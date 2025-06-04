import React, { useState } from 'react';
import { Trophy, Users, DollarSign, Download, RotateCcw, BarChart3 } from 'lucide-react';
import { useAuctionStore } from '../store/auctionStore';
import { formatCurrency, exportAuctionResults } from '../utils/excelUtils';

interface DashboardProps {
  onRestart: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onRestart }) => {
  const { tournament, resetAuction } = useAuctionStore();
  const [activeTab, setActiveTab] = useState<'teams' | 'players' | 'stats'>('teams');

  if (!tournament) {
    return <div>No tournament data available</div>;
  }

  const handleExportResults = () => {
    exportAuctionResults(tournament);
  };

  const handleRestart = () => {
    resetAuction();
    onRestart();
  };

  // Calculate statistics
  const totalSpent = tournament.teams.reduce((sum, team) => sum + (team.budget - team.remainingBudget), 0);
  const soldPlayers = tournament.players.filter(p => p.soldPrice).length;
  const unsoldPlayers = tournament.players.filter(p => p.isUnsold).length;
  const averagePrice = soldPlayers > 0 ? totalSpent / soldPlayers : 0;

  const mostExpensivePlayer = tournament.players
    .filter(p => p.soldPrice)
    .sort((a, b) => (b.soldPrice || 0) - (a.soldPrice || 0))[0];

  const teamWithMostSpent = tournament.teams
    .sort((a, b) => (b.budget - b.remainingBudget) - (a.budget - a.remainingBudget))[0];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🏆 {tournament.name} - Results
            </h1>
            <p className="text-gray-600">
              Auction completed with {soldPlayers} players sold and {unsoldPlayers} unsold
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleExportResults}
              className="btn-success inline-flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Results
            </button>
            <button
              onClick={handleRestart}
              className="btn-secondary inline-flex items-center"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              New Auction
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-blue-600">Players Sold</p>
                <p className="text-2xl font-bold text-blue-900">{soldPlayers}</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-green-600">Total Spent</p>
                <p className="text-2xl font-bold text-green-900">{formatCurrency(totalSpent)}</p>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center">
              <BarChart3 className="w-8 h-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-sm text-yellow-600">Average Price</p>
                <p className="text-2xl font-bold text-yellow-900">{formatCurrency(averagePrice)}</p>
              </div>
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <Trophy className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm text-purple-600">Highest Sale</p>
                <p className="text-2xl font-bold text-purple-900">
                  {mostExpensivePlayer ? formatCurrency(mostExpensivePlayer.soldPrice || 0) : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="card">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'teams', label: 'Team Squads', icon: Users },
              { id: 'players', label: 'Player Results', icon: Trophy },
              { id: 'stats', label: 'Statistics', icon: BarChart3 },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm inline-flex items-center ${
                  activeTab === id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-6">
          {/* Teams Tab */}
          {activeTab === 'teams' && (
            <div className="space-y-6">
              {tournament.teams.map((team) => (
                <div key={team.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900">{team.name}</h3>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Remaining Budget</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatCurrency(team.remainingBudget)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                    <div>
                      <span className="text-gray-500">Players:</span>
                      <span className="ml-2 font-medium">{team.players.length}/{team.maxPlayers}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Total Spent:</span>
                      <span className="ml-2 font-medium">{formatCurrency(team.budget - team.remainingBudget)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Avg. Price:</span>
                      <span className="ml-2 font-medium">
                        {team.players.length > 0 
                          ? formatCurrency((team.budget - team.remainingBudget) / team.players.length)
                          : 'N/A'
                        }
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Most Expensive:</span>
                      <span className="ml-2 font-medium">
                        {team.players.length > 0
                          ? formatCurrency(Math.max(...team.players.map(p => p.soldPrice || 0)))
                          : 'N/A'
                        }
                      </span>
                    </div>
                  </div>

                  {team.players.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Player</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Base Price</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sold Price</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {team.players.map((player) => (
                            <tr key={player.id}>
                              <td className="px-4 py-2 text-sm font-medium text-gray-900">{player.name}</td>
                              <td className="px-4 py-2 text-sm text-gray-500">{player.role || 'N/A'}</td>
                              <td className="px-4 py-2 text-sm text-gray-500">{formatCurrency(player.basePrice || 100)}</td>
                              <td className="px-4 py-2 text-sm font-medium text-green-600">
                                {formatCurrency(player.soldPrice || 0)}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-500">{player.rating || 'N/A'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No players in this team</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Players Tab */}
          {activeTab === 'players' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Player</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Base Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Final Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Team</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tournament.players
                    .sort((a, b) => (b.soldPrice || 0) - (a.soldPrice || 0))
                    .map((player) => {
                      const team = player.teamId ? tournament.teams.find(t => t.id === player.teamId) : null;
                      return (
                        <tr key={player.id}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{player.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{player.role || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{formatCurrency(player.basePrice || 100)}</td>
                          <td className="px-4 py-3 text-sm font-medium">
                            {player.soldPrice ? (
                              <span className="text-green-600">{formatCurrency(player.soldPrice)}</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {team ? team.name : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {player.soldPrice ? (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                Sold
                              </span>
                            ) : player.isUnsold ? (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                Unsold
                              </span>
                            ) : (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                Pending
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}

          {/* Statistics Tab */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              {/* Key Highlights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-blue-900 mb-4">Most Expensive Player</h4>
                  {mostExpensivePlayer ? (
                    <div>
                      <p className="text-xl font-bold text-blue-900">{mostExpensivePlayer.name}</p>
                      <p className="text-blue-700">{mostExpensivePlayer.role || 'N/A'}</p>
                      <p className="text-2xl font-bold text-blue-900 mt-2">
                        {formatCurrency(mostExpensivePlayer.soldPrice || 0)}
                      </p>
                    </div>
                  ) : (
                    <p className="text-blue-700">No players sold yet</p>
                  )}
                </div>

                <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-green-900 mb-4">Biggest Spender</h4>
                  <div>
                    <p className="text-xl font-bold text-green-900">{teamWithMostSpent.name}</p>
                    <p className="text-green-700">{teamWithMostSpent.players.length} players</p>
                    <p className="text-2xl font-bold text-green-900 mt-2">
                      {formatCurrency(teamWithMostSpent.budget - teamWithMostSpent.remainingBudget)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Role-wise Statistics */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Role-wise Statistics</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {['Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper'].map(role => {
                    const rolePlayers = tournament.players.filter(p => p.role === role);
                    const soldInRole = rolePlayers.filter(p => p.soldPrice);
                    const avgPrice = soldInRole.length > 0 
                      ? soldInRole.reduce((sum, p) => sum + (p.soldPrice || 0), 0) / soldInRole.length
                      : 0;

                    return (
                      <div key={role} className="bg-white rounded p-4">
                        <h5 className="font-medium text-gray-900 mb-2">{role}</h5>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Total:</span>
                            <span>{rolePlayers.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Sold:</span>
                            <span>{soldInRole.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Avg Price:</span>
                            <span>{formatCurrency(avgPrice)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
