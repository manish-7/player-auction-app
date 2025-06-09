import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Tournament, Team, Player, AuctionState, Bid, TournamentSettings } from '../types';
import { getTeamTemplate } from '../utils/teamData';

interface AuctionSettings {
  bidIncrement: number;
  auctionTimer: number;
  autoPassTimer: number;
}

interface SavedTournament {
  id: string;
  tournament: Tournament;
  auctionState: AuctionState;
  savedAt: Date;
  completedAt?: Date;
  totalPlayers: number;
  soldPlayers: number;
  unsoldPlayers: number;
  totalSpent: number;
  isCompleted: boolean;
  progress: number; // percentage of auction completed
}

interface AuctionStore {
  // Tournament state
  tournament: Tournament | null;
  auctionState: AuctionState;
  settings: AuctionSettings;
  bidHistory: Array<{
    tournament: Tournament;
    auctionState: AuctionState;
    action: string;
    timestamp: Date;
  }>;
  savedTournaments: SavedTournament[];

  // Actions
  createTournament: (config: {
    name: string;
    numberOfTeams: number;
    playersPerTeam: number;
    teamBudget: number;
    settings?: TournamentSettings;
  }) => void;

  setPlayers: (players: Player[]) => void;

  setupTeams: (teamNames?: string[]) => void;

  assignCaptainsToTeams: () => void;

  startAuction: () => void;

  placeBid: (teamId: string, amount: number) => void;

  passTeam: (teamId: string) => void;

  soldPlayer: () => void;

  unsoldPlayer: () => void;

  // New functions for delayed player advancement
  markPlayerSold: () => void;
  markPlayerUnsold: () => void;
  advanceToNextPlayer: () => void;
  setPreventAutoAdvance: (prevent: boolean) => void;

  nextPlayer: () => void;

  resetAuction: () => void;

  updateSettings: (settings: Partial<AuctionSettings>) => void;

  undoBid: () => void;

  canUndo: () => boolean;

  endAuction: () => void;

  clearStorage: () => void;

  restartAuction: () => void;

  // Tournament History
  saveTournament: () => void;
  saveCurrentAuction: (name?: string) => string | null;
  loadTournament: (tournamentId: string) => void;
  deleteSavedTournament: (tournamentId: string) => void;
  getSavedTournaments: () => SavedTournament[];
  getCompletedTournaments: () => SavedTournament[];
  getIncompleteTournaments: () => SavedTournament[];
  updateSavedTournamentName: (tournamentId: string, newName: string) => void;

  // Getters
  getCurrentPlayer: () => Player | null;
  getTeamById: (teamId: string) => Team | null;
  getEligibleTeams: () => Team[];
  getMaxBidForTeam: (teamId: string) => number;
  areAllTeamsFull: () => boolean;
  calculateBidIncrement: (minimumBid: number) => number;
}

const initialAuctionState: AuctionState = {
  currentBids: [],
  passedTeams: [],
  timer: 30,
  isActive: false,
};

const defaultSettings: AuctionSettings = {
  bidIncrement: 1, // ₹1 minimum increment (will be calculated dynamically)
  auctionTimer: 30,
  autoPassTimer: 10,
};

export const useAuctionStore = create<AuctionStore>()(
  devtools(
    persist(
      (set, get) => ({
      tournament: null,
      auctionState: initialAuctionState,
      settings: defaultSettings,
      bidHistory: [],
      savedTournaments: [],

      createTournament: (config) => {
        const teams: Team[] = [];
        for (let i = 0; i < config.numberOfTeams; i++) {
          const template = getTeamTemplate(i);
          teams.push({
            id: `team-${i + 1}`,
            name: template.name,
            budget: config.teamBudget,
            remainingBudget: config.teamBudget,
            players: [],
            maxPlayers: config.playersPerTeam,
            logo: template.logo,
            primaryColor: template.primaryColor,
            secondaryColor: template.secondaryColor,
          });
        }

        const defaultSettings: TournamentSettings = {
          enableUnsoldPlayerReturn: true,
          unsoldPlayerReturnRound: 1,
          enableTimer: true,
          timerDuration: 30,
          minimumBid: 10000000, // ₹1 crore
          bidIncrement: 10000000, // ₹1 crore - Default bid increment same as minimum bid
          hidePricesInLiveView: false,
          hideUnsoldStatusInLiveView: true, // Default to hiding unsold status for cleaner live view
        };

        const tournament: Tournament = {
          id: `tournament-${Date.now()}`,
          name: config.name,
          numberOfTeams: config.numberOfTeams,
          playersPerTeam: config.playersPerTeam,
          teamBudget: config.teamBudget,
          teams,
          players: [],
          currentPlayerIndex: 0,
          isAuctionStarted: false,
          isAuctionCompleted: false,
          settings: config.settings || defaultSettings,
        };

        // Use the tournament's configured bid increment
        const bidIncrement = tournament.settings.bidIncrement;

        set({
          tournament,
          settings: {
            ...get().settings,
            bidIncrement: bidIncrement
          }
        });
      },

      setPlayers: (players) => {
        // Shuffle players for random auction order
        const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);

        set((state) => ({
          tournament: state.tournament
            ? { ...state.tournament, players: shuffledPlayers }
            : null,
        }));
      },

      setupTeams: (teamNames) => {
        set((state) => {
          if (!state.tournament) return state;

          const updatedTeams = state.tournament.teams.map((team, index) => ({
            ...team,
            name: teamNames?.[index] || team.name,
          }));

          return {
            tournament: {
              ...state.tournament,
              teams: updatedTeams,
            },
          };
        });
      },

      assignCaptainsToTeams: () => {
        set((state) => {
          if (!state.tournament) return state;

          const captains = state.tournament.players.filter(player => player.isCaptain);

          // Only proceed if we have captains and the right number of them
          if (captains.length === 0 || captains.length !== state.tournament.numberOfTeams) {
            console.log(`Skipping captain assignment: Found ${captains.length} captains, expected ${state.tournament.numberOfTeams} or 0 for no captain functionality`);
            return state;
          }

          // Assign each captain to a team
          const updatedTeams = state.tournament.teams.map((team, index) => {
            const captain = captains[index];
            if (captain) {
              // Create a copy of the captain with team assignment
              // Captains are free - they don't consume budget
              const assignedCaptain = {
                ...captain,
                teamId: team.id,
                soldPrice: 0, // Captains are free
              };

              return {
                ...team,
                players: [assignedCaptain],
                remainingBudget: team.budget, // No budget deduction for captains
              };
            }
            return team;
          });

          // Update players list to mark captains as assigned
          const updatedPlayers = state.tournament.players.map(player => {
            if (player.isCaptain) {
              const teamIndex = captains.findIndex(c => c.id === player.id);
              if (teamIndex !== -1) {
                return {
                  ...player,
                  teamId: state.tournament!.teams[teamIndex].id,
                  soldPrice: 0, // Captains are free
                };
              }
            }
            return player;
          });

          return {
            tournament: {
              ...state.tournament,
              teams: updatedTeams,
              players: updatedPlayers,
            },
          };
        });
      },

      startAuction: () => {
        set((state) => ({
          tournament: state.tournament
            ? { ...state.tournament, isAuctionStarted: true }
            : null,
          auctionState: {
            ...initialAuctionState,
            isActive: true,
          },
        }));
      },

      placeBid: (teamId, amount) => {
        const { tournament, auctionState, bidHistory } = get();
        if (!tournament || !auctionState.isActive) return;

        const team = tournament.teams.find(t => t.id === teamId);
        if (!team || team.remainingBudget < amount) return;

        // Check if bid exceeds maximum allowed for this team
        const maxBid = get().getMaxBidForTeam(teamId);
        if (amount > maxBid) return;

        // Save current state to history before making changes
        const historyEntry = {
          tournament: JSON.parse(JSON.stringify(tournament)),
          auctionState: JSON.parse(JSON.stringify(auctionState)),
          action: `Bid placed: ${team.name} - ${amount}`,
          timestamp: new Date(),
        };

        const newBid: Bid = {
          teamId,
          amount,
          timestamp: new Date(),
        };

        set((state) => ({
          bidHistory: [...bidHistory, historyEntry],
          auctionState: {
            ...state.auctionState,
            currentBids: [...state.auctionState.currentBids, newBid],
            highestBid: newBid,
            timer: state.tournament?.settings.timerDuration || 30,
          },
        }));
      },

      passTeam: (teamId) => {
        set((state) => ({
          auctionState: {
            ...state.auctionState,
            passedTeams: [...state.auctionState.passedTeams, teamId],
          },
        }));
      },

      soldPlayer: () => {
        const { tournament, auctionState } = get();
        const currentPlayer = get().getCurrentPlayer();
        if (!tournament || !auctionState.highestBid || !currentPlayer) return;

        const winningTeam = tournament.teams.find(t => t.id === auctionState.highestBid!.teamId);
        if (!winningTeam) return;

        const soldPlayer = {
          ...currentPlayer,
          soldPrice: auctionState.highestBid.amount,
          teamId: winningTeam.id,
        };

        set((state) => {
          if (!state.tournament) return state;

          const updatedTeams = state.tournament.teams.map(team => {
            if (team.id === winningTeam.id) {
              return {
                ...team,
                players: [...team.players, soldPlayer],
                remainingBudget: team.remainingBudget - auctionState.highestBid!.amount,
              };
            }
            return team;
          });

          const updatedPlayers = state.tournament.players.map(player =>
            player.id === soldPlayer.id ? soldPlayer : player
          );

          return {
            tournament: {
              ...state.tournament,
              teams: updatedTeams,
              players: updatedPlayers,
              currentPlayerIndex: state.tournament.currentPlayerIndex + 1,
            },
            auctionState: {
              ...initialAuctionState,
              isActive: true,
            },
          };
        });

        get().nextPlayer();
      },

      // New function: Mark player as sold without advancing
      markPlayerSold: () => {
        const { tournament, auctionState } = get();
        const currentPlayer = get().getCurrentPlayer();
        if (!tournament || !auctionState.highestBid || !currentPlayer) return;

        const winningTeam = tournament.teams.find(t => t.id === auctionState.highestBid!.teamId);
        if (!winningTeam) return;

        const soldPlayer = {
          ...currentPlayer,
          soldPrice: auctionState.highestBid.amount,
          teamId: winningTeam.id,
        };

        set((state) => {
          if (!state.tournament) return state;

          const updatedPlayers = state.tournament.players.map(player =>
            player.id === currentPlayer.id ? soldPlayer : player
          );

          const updatedTeams = state.tournament.teams.map(team => {
            if (team.id === winningTeam.id) {
              return {
                ...team,
                players: [...team.players, soldPlayer],
                remainingBudget: team.remainingBudget - auctionState.highestBid!.amount,
              };
            }
            return team;
          });

          return {
            ...state,
            tournament: {
              ...state.tournament,
              players: updatedPlayers,
              teams: updatedTeams,
            },
            auctionState: {
              ...state.auctionState,
              highestBid: undefined,
              currentBids: [],
              passedTeams: [],
            },
          };
        });
      },

      // New function: Mark player as unsold without advancing
      markPlayerUnsold: () => {
        const { tournament } = get();
        if (!tournament || !tournament.players[tournament.currentPlayerIndex]) return;

        const currentPlayer = tournament.players[tournament.currentPlayerIndex];
        const unsoldPlayer = { ...currentPlayer, isUnsold: true };

        set((state) => {
          if (!state.tournament) return state;

          const updatedPlayers = state.tournament.players.map(player =>
            player.id === currentPlayer.id ? unsoldPlayer : player
          );

          return {
            ...state,
            tournament: {
              ...state.tournament,
              players: updatedPlayers,
            },
            auctionState: {
              ...state.auctionState,
              highestBid: undefined,
              currentBids: [],
              passedTeams: [],
            },
          };
        });
      },

      // New function: Advance to next player (for use after shuffle animation)
      advanceToNextPlayer: () => {
        get().nextPlayer();
      },

      // New function: Control auto-advance behavior
      setPreventAutoAdvance: (prevent: boolean) => {
        set((state) => ({
          auctionState: {
            ...state.auctionState,
            preventAutoAdvance: prevent,
          },
        }));
      },

      unsoldPlayer: () => {
        const { tournament } = get();
        if (!tournament || !tournament.players[tournament.currentPlayerIndex]) return;

        const currentPlayer = tournament.players[tournament.currentPlayerIndex];
        const unsoldPlayer = { ...currentPlayer, isUnsold: true };

        set((state) => {
          if (!state.tournament) return state;

          const updatedPlayers = state.tournament.players.map(player =>
            player.id === unsoldPlayer.id ? unsoldPlayer : player
          );

          return {
            tournament: {
              ...state.tournament,
              players: updatedPlayers,
              currentPlayerIndex: state.tournament.currentPlayerIndex + 1,
            },
            auctionState: {
              ...initialAuctionState,
              isActive: true,
            },
          };
        });

        get().nextPlayer();
      },

      nextPlayer: () => {
        const { tournament } = get();
        if (!tournament) return;

        // Check if we have properly assigned captains
        const captains = tournament.players.filter(p => p.isCaptain);
        const hasCaptains = captains.length === tournament.numberOfTeams;

        // First, advance the current player index to the next available player
        let nextIndex = tournament.currentPlayerIndex + 1;

        // Find the next player that hasn't been sold or marked unsold and is not a captain (if captains are being used)
        while (nextIndex < tournament.players.length) {
          const player = tournament.players[nextIndex];
          if (!player.soldPrice && !player.isUnsold && (!hasCaptains || !player.isCaptain)) {
            break; // Found next available player
          }
          nextIndex++;
        }

        // Update the current player index
        set((state) => ({
          tournament: state.tournament ? {
            ...state.tournament,
            currentPlayerIndex: nextIndex,
          } : null,
        }));

        if (nextIndex >= tournament.players.length) {
          // Check if we should bring back unsold players
          if (tournament.settings.enableUnsoldPlayerReturn) {
            const captains = tournament.players.filter(p => p.isCaptain);
            const hasCaptains = captains.length === tournament.numberOfTeams;
            const unsoldPlayers = tournament.players.filter(p => p.isUnsold && !p.soldPrice && (!hasCaptains || !p.isCaptain));

            if (unsoldPlayers.length > 0) {
              // Check if any team still has space and can afford any unsold player
              const teamsWithSpace = tournament.teams.filter(team => team.players.length < team.maxPlayers);
              const canAnyTeamAffordAnyPlayer = teamsWithSpace.some(team =>
                unsoldPlayers.some(player =>
                  team.remainingBudget >= (player.basePrice || tournament.settings.minimumBid)
                )
              );

              if (canAnyTeamAffordAnyPlayer) {
                // Reset unsold players and shuffle them randomly
                const soldPlayers = tournament.players.filter(p => p.soldPrice);
                const resetUnsoldPlayers = tournament.players
                  .filter(p => p.isUnsold && !p.soldPrice)
                  .map(player => ({ ...player, isUnsold: false }));

                // Shuffle the unsold players randomly
                const shuffledUnsoldPlayers = [...resetUnsoldPlayers].sort(() => Math.random() - 0.5);

                // Combine sold players with shuffled unsold players
                const reorderedPlayers = [...soldPlayers, ...shuffledUnsoldPlayers];

                set((state) => ({
                  tournament: state.tournament ? {
                    ...state.tournament,
                    players: reorderedPlayers,
                    currentPlayerIndex: soldPlayers.length, // Start from first unsold player
                  } : null,
                  auctionState: {
                    ...initialAuctionState,
                    isActive: true,
                  },
                }));
                return;
              }
            }
          }

          // Check if all teams are full or no team can afford any remaining player
          const allTeamsFull = tournament.teams.every(team => team.players.length >= team.maxPlayers);
          const captains = tournament.players.filter(p => p.isCaptain);
          const hasCaptains = captains.length === tournament.numberOfTeams;
          const remainingPlayers = tournament.players.filter(p => !p.soldPrice && !p.isUnsold && (!hasCaptains || !p.isCaptain));
          const teamsWithSpace = tournament.teams.filter(team => team.players.length < team.maxPlayers);

          // Check if any team with space can afford any remaining player
          const canAnyTeamAffordAnyPlayer = teamsWithSpace.some(team =>
            remainingPlayers.some(player =>
              team.remainingBudget >= (player.basePrice || tournament.settings.minimumBid)
            )
          );

          // End auction only if all teams are full OR no team can afford any remaining player
          if (allTeamsFull || !canAnyTeamAffordAnyPlayer || remainingPlayers.length === 0) {
            set((state) => ({
              tournament: state.tournament
                ? { ...state.tournament, isAuctionCompleted: true }
                : null,
              auctionState: { ...initialAuctionState, isActive: false },
            }));

            // Auto-save the completed tournament
            setTimeout(() => {
              get().saveTournament();
            }, 100);
            return;
          }

          // If we reach here, there are still players and teams that can afford them
          // This shouldn't happen in normal flow, but just in case
          set(() => ({
            auctionState: {
              ...initialAuctionState,
              isActive: true,
            },
          }));
          return;
        }

        set(() => ({
          auctionState: {
            ...initialAuctionState,
            isActive: true,
          },
        }));
      },

      resetAuction: () => {
        set({ tournament: null, auctionState: initialAuctionState });
      },

      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));
      },

      // Helper function to calculate appropriate bid increment
      calculateBidIncrement: (minimumBid: number) => {
        return Math.max(
          1, // Minimum increment of ₹1
          Math.round(minimumBid * 0.1) // 10% of minimum bid
        );
      },

      undoBid: () => {
        const { bidHistory } = get();
        if (bidHistory.length === 0) return;

        const lastState = bidHistory[bidHistory.length - 1];
        const newHistory = bidHistory.slice(0, -1);

        set(() => ({
          tournament: lastState.tournament,
          auctionState: lastState.auctionState,
          bidHistory: newHistory,
        }));
      },

      canUndo: () => {
        const { bidHistory } = get();
        return bidHistory.length > 0;
      },

      endAuction: () => {
        set((state) => ({
          tournament: state.tournament ? {
            ...state.tournament,
            isAuctionCompleted: true,
          } : null,
          auctionState: {
            ...state.auctionState,
            isActive: false,
          },
        }));

        // Auto-save the completed tournament
        setTimeout(() => {
          get().saveTournament();
        }, 100);
      },

      getCurrentPlayer: () => {
        const { tournament, auctionState } = get();
        if (!tournament || tournament.currentPlayerIndex >= tournament.players.length) {
          return null;
        }

        // Check if we have properly assigned captains
        const captains = tournament.players.filter(p => p.isCaptain);
        const hasCaptains = captains.length === tournament.numberOfTeams;

        // If auto-advance is prevented (during shuffle), just return the player at current index
        if (auctionState.preventAutoAdvance) {
          const player = tournament.players[tournament.currentPlayerIndex];
          if (player && !player.soldPrice && !player.isUnsold && (!hasCaptains || !player.isCaptain)) {
            return player;
          }
          return null;
        }

        // Find the next player that hasn't been sold yet and is not a captain (if captains are being used)
        for (let i = tournament.currentPlayerIndex; i < tournament.players.length; i++) {
          const player = tournament.players[i];
          if (!player.soldPrice && !player.isUnsold && (!hasCaptains || !player.isCaptain)) {
            // Update the current index if we skipped players
            if (i !== tournament.currentPlayerIndex) {
              set((state) => ({
                tournament: state.tournament ? {
                  ...state.tournament,
                  currentPlayerIndex: i,
                } : null,
              }));
            }
            return player;
          }
        }

        return null;
      },

      getTeamById: (teamId) => {
        const { tournament } = get();
        return tournament?.teams.find(team => team.id === teamId) || null;
      },

      getEligibleTeams: () => {
        const { tournament, auctionState } = get();
        const currentPlayer = get().getCurrentPlayer();
        if (!tournament || !currentPlayer) return [];

        return tournament.teams.filter(team => {
          // Check if team has space for more players (hard constraint - check first)
          if (team.players.length >= team.maxPlayers) return false;

          // Check if team hasn't passed
          if (auctionState.passedTeams.includes(team.id)) return false;

          // Check if team has budget for minimum bid (only if they have space)
          const minBid = auctionState.highestBid?.amount
            ? auctionState.highestBid.amount + Number(get().settings.bidIncrement)
            : currentPlayer.basePrice || tournament.settings.minimumBid;

          if (team.remainingBudget < minBid) return false;

          return true;
        });
      },

      getMaxBidForTeam: (teamId) => {
        const { tournament } = get();
        if (!tournament) return 0;

        const team = tournament.teams.find(t => t.id === teamId);
        if (!team) return 0;

        const remainingSlots = team.maxPlayers - team.players.length;

        // If this is the last slot, team can bid their entire remaining budget
        if (remainingSlots <= 1) {
          return team.remainingBudget;
        }

        // Calculate maximum bid: remaining budget minus minimum required for remaining slots
        const minimumBid = tournament.settings.minimumBid;
        const reserveForRemainingSlots = (remainingSlots - 1) * minimumBid;
        const maxBid = team.remainingBudget - reserveForRemainingSlots;

        // Ensure max bid is at least the minimum bid
        return Math.max(maxBid, minimumBid);
      },

      areAllTeamsFull: () => {
        const { tournament } = get();
        if (!tournament) return false;

        return tournament.teams.every(team => team.players.length >= team.maxPlayers);
      },

      clearStorage: () => {
        const { savedTournaments } = get();
        localStorage.removeItem('auction-store');
        set({
          tournament: null,
          auctionState: initialAuctionState,
          settings: defaultSettings,
          bidHistory: [],
          savedTournaments, // Preserve saved tournaments
        });
      },

      restartAuction: () => {
        set((state) => {
          if (!state.tournament) return state;

          // Reset teams to original state but keep captains if they exist and are properly configured
          const captains = state.tournament.players.filter(p => p.isCaptain);
          const hasCaptains = captains.length === state.tournament.numberOfTeams;

          const resetTeams = state.tournament.teams.map((team, index) => {
            if (hasCaptains) {
              const captain = captains[index];
              if (captain) {
                // Keep captain in team - captains are free
                const assignedCaptain = {
                  ...captain,
                  teamId: team.id,
                  soldPrice: 0, // Captains are free
                };
                return {
                  ...team,
                  players: [assignedCaptain],
                  remainingBudget: team.budget, // No budget deduction for captains
                };
              }
            }
            return {
              ...team,
              players: [],
              remainingBudget: team.budget,
            };
          });

          // Reset players to original state but keep captain assignments if captain functionality is active
          const resetPlayers = state.tournament.players.map(player => {
            if (player.isCaptain && hasCaptains) {
              // Keep captain assignments only if we have proper captain functionality
              const teamIndex = captains.findIndex(c => c.id === player.id);
              if (teamIndex !== -1) {
                return {
                  ...player,
                  teamId: state.tournament!.teams[teamIndex].id,
                  soldPrice: 0, // Captains are free
                  isUnsold: false,
                };
              }
            }
            return {
              ...player,
              soldPrice: undefined,
              teamId: undefined,
              isUnsold: false,
            };
          });

          // Shuffle players again for new auction order
          const shuffledPlayers = [...resetPlayers].sort(() => Math.random() - 0.5);

          // Use the tournament's configured bid increment
          const bidIncrement = state.tournament.settings.bidIncrement;

          return {
            tournament: {
              ...state.tournament,
              teams: resetTeams,
              players: shuffledPlayers,
              currentPlayerIndex: 0,
              isAuctionStarted: false,
              isAuctionCompleted: false,
            },
            auctionState: initialAuctionState,
            bidHistory: [],
            settings: {
              ...state.settings,
              bidIncrement: bidIncrement
            }
          };
        });
      },

      // Tournament History Functions
      saveTournament: () => {
        const { tournament, auctionState } = get();
        if (!tournament || !tournament.isAuctionCompleted) return;

        const soldPlayers = tournament.players.filter(p => p.soldPrice).length;
        const unsoldPlayers = tournament.players.filter(p => p.isUnsold).length;
        const totalSpent = tournament.teams.reduce((total, team) =>
          total + (team.budget - team.remainingBudget), 0
        );

        const savedTournament: SavedTournament = {
          id: `saved-${tournament.id}-${Date.now()}`,
          tournament: JSON.parse(JSON.stringify(tournament)),
          auctionState: JSON.parse(JSON.stringify(auctionState)),
          savedAt: new Date(),
          completedAt: new Date(),
          totalPlayers: tournament.players.length,
          soldPlayers,
          unsoldPlayers,
          totalSpent,
          isCompleted: true,
          progress: 100,
        };

        set((state) => ({
          savedTournaments: [...state.savedTournaments, savedTournament],
        }));
      },

      saveCurrentAuction: (name?: string) => {
        const { tournament, auctionState } = get();
        if (!tournament) return null;

        const soldPlayers = tournament.players.filter(p => p.soldPrice).length;
        const unsoldPlayers = tournament.players.filter(p => p.isUnsold).length;
        const totalSpent = tournament.teams.reduce((total, team) =>
          total + (team.budget - team.remainingBudget), 0
        );

        const progress = tournament.players.length > 0
          ? Math.round(((soldPlayers + unsoldPlayers) / tournament.players.length) * 100)
          : 0;

        const savedTournament: SavedTournament = {
          id: `saved-${tournament.id}-${Date.now()}`,
          tournament: JSON.parse(JSON.stringify({
            ...tournament,
            name: name || tournament.name,
          })),
          auctionState: JSON.parse(JSON.stringify(auctionState)),
          savedAt: new Date(),
          completedAt: tournament.isAuctionCompleted ? new Date() : undefined,
          totalPlayers: tournament.players.length,
          soldPlayers,
          unsoldPlayers,
          totalSpent,
          isCompleted: tournament.isAuctionCompleted,
          progress,
        };

        set((state) => ({
          savedTournaments: [...state.savedTournaments, savedTournament],
        }));

        return savedTournament.id;
      },

      loadTournament: (tournamentId: string) => {
        const { savedTournaments } = get();
        const savedTournament = savedTournaments.find(st => st.id === tournamentId);
        if (!savedTournament) return;

        // Use the tournament's configured bid increment
        const bidIncrement = savedTournament.tournament.settings.bidIncrement || savedTournament.tournament.settings.minimumBid;

        // Load the saved auction state for incomplete auctions, or reset for completed ones
        const auctionStateToLoad = savedTournament.isCompleted
          ? initialAuctionState
          : (savedTournament.auctionState || initialAuctionState);

        set((state) => ({
          tournament: savedTournament.tournament,
          auctionState: auctionStateToLoad,
          bidHistory: [],
          settings: {
            ...state.settings,
            bidIncrement: bidIncrement
          }
        }));
      },

      deleteSavedTournament: (tournamentId: string) => {
        set((state) => ({
          savedTournaments: state.savedTournaments.filter(st => st.id !== tournamentId),
        }));
      },

      getSavedTournaments: () => {
        const { savedTournaments } = get();
        return savedTournaments.sort((a, b) =>
          new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
        );
      },

      getCompletedTournaments: () => {
        const { savedTournaments } = get();
        return savedTournaments
          .filter(st => st.isCompleted)
          .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());
      },

      getIncompleteTournaments: () => {
        const { savedTournaments } = get();
        return savedTournaments
          .filter(st => !st.isCompleted)
          .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
      },

      updateSavedTournamentName: (tournamentId: string, newName: string) => {
        set((state) => ({
          savedTournaments: state.savedTournaments.map(st =>
            st.id === tournamentId
              ? {
                  ...st,
                  tournament: { ...st.tournament, name: newName },
                  savedAt: new Date() // Update saved time when name is changed
                }
              : st
          ),
        }));
      },
    }),
    {
      name: 'auction-store',
      version: 1,
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          try {
            return JSON.parse(str, (_key, value) => {
              // Restore Date objects
              if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
                return new Date(value);
              }
              return value;
            });
          } catch {
            return null;
          }
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value, (_key, val) => {
            // Convert Date objects to ISO strings
            if (val instanceof Date) {
              return val.toISOString();
            }
            return val;
          }));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
      // Only persist essential state - remove functions to avoid serialization issues
      partialize: (state) => ({
        tournament: state.tournament,
        auctionState: state.auctionState,
        settings: state.settings,
        bidHistory: state.bidHistory,
        savedTournaments: state.savedTournaments,
      }) as AuctionStore,
    }
  ),
  {
    name: 'auction-store-devtools',
  }
));
