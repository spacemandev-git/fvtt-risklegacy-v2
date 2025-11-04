// Asset loader utilities
// Will be implemented in Module 1.4

import { z } from 'zod';
import logger from '../logger';

// Placeholder schemas - will be expanded in Module 1.4
export const FactionSchema = z.object({
  id: z.string(),
  name: z.string(),
  // More fields will be added
});

export const AssetDatabase = {
  factions: [] as z.infer<typeof FactionSchema>[],
  // More asset types will be added
};

export function loadAssets() {
  logger.info('Asset loading not yet implemented (Module 1.4)');
  return AssetDatabase;
}

export default { loadAssets, AssetDatabase };
