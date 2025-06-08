import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Wifi, WifiOff, Eye, Clock, RefreshCw } from 'lucide-react';
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
              const soldPlayer = prevData.tournament.players[prevPlayerIndex];
              if (soldPlayer) {
                // Check if player was sold by looking at highest bid
                if (prevData.auctionState.highestBid) {
                  const soldTeam = data.tournament.teams?.find(t => t.id === prevData.auctionState.highestBid?.teamId);
                  success(
                    `${soldPlayer.name} SOLD!`,
                    `Bought by ${soldTeam?.name || 'Unknown Team'} for ${formatCurrency(prevData.auctionState.highestBid.amount)}`,
                    6000
                  );
                } else {
                  warning(
                    `${soldPlayer.name} UNSOLD`,
                    'No bids received - player goes back to pool',
                    4000
                  );
                }
              }
            }

            // New player started
            const currentPlayer = data.tournament.players[currentPlayerIndex];
            if (currentPlayer && currentPlayerIndex !== prevPlayerIndex) {
              info(
                `Now Auctioning: ${currentPlayer.name}`,
                `Base price: ${formatCurrency(currentPlayer.basePrice || data.tournament.settings?.minimumBid || 100)}`,
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

  const { tournament, auctionState } = auctionData;
  const currentPlayer = tournament.players && tournament.players[tournament.currentPlayerIndex];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />

      {/* Header - Compact */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
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

      <div className="max-w-7xl mx-auto p-4 space-y-4">
        {/* Current Player - Compact Card */}
        {currentPlayer && (
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              {/* Bid Information - Far Left */}
              <div className="text-left flex-shrink-0">
                {auctionState.highestBid ? (
                  <div>
                    <p className="text-sm text-blue-600 font-medium">CURRENT BID</p>
                    <div className="text-3xl font-bold text-blue-600">
                      {formatCurrency(auctionState.highestBid.amount)}
                    </div>
                    <p className="text-sm text-gray-600">
                      by {tournament.teams?.find(t => t.id === auctionState.highestBid?.teamId)?.name || 'Unknown Team'}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-600 font-medium">BASE PRICE</p>
                    <div className="text-3xl font-bold text-gray-900">
                      {formatCurrency(currentPlayer.basePrice || tournament.settings.minimumBid)}
                    </div>
                  </div>
                )}
              </div>

              {/* Player Info - Centered */}
              <div className="flex items-center space-x-4 flex-shrink-0">
                <div className="flex-shrink-0">
                  <PlayerImage
                    imageUrl={currentPlayer.imageUrl}
                    playerName={currentPlayer.name}
                    size="xl"
                    className="shadow-md"
                  />
                </div>
                <div className="text-center">
                  <h2 className="text-2xl font-semibold text-gray-900 whitespace-nowrap">
                    {currentPlayer.name}
                  </h2>
                  {currentPlayer.role && (
                    <span className="inline-block bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded-full mt-1">
                      {currentPlayer.role}
                    </span>
                  )}
                </div>
              </div>

              {/* Progress Indicator - Far Right */}
              <div className="text-right flex-shrink-0">
                <div className="text-lg font-bold text-gray-700">
                  {(tournament.currentPlayerIndex || 0) + 1} / {tournament.players?.length || 0}
                </div>
                <div className="text-sm text-gray-500">Players</div>
                <div className="w-16 bg-gray-200 rounded-full h-2 mt-1">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${tournament.players?.length ? (((tournament.currentPlayerIndex || 0) + 1) / tournament.players.length) * 100 : 0}%`,
                    }}
                  />
                </div>
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
                const isHighestBidder = auctionState.highestBid?.teamId === team.id;

                // Calculate if team is eligible (can afford current player)
                const currentPlayer = tournament.players && tournament.players[tournament.currentPlayerIndex];
                const basePrice = currentPlayer ? (currentPlayer.basePrice || tournament.settings?.minimumBid || 100) : 100;
                const currentBid = auctionState.highestBid?.amount || 0;
                const minBid = Math.max(basePrice, currentBid + (tournament.settings?.minimumBid || 100));
                const isEligible = team.remainingBudget >= minBid &&
                                 (team.players?.length || 0) < (team.maxPlayers || 11);

                // Ensure team has required properties
                const safeTeam = {
                  ...team,
                  players: team.players || [],
                  remainingBudget: team.remainingBudget || 0,
                  maxPlayers: team.maxPlayers || 11,
                };

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
                    maxBid={team.remainingBudget}
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
      </div>
    </div>
  );
};

export default LiveAuctionViewer;
