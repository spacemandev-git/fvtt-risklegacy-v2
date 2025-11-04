import { Hono } from 'hono';
import { logger as honoLogger } from 'hono/logger';
import { cors } from 'hono/cors';
import logger from './logger';

const app = new Hono();

// Middleware
app.use('*', honoLogger());
app.use('*', cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
}));

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '0.1.0'
  });
});

// API routes (stubs until their respective modules are implemented)
import authRoutes from './api/auth';
import campaignRoutes from './api/campaigns';
import lobbyRoutes from './api/lobbies';
import assetRoutes from './api/assets';
import rulebookRoutes from './api/rulebook';

app.route('/api/auth', authRoutes);
app.route('/api/campaigns', campaignRoutes);
app.route('/api/lobbies', lobbyRoutes);
app.route('/api/assets', assetRoutes);
app.route('/api/rulebook', rulebookRoutes);

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

// Error handler
app.onError((err, c) => {
  logger.error('Server error:', err);
  return c.json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  }, 500);
});

const port = parseInt(process.env.PORT || '8000');

logger.info(`Starting Risk Legacy server on port ${port}`);
logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);

export default {
  port,
  fetch: app.fetch,
};

export { logger };
