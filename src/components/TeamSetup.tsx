import React, { useState } from 'react';
import { Edit2, Users, DollarSign } from 'lucide-react';
import { useAuctionStore } from '../store/auctionStore';
import { formatCurrency } from '../utils/excelUtils';

interface TeamSetupProps {
  onNext: () => void;
  onBack: () => void;
}

const TeamSetup: React.FC<TeamSetupProps> = ({ onNext, onBack }) => {
  const { tournament, setupTeams, assignCaptainsToTeams } = useAuctionStore();
  const [teamNames, setTeamNames] = useState<string[]>(
    tournament?.teams.map(team => team.name) || []
  );
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleTeamNameChange = (index: number, newName: string) => {
    const updatedNames = [...teamNames];
    updatedNames[index] = newName;
    setTeamNames(updatedNames);
  };

  const handleSaveTeamName = () => {
    setEditingIndex(null);
    setupTeams(teamNames);
  };

  const handleStartAuction = () => {
    setupTeams(teamNames);

    // Automatically assign captains to their teams only if we have the exact right number
    const captains = tournament?.players.filter(p => p.isCaptain) || [];
    if (captains.length === tournament?.numberOfTeams) {
      assignCaptainsToTeams();
    }
    // If captains.length is 0 or doesn't match numberOfTeams, proceed without captain functionality

    onNext();
  };

  const useDefaultNames = () => {
    const defaultNames = [
      'Mumbai Indians', 'Chennai Super Kings', 'Royal Challengers Bangalore',
      'Kolkata Knight Riders', 'Delhi Capitals', 'Punjab Kings',
      'Rajasthan Royals', 'Sunrisers Hyderabad', 'Gujarat Titans',
      'Lucknow Super Giants', 'Team 11', 'Team 12', 'Team 13', 'Team 14', 'Team 15', 'Team 16'
    ];

    const names = tournament?.teams.map((_, index) =>
      defaultNames[index] || `Team ${index + 1}`
    ) || [];

    setTeamNames(names);
    setupTeams(names);
  };

  const useCaptainNames = () => {
    if (!tournament) return;

    const captains = tournament.players.filter(player => player.isCaptain);

    if (captains.length !== tournament.numberOfTeams) {
      alert(`Cannot use captain names: Expected ${tournament.numberOfTeams} captains, but found ${captains.length}. Please ensure you have exactly one captain for each team in your Excel file.`);
      return;
    }

    const captainNames = captains.map(captain => `${captain.name}'s Team`);

    // Fill remaining slots with default names if needed
    const names = tournament.teams.map((_, index) =>
      captainNames[index] || `Team ${index + 1}`
    );

    setTeamNames(names);
    setupTeams(names);
  };

  if (!tournament) {
    return <div>No tournament data found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Team Setup
          </h2>
          <p className="text-gray-600">
            Customize team names and review the tournament configuration before starting the auction.
          </p>
        </div>

        {/* Tournament Summary */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tournament Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Total Teams</p>
                <p className="text-xl font-bold text-gray-900">{tournament.numberOfTeams}</p>
              </div>
            </div>
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Budget per Team</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(tournament.teamBudget)}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Users className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Players per Team</p>
                <p className="text-xl font-bold text-gray-900">{tournament.playersPerTeam}</p>
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Total Players Available:</span>
                <span className="ml-2 font-medium">{tournament.players.length}</span>
              </div>
              <div>
                <span className="text-gray-500">Players Needed:</span>
                <span className="ml-2 font-medium">{tournament.numberOfTeams * tournament.playersPerTeam}</span>
              </div>
              <div>
                <span className="text-gray-500">Total Budget:</span>
                <span className="ml-2 font-medium">{formatCurrency(tournament.teamBudget * tournament.numberOfTeams)}</span>
              </div>
              <div>
                <span className="text-gray-500">Avg. Price per Player:</span>
                <span className="ml-2 font-medium">
                  {formatCurrency(tournament.teamBudget / tournament.playersPerTeam)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Setup Options */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={useDefaultNames}
              className="btn-secondary"
            >
              Use IPL Team Names
            </button>
            <button
              onClick={() => {
                const names = tournament.teams.map((_, index) => `Team ${index + 1}`);
                setTeamNames(names);
                setupTeams(names);
              }}
              className="btn-secondary"
            >
              Use Default Names
            </button>
            {tournament.players.filter(p => p.isCaptain).length === tournament.numberOfTeams && (
              <button
                onClick={useCaptainNames}
                className="btn-primary"
              >
                Use Captain Names for Teams
              </button>
            )}
          </div>
          {tournament.players.filter(p => p.isCaptain).length > 0 && (
            <div className="mt-3 text-sm text-gray-600">
              <p>
                Captains found: {tournament.players.filter(p => p.isCaptain).map(c => c.name).join(', ')}
                {tournament.players.filter(p => p.isCaptain).length !== tournament.numberOfTeams && (
                  <span className="text-amber-600 ml-2">
                    (Need exactly {tournament.numberOfTeams} captains for team naming and auto-assignment)
                  </span>
                )}
                {tournament.players.filter(p => p.isCaptain).length === tournament.numberOfTeams && (
                  <span className="text-green-600 ml-2">
                    ✓ Perfect! Captains will be auto-assigned to teams
                  </span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Team Names Configuration */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Names</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tournament.teams.map((team, index) => (
              <div key={team.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    {editingIndex === index ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={teamNames[index] || ''}
                          onChange={(e) => handleTeamNameChange(index, e.target.value)}
                          className="input-field text-sm"
                          placeholder={`Team ${index + 1}`}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveTeamName();
                            }
                          }}
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveTeamName()}
                          className="btn-primary text-sm py-1 px-2"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {teamNames[index] || `Team ${index + 1}`}
                          </h4>
                          <p className="text-sm text-gray-500">
                            Budget: {formatCurrency(team.budget)} • 
                            Max Players: {team.maxPlayers}
                          </p>
                        </div>
                        <button
                          onClick={() => setEditingIndex(index)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Player Distribution Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-blue-900 mb-2">Player Distribution</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-blue-800">
            {['Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper'].map(role => {
              const count = tournament.players.filter(p => p.role === role).length;
              return (
                <div key={role}>
                  <span className="font-medium">{role}:</span>
                  <span className="ml-1">{count} players</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Auction Rules Info */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-yellow-900 mb-2">Auction Rules</h4>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• Each team starts with equal budget and must fill their squad</li>
            <li>• Bidding starts at the player's base price</li>
            <li>• Minimum bid increment: ₹5 Lakh</li>
            <li>• Teams can pass if they don't want to bid</li>
            <li>• Highest bidder wins the player</li>
            <li>• Unsold players can be brought back later</li>
          </ul>
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-6 border-t border-gray-200">
          <button onClick={onBack} className="btn-secondary">
            Back to Player Upload
          </button>
          <button onClick={handleStartAuction} className="btn-success">
            Start Auction
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamSetup;
