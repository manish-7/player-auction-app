import React, { useState } from 'react';
import {
  History,
  Play,
  Trophy,
  Calendar,
  Trash2,
  Edit3,
  Save,
  X,
  Clock,
  CheckCircle
} from 'lucide-react';
import { useAuctionStore } from '../store/auctionStore';
import { formatCurrency } from '../utils/excelUtils';

interface AuctionHistoryProps {
  onLoadTournament: (tournamentId: string) => void;
  onClose: () => void;
}

const AuctionHistory: React.FC<AuctionHistoryProps> = ({ onLoadTournament, onClose }) => {
  const {
    getCompletedTournaments,
    getIncompleteTournaments,
    deleteSavedTournament,
    updateSavedTournamentName,
  } = useAuctionStore();

  const [activeTab, setActiveTab] = useState<'incomplete' | 'completed'>('incomplete');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const completedTournaments = getCompletedTournaments();
  const incompleteTournaments = getIncompleteTournaments();

  const handleEdit = (tournament: any) => {
    setEditingId(tournament.id);
    setEditingName(tournament.tournament.name);
  };

  const handleSaveEdit = () => {
    if (editingId && editingName.trim()) {
      updateSavedTournamentName(editingId, editingName.trim());
      setEditingId(null);
      setEditingName('');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleDelete = (tournamentId: string, tournamentName: string) => {
    if (window.confirm(`Are you sure you want to delete "${tournamentName}"? This action cannot be undone.`)) {
      deleteSavedTournament(tournamentId);
    }
  };

  const handleLoad = (tournamentId: string) => {
    onLoadTournament(tournamentId);
    onClose();
  };

  const renderTournamentCard = (savedTournament: any) => {
    const { tournament } = savedTournament;
    const isEditing = editingId === savedTournament.id;

    return (
      <div key={savedTournament.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            {isEditing ? (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="text-lg font-semibold text-gray-900 border border-gray-300 rounded px-2 py-1 flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
                  autoFocus
                />
                <button
                  onClick={handleSaveEdit}
                  className="p-1 text-green-600 hover:text-green-800"
                  title="Save"
                >
                  <Save className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="p-1 text-gray-600 hover:text-gray-800"
                  title="Cancel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-gray-900">{tournament.name}</h3>
                <button
                  onClick={() => handleEdit(savedTournament)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                  title="Edit name"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            )}
            
            <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>
                  {savedTournament.isCompleted ? 'Completed' : 'Saved'}: {' '}
                  {new Date(savedTournament.savedAt).toLocaleDateString()}
                </span>
              </div>
              {!savedTournament.isCompleted && (
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{savedTournament.progress}% complete</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {savedTournament.isCompleted ? (
              <div className="flex items-center text-green-600">
                <CheckCircle className="w-5 h-5 mr-1" />
                <span className="text-sm font-medium">Completed</span>
              </div>
            ) : (
              <div className="flex items-center text-blue-600">
                <Clock className="w-5 h-5 mr-1" />
                <span className="text-sm font-medium">In Progress</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{tournament.teams.length}</div>
            <div className="text-xs text-gray-500">Teams</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{savedTournament.totalPlayers}</div>
            <div className="text-xs text-gray-500">Players</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">{savedTournament.soldPlayers}</div>
            <div className="text-xs text-gray-500">Sold</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {formatCurrency(savedTournament.totalSpent)}
            </div>
            <div className="text-xs text-gray-500">Total Spent</div>
          </div>
        </div>

        {/* Progress Bar for Incomplete Auctions */}
        {!savedTournament.isCompleted && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Auction Progress</span>
              <span>{savedTournament.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${savedTournament.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="text-sm text-gray-500">
            {savedTournament.isCompleted ? 'View results' : 'Resume auction'}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleLoad(savedTournament.id)}
              className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                savedTournament.isCompleted
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              {savedTournament.isCompleted ? (
                <>
                  <Trophy className="w-4 h-4 mr-2" />
                  View Results
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Resume
                </>
              )}
            </button>
            <button
              onClick={() => handleDelete(savedTournament.id, tournament.name)}
              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <History className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Auction History</h2>
                <p className="text-blue-100">Manage your saved and completed auctions</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('incomplete')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'incomplete'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>In Progress ({incompleteTournaments.length})</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'completed'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Trophy className="w-4 h-4" />
                <span>Completed ({completedTournaments.length})</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'incomplete' ? (
            incompleteTournaments.length > 0 ? (
              <div className="space-y-4">
                {incompleteTournaments.map(renderTournamentCard)}
              </div>
            ) : (
              <div className="text-center py-12">
                <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Incomplete Auctions</h3>
                <p className="text-gray-500">
                  Start a new auction and save it to see it here.
                </p>
              </div>
            )
          ) : (
            completedTournaments.length > 0 ? (
              <div className="space-y-4">
                {completedTournaments.map(renderTournamentCard)}
              </div>
            ) : (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Completed Auctions</h3>
                <p className="text-gray-500">
                  Complete an auction to see the results here.
                </p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default AuctionHistory;
