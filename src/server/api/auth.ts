// Authentication API routes
// Will be implemented in Module 2.1

import { Hono } from 'hono';

const auth = new Hono();

// POST /api/auth/register - Create new user
auth.post('/register', async (c) => {
  return c.json({ message: 'Not implemented yet (Module 2.1)' }, 501);
});

// POST /api/auth/login - Login user
auth.post('/login', async (c) => {
  return c.json({ message: 'Not implemented yet (Module 2.1)' }, 501);
});

// GET /api/auth/me - Get current user
auth.get('/me', async (c) => {
  return c.json({ message: 'Not implemented yet (Module 2.1)' }, 501);
});

export default auth;
