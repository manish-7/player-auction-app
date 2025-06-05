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
  const setupAutoSync = useCallback((_auctionId: string) => {
    // This will be called whenever the auction state changes
    // We'll implement this when we integrate with the auction store
  }, []);

  /**
   * Update shared auction when local state changes
   */
  const syncAuctionState = useCallback(async () => {
    if (!sharingState.isSharing || !tournament || !auctionState) return;

    try {
      await auctionSharingService.updateSharedAuction(tournament, auctionState);
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
