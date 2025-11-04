// Rulebook API routes
// Will be implemented in Module 1.2

import { Hono } from 'hono';

const rulebook = new Hono();

rulebook.get('/base', async (c) => {
  return c.json({ message: 'Not implemented yet (Module 1.2)' }, 501);
});

export default rulebook;
