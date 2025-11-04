// Lobby API routes
// Will be implemented in Module 4.3

import { Hono } from 'hono';

const lobbies = new Hono();

lobbies.get('/', async (c) => {
  return c.json({ message: 'Not implemented yet (Module 4.3)' }, 501);
});

lobbies.post('/', async (c) => {
  return c.json({ message: 'Not implemented yet (Module 4.3)' }, 501);
});

export default lobbies;
