import { ref, set, onValue, off, push, serverTimestamp } from 'firebase/database';
import { database } from '../config/firebase';
import type { Tournament, AuctionState } from '../types';

export interface SharedAuctionData {
  tournament: Tournament;
  auctionState: AuctionState;
  lastUpdated: any;
  isActive: boolean;
  createdBy: string;
  createdAt: any;
}

export interface AuctionViewer {
  id: string;
  name: string;
  joinedAt: any;
  isActive: boolean;
}

export class AuctionSharingService {
  private currentAuctionId: string | null = null;
  private listeners: Map<string, () => void> = new Map();

  /**
   * Share an auction and get a unique link
   */
  async shareAuction(tournament: Tournament, auctionState: AuctionState): Promise<string> {
    try {
      console.log('Starting to share auction...');

      // Generate unique auction ID
      const auctionRef = push(ref(database, 'shared-auctions'));
      const auctionId = auctionRef.key!;

      console.log('Generated auction ID:', auctionId);

      // Prepare auction data for sharing
      const sharedData: SharedAuctionData = {
        tournament: this.sanitizeTournamentForSharing(tournament),
        auctionState: this.sanitizeAuctionStateForSharing(auctionState),
        lastUpdated: serverTimestamp(),
        isActive: true,
        createdBy: 'auction-master', // Could be enhanced with user auth
        createdAt: serverTimestamp(),
      };

      console.log('Saving auction data to Firebase...');

      // Save to Firebase
      await set(auctionRef, sharedData);

      console.log('Auction shared successfully!');

      this.currentAuctionId = auctionId;
      return auctionId;
    } catch (error) {
      console.error('Error sharing auction:', error);
      throw new Error(`Failed to share auction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update shared auction with new state
   */
  async updateSharedAuction(tournament: Tournament, auctionState: AuctionState): Promise<void> {
    if (!this.currentAuctionId) return;

    try {
      const auctionRef = ref(database, `shared-auctions/${this.currentAuctionId}`);
      const updateData = {
        tournament: this.sanitizeTournamentForSharing(tournament),
        auctionState: this.sanitizeAuctionStateForSharing(auctionState),
        lastUpdated: serverTimestamp(),
        isActive: true,
      };

      await set(auctionRef, updateData);
    } catch (error) {
      console.error('Error updating shared auction:', error);
    }
  }

  /**
   * Subscribe to auction updates
   */
  subscribeToAuction(
    auctionId: string,
    onUpdate: (data: SharedAuctionData) => void,
    onError?: (error: Error) => void
  ): () => void {
    const auctionRef = ref(database, `shared-auctions/${auctionId}`);

    const unsubscribe = () => {
      off(auctionRef);
      this.listeners.delete(auctionId);
    };

    onValue(
      auctionRef,
      (snapshot: any) => {
        const data = snapshot.val();
        if (data) {
          onUpdate(data as SharedAuctionData);
        } else {
          onError?.(new Error('Auction not found'));
        }
      },
      (error: any) => {
        console.error('Error subscribing to auction:', error);
        onError?.(new Error('Failed to connect to auction'));
      }
    );

    this.listeners.set(auctionId, unsubscribe);
    return unsubscribe;
  }

  /**
   * Join auction as viewer
   */
  async joinAsViewer(auctionId: string, viewerName: string): Promise<string> {
    try {
      const viewerRef = push(ref(database, `shared-auctions/${auctionId}/viewers`));
      const viewerId = viewerRef.key!;

      const viewerData: AuctionViewer = {
        id: viewerId,
        name: viewerName,
        joinedAt: serverTimestamp(),
        isActive: true,
      };

      await set(viewerRef, viewerData);
      return viewerId;
    } catch (error) {
      console.error('Error joining auction:', error);
      throw new Error('Failed to join auction');
    }
  }

  /**
   * End shared auction
   */
  async endSharedAuction(): Promise<void> {
    if (!this.currentAuctionId) return;

    try {
      const auctionRef = ref(database, `shared-auctions/${this.currentAuctionId}`);
      await set(auctionRef, {
        isActive: false,
        endedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error ending shared auction:', error);
    }
  }

  /**
   * Clean up listeners
   */
  cleanup(): void {
    this.listeners.forEach((unsubscribe) => unsubscribe());
    this.listeners.clear();
    this.currentAuctionId = null;
  }

  /**
   * Generate shareable URL
   */
  generateShareableUrl(auctionId: string): string {
    const baseUrl = window.location.origin;
    const basePath = import.meta.env.BASE_URL || '/';
    const cleanBasePath = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
    return `${baseUrl}${cleanBasePath}/auction/live/${auctionId}`;
  }

  /**
   * Sanitize tournament data for sharing (remove sensitive info)
   */
  private sanitizeTournamentForSharing(tournament: Tournament): Tournament {
    // Remove any sensitive data or large unnecessary fields
    return {
      ...tournament,
      // Could filter out sensitive information here if needed
    };
  }

  /**
   * Sanitize auction state for sharing
   */
  private sanitizeAuctionStateForSharing(auctionState: AuctionState): AuctionState {
    return {
      ...auctionState,
      // Keep all auction state for now, could optimize later
    };
  }

  /**
   * Check if auction exists
   */
  async checkAuctionExists(auctionId: string): Promise<boolean> {
    try {
      const auctionRef = ref(database, `shared-auctions/${auctionId}`);
      return new Promise((resolve) => {
        onValue(auctionRef, (snapshot: any) => {
          resolve(snapshot.exists());
        }, { onlyOnce: true });
      });
    } catch (error) {
      console.error('Error checking auction:', error);
      return false;
    }
  }
}

// Export singleton instance
export const auctionSharingService = new AuctionSharingService();
