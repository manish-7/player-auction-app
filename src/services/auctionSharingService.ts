import { ref, set, onValue, off, push, serverTimestamp, update } from 'firebase/database';
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
    if (!this.currentAuctionId) {
      console.warn('No current auction ID, cannot update');
      return;
    }

    try {
      const auctionRef = ref(database, `shared-auctions/${this.currentAuctionId}`);
      const updateData = {
        tournament: this.sanitizeTournamentForSharing(tournament),
        auctionState: this.sanitizeAuctionStateForSharing(auctionState),
        lastUpdated: serverTimestamp(),
        isActive: true,
      };

      console.log('Updating Firebase with data:', {
        auctionId: this.currentAuctionId,
        currentPlayer: tournament.currentPlayerIndex,
        highestBid: auctionState.highestBid
      });

      await update(auctionRef, updateData);
      console.log('Firebase update successful');
    } catch (error) {
      console.error('Error updating shared auction:', error);
      throw error; // Re-throw to let caller handle
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

    console.log('Setting up Firebase listener for auction:', auctionId);

    onValue(
      auctionRef,
      (snapshot: any) => {
        const data = snapshot.val();
        console.log('Firebase data received:', data ? 'Data available' : 'No data');
        if (data) {
          onUpdate(data as SharedAuctionData);
        } else {
          console.warn('No auction data found');
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
   * Subscribe to viewer count updates
   */
  subscribeToViewers(
    auctionId: string,
    onUpdate: (count: number) => void
  ): () => void {
    const viewersRef = ref(database, `shared-auctions/${auctionId}/viewers`);

    const unsubscribe = () => {
      off(viewersRef);
    };

    onValue(
      viewersRef,
      (snapshot: any) => {
        const viewers = snapshot.val();
        if (viewers) {
          // Count active viewers
          const activeViewers = Object.values(viewers).filter(
            (viewer: any) => viewer.isActive
          );
          onUpdate(activeViewers.length);
        } else {
          onUpdate(0);
        }
      },
      (error: any) => {
        console.error('Error subscribing to viewers:', error);
        onUpdate(0);
      }
    );

    return unsubscribe;
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
          const exists = snapshot.exists();
          console.log('Auction exists check:', auctionId, exists);
          resolve(exists);
        }, { onlyOnce: true });
      });
    } catch (error) {
      console.error('Error checking auction:', error);
      return false;
    }
  }

  /**
   * Monitor Firebase connection status
   */
  monitorConnection(onConnectionChange: (connected: boolean) => void): () => void {
    const connectedRef = ref(database, '.info/connected');

    const unsubscribe = () => {
      off(connectedRef);
    };

    onValue(connectedRef, (snapshot) => {
      const connected = snapshot.val() === true;
      console.log('Firebase connection status:', connected);
      onConnectionChange(connected);
    });

    return unsubscribe;
  }
}

// Export singleton instance
export const auctionSharingService = new AuctionSharingService();
