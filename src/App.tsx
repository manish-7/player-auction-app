import { useState, useEffect } from 'react';
import { useAuctionStore } from './store/auctionStore';
import { useConfirmation } from './hooks/useConfirmation';
import { RotateCcw, Zap, AlertTriangle } from 'lucide-react';
import TournamentSetup from './components/TournamentSetup';
import PlayerInventory from './components/PlayerInventory';
import TeamSetup from './components/TeamSetup';
import AuctionRoom from './components/AuctionRoom';
import Dashboard from './components/Dashboard';
import AuctionHistory from './components/AuctionHistory';

type AppStep = 'tournament' | 'players' | 'teams' | 'auction' | 'results' | 'history';

function App() {
  const { tournament, clearStorage, restartAuction, loadTournament, saveCurrentAuction } = useAuctionStore();
  const { showConfirmation, ConfirmationComponent } = useConfirmation();
  const [currentStep, setCurrentStep] = useState<AppStep>('tournament');
  const [hasAutoRestored, setHasAutoRestored] = useState(false);

  // Auto-restore only once on initial load
  useEffect(() => {
    if (tournament && !hasAutoRestored) {
      if (tournament.isAuctionCompleted) {
        setCurrentStep('results');
      } else if (tournament.isAuctionStarted) {
        setCurrentStep('auction');
      } else if (tournament.teams.length > 0 && tournament.players.length > 0) {
        setCurrentStep('teams');
      } else if (tournament.players.length > 0) {
        setCurrentStep('players');
      }
      setHasAutoRestored(true);
    }
  }, [tournament, hasAutoRestored]);

  const handleStepChange = (step: AppStep) => {
    setCurrentStep(step);
  };

  const canNavigateToStep = (step: AppStep): boolean => {
    switch (step) {
      case 'tournament':
        return true; // Can always go back to setup
      case 'players':
        return tournament !== null;
      case 'teams':
        return tournament !== null && tournament.players.length > 0;
      case 'auction':
        return tournament !== null && tournament.teams.length > 0 && tournament.players.length > 0;
      case 'results':
        return tournament !== null && tournament.isAuctionCompleted;
      case 'history':
        return true; // Can always access history
      default:
        return false;
    }
  };

  const handleNavigateToStep = async (step: AppStep) => {
    if (!canNavigateToStep(step)) return;

    // Warn if navigating away from active auction
    if (currentStep === 'auction' && tournament?.isAuctionStarted && !tournament?.isAuctionCompleted && step !== 'auction') {
      const shouldSave = await showConfirmation({
        title: 'Save Auction Progress?',
        message: 'You are leaving an active auction. Would you like to save your progress before continuing?',
        confirmText: 'Save & Continue',
        cancelText: 'Continue Without Saving',
        type: 'warning',
        icon: <AlertTriangle className="w-6 h-6 text-white" />
      });

      if (shouldSave) {
        // Auto-save with timestamp
        const timestamp = new Date().toLocaleString();
        const autoSaveName = `${tournament.name} - ${timestamp}`;
        const savedId = saveCurrentAuction(autoSaveName);

        if (savedId) {
          console.log(`Auction auto-saved as "${autoSaveName}"`);
        }
      }
    }

    setCurrentStep(step);
  };

  const handleNewTournament = async () => {
    // Check if there's an active tournament that should be saved
    if (tournament && (tournament.isAuctionStarted || tournament.players.length > 0)) {
      const shouldSave = await showConfirmation({
        title: 'Save Current Tournament?',
        message: `You have an active tournament "${tournament.name}" with progress. Would you like to save it before starting a new one?`,
        confirmText: 'Save & Continue',
        cancelText: 'Discard & Continue',
        type: 'warning',
        icon: <AlertTriangle className="w-6 h-6 text-white" />
      });

      if (shouldSave) {
        // Auto-save with a timestamp-based name
        const timestamp = new Date().toLocaleString();
        const autoSaveName = `${tournament.name} - ${timestamp}`;
        const savedId = saveCurrentAuction(autoSaveName);

        if (savedId) {
          // Show success message briefly
          console.log(`Tournament auto-saved as "${autoSaveName}"`);
        }
      }
    }

    // Now clear and start new
    clearStorage();
    setCurrentStep('tournament');
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'tournament':
        return <TournamentSetup onNext={() => handleStepChange('players')} />;

      case 'players':
        return (
          <PlayerInventory
            onNext={() => handleStepChange('teams')}
            onBack={() => handleStepChange('tournament')}
          />
        );

      case 'teams':
        return (
          <TeamSetup
            onNext={() => handleStepChange('auction')}
            onBack={() => handleStepChange('players')}
          />
        );

      case 'auction':
        return <AuctionRoom onComplete={() => handleStepChange('results')} />;

      case 'results':
        return <Dashboard
          onRestart={() => handleStepChange('tournament')}
          onNewTournament={handleNewTournament}
        />;

      case 'history':
        return (
          <AuctionHistory
            onLoadTournament={(tournamentId: string) => {
              loadTournament(tournamentId);
              // Navigate to appropriate step based on loaded tournament state
              const loadedTournament = useAuctionStore.getState().tournament;
              if (loadedTournament?.isAuctionCompleted) {
                handleStepChange('results');
              } else if (loadedTournament?.isAuctionStarted) {
                handleStepChange('auction');
              } else if (loadedTournament) {
                handleStepChange('teams');
              } else {
                handleStepChange('tournament');
              }
            }}
            onClose={() => {
              // Go back to appropriate step based on current tournament state
              if (tournament?.isAuctionCompleted) {
                handleStepChange('results');
              } else if (tournament?.isAuctionStarted) {
                handleStepChange('auction');
              } else if (tournament) {
                handleStepChange('teams');
              } else {
                handleStepChange('tournament');
              }
            }}
          />
        );

      default:
        return <TournamentSetup onNext={() => handleStepChange('players')} />;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="gradient-bg shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-2 sm:gap-4">
            <div className="flex items-center min-w-0 flex-shrink-0">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <span className="text-lg sm:text-xl">🏏</span>
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl font-bold text-white truncate">
                    <span className="hidden sm:inline">Tournament Player Auction</span>
                    <span className="sm:hidden">Player Auction</span>
                  </h1>
                  {tournament && (
                    <p className="text-blue-100 text-xs sm:text-sm truncate">
                      {tournament.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Persistence Indicator & Actions */}
            <div className="flex items-center space-x-1 sm:space-x-3 flex-shrink-0">
              {tournament && (
                <div className="hidden sm:flex items-center space-x-1.5">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-white/80 text-xs">Auto-saved</span>
                </div>
              )}

              <div className="flex items-center space-x-1 sm:space-x-2">
                {/* Tournament History Button */}
                <button
                  onClick={() => handleNavigateToStep('history')}
                  className="bg-purple-500/80 hover:bg-purple-600/90 text-white text-xs px-2 sm:px-3 py-1.5 rounded-lg font-medium shadow-sm transition-all duration-200 hover:shadow-md"
                  title="View tournament history"
                >
                  <span className="hidden sm:inline">📚 History</span>
                  <span className="sm:hidden">📚</span>
                </button>

                {tournament && (
                  <>
                    {(tournament.isAuctionStarted || tournament.isAuctionCompleted) && (
                      <button
                        onClick={async () => {
                          const confirmed = await showConfirmation({
                            title: 'Restart Auction?',
                            message: 'This will reset all teams and reshuffle players, but keep your tournament setup. All current auction progress will be lost.',
                            confirmText: 'Restart Auction',
                            cancelText: 'Cancel',
                            type: 'warning',
                            icon: <RotateCcw className="w-6 h-6 text-white" />
                          });
                          if (confirmed) {
                            restartAuction();
                            setCurrentStep('auction');
                          }
                        }}
                        className="bg-orange-500/80 hover:bg-orange-600/90 text-white text-xs px-2 sm:px-3 py-1.5 rounded-lg font-medium shadow-sm transition-all duration-200 hover:shadow-md"
                        title="Restart auction with same players and teams"
                      >
                        <span className="hidden sm:inline">🔄 Restart Auction</span>
                        <span className="sm:hidden">🔄</span>
                      </button>
                    )}
                    <button
                      onClick={handleNewTournament}
                      className="bg-green-500/80 hover:bg-green-600/90 text-white text-xs px-2 sm:px-3 py-1.5 rounded-lg font-medium shadow-sm transition-all duration-200 hover:shadow-md"
                      title="Start a new tournament (will offer to save current one)"
                    >
                      <span className="hidden sm:inline">🆕 New Tournament</span>
                      <span className="sm:hidden">🆕</span>
                    </button>
                    <button
                      onClick={async () => {
                        const confirmed = await showConfirmation({
                          title: 'Clear All Data?',
                          message: 'This will permanently delete all saved tournament data, including players, teams, and auction history. This action cannot be undone.',
                          confirmText: 'Clear All Data',
                          cancelText: 'Cancel',
                          type: 'danger',
                          icon: <Zap className="w-6 h-6 text-white" />
                        });
                        if (confirmed) {
                          clearStorage();
                          setCurrentStep('tournament');
                        }
                      }}
                      className="bg-red-500/80 hover:bg-red-600/90 text-white text-xs px-2 sm:px-3 py-1.5 rounded-lg font-medium shadow-sm transition-all duration-200 hover:shadow-md"
                      title="Clear all data including history"
                    >
                      <span className="hidden sm:inline">🗑️ Clear All</span>
                      <span className="sm:hidden">🗑️</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Progress Indicator */}
            <div className="hidden md:flex items-center space-x-2 flex-1 justify-center max-w-2xl">
              {[
                { id: 'tournament', label: 'Setup', step: 1, icon: '⚙️' },
                { id: 'players', label: 'Players', step: 2, icon: '👥' },
                { id: 'teams', label: 'Teams', step: 3, icon: '🏆' },
                { id: 'auction', label: 'Auction', step: 4, icon: '🔨' },
                { id: 'results', label: 'Results', step: 5, icon: '📊' },
              ].map(({ id, label, step, icon }) => {
                const isActive = currentStep === id;
                const canNavigate = canNavigateToStep(id as AppStep);
                const isCompleted =
                  (currentStep === 'players' && step === 1) ||
                  (currentStep === 'teams' && step <= 2) ||
                  (currentStep === 'auction' && step <= 3) ||
                  (currentStep === 'results' && step <= 4);

                return (
                  <div key={id} className="flex items-center">
                    <button
                      onClick={() => handleNavigateToStep(id as AppStep)}
                      disabled={!canNavigate}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-white text-blue-600 shadow-lg scale-110'
                          : isCompleted
                          ? 'bg-green-500/80 text-white hover:bg-green-600/80'
                          : canNavigate
                          ? 'bg-white/20 text-white/60 hover:bg-white/30 hover:text-white/80'
                          : 'bg-white/10 text-white/40 cursor-not-allowed'
                      } ${canNavigate ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                      title={canNavigate ? `Go to ${label}` : `Complete previous steps to access ${label}`}
                    >
                      {icon}
                    </button>
                    <span
                      className={`ml-1 text-xs font-medium transition-colors ${
                        isActive ? 'text-white' : 'text-white/70'
                      }`}
                    >
                      {label}
                    </span>
                    {step < 5 && (
                      <div className="w-4 h-0.5 bg-white/30 mx-2" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mobile Progress Indicator */}
        <div className="md:hidden border-t border-white/20">
          <div className="max-w-7xl mx-auto px-4 py-2">
            <div className="flex items-center justify-center space-x-1 overflow-x-auto">
              {[
                { id: 'tournament', label: 'Setup', step: 1, icon: '⚙️' },
                { id: 'players', label: 'Players', step: 2, icon: '👥' },
                { id: 'teams', label: 'Teams', step: 3, icon: '🏆' },
                { id: 'auction', label: 'Auction', step: 4, icon: '🔨' },
                { id: 'results', label: 'Results', step: 5, icon: '📊' },
              ].map(({ id, label, step, icon }) => {
                const isActive = currentStep === id;
                const canNavigate = canNavigateToStep(id as AppStep);
                const isCompleted =
                  (currentStep === 'players' && step === 1) ||
                  (currentStep === 'teams' && step <= 2) ||
                  (currentStep === 'auction' && step <= 3) ||
                  (currentStep === 'results' && step <= 4);

                return (
                  <div key={id} className="flex items-center flex-shrink-0">
                    <button
                      onClick={() => handleNavigateToStep(id as AppStep)}
                      disabled={!canNavigate}
                      className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-white text-blue-600 shadow-lg scale-110'
                          : isCompleted
                          ? 'bg-green-500/80 text-white hover:bg-green-600/80'
                          : canNavigate
                          ? 'bg-white/20 text-white/60 hover:bg-white/30 hover:text-white/80'
                          : 'bg-white/10 text-white/40 cursor-not-allowed'
                      } ${canNavigate ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                      title={canNavigate ? `Go to ${label}` : `Complete previous steps to access ${label}`}
                    >
                      {icon}
                    </button>
                    {step < 5 && (
                      <div className="w-2 h-0.5 bg-white/30 mx-1" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderCurrentStep()}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center text-sm text-gray-500">
            <p>
              Developed By: Manish Jaiswal | Contact: {' '}
              <a
                href="mailto:manish.rokks@gmail.com"
                className="text-blue-600 hover:text-blue-800 transition-colors"
              >
                manish.rokks@gmail.com
              </a>
            </p>
          </div>
        </div>
      </footer>

      {/* Confirmation Modal */}
      <ConfirmationComponent />
    </div>
  );
}

export default App;
