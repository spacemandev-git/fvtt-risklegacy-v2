// Asset serving API routes
// Will be implemented in Module 4.4

import { Hono } from 'hono';

const assets = new Hono();

assets.get('/packs', async (c) => {
  return c.json({ message: 'Not implemented yet (Module 4.4)' }, 501);
});

assets.get('/factions', async (c) => {
  return c.json({ message: 'Not implemented yet (Module 4.4)' }, 501);
});

export default assets;
