import React, { useState, useEffect } from 'react';
import { Check, Star } from 'lucide-react';
import type { Team } from '../types';
import { formatCurrency } from '../utils/excelUtils';
import PlayerImage from './PlayerImage';

// Role icons mapping
const getRoleIcon = (role: string | undefined) => {
  switch (role) {
    case 'Batsman':
      return '🏏'; // Cricket bat
    case 'Bowler':
      return '⚡'; // Lightning for fast bowling
    case 'All-Rounder':
      return '🌟'; // Star for versatility
    case 'Wicket-Keeper':
      return '🥅'; // Goal/wickets
    default:
      return '👤'; // Default person icon
  }
};

interface TeamCardProps {
  team: Team;
  isSelected: boolean;
  isEligible: boolean;
  isHighestBidder: boolean;
  onSelect: () => void;
  onPass: () => void;
  onQuickBid?: () => void;
  disabled?: boolean;
  maxBid?: number;
  minBid?: number;
  forceExpanded?: boolean | null;
  viewerMode?: boolean; // New prop for live viewer mode
  showPrices?: boolean; // New prop to control price visibility
}

const TeamCard: React.FC<TeamCardProps> = ({
  team,
  isSelected,
  isEligible,
  isHighestBidder,
  onSelect,
  onPass,
  onQuickBid,
  disabled = false,
  maxBid,
  minBid,
  forceExpanded = null,
  viewerMode = false,
  showPrices = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Reset local state when forceExpanded changes, but only if it's a definitive state
  useEffect(() => {
    if (forceExpanded !== null) {
      setIsExpanded(forceExpanded);
    }
  }, [forceExpanded]);

  // Use forceExpanded when set, otherwise use local state
  const shouldShowExpanded = forceExpanded !== null ? forceExpanded : isExpanded;
  const cardClasses = `
    relative p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer min-h-[120px]
    ${isHighestBidder
      ? 'border-green-500 bg-green-50 shadow-md'
      : isSelected
        ? 'border-blue-500 bg-blue-50 shadow-sm'
        : isEligible || viewerMode
          ? 'border-gray-300 bg-white hover:border-gray-400 hover:shadow-sm'
          : 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
    }
  `;

  const logoStyle = {
    background: `linear-gradient(135deg, ${team.primaryColor}, ${team.secondaryColor})`,
  };

  return (
    <div className={cardClasses} onClick={isEligible && !disabled ? onSelect : undefined}>
      {/* Clean, Compact Layout */}
      <div className="space-y-2">
        {/* Team Name - Full Row */}
        <div className="flex items-center space-x-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0"
            style={logoStyle}
          >
            {team.logo}
          </div>
          <h3 className="font-medium text-base text-gray-900 truncate flex-1">
            {team.name}
          </h3>
          {isHighestBidder && (
            <div className="bg-green-500 text-white rounded-full p-1">
              <Check className="w-3 h-3" />
            </div>
          )}
        </div>

        {/* Budget and Players - Clean Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-left">
              <div className="text-lg font-semibold text-gray-900">
                {showPrices ? formatCurrency(team.remainingBudget) : '***'}
              </div>
              <div className="text-xs text-gray-500">Budget Left</div>
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-gray-700">
                {team.players?.length || 0}/{team.maxPlayers}
              </div>
              <div className="text-xs text-gray-500">Players</div>
            </div>
          </div>

          {/* Max Bid - Right Side */}
          {maxBid !== undefined && isEligible && showPrices && (
            <div className="text-right">
              <div className="text-sm font-medium text-orange-600">
                {formatCurrency(maxBid)}
              </div>
              <div className="text-xs text-gray-500">Max Bid</div>
            </div>
          )}
        </div>

        {/* Action Buttons - Compact */}
        {isEligible && !disabled && (
          <div className="flex space-x-2">
            {/* BID Button */}
            {onQuickBid && minBid !== undefined && maxBid !== undefined && maxBid >= minBid && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickBid();
                }}
                className="flex-1 py-2 px-3 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                title={`Quick bid: ${formatCurrency(minBid)}`}
              >
                <div className="flex items-center justify-center space-x-1">
                  <span>⚡</span>
                  <span>BID {showPrices ? formatCurrency(minBid) : '***'}</span>
                </div>
              </button>
            )}

            {/* Pass Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPass();
              }}
              className="px-4 py-2 rounded-md text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Pass
            </button>
          </div>
        )}

        {!isEligible && (
          <div className="text-center py-1 text-sm text-gray-500">
            {team.remainingBudget < (minBid || 100) ? 'Insufficient Budget' :
             (team.players?.length || 0) >= team.maxPlayers ? 'Squad Full' : 'Passed'}
          </div>
        )}
      </div>

      {/* Expandable Players Section */}
      {shouldShowExpanded && team.players && team.players.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Squad ({team.players?.length || 0}/{team.maxPlayers})
              </h4>
              <div className="text-xs text-gray-500">
                Spent: {showPrices ? formatCurrency(team.budget - team.remainingBudget) : '***'}
              </div>
            </div>

            <div className="grid gap-1.5">
              {(team.players || [])
                .sort((a, b) => (b.soldPrice || 0) - (a.soldPrice || 0)) // Sort by price descending
                .map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                  >
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      {/* Player Image */}
                      <PlayerImage
                        imageUrl={player.imageUrl}
                        playerName={player.name}
                        size="sm"
                        className="flex-shrink-0"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">{getRoleIcon(player.role)}</span>
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {player.name}
                          </span>
                          {player.rating && player.rating >= 85 && (
                            <Star className="w-3 h-3 text-yellow-500 flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                          {player.rating && (
                            <span>⭐ {player.rating}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs font-semibold text-green-600 flex-shrink-0">
                      {showPrices ? formatCurrency(player.soldPrice || 0) : '***'}
                    </div>
                  </div>
                ))}
            </div>

            {/* Team Summary */}
            {team.players && team.players.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <span>{getRoleIcon('Batsman')}</span>
                      <span className="font-medium text-gray-900">
                        {(team.players || []).filter(p => p.role === 'Batsman').length}
                      </span>
                    </div>
                    <div className="text-gray-500">Batsmen</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <span>{getRoleIcon('Bowler')}</span>
                      <span className="font-medium text-gray-900">
                        {(team.players || []).filter(p => p.role === 'Bowler').length}
                      </span>
                    </div>
                    <div className="text-gray-500">Bowlers</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <span>{getRoleIcon('All-Rounder')}</span>
                      <span className="font-medium text-gray-900">
                        {(team.players || []).filter(p => p.role === 'All-Rounder').length}
                      </span>
                    </div>
                    <div className="text-gray-500">All-Rounders</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <span>{getRoleIcon('Wicket-Keeper')}</span>
                      <span className="font-medium text-gray-900">
                        {(team.players || []).filter(p => p.role === 'Wicket-Keeper').length}
                      </span>
                    </div>
                    <div className="text-gray-500">Keepers</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamCard;
