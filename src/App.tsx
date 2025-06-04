import React, { useState, useEffect } from 'react';
import { useAuctionStore } from './store/auctionStore';
import TournamentSetup from './components/TournamentSetup';
import PlayerInventory from './components/PlayerInventory';
import TeamSetup from './components/TeamSetup';
import AuctionRoom from './components/AuctionRoom';
import Dashboard from './components/Dashboard';
import TournamentHistory from './components/TournamentHistory';

type AppStep = 'tournament' | 'players' | 'teams' | 'auction' | 'results' | 'history';

function App() {
  const { tournament, clearStorage, restartAuction } = useAuctionStore();
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

  const handleNavigateToStep = (step: AppStep) => {
    if (!canNavigateToStep(step)) return;

    // Warn if navigating away from active auction
    if (currentStep === 'auction' && tournament?.isAuctionStarted && !tournament?.isAuctionCompleted && step !== 'auction') {
      const confirmed = window.confirm(
        'You are currently in an active auction. Navigating away will pause the auction. Are you sure you want to continue?'
      );
      if (!confirmed) return;
    }

    setCurrentStep(step);
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
        return <Dashboard onRestart={() => handleStepChange('tournament')} />;

      case 'history':
        return (
          <TournamentHistory
            onBack={() => {
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
            onLoadTournament={() => handleStepChange('results')}
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
          <div className="flex items-center justify-between h-20 gap-4">
            <div className="flex items-center min-w-0 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <span className="text-xl">🏏</span>
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl font-bold text-white truncate">
                    Tournament Player Auction
                  </h1>
                  {tournament && (
                    <p className="text-blue-100 text-sm truncate">
                      {tournament.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Persistence Indicator */}
            <div className="flex items-center space-x-3 flex-shrink-0">
              {tournament && (
                <div className="flex items-center space-x-1.5">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-white/80 text-xs">Auto-saved</span>
                </div>
              )}

              <div className="flex items-center space-x-2">
                {/* Tournament History Button */}
                <button
                  onClick={() => handleNavigateToStep('history')}
                  className="bg-purple-500/80 hover:bg-purple-600/90 text-white text-xs px-3 py-1.5 rounded-lg font-medium shadow-sm transition-all duration-200 hover:shadow-md"
                  title="View tournament history"
                >
                  📚 History
                </button>

                {tournament && (
                  <>
                    {(tournament.isAuctionStarted || tournament.isAuctionCompleted) && (
                      <button
                        onClick={() => {
                          if (window.confirm('Are you sure you want to restart the auction? This will reset all teams and reshuffle players, but keep your tournament setup.')) {
                            restartAuction();
                            setCurrentStep('auction');
                          }
                        }}
                        className="bg-orange-500/80 hover:bg-orange-600/90 text-white text-xs px-3 py-1.5 rounded-lg font-medium shadow-sm transition-all duration-200 hover:shadow-md"
                        title="Restart auction with same players and teams"
                      >
                        🔄 Restart Auction
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to clear all saved data and start fresh?')) {
                          clearStorage();
                          setCurrentStep('tournament');
                        }
                      }}
                      className="bg-red-500/80 hover:bg-red-600/90 text-white text-xs px-3 py-1.5 rounded-lg font-medium shadow-sm transition-all duration-200 hover:shadow-md"
                      title="Clear all data and start over"
                    >
                      🆕 New Tournament
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
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderCurrentStep()}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center text-sm text-gray-500">
            <p>Developed By: Manish Jaiswal</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
