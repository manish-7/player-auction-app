import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Wifi, WifiOff, Eye, Clock, RefreshCw, Trophy } from 'lucide-react';
import { auctionSharingService, type SharedAuctionData } from '../services/auctionSharingService';
import { formatCurrency } from '../utils/excelUtils';
import TeamCard from './TeamCard';
import ToastContainer from './ToastContainer';
import { useToast } from '../hooks/useToast';
import PlayerImage from './PlayerImage';

const LiveAuctionViewer: React.FC = () => {
  const { auctionId } = useParams<{ auctionId: string }>();
  const navigate = useNavigate();
  const { toasts, removeToast, success, info, warning } = useToast();

  const [auctionData, setAuctionData] = useState<SharedAuctionData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewerName, setViewerName] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  // Price visibility is controlled by tournament settings, not user preference
  const showPrices = auctionData ? !auctionData.tournament.settings?.hidePricesInLiveView : true;

  // Track previous state for notifications
  const previousDataRef = useRef<SharedAuctionData | null>(null);

  useEffect(() => {
    if (!auctionId) {
      setError('Invalid auction link');
      return;
    }

    // Check if auction exists first
    auctionSharingService.checkAuctionExists(auctionId).then(exists => {
      if (!exists) {
        setError('Auction not found or has ended');
        return;
      }

      // Subscribe to auction updates
      const unsubscribe = auctionSharingService.subscribeToAuction(
        auctionId,
        (data) => {
          // Check for player state changes and show notifications
          if (previousDataRef.current) {
            const prevData = previousDataRef.current;
            const prevPlayerIndex = prevData.tournament.currentPlayerIndex;
            const currentPlayerIndex = data.tournament.currentPlayerIndex;

            // Player moved to next (either sold or unsold)
            if (currentPlayerIndex > prevPlayerIndex) {
              const prevPlayer = prevData.tournament.players[prevPlayerIndex];
              if (prevPlayer) {
                // Check if player was sold by looking at the current player state
                const currentPlayerState = data.tournament.players[prevPlayerIndex];
                if (currentPlayerState && currentPlayerState.soldPrice && currentPlayerState.teamId) {
                  // Player was sold - find the team that bought them
                  const soldTeam = data.tournament.teams?.find(t => t.id === currentPlayerState.teamId);
                  const shouldShowPrice = !data.tournament.settings?.hidePricesInLiveView;
                  const priceText = shouldShowPrice ? ` for ${formatCurrency(currentPlayerState.soldPrice)}` : '';
                  success(
                    `${prevPlayer.name} SOLD!`,
                    `Bought by ${soldTeam?.name || 'Unknown Team'}${priceText}`,
                    6000
                  );
                } else if (currentPlayerState && currentPlayerState.isUnsold) {
                  // Player was marked as unsold
                  warning(
                    `${prevPlayer.name} UNSOLD`,
                    'No bids received - player goes back to pool',
                    4000
                  );
                }
              }
            }

            // New player started
            const currentPlayer = data.tournament.players[currentPlayerIndex];
            if (currentPlayer && currentPlayerIndex !== prevPlayerIndex) {
              const shouldShowPrice = !data.tournament.settings?.hidePricesInLiveView;
              const basePriceText = shouldShowPrice
                ? `Base price: ${formatCurrency(currentPlayer.basePrice || data.tournament.settings?.minimumBid || 100)}`
                : currentPlayer.role ? `Role: ${currentPlayer.role}` : 'Now up for auction';
              info(
                `Now Auctioning: ${currentPlayer.name}`,
                basePriceText,
                3000
              );
            }
          }

          previousDataRef.current = data;
          setAuctionData(data);
          setIsConnected(true);
          setLastUpdated(new Date());
          setError(null);
        },
        (error) => {
          setError(error.message);
          setIsConnected(false);
        }
      );

      // Subscribe to viewer count
      const unsubscribeViewers = auctionSharingService.subscribeToViewers(
        auctionId,
        (count) => {
          setViewerCount(count);
        }
      );

      // Monitor Firebase connection
      const unsubscribeConnection = auctionSharingService.monitorConnection(
        (connected) => {
          console.log('Firebase connection changed:', connected);
          setIsConnected(connected);
          if (!connected) {
            warning('Connection lost', 'Trying to reconnect...', 3000);
          }
        }
      );

      return () => {
        unsubscribe();
        unsubscribeViewers();
        unsubscribeConnection();
      };
    });
  }, [auctionId]);

  const handleJoinAuction = async () => {
    if (!auctionId || !viewerName.trim()) return;

    try {
      await auctionSharingService.joinAsViewer(auctionId, viewerName.trim());
      setHasJoined(true);
    } catch (error) {
      setError('Failed to join auction');
    }
  };

  const handleRefresh = () => {
    console.log('Manual refresh triggered');
    window.location.reload();
  };

  // Join screen
  if (!hasJoined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <Eye className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Join Live Auction
            </h1>
            <p className="text-gray-600 mb-6">
              Enter your name to watch the auction in real-time
            </p>
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Your name"
                value={viewerName}
                onChange={(e) => setViewerName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && handleJoinAuction()}
              />
              <button
                onClick={handleJoinAuction}
                disabled={!viewerName.trim()}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2 px-4 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Join Auction
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error screen
  if (error && !auctionData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-500 rounded-full flex items-center justify-center">
            <WifiOff className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Connection Error
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // Loading screen
  if (!auctionData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Connecting to auction...</p>
        </div>
      </div>
    );
  }

  const { tournament, auctionState, isShuffling } = auctionData;
  const currentPlayer = tournament.players && tournament.players[tournament.currentPlayerIndex];

  // Helper function to get auctionable player count (excluding captains)
  const getAuctionablePlayerCount = () => {
    const captains = tournament.players.filter(p => p.isCaptain);
    const hasCaptains = captains.length === tournament.numberOfTeams;
    return tournament.players.filter(p => !hasCaptains || !p.isCaptain).length;
  };

  // Helper function to get current auction progress (excluding captains)
  const getCurrentAuctionProgress = () => {
    const captains = tournament.players.filter(p => p.isCaptain);
    const hasCaptains = captains.length === tournament.numberOfTeams;

    // Find the current player's position in the auctionable players list
    let currentAuctionableIndex = 0;
    for (let i = 0; i <= tournament.currentPlayerIndex && i < tournament.players.length; i++) {
      const player = tournament.players[i];
      if (!hasCaptains || !player.isCaptain) {
        if (i === tournament.currentPlayerIndex) {
          break;
        }
        currentAuctionableIndex++;
      }
    }
    return currentAuctionableIndex + 1;
  };

  // Helper function to calculate max bid for a team (same logic as auction store)
  const getMaxBidForTeam = (team: any) => {
    if (!tournament) return 0;

    const remainingSlots = team.maxPlayers - team.players.length;

    // If this is the last slot, team can bid their entire remaining budget
    if (remainingSlots <= 1) {
      return team.remainingBudget;
    }

    // Calculate maximum bid: remaining budget minus minimum required for remaining slots
    const minimumBid = tournament.settings?.minimumBid || 100;
    const reserveForRemainingSlots = (remainingSlots - 1) * minimumBid;
    const maxBid = team.remainingBudget - reserveForRemainingSlots;

    // Ensure max bid is at least the minimum bid
    return Math.max(maxBid, minimumBid);
  };

  // When shuffling, keep showing the previous bid info to maintain consistency
  const shouldShowPreviousBid = isShuffling && previousDataRef.current &&
    previousDataRef.current.auctionState.highestBid !== null;

  // Use previous bid info if shuffling, otherwise use current
  const displayBid = shouldShowPreviousBid ? previousDataRef.current!.auctionState.highestBid : auctionState.highestBid;
  const displayTeams = shouldShowPreviousBid ? previousDataRef.current!.tournament.teams : tournament.teams;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />

      {/* Header - Compact */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-3">
        <div className="max-w-7xl mx-auto">
          {/* Mobile Header */}
          <div className="block md:hidden">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Live Auction</h1>
                <p className="text-xs text-gray-600">Watching as {viewerName}</p>
              </div>
              <button
                onClick={handleRefresh}
                className="flex items-center text-xs text-gray-600 hover:text-gray-800 transition-colors px-2 py-1 rounded border border-gray-200 hover:bg-gray-50"
                title="Refresh connection"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Refresh
              </button>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <div className="flex items-center text-blue-600">
                  <Eye className="w-3 h-3 mr-1" />
                  {viewerCount}
                </div>
                <div className={`flex items-center ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                  {isConnected ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
                  {isConnected ? 'Connected' : 'Disconnected'}
                </div>
              </div>
              {lastUpdated && (
                <div className="flex items-center text-gray-500">
                  <Clock className="w-3 h-3 mr-1" />
                  {lastUpdated.toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden md:flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Live Auction</h1>
              <p className="text-sm text-gray-600">Watching as {viewerName}</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center text-sm text-blue-600">
                <Eye className="w-4 h-4 mr-1" />
                {viewerCount} watching
              </div>
              <div className={`flex items-center text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                {isConnected ? <Wifi className="w-4 h-4 mr-1" /> : <WifiOff className="w-4 h-4 mr-1" />}
                {isConnected ? 'Connected' : 'Disconnected'}
              </div>
              {lastUpdated && (
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="w-4 h-4 mr-1" />
                  Updated {lastUpdated.toLocaleTimeString()}
                </div>
              )}

              <button
                onClick={handleRefresh}
                className="flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors px-2 py-1 rounded border border-gray-200 hover:bg-gray-50"
                title="Refresh connection"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-4">
        {/* Current Player or Completion Status */}
        {currentPlayer ? (
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
            <div className="min-h-[120px] flex items-center">
              {isShuffling ? (
                /* Shuffling State - Show shuffling indicator */
                <div className="flex items-center justify-center w-full">
                  <div className="text-center">
                    <div className="inline-flex items-center px-4 py-2 rounded-full bg-yellow-100 text-yellow-800 text-lg font-medium animate-bounce mb-2">
                      🎲 Selecting Next Player...
                    </div>
                    <p className="text-sm text-gray-600">Please wait while the next player is being selected</p>
                  </div>
                </div>
              ) : (
                <div className="w-full">
                  {/* Mobile Layout */}
                  <div className="block md:hidden">
                    {/* Player Info - Top */}
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="flex-shrink-0">
                        <PlayerImage
                          key={`live-player-${currentPlayer?.id}-${tournament.currentPlayerIndex}`}
                          imageUrl={currentPlayer?.imageUrl}
                          playerName={currentPlayer?.name || 'Unknown Player'}
                          size="lg"
                          className="shadow-md"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-semibold text-gray-900 truncate">
                          {currentPlayer?.name || 'Unknown Player'}
                          {currentPlayer?.isCaptain && (
                            <span className="text-sm font-bold text-blue-600 ml-1">(C)</span>
                          )}
                        </h2>
                        {currentPlayer?.role && (
                          <span className="inline-block bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded-full mt-1">
                            {currentPlayer.role}
                          </span>
                        )}
                        <div className="mt-2 text-sm text-gray-500">
                          Player {getCurrentAuctionProgress()} of {getAuctionablePlayerCount()}
                        </div>
                      </div>
                    </div>

                    {/* Bid Information - Bottom */}
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        {displayBid ? (
                          <div>
                            <p className="text-xs text-blue-600 font-medium">CURRENT BID</p>
                            <div className="text-2xl font-bold text-blue-600">
                              {showPrices ? formatCurrency(displayBid.amount) : '***'}
                            </div>
                            <p className="text-xs text-gray-600">
                              by {displayTeams?.find(t => t.id === displayBid?.teamId)?.name || 'Unknown Team'}
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-xs text-gray-600 font-medium">BASE PRICE</p>
                            <div className="text-2xl font-bold text-gray-900">
                              {showPrices ? formatCurrency(currentPlayer?.basePrice || tournament.settings?.minimumBid || 100) : '***'}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Progress Bar - Mobile */}
                      <div className="text-right">
                        <div className="text-xs text-gray-500 mb-1">
                          {getCurrentAuctionProgress()} / {getAuctionablePlayerCount()}
                        </div>
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                            style={{
                              width: `${getAuctionablePlayerCount() ? (getCurrentAuctionProgress() / getAuctionablePlayerCount()) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden md:flex items-center justify-between w-full">
                    {/* Bid Information - Far Left */}
                    <div className="text-left flex-shrink-0">
                      {displayBid ? (
                        <div>
                          <p className="text-sm text-blue-600 font-medium">CURRENT BID</p>
                          <div className="text-3xl font-bold text-blue-600">
                            {showPrices ? formatCurrency(displayBid.amount) : '***'}
                          </div>
                          <p className="text-sm text-gray-600">
                            by {displayTeams?.find(t => t.id === displayBid?.teamId)?.name || 'Unknown Team'}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm text-gray-600 font-medium">BASE PRICE</p>
                          <div className="text-3xl font-bold text-gray-900">
                            {showPrices ? formatCurrency(currentPlayer?.basePrice || tournament.settings?.minimumBid || 100) : '***'}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Player Info - Centered */}
                    <div className="flex items-center space-x-4 flex-shrink-0">
                      <div className="flex-shrink-0">
                        <PlayerImage
                          key={`live-player-${currentPlayer?.id}-${tournament.currentPlayerIndex}`}
                          imageUrl={currentPlayer?.imageUrl}
                          playerName={currentPlayer?.name || 'Unknown Player'}
                          size="xl"
                          className="shadow-md"
                        />
                      </div>
                      <div className="text-center">
                        <h2 className="text-2xl font-semibold text-gray-900 whitespace-nowrap">
                          {currentPlayer?.name || 'Unknown Player'}
                          {currentPlayer?.isCaptain && (
                            <span className="text-lg font-bold text-blue-600 ml-1">(C)</span>
                          )}
                        </h2>
                        {currentPlayer?.role && (
                          <span className="inline-block bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded-full mt-1">
                            {currentPlayer.role}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress Indicator - Far Right */}
                    <div className="text-right flex-shrink-0">
                      <div className="text-lg font-bold text-gray-700">
                        {getCurrentAuctionProgress()} / {getAuctionablePlayerCount()}
                      </div>
                      <div className="text-sm text-gray-500">Players</div>
                      <div className="w-16 bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${getAuctionablePlayerCount() ? (getCurrentAuctionProgress() / getAuctionablePlayerCount()) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Auction Completed Banner */
          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg shadow-md border-2 border-green-200 p-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-green-800 mb-2">
                🏆 Auction Completed!
              </h2>
              <p className="text-green-700 text-lg">
                All players have been auctioned. Check out the final team compositions below.
              </p>
              <div className="mt-4 text-sm text-green-600">
                <span className="font-medium">
                  {getAuctionablePlayerCount()} players processed
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Teams Grid - Compact */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Teams</h3>
          <div className="team-grid">
            {tournament.teams && tournament.teams.length > 0 ? (
              tournament.teams.map((team) => {
                const isHighestBidder = displayBid?.teamId === team.id;

                // Ensure team has required properties
                const safeTeam = {
                  ...team,
                  players: team.players || [],
                  remainingBudget: team.remainingBudget || 0,
                  maxPlayers: team.maxPlayers || 11,
                };

                // Calculate minBid for display purposes
                const currentPlayerForBid = tournament.players && tournament.players[tournament.currentPlayerIndex];
                const basePrice = currentPlayerForBid ? (currentPlayerForBid.basePrice || tournament.settings?.minimumBid || 100) : 100;
                const currentBid = displayBid?.amount || 0;
                const minBid = Math.max(basePrice, currentBid + (tournament.settings?.minimumBid || 100));

                // For live viewer, calculate eligibility to show proper status messages
                // but don't gray out teams (they should still be visible)
                // Check squad space first (hard constraint), then budget
                const hasSquadSpace = (safeTeam.players?.length || 0) < safeTeam.maxPlayers;
                const hasBudget = safeTeam.remainingBudget >= minBid;
                const isEligible = hasSquadSpace && hasBudget;

                return (
                  <TeamCard
                    key={team.id}
                    team={safeTeam}
                    isSelected={false}
                    isEligible={isEligible}
                    isHighestBidder={isHighestBidder}
                    forceExpanded={true}
                    onSelect={() => {}}
                    onPass={() => {}}
                    disabled={true}
                    minBid={minBid}
                    maxBid={getMaxBidForTeam(safeTeam)}
                    viewerMode={true}
                    showPrices={showPrices}
                  />
                );
              })
            ) : (
              <div className="text-center text-gray-500 py-4">
                No teams data available
              </div>
            )}
          </div>
        </div>

        {/* Remaining Players */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-3 md:p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base md:text-lg font-semibold text-gray-900">Remaining Players</h3>
            <div className="text-right">
              <div className="text-base md:text-lg font-bold text-orange-600">
                {(() => {
                  const captains = tournament.players.filter(p => p.isCaptain);
                  const hasCaptains = captains.length === tournament.numberOfTeams;
                  return tournament.players.filter(p => !p.soldPrice && (!hasCaptains || !p.isCaptain) && (tournament.players.indexOf(p) > tournament.currentPlayerIndex || p.isUnsold)).length;
                })()}
              </div>
              <div className="text-xs md:text-sm text-gray-500">Left</div>
            </div>
          </div>

          {(() => {
            const captains = tournament.players.filter(p => p.isCaptain);
            const hasCaptains = captains.length === tournament.numberOfTeams;
            return tournament.players.filter(p => !p.soldPrice && (!hasCaptains || !p.isCaptain) && (tournament.players.indexOf(p) > tournament.currentPlayerIndex || p.isUnsold)).length > 0;
          })() ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3 max-h-64 overflow-y-auto">
              {(() => {
                const captains = tournament.players.filter(p => p.isCaptain);
                const hasCaptains = captains.length === tournament.numberOfTeams;
                return tournament.players
                  .filter(p => !p.soldPrice && (!hasCaptains || !p.isCaptain) && (tournament.players.indexOf(p) > tournament.currentPlayerIndex || p.isUnsold));
              })()
                .sort((a, b) => {
                  // First sort by captain status (captains first)
                  if (a.isCaptain && !b.isCaptain) return -1;
                  if (!a.isCaptain && b.isCaptain) return 1;

                  // Then sort upcoming players first, then unsold players at the end
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
                  const shouldShowUnsoldStatus = !tournament.settings?.hideUnsoldStatusInLiveView;
                  const showUnsoldStyling = isUnsold && shouldShowUnsoldStatus;

                  return (
                    <div key={player.id} className={`flex items-center justify-between text-xs md:text-sm rounded-lg p-2 ${
                      showUnsoldStyling ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'
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
                            {isUnsold && shouldShowUnsoldStatus && (
                              <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-yellow-200 text-yellow-800">
                                UNSOLD
                              </span>
                            )}
                            <div className="font-medium text-gray-900 truncate">
                              {player.name}
                              {player.isCaptain && (
                                <span className="text-xs font-bold text-blue-600 ml-1">(C)</span>
                              )}
                            </div>
                          </div>
                          {player.role && (
                            <div className="text-xs text-gray-500">{player.role}</div>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <div className="text-xs font-medium text-gray-600">
                          {showPrices ? formatCurrency(player.basePrice || tournament.settings?.minimumBid || 100) : '***'}
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
    </div>
  );
};

export default LiveAuctionViewer;
