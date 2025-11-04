import type { Game } from 'boardgame.io';

// This will be implemented in Module 3.1+
// For now, this is a minimal stub to verify boardgame.io integration

export const RiskLegacy: Game = {
  name: 'risk-legacy',

  setup: () => ({
    // Initial game state will be defined in Module 3.1
  }),

  // Phases will be added in Modules 3.2-3.6
  phases: {},

  // Moves will be added in Modules 3.2-3.5
  moves: {},

  // End condition will be implemented in Module 3.6
  endIf: () => undefined,
};

export default RiskLegacy;
