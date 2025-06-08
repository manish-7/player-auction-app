import React, { useState } from 'react';
import { Calendar, Trophy, Users, DollarSign, Trash2, Eye, ArrowLeft } from 'lucide-react';
import { useAuctionStore } from '../store/auctionStore';
import { useConfirmation } from '../hooks/useConfirmation';
import { formatCurrency } from '../utils/excelUtils';

interface TournamentHistoryProps {
  onBack: () => void;
  onLoadTournament: () => void;
}

const TournamentHistory: React.FC<TournamentHistoryProps> = ({ onBack, onLoadTournament }) => {
  const { getSavedTournaments, loadTournament, deleteSavedTournament } = useAuctionStore();
  const { showConfirmation, ConfirmationComponent } = useConfirmation();
  const [selectedTournament, setSelectedTournament] = useState<string | null>(null);

  const savedTournaments = getSavedTournaments();

  const handleLoadTournament = (tournamentId: string) => {
    loadTournament(tournamentId);
    onLoadTournament();
  };

  const handleDeleteTournament = async (tournamentId: string, tournamentName: string) => {
    const confirmed = await showConfirmation({
      title: 'Delete Tournament?',
      message: `Are you sure you want to delete "${tournamentName}"? This action cannot be undone and all tournament data will be permanently lost.`,
      confirmText: 'Delete Tournament',
      cancelText: 'Cancel',
      type: 'danger',
      icon: <Trash2 className="w-6 h-6 text-white" />
    });

    if (confirmed) {
      deleteSavedTournament(tournamentId);
      if (selectedTournament === tournamentId) {
        setSelectedTournament(null);
      }
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (savedTournaments.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center">
            <Trophy className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            No Saved Tournaments
          </h2>
          <p className="text-gray-600 mb-8 text-lg">
            Complete some auctions to see them saved here for future reference.
          </p>
          <button onClick={onBack} className="btn-secondary">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Current Tournament
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🏆 Tournament History
          </h1>
          <p className="text-gray-600">
            Browse and manage your completed auction tournaments
          </p>
        </div>
        <button onClick={onBack} className="btn-secondary">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>
      </div>

      {/* Tournament Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {savedTournaments.map((savedTournament) => (
          <div
            key={savedTournament.id}
            className={`bg-white rounded-xl shadow-sm border-2 transition-all duration-200 hover:shadow-md ${
              selectedTournament === savedTournament.id
                ? 'border-blue-500 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="p-6">
              {/* Tournament Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 truncate">
                    {savedTournament.tournament.name}
                  </h3>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <Calendar className="w-4 h-4 mr-1" />
                    {savedTournament.completedAt ? formatDate(savedTournament.completedAt) : 'In Progress'}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteTournament(savedTournament.id, savedTournament.tournament.name)}
                  className="text-gray-400 hover:text-red-500 transition-colors p-1"
                  title="Delete tournament"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Tournament Stats */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="w-4 h-4 mr-2" />
                    Teams
                  </div>
                  <span className="font-semibold text-gray-900">
                    {savedTournament.tournament.numberOfTeams}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-600">
                    <Trophy className="w-4 h-4 mr-2" />
                    Players
                  </div>
                  <span className="font-semibold text-gray-900">
                    {savedTournament.soldPlayers}/{savedTournament.totalPlayers} sold
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-600">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Total Spent
                  </div>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(savedTournament.totalSpent)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <button
                  onClick={() => setSelectedTournament(
                    selectedTournament === savedTournament.id ? null : savedTournament.id
                  )}
                  className="flex-1 btn-secondary text-sm py-2"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  {selectedTournament === savedTournament.id ? 'Hide' : 'Preview'}
                </button>
                <button
                  onClick={() => handleLoadTournament(savedTournament.id)}
                  className="flex-1 btn-primary text-sm py-2"
                >
                  Load
                </button>
              </div>

              {/* Tournament Preview */}
              {selectedTournament === savedTournament.id && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Team Summary</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {savedTournament.tournament.teams.map((team) => (
                      <div key={team.id} className="flex items-center justify-between text-xs">
                        <div className="flex items-center">
                          <div
                            className="w-3 h-3 rounded-full mr-2"
                            style={{
                              background: `linear-gradient(135deg, ${team.primaryColor}, ${team.secondaryColor})`,
                            }}
                          />
                          <span className="font-medium truncate">{team.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{team.players.length} players</div>
                          <div className="text-gray-500">
                            {formatCurrency(team.budget - team.remainingBudget)} spent
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">
          📊 History Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {savedTournaments.length}
            </div>
            <div className="text-sm text-blue-800">Tournaments</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {savedTournaments.reduce((sum, t) => sum + t.tournament.numberOfTeams, 0)}
            </div>
            <div className="text-sm text-blue-800">Total Teams</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {savedTournaments.reduce((sum, t) => sum + t.soldPlayers, 0)}
            </div>
            <div className="text-sm text-blue-800">Players Sold</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(savedTournaments.reduce((sum, t) => sum + t.totalSpent, 0))}
            </div>
            <div className="text-sm text-blue-800">Total Spent</div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationComponent />
    </div>
  );
};

export default TournamentHistory;
