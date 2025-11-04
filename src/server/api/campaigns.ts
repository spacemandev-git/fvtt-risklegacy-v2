// Campaign management API routes
// Will be implemented in Module 2.2

import { Hono } from 'hono';

const campaigns = new Hono();

campaigns.get('/', async (c) => {
  return c.json({ message: 'Not implemented yet (Module 2.2)' }, 501);
});

campaigns.post('/', async (c) => {
  return c.json({ message: 'Not implemented yet (Module 2.2)' }, 501);
});

export default campaigns;
