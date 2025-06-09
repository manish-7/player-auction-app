import React, { useState, useEffect } from 'react';
import { Timer, Trophy, SkipForward, Zap, Undo, Share2, Copy, Users, Save } from 'lucide-react';
import { useAuctionStore } from '../store/auctionStore';
import { formatCurrency } from '../utils/excelUtils';
import { useAuctionSharing } from '../hooks/useAuctionSharing';
import ShareAuctionDemo from './ShareAuctionDemo';
import ToastContainer from './ToastContainer';
import { useToast } from '../hooks/useToast';
import TeamCard from './TeamCard';
import PlayerImage from './PlayerImage';
import SaveAuctionDialog from './SaveAuctionDialog';

interface AuctionRoomProps {
  onComplete: () => void;
}

const AuctionRoom: React.FC<AuctionRoomProps> = ({ onComplete }) => {
  const {
    tournament,
    auctionState,
    settings,
    placeBid,
    passTeam,
    soldPlayer,
    unsoldPlayer,
    markPlayerSold,
    markPlayerUnsold,
    advanceToNextPlayer,
    setPreventAutoAdvance,

    getCurrentPlayer,
    getEligibleTeams,
    startAuction,
    undoBid,
    canUndo,
    getMaxBidForTeam,
    endAuction,
    areAllTeamsFull,
    saveCurrentAuction,
  } = useAuctionStore();

  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [bidAmount, setBidAmount] = useState<number>(0);
  const [timer, setTimer] = useState(tournament?.settings.timerDuration || 30);
  const [showBidInput, setShowBidInput] = useState(false);
  const [allTeamsExpanded, setAllTeamsExpanded] = useState<boolean | null>(null);
  const [showEndAuctionDialog, setShowEndAuctionDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showShareDemo, setShowShareDemo] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [shufflePlayer, setShufflePlayer] = useState<any>(null);
  const [shuffleInterval, setShuffleInterval] = useState<NodeJS.Timeout | null>(null);
  const [shuffleCounter, setShuffleCounter] = useState(0);

  // Toast notifications
  const { toasts, removeToast, success, warning } = useToast();

  // Auction sharing hook
  const { sharingState, startSharing, stopSharing, copyShareUrl, syncAuctionState } = useAuctionSharing();

  const currentPlayer = getCurrentPlayer();
  const eligibleTeams = getEligibleTeams();
  const allTeamsFull = areAllTeamsFull();

  // Start auction when component mounts
  useEffect(() => {
    if (tournament && !tournament.isAuctionStarted) {
      startAuction();
    }
  }, [tournament, startAuction]);

  useEffect(() => {
    if (currentPlayer) {
      const minBid = auctionState.highestBid?.amount
        ? auctionState.highestBid.amount + Number(settings.bidIncrement)
        : currentPlayer.basePrice || tournament?.settings.minimumBid || 100;
      setBidAmount(minBid);
    }
  }, [currentPlayer, auctionState.highestBid, settings.bidIncrement]);

  useEffect(() => {
    if (tournament?.isAuctionCompleted) {
      onComplete();
    }
  }, [tournament?.isAuctionCompleted, onComplete]);

  // Timer logic
  useEffect(() => {
    if (!auctionState.isActive || !currentPlayer || !tournament?.settings.enableTimer) return;

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          // Auto-sell or mark unsold
          if (auctionState.highestBid && tournament) {
            const winningTeam = tournament.teams.find(t => t.id === auctionState.highestBid?.teamId);
            success(
              `${currentPlayer?.name} AUTO-SOLD!`,
              `Time expired - Bought by ${winningTeam?.name || 'Unknown Team'} for ${formatCurrency(auctionState.highestBid.amount)}`,
              5000
            );
            // Immediately set shuffling to prevent "Auction Completed" flash
            setIsShuffling(true);
            // Prevent getCurrentPlayer from auto-advancing
            setPreventAutoAdvance(true);
            markPlayerSold();
            // Start shuffling animation for next player
            setTimeout(() => {
              startPlayerShuffle();
            }, 500);
          } else {
            warning(
              `${currentPlayer?.name} UNSOLD`,
              'Time expired - No bids received',
              4000
            );
            // Immediately set shuffling to prevent "Auction Completed" flash
            setIsShuffling(true);
            // Prevent getCurrentPlayer from auto-advancing
            setPreventAutoAdvance(true);
            markPlayerUnsold();
            // Start shuffling animation for next player
            setTimeout(() => {
              startPlayerShuffle();
            }, 500);
          }
          return tournament.settings.timerDuration;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [auctionState.isActive, currentPlayer, auctionState.highestBid, soldPlayer, unsoldPlayer, tournament?.settings.timerDuration, tournament?.settings.enableTimer]);

  // Cleanup shuffle interval on unmount
  useEffect(() => {
    return () => {
      if (shuffleInterval) {
        clearInterval(shuffleInterval);
      }
    };
  }, [shuffleInterval]);

  const handlePlaceBid = () => {
    if (selectedTeam && bidAmount > 0) {
      placeBid(selectedTeam, bidAmount);
      setSelectedTeam('');
      setShowBidInput(false);
      setBidAmount(bidAmount + Number(settings.bidIncrement));
    }
  };

  const handleQuickBid = (teamId: string) => {
    const quickBidAmount = auctionState.highestBid?.amount
      ? auctionState.highestBid.amount + Number(settings.bidIncrement)
      : currentPlayer?.basePrice || tournament?.settings.minimumBid || 100;

    const maxBid = getMaxBidForTeam(teamId);
    const finalBidAmount = Math.min(quickBidAmount, maxBid);

    placeBid(teamId, finalBidAmount);
    setSelectedTeam('');
    setShowBidInput(false);
  };

  const handlePassTeam = (teamId: string) => {
    passTeam(teamId);
  };

  const handleSoldPlayer = () => {
    if (currentPlayer && auctionState.highestBid && tournament) {
      const winningTeam = tournament.teams.find(t => t.id === auctionState.highestBid?.teamId);
      success(
        `${currentPlayer.name} SOLD!`,
        `Bought by ${winningTeam?.name || 'Unknown Team'} for ${formatCurrency(auctionState.highestBid.amount)}`,
        5000
      );
    }

    // Immediately set shuffling to prevent "Auction Completed" flash
    setIsShuffling(true);

    // Prevent getCurrentPlayer from auto-advancing
    setPreventAutoAdvance(true);

    // Mark player as sold but don't advance yet
    markPlayerSold();

    // Sync shuffling state to live viewers
    syncAuctionState(true);

    // Start shuffling animation which will advance to next player when complete
    setTimeout(() => {
      startPlayerShuffle();
    }, 500); // Small delay to let the sold action complete
  };

  const handleUnsoldPlayer = () => {
    if (currentPlayer) {
      warning(
        `${currentPlayer.name} UNSOLD`,
        'No bids received - player goes back to pool',
        4000
      );
    }

    // Immediately set shuffling to prevent "Auction Completed" flash
    setIsShuffling(true);

    // Prevent getCurrentPlayer from auto-advancing
    setPreventAutoAdvance(true);

    // Mark player as unsold but don't advance yet
    markPlayerUnsold();

    // Sync shuffling state to live viewers
    syncAuctionState(true);

    // Start shuffling animation which will advance to next player when complete
    setTimeout(() => {
      startPlayerShuffle();
    }, 500); // Small delay to let the unsold action complete
  };

  const handleEndAuction = () => {
    endAuction();
    setShowEndAuctionDialog(false);
  };

  const handleStartSharing = async () => {
    try {
      await startSharing();
      setShowShareDialog(true);
    } catch (error) {
      console.error('Failed to start sharing:', error);
      // Show demo dialog if Firebase isn't configured
      setShowShareDemo(true);
    }
  };

  const handleCopyShareUrl = async () => {
    const success = await copyShareUrl();
    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleStopSharing = async () => {
    await stopSharing();
    setShowShareDialog(false);
  };

  const handleSaveAuction = (name: string) => {
    const savedId = saveCurrentAuction(name);
    if (savedId) {
      success(
        'Auction Saved!',
        `"${name}" has been saved and can be resumed later from the auction history.`,
        5000
      );
    }
  };

  const startPlayerShuffle = () => {
    if (!tournament) return;

    // Get all remaining players (not sold, not unsold) - these are the candidates for next player
    const remainingPlayers = tournament.players.filter(p => !p.soldPrice && !p.isUnsold);
    if (remainingPlayers.length === 0) {
      // No more players to shuffle, just advance
      setIsShuffling(false);
      setPreventAutoAdvance(false);
      advanceToNextPlayer();
      return;
    }

    // isShuffling is already set to true by the caller

    // Create shuffling effect by rapidly changing the displayed player
    const interval = setInterval(() => {
      const randomPlayer = remainingPlayers[Math.floor(Math.random() * remainingPlayers.length)];
      setShufflePlayer(randomPlayer);
      setShuffleCounter(prev => prev + 1); // Increment counter to force PlayerImage re-render
    }, 100); // Change every 100ms for fast shuffling effect

    setShuffleInterval(interval);

    // Stop shuffling after 2 seconds and advance to the actual next player
    setTimeout(() => {
      clearInterval(interval);
      setShuffleInterval(null);
      setIsShuffling(false);
      setShufflePlayer(null);

      // Re-enable auto-advance
      setPreventAutoAdvance(false);

      // Now advance to the next player
      advanceToNextPlayer();

      // Sync that shuffling has ended
      syncAuctionState(false);

      setTimer(tournament?.settings.timerDuration || 30);
    }, 2000);
  };

  // Don't show auction completed during shuffling, even if currentPlayer is null
  if (!tournament || (!currentPlayer && !isShuffling)) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
            <Trophy className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-yellow-800 bg-clip-text text-transparent mb-4">
            Auction Completed!
          </h2>
          <p className="text-gray-600 mb-8 text-lg">
            All players have been auctioned. View the results to see team compositions.
          </p>
          <button onClick={onComplete} className="btn-primary">
            <Trophy className="w-5 h-5 mr-2" />
            View Results
          </button>
        </div>
      </div>
    );
  }

  const minBid = auctionState.highestBid?.amount
    ? auctionState.highestBid.amount + Number(settings.bidIncrement)
    : currentPlayer?.basePrice || tournament?.settings.minimumBid || 100;

  const highestBiddingTeam = auctionState.highestBid 
    ? tournament.teams.find(t => t.id === auctionState.highestBid!.teamId)
    : null;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />

      {/* Responsive Header */}
      <div className="space-y-4">
        {/* Mobile Layout */}
        <div className="block lg:hidden">
          {/* Timer and Actions Row */}
          <div className="flex items-center justify-between mb-4">
            {/* Timer */}
            <div className="flex-shrink-0">
              {tournament.settings.enableTimer ? (
                <div className="inline-flex items-center bg-gradient-to-r from-red-500 to-orange-500 rounded-lg p-2 shadow-lg">
                  <Timer className="w-4 h-4 text-white mr-1" />
                  <div className="text-lg font-bold text-white">
                    {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
                  </div>
                </div>
              ) : (
                <div className="inline-flex items-center bg-gradient-to-r from-gray-400 to-gray-500 rounded-lg p-2 shadow-lg">
                  <Timer className="w-4 h-4 text-white mr-1" />
                  <div className="text-sm font-medium text-white">
                    No Timer
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-2">
              {canUndo() && (
                <button
                  onClick={undoBid}
                  className="btn-secondary flex items-center text-sm md:text-base py-2 md:py-3 px-3 md:px-4"
                  title="Undo last bid"
                >
                  <Undo className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" />
                  Undo
                </button>
              )}

              {auctionState.highestBid ? (
                <button
                  onClick={handleSoldPlayer}
                  disabled={isShuffling}
                  className={`btn-success flex items-center text-sm md:text-base py-2 md:py-3 px-3 md:px-4 transition-all duration-300 ${
                    isShuffling ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <Trophy className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" />
                  {isShuffling ? 'Shuffling...' : 'Sold'}
                </button>
              ) : (
                <button
                  onClick={handleUnsoldPlayer}
                  disabled={isShuffling}
                  className={`btn-danger flex items-center text-sm md:text-base py-2 md:py-3 px-3 md:px-4 transition-all duration-300 ${
                    isShuffling ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <SkipForward className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" />
                  {isShuffling ? 'Shuffling...' : 'Unsold'}
                </button>
              )}
            </div>
          </div>

          {/* Player Info - Mobile */}
          <div className="text-center">
            {allTeamsFull ? (
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-3">
                  All Teams Complete!
                </h1>
                <button
                  onClick={() => setShowEndAuctionDialog(true)}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-2 rounded-xl font-semibold shadow-lg transition-all duration-200 flex items-center mx-auto"
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  End Auction
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                {/* Player Image - Mobile Size */}
                <div className="flex-shrink-0">
                  <div className={`transition-all duration-200 ${isShuffling ? 'animate-pulse scale-105' : ''}`}>
                    <PlayerImage
                      key={isShuffling && shufflePlayer ? `shuffle-${shufflePlayer.id}-${shuffleCounter}` : `current-${currentPlayer?.id}`}
                      imageUrl={isShuffling ? undefined : currentPlayer?.imageUrl}
                      playerName={(isShuffling && shufflePlayer ? shufflePlayer.name : currentPlayer?.name) || 'Unknown Player'}
                      size="xl"
                      className={`shadow-lg border-4 ${isShuffling ? 'border-yellow-400 shadow-yellow-200' : 'border-white'} transition-all duration-200`}
                    />
                  </div>
                </div>

                {/* Player Info - Mobile Layout */}
                <div className="text-left flex-1 min-w-0">
                  {/* Shuffling Indicator */}
                  {isShuffling && (
                    <div className="mb-2">
                      <div className="inline-flex items-center px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-medium animate-bounce">
                        🎲 Selecting Next Player...
                      </div>
                    </div>
                  )}

                  {/* Player Name - Mobile */}
                  <h1 className={`text-2xl font-bold leading-tight truncate transition-all duration-200 ${
                    isShuffling ? 'text-yellow-600 animate-pulse' : 'text-gray-900'
                  }`}>
                    {isShuffling && shufflePlayer ? shufflePlayer.name : currentPlayer?.name}
                  </h1>

                  {/* Player Role - Mobile */}
                  {(isShuffling && shufflePlayer ? shufflePlayer.role : currentPlayer?.role) && (
                    <span className={`inline-block text-xs font-medium px-2 py-1 rounded-full mt-1 transition-all duration-200 ${
                      isShuffling ? 'bg-yellow-100 text-yellow-800 animate-pulse' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {isShuffling && shufflePlayer ? shufflePlayer.role : currentPlayer?.role}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:grid grid-cols-3 gap-6">
          {/* Timer */}
          <div className="flex items-center justify-start">
            {tournament.settings.enableTimer ? (
              <div className="inline-flex items-center bg-gradient-to-r from-red-500 to-orange-500 rounded-xl p-4 shadow-lg">
                <Timer className="w-6 h-6 text-white mr-2" />
                <div className="text-2xl font-bold text-white">
                  {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
                </div>
              </div>
            ) : (
              <div className="inline-flex items-center bg-gradient-to-r from-gray-400 to-gray-500 rounded-xl p-4 shadow-lg">
                <Timer className="w-6 h-6 text-white mr-2" />
                <div className="text-lg font-medium text-white">
                  No Timer
                </div>
              </div>
            )}
          </div>

          {/* Current Player Info or End Auction */}
          <div className="text-center">
            {allTeamsFull ? (
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  All Teams Complete!
                </h1>
                <button
                  onClick={() => setShowEndAuctionDialog(true)}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg transition-all duration-200 flex items-center mx-auto"
                >
                  <Trophy className="w-5 h-5 mr-2" />
                  End Auction
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-6">
                {/* Player Image - Fixed Size */}
                <div className="flex-shrink-0">
                  <div className={`transition-all duration-200 ${isShuffling ? 'animate-pulse scale-105' : ''}`}>
                    <PlayerImage
                      key={isShuffling && shufflePlayer ? `shuffle-${shufflePlayer.id}-${shuffleCounter}` : `current-${currentPlayer?.id}`}
                      imageUrl={isShuffling ? undefined : currentPlayer?.imageUrl}
                      playerName={(isShuffling && shufflePlayer ? shufflePlayer.name : currentPlayer?.name) || 'Unknown Player'}
                      size="2xl"
                      className={`shadow-lg border-4 ${isShuffling ? 'border-yellow-400 shadow-yellow-200' : 'border-white'} transition-all duration-200`}
                    />
                  </div>
                </div>

                {/* Player Info - Compact Layout */}
                <div className="text-center w-80">
                  {/* Shuffling Indicator */}
                  {isShuffling && (
                    <div className="mb-2">
                      <div className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm font-medium animate-bounce">
                        🎲 Selecting Next Player...
                      </div>
                    </div>
                  )}

                  {/* Player Name - Single Line */}
                  <div className="flex items-center justify-center mb-4">
                    <h1 className={`text-4xl font-bold leading-none whitespace-nowrap overflow-hidden text-ellipsis transition-all duration-200 ${
                      isShuffling ? 'text-yellow-600 animate-pulse' : 'text-gray-900'
                    }`}>
                      {isShuffling && shufflePlayer ? shufflePlayer.name : currentPlayer?.name}
                    </h1>
                  </div>

                  {/* Player Role - Fixed Height */}
                  <div className="h-8 flex items-center justify-center">
                    {(isShuffling && shufflePlayer ? shufflePlayer.role : currentPlayer?.role) ? (
                      <span className={`inline-block text-sm font-medium px-3 py-1 rounded-full transition-all duration-200 ${
                        isShuffling ? 'bg-yellow-100 text-yellow-800 animate-pulse' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {isShuffling && shufflePlayer ? shufflePlayer.role : currentPlayer?.role}
                      </span>
                    ) : (
                      <span className="inline-block opacity-0 text-sm font-medium px-3 py-1">
                        Placeholder
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center justify-end space-x-3">
            {canUndo() && (
              <button
                onClick={undoBid}
                className="btn-secondary flex items-center py-3 px-4 text-base"
                title="Undo last bid"
              >
                <Undo className="w-5 h-5 mr-2" />
                Undo
              </button>
            )}

            {auctionState.highestBid ? (
              <button
                onClick={handleSoldPlayer}
                disabled={isShuffling}
                className={`btn-success flex items-center py-3 px-6 text-base font-semibold transition-all duration-300 ${
                  isShuffling ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Trophy className="w-5 h-5 mr-2" />
                {isShuffling ? 'Shuffling...' : 'Sold'}
              </button>
            ) : (
              <button
                onClick={handleUnsoldPlayer}
                disabled={isShuffling}
                className={`btn-danger flex items-center py-3 px-6 text-base font-semibold transition-all duration-300 ${
                  isShuffling ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <SkipForward className="w-5 h-5 mr-2" />
                {isShuffling ? 'Shuffling...' : 'Unsold'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Current Bid Status - Responsive Layout */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 md:p-6 border-2 border-blue-200">
        {/* Mobile Layout */}
        <div className="block md:hidden">
          {/* Price Section - Top */}
          <div className="text-center mb-4">
            <p className={`text-xs font-medium mb-2 transition-all duration-200 ${
              auctionState.highestBid && highestBiddingTeam
                ? 'text-blue-600'
                : isShuffling
                  ? 'text-yellow-600'
                  : 'text-gray-600'
            }`}>
              {auctionState.highestBid && highestBiddingTeam
                ? 'CURRENT BID'
                : isShuffling
                  ? 'SHUFFLING...'
                  : 'BASE PRICE'
              }
            </p>
            <div className={`text-3xl font-bold mb-2 transition-all duration-200 ${
              auctionState.highestBid && highestBiddingTeam
                ? 'text-blue-600'
                : isShuffling
                  ? 'text-yellow-600 animate-pulse'
                  : 'text-gray-900'
            }`}>
              {auctionState.highestBid && highestBiddingTeam ? (
                formatCurrency(auctionState.highestBid.amount)
              ) : (
                formatCurrency(
                  (isShuffling && shufflePlayer ? shufflePlayer.basePrice : currentPlayer?.basePrice) ||
                  tournament?.settings.minimumBid || 100
                )
              )}
            </div>
          </div>

          {/* Bidder Info - Bottom */}
          {auctionState.highestBid && highestBiddingTeam ? (
            <div className="text-center mb-4">
              <p className="text-xs font-medium mb-2 text-blue-600">CURRENT HIGHEST BIDDER</p>
              <div className="flex items-center justify-center">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3 shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${highestBiddingTeam.primaryColor}, ${highestBiddingTeam.secondaryColor})`,
                  }}
                >
                  {highestBiddingTeam.logo}
                </div>
                <div className="text-left">
                  <div className="text-lg font-bold text-gray-900">{highestBiddingTeam.name}</div>
                  <div className="text-xs text-gray-600">
                    Budget: {formatCurrency(highestBiddingTeam.remainingBudget)} remaining
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-600 mt-2">
                Bid placed {new Date(auctionState.highestBid.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ) : (
            <div className="text-center mb-4">
              <p className="text-xs font-medium mb-2 text-gray-600">STARTING PRICE</p>
              <div className="text-sm text-gray-600">No bids placed yet</div>
            </div>
          )}

          {/* Stats Row - Mobile */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-blue-200">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">MIN BID</p>
              <div className="text-sm font-bold text-green-600">
                {formatCurrency(minBid)}
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">INCREMENT</p>
              <div className="text-sm font-bold text-orange-600">
                {formatCurrency(settings.bidIncrement)}
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">ELIGIBLE</p>
              <div className="text-sm font-bold text-purple-600">
                {eligibleTeams.length} / {tournament.teams.length}
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:block">
          <div className="grid grid-cols-2 gap-6 mb-4">
            {/* Left Column: Bidder Info */}
            <div className="flex flex-col justify-center min-h-[120px]">
              <p className="text-sm font-medium mb-3 text-center">
                {auctionState.highestBid && highestBiddingTeam ? (
                  <span className="text-blue-600">CURRENT HIGHEST BIDDER</span>
                ) : (
                  <span className="text-gray-600">STARTING PRICE</span>
                )}
              </p>

              {auctionState.highestBid && highestBiddingTeam ? (
                <>
                  <div className="flex items-center justify-center mb-2">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold mr-4 shadow-lg"
                      style={{
                        background: `linear-gradient(135deg, ${highestBiddingTeam.primaryColor}, ${highestBiddingTeam.secondaryColor})`,
                      }}
                    >
                      {highestBiddingTeam.logo}
                    </div>
                    <div>
                      <div className="text-xl font-bold text-gray-900">{highestBiddingTeam.name}</div>
                      <div className="text-sm text-gray-600">
                        Budget: {formatCurrency(highestBiddingTeam.remainingBudget)} remaining
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 text-center">
                    Bid placed {new Date(auctionState.highestBid.timestamp).toLocaleTimeString()}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center flex-1">
                  <div className="text-lg text-gray-600 text-center">No bids placed yet</div>
                </div>
              )}
            </div>

            {/* Right Column: Price */}
            <div className="text-center min-h-[120px] flex flex-col justify-center">
              <p className={`text-sm font-medium mb-3 transition-all duration-200 ${
                auctionState.highestBid && highestBiddingTeam
                  ? 'text-blue-600'
                  : isShuffling
                    ? 'text-yellow-600'
                    : 'text-gray-600'
              }`}>
                {auctionState.highestBid && highestBiddingTeam
                  ? 'CURRENT BID'
                  : isShuffling
                    ? 'SHUFFLING...'
                    : 'BASE PRICE'
                }
              </p>
              <div className={`text-5xl font-bold mb-2 transition-all duration-200 ${
                auctionState.highestBid && highestBiddingTeam
                  ? 'text-blue-600'
                  : isShuffling
                    ? 'text-yellow-600 animate-pulse'
                    : 'text-gray-900'
              }`}>
                {auctionState.highestBid && highestBiddingTeam ? (
                  formatCurrency(auctionState.highestBid.amount)
                ) : (
                  formatCurrency(
                    (isShuffling && shufflePlayer ? shufflePlayer.basePrice : currentPlayer?.basePrice) ||
                    tournament?.settings.minimumBid || 100
                  )
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-blue-200">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">MINIMUM NEXT BID</p>
              <div className="text-lg font-bold text-green-600">
                {formatCurrency(minBid)}
              </div>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">BID INCREMENT</p>
              <div className="text-lg font-bold text-orange-600">
                {formatCurrency(settings.bidIncrement)}
              </div>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">ELIGIBLE TEAMS</p>
              <div className="text-lg font-bold text-purple-600">
                {eligibleTeams.length} / {tournament.teams.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bidding Section - Prominent and Compact */}
      <div className={`bg-white rounded-xl shadow-lg border-2 border-blue-100 p-4 transition-all duration-300 ${
        isShuffling ? 'opacity-50 pointer-events-none' : ''
      }`}>
        {/* Mobile Header */}
        <div className="block md:hidden mb-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-bold text-gray-900">Place Your Bid</h2>
            <div className="text-xs text-gray-600">
              Min: <span className="font-semibold text-green-600">{formatCurrency(minBid)}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {/* Share Auction Button */}
              {!sharingState.isSharing ? (
                <button
                  onClick={handleStartSharing}
                  disabled={sharingState.isLoading}
                  className="flex items-center text-xs text-blue-600 hover:text-blue-800 transition-colors px-2 py-1 rounded border border-blue-200 hover:bg-blue-50 disabled:opacity-50"
                  title="Share auction live with others"
                >
                  <Share2 className="w-3 h-3 mr-1" />
                  <span>{sharingState.isLoading ? 'Sharing...' : 'Share'}</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowShareDialog(true)}
                  className="flex items-center text-xs text-green-600 hover:text-green-800 transition-colors px-2 py-1 rounded border border-green-200 bg-green-50"
                  title="Auction is being shared live"
                >
                  <Users className="w-3 h-3 mr-1" />
                  <span>Live ({sharingState.viewerCount})</span>
                </button>
              )}

              <button
                onClick={() => setShowSaveDialog(true)}
                className="flex items-center text-xs text-purple-600 hover:text-purple-800 transition-colors px-2 py-1 rounded border border-purple-200 hover:bg-purple-50"
                title="Save auction progress"
              >
                <Save className="w-3 h-3 mr-1" />
                <span>Save</span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowEndAuctionDialog(true)}
                className="flex items-center text-xs text-red-600 hover:text-red-800 transition-colors px-2 py-1 rounded border border-red-200 hover:bg-red-50"
                title="Manually end the auction"
              >
                <Trophy className="w-3 h-3 mr-1" />
                <span>End</span>
              </button>
              <button
                onClick={() => {
                  if (allTeamsExpanded === true) {
                    setAllTeamsExpanded(false); // Collapse all
                  } else {
                    setAllTeamsExpanded(true); // Expand all
                  }
                }}
                className="flex items-center text-xs text-gray-600 hover:text-gray-800 transition-colors"
              >
                {allTeamsExpanded === true ? (
                  <>
                    <span className="mr-1">Collapse</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </>
                ) : (
                  <>
                    <span className="mr-1">Expand</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900">Place Your Bid</h2>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              Min: <span className="font-semibold text-green-600">{formatCurrency(minBid)}</span>
            </div>

            {/* Share Auction Button */}
            {!sharingState.isSharing ? (
              <button
                onClick={handleStartSharing}
                disabled={sharingState.isLoading}
                className="flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors px-2 py-1 rounded border border-blue-200 hover:bg-blue-50 disabled:opacity-50"
                title="Share auction live with others"
              >
                <Share2 className="w-4 h-4 mr-1" />
                <span>{sharingState.isLoading ? 'Sharing...' : 'Share Live'}</span>
              </button>
            ) : (
              <button
                onClick={() => setShowShareDialog(true)}
                className="flex items-center text-sm text-green-600 hover:text-green-800 transition-colors px-2 py-1 rounded border border-green-200 bg-green-50"
                title="Auction is being shared live"
              >
                <Users className="w-4 h-4 mr-1" />
                <span>Live ({sharingState.viewerCount})</span>
              </button>
            )}

            <button
              onClick={() => setShowSaveDialog(true)}
              className="flex items-center text-sm text-purple-600 hover:text-purple-800 transition-colors px-2 py-1 rounded border border-purple-200 hover:bg-purple-50"
              title="Save auction progress"
            >
              <Save className="w-4 h-4 mr-1" />
              <span>Save</span>
            </button>
            <button
              onClick={() => setShowEndAuctionDialog(true)}
              className="flex items-center text-sm text-red-600 hover:text-red-800 transition-colors px-2 py-1 rounded border border-red-200 hover:bg-red-50"
              title="Manually end the auction"
            >
              <Trophy className="w-4 h-4 mr-1" />
              <span>End Auction</span>
            </button>
            <button
              onClick={() => {
                if (allTeamsExpanded === true) {
                  setAllTeamsExpanded(false); // Collapse all
                } else {
                  setAllTeamsExpanded(true); // Expand all
                }
              }}
              className="flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              {allTeamsExpanded === true ? (
                <>
                  <span className="mr-1">Collapse All</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </>
              ) : (
                <>
                  <span className="mr-1">Expand All</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="team-grid mb-4">
          {tournament.teams.map((team) => {
            const isEligible = eligibleTeams.some(t => t.id === team.id);
            const isHighestBidder = auctionState.highestBid?.teamId === team.id;
            const isSelected = selectedTeam === team.id;
            const maxBid = getMaxBidForTeam(team.id);

            return (
              <TeamCard
                key={team.id}
                team={team}
                isSelected={isSelected}
                isEligible={isEligible}
                isHighestBidder={isHighestBidder}
                maxBid={maxBid}
                minBid={minBid}
                forceExpanded={allTeamsExpanded}
                onSelect={() => {
                  if (isSelected) {
                    handleQuickBid(team.id);
                  } else {
                    setSelectedTeam(team.id);
                    setBidAmount(minBid);
                    setShowBidInput(true);
                  }
                }}
                onQuickBid={() => handleQuickBid(team.id)}
                onPass={() => handlePassTeam(team.id)}
                disabled={!isEligible}
              />
            );
          })}
        </div>

        {/* Custom Bid Input - Compact */}
        {showBidInput && selectedTeam && (
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-blue-900">
                Bid for {tournament.teams.find(t => t.id === selectedTeam)?.name}
              </h3>
              <button
                onClick={() => {
                  setShowBidInput(false);
                  setSelectedTeam('');
                }}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                ✕
              </button>
            </div>

            {(() => {
              const maxBid = getMaxBidForTeam(selectedTeam);
              const team = tournament.teams.find(t => t.id === selectedTeam);
              const remainingSlots = team ? team.maxPlayers - team.players.length : 0;

              return (
                <>
                  {remainingSlots > 1 && (
                    <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-yellow-800">
                          ⚠️ Reserve budget for {remainingSlots - 1} more players
                        </span>
                        <span className="font-semibold text-yellow-900">
                          Max: {formatCurrency(maxBid)}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-3">
                    <div className="flex-1">
                      <div className="relative">
                        <input
                          type="number"
                          value={bidAmount}
                          onChange={(e) => setBidAmount(Number(e.target.value))}
                          min={minBid}
                          max={maxBid}
                          step={Number(settings.bidIncrement)}
                          className="input-field text-sm pr-24"
                          placeholder={`Min: ${formatCurrency(minBid)} • Max: ${formatCurrency(maxBid)}`}
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span className="text-sm text-blue-700 font-bold bg-blue-50 px-2 py-1 rounded border border-blue-200">
                            {formatCurrency(bidAmount || 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 max-w-md">
                      {(() => {
                        // Generate smart quick bid increments
                        const baseIncrement = Number(settings.bidIncrement);
                        const currentBid = auctionState.highestBid?.amount || (currentPlayer?.basePrice || tournament?.settings.minimumBid || 100);

                        // Create multiple increment options based on current bid scale
                        const increments = [
                          baseIncrement,                    // 1x increment
                          baseIncrement * 2,               // 2x increment
                          baseIncrement * 5,               // 5x increment
                          baseIncrement * 10,              // 10x increment
                          baseIncrement * 20,              // 20x increment
                          baseIncrement * 50,              // 50x increment
                          Math.round(currentBid * 0.05),  // 5% of current bid
                          Math.round(currentBid * 0.1),   // 10% of current bid
                          Math.round(currentBid * 0.25),  // 25% of current bid
                          Math.round(currentBid * 0.5),   // 50% of current bid
                        ].filter((inc, index, arr) => {
                          // Remove duplicates and ensure minimum increment
                          return inc >= baseIncrement && arr.indexOf(inc) === index;
                        }).sort((a, b) => a - b).slice(0, 8); // Show max 8 options

                        const buttons = increments.map((increment) => {
                          const newAmount = minBid + increment;
                          return newAmount <= maxBid ? (
                            <button
                              key={increment}
                              onClick={() => setBidAmount(newAmount)}
                              className="btn-secondary text-xs py-1 px-1.5 whitespace-nowrap text-center min-w-0"
                              title={`Add ${formatCurrency(increment)} to current bid`}
                            >
                              +{formatCurrency(increment)}
                            </button>
                          ) : null;
                        }).filter(Boolean);

                        // Add Max button if there's space and max bid is significantly higher than min bid
                        if (maxBid > minBid * 1.5) {
                          buttons.push(
                            <button
                              key="max"
                              onClick={() => setBidAmount(maxBid)}
                              className="btn-secondary text-xs py-1 px-2 bg-yellow-100 text-yellow-800 border-yellow-300 whitespace-nowrap font-medium"
                              title={`Maximum possible bid: ${formatCurrency(maxBid)}`}
                            >
                              Max
                            </button>
                          );
                        }

                        return buttons;
                      })()}
                    </div>
                    <button
                      onClick={handlePlaceBid}
                      disabled={bidAmount < minBid || bidAmount > maxBid}
                      className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm py-2 px-3"
                    >
                      <Zap className="w-3 h-3 mr-1" />
                      Bid
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>

      {/* Bid History and Remaining Players */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bid History */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Bid History</h3>
          {auctionState.currentBids.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {auctionState.currentBids
                .slice()
                .reverse()
                .map((bid, index) => {
                  const team = tournament.teams.find(t => t.id === bid.teamId);
                  return (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        <div
                          className="w-4 h-4 rounded-full mr-2"
                          style={{
                            background: `linear-gradient(135deg, ${team?.primaryColor}, ${team?.secondaryColor})`,
                          }}
                        />
                        <span className="font-medium">{team?.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-blue-600">
                          {formatCurrency(bid.amount)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(bid.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="text-center text-gray-500 text-sm py-8">
              No bids placed yet
            </div>
          )}
        </div>

        {/* Remaining Players - Takes 2 columns */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Remaining Players</h3>
            <div className="text-right">
              <div className="text-lg font-bold text-orange-600">
                {tournament.players.filter(p => !p.soldPrice && (tournament.players.indexOf(p) > tournament.currentPlayerIndex || p.isUnsold)).length}
              </div>
              <div className="text-xs text-gray-500">Left</div>
            </div>
          </div>

          {tournament.players.filter(p => !p.soldPrice && (tournament.players.indexOf(p) > tournament.currentPlayerIndex || p.isUnsold)).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-64 overflow-y-auto">
              {tournament.players
                .filter(p => !p.soldPrice && (tournament.players.indexOf(p) > tournament.currentPlayerIndex || p.isUnsold))
                .sort((a, b) => {
                  // Sort upcoming players first, then unsold players at the end
                  const aIsUnsold = a.isUnsold;
                  const bIsUnsold = b.isUnsold;

                  if (aIsUnsold && !bIsUnsold) return 1; // a (unsold) comes after b (upcoming)
                  if (!aIsUnsold && bIsUnsold) return -1; // a (upcoming) comes before b (unsold)

                  // Within each group (upcoming or unsold), randomize the order
                  // Use player name as a seed for consistent randomization across renders
                  const aHash = a.name.split('').reduce((hash, char) => hash + char.charCodeAt(0), 0);
                  const bHash = b.name.split('').reduce((hash, char) => hash + char.charCodeAt(0), 0);
                  return aHash - bHash;
                })
                .map((player) => {
                  const isUnsold = player.isUnsold;

                  return (
                    <div key={player.id} className={`flex items-center justify-between text-sm rounded-lg p-3 ${
                      isUnsold ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'
                    }`}>
                      <div className="flex items-center min-w-0 flex-1">
                        <div className="flex-shrink-0 mr-2">
                          <PlayerImage
                            imageUrl={player.imageUrl}
                            playerName={player.name}
                            size="sm"
                            className="shadow-sm"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-1">
                            {isUnsold && (
                              <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-yellow-200 text-yellow-800">
                                UNSOLD
                              </span>
                            )}
                            <div className="font-medium text-gray-900 truncate">{player.name}</div>
                          </div>
                          {player.role && (
                            <div className="text-xs text-gray-500">{player.role}</div>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <div className="text-xs font-medium text-gray-600">
                          {formatCurrency(player.basePrice || tournament.settings.minimumBid)}
                        </div>
                        <div className="text-xs text-gray-400">Base</div>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="text-center text-gray-500 text-sm py-8">
              {tournament.currentPlayerIndex >= tournament.players.length - 1
                ? "🏆 Auction completed!"
                : "No more players to auction"}
            </div>
          )}
        </div>
      </div>

      {/* Auction Progress - Full Width */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Auction Progress</h3>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              {tournament.currentPlayerIndex + 1} / {tournament.players.length}
            </div>
            <div className="text-sm text-gray-500">Players</div>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
            style={{
              width: `${((tournament.currentPlayerIndex + 1) / tournament.players.length) * 100}%`,
            }}
          />
        </div>
        <div className="flex justify-between text-sm text-gray-600 mt-2">
          <span>Start</span>
          <span className="font-medium">{Math.round(((tournament.currentPlayerIndex + 1) / tournament.players.length) * 100)}% Complete</span>
          <span>Finish</span>
        </div>
      </div>

      {/* End Auction Confirmation Dialog */}
      {showEndAuctionDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md mx-4 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                End Auction?
              </h3>
              <p className="text-gray-600 mb-4">
                {allTeamsFull
                  ? "Are you sure you want to end the auction? All teams have completed their squads."
                  : "Are you sure you want to end the auction early? Some teams may not have completed their squads yet."
                }
              </p>
              {!allTeamsFull && (
                <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
                  <div className="text-gray-700 mb-2 font-medium">Current Status:</div>
                  <div className="space-y-1 text-gray-600">
                    <div>Players sold: {tournament.players.filter(p => p.soldPrice).length} / {tournament.players.length}</div>
                    <div>Teams with space: {tournament.teams.filter(team => team.players.length < team.maxPlayers).length} / {tournament.teams.length}</div>
                    <div>Eligible teams: {eligibleTeams.length} / {tournament.teams.length}</div>
                  </div>
                </div>
              )}
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowEndAuctionDialog(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEndAuction}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-colors"
                >
                  End Auction
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Auction Dialog */}
      {showShareDialog && sharingState.shareUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md mx-4 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                <Share2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Auction is Live!
              </h3>
              <p className="text-gray-600 mb-4">
                Share this link with others to let them watch the auction in real-time.
              </p>

              {/* Share URL */}
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="text-sm text-gray-600 mb-2">Share Link:</div>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={sharingState.shareUrl}
                    readOnly
                    className="flex-1 text-sm bg-white border border-gray-300 rounded px-2 py-1 text-gray-800"
                  />
                  <button
                    onClick={handleCopyShareUrl}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      copySuccess
                        ? 'bg-green-100 text-green-800 border border-green-300'
                        : 'bg-blue-100 text-blue-800 border border-blue-300 hover:bg-blue-200'
                    }`}
                  >
                    {copySuccess ? (
                      <>✓ Copied</>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 mr-1 inline" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Viewer Count */}
              <div className="flex items-center justify-center text-sm text-gray-600 mb-4">
                <Users className="w-4 h-4 mr-1" />
                <span>{sharingState.viewerCount} viewer{sharingState.viewerCount !== 1 ? 's' : ''} watching</span>
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowShareDialog(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleStopSharing}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Stop Sharing
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Demo Dialog */}
      <ShareAuctionDemo
        isVisible={showShareDemo}
        onClose={() => setShowShareDemo(false)}
      />

      {/* Save Auction Dialog */}
      <SaveAuctionDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onSave={handleSaveAuction}
        currentName={tournament?.name || 'My Auction'}
        isCompleted={false}
      />
    </div>
  );
};

export default AuctionRoom;
