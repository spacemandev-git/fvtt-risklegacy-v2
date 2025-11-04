// Game state type definitions
// Will be implemented in Module 3.1

export interface Territory {
  id: string;
  name: string;
  owner: string | null;
  troops: number;
  isHQ: boolean;
  isCity: boolean;
  // More properties will be added
}

export interface Player {
  id: string;
  faction: string | null;
  power: string | null;
  stars: number;
  cards: string[];
  // More properties will be added
}

export interface GameState {
  territories: Record<string, Territory>;
  players: Record<string, Player>;
  // More properties will be added
}
