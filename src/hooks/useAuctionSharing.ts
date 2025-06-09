import { useState, useEffect, useCallback } from 'react';
import { auctionSharingService } from '../services/auctionSharingService';
import { useAuctionStore } from '../store/auctionStore';

export interface SharingState {
  isSharing: boolean;
  shareUrl: string | null;
  auctionId: string | null;
  error: string | null;
  isLoading: boolean;
  viewerCount: number;
  unsubscribeViewers?: () => void;
}

export const useAuctionSharing = () => {
  const { tournament, auctionState } = useAuctionStore();
  const [sharingState, setSharingState] = useState<SharingState>({
    isSharing: false,
    shareUrl: null,
    auctionId: null,
    error: null,
    isLoading: false,
    viewerCount: 0,
  });

  /**
   * Start sharing the current auction
   */
  const startSharing = useCallback(async () => {
    if (!tournament || !auctionState) {
      setSharingState(prev => ({ ...prev, error: 'No active auction to share' }));
      return;
    }

    setSharingState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const auctionId = await auctionSharingService.shareAuction(tournament, auctionState);
      const shareUrl = auctionSharingService.generateShareableUrl(auctionId);

      setSharingState(prev => ({
        ...prev,
        isSharing: true,
        shareUrl,
        auctionId,
        isLoading: false,
      }));

      // Set up auto-sync for future updates
      setupAutoSync(auctionId);
    } catch (error) {
      setSharingState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to start sharing',
        isLoading: false,
      }));
    }
  }, [tournament, auctionState]);

  /**
   * Stop sharing the auction
   */
  const stopSharing = useCallback(async () => {
    try {
      // Cleanup viewer subscription
      setSharingState(prev => {
        if (prev.unsubscribeViewers) {
          prev.unsubscribeViewers();
        }
        return prev;
      });

      await auctionSharingService.endSharedAuction();
      auctionSharingService.cleanup();

      setSharingState({
        isSharing: false,
        shareUrl: null,
        auctionId: null,
        error: null,
        isLoading: false,
        viewerCount: 0,
      });
    } catch (error) {
      setSharingState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to stop sharing',
      }));
    }
  }, []);

  /**
   * Copy share URL to clipboard
   */
  const copyShareUrl = useCallback(async () => {
    if (!sharingState.shareUrl) return false;

    try {
      await navigator.clipboard.writeText(sharingState.shareUrl);
      return true;
    } catch (error) {
      console.error('Failed to copy URL:', error);
      return false;
    }
  }, [sharingState.shareUrl]);

  /**
   * Set up automatic syncing of auction updates
   */
  const setupAutoSync = useCallback((auctionId: string) => {
    // Subscribe to viewer count updates
    const unsubscribeViewers = auctionSharingService.subscribeToViewers(
      auctionId,
      (count) => {
        setSharingState(prev => ({ ...prev, viewerCount: count }));
      }
    );

    // Store the unsubscribe function for cleanup
    setSharingState(prev => ({ ...prev, unsubscribeViewers }));
  }, []);

  /**
   * Update shared auction when local state changes
   */
  const syncAuctionState = useCallback(async (isShuffling?: boolean) => {
    if (!sharingState.isSharing || !tournament || !auctionState) return;

    try {
      console.log('Syncing auction state to Firebase...', {
        currentPlayer: tournament.currentPlayerIndex,
        highestBid: auctionState.highestBid,
        isShuffling
      });
      await auctionSharingService.updateSharedAuction(tournament, auctionState, isShuffling);
      console.log('Auction state synced successfully');
    } catch (error) {
      console.error('Failed to sync auction state:', error);
    }
  }, [sharingState.isSharing, tournament, auctionState]);

  // Auto-sync when auction state changes
  useEffect(() => {
    if (sharingState.isSharing) {
      syncAuctionState();
    }
  }, [tournament, auctionState, syncAuctionState, sharingState.isSharing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      auctionSharingService.cleanup();
    };
  }, []);

  return {
    sharingState,
    startSharing,
    stopSharing,
    copyShareUrl,
    syncAuctionState,
  };
};
