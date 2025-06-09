export interface Player {
  id: string;
  name: string;
  basePrice?: number;
  role?: PlayerRole;
  rating?: number;
  imageUrl?: string;
  isUnsold?: boolean;
  soldPrice?: number;
  teamId?: string;
}

export interface Team {
  id: string;
  name: string;
  budget: number;
  remainingBudget: number;
  players: Player[];
  maxPlayers: number;
  maxForeignPlayers?: number;
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface Tournament {
  id: string;
  name: string;
  numberOfTeams: number;
  playersPerTeam: number;
  teamBudget: number;
  teams: Team[];
  players: Player[];
  currentPlayerIndex: number;
  isAuctionStarted: boolean;
  isAuctionCompleted: boolean;
  constraints?: AuctionConstraints;
  settings: TournamentSettings;
}

export interface TournamentSettings {
  enableUnsoldPlayerReturn: boolean;
  unsoldPlayerReturnRound: number;
  enableTimer: boolean;
  timerDuration: number; // in seconds: 30, 60, 90, 120
  minimumBid: number; // minimum bid amount
  bidIncrement: number; // bid increment amount
  hidePricesInLiveView: boolean; // hide prices in shared live auction view
  hideUnsoldStatusInLiveView: boolean; // hide unsold player status in shared live auction view
}

export interface AuctionConstraints {
  maxForeignPlayers?: number;
  roleBasedLimits?: {
    [key in PlayerRole]?: {
      min?: number;
      max?: number;
    };
  };
}

export interface Bid {
  teamId: string;
  amount: number;
  timestamp: Date;
}

export interface AuctionState {
  currentBids: Bid[];
  highestBid?: Bid;
  passedTeams: string[];
  timer: number;
  isActive: boolean;
  preventAutoAdvance?: boolean; // Flag to prevent getCurrentPlayer from auto-advancing
}

export type PlayerRole = 
  | 'Batsman' 
  | 'Bowler' 
  | 'All-Rounder' 
  | 'Wicket-Keeper';

export type AuctionStatus = 
  | 'not-started' 
  | 'in-progress' 
  | 'completed' 
  | 'paused';

export interface ExcelPlayerData {
  'Player Name': string;
  'Base Price'?: number;
  'Role'?: string;
  'Rating'?: number;
  'Image URL'?: string;
}

export interface AuctionSettings {
  bidIncrement: number;
  auctionTimer: number;
  autoPassTimer: number;
}
