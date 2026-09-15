import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { config } from '../config/index.js';

const router = Router();

// GET /api/n8n/workflows
router.get('/workflows', authenticate, async (_req: AuthRequest, res: Response) => {
  try {
    if (!config.n8nBaseUrl || !config.n8nApiKey) {
      res.json({ workflows: [], configured: false });
      return;
    }

    const response = await fetch(`${config.n8nBaseUrl}/api/v1/workflows`, {
      headers: {
        'X-N8N-API-KEY': config.n8nApiKey,
      },
    });

    if (!response.ok) {
      console.error('n8n API error:', response.status, response.statusText);
      res.json({ workflows: [], configured: true, error: 'Failed to fetch workflows from n8n' });
      return;
    }

    const data = await response.json() as { data?: Array<{ id: string; name: string; active: boolean; createdAt: string; updatedAt: string }> };
    const workflows = (data.data || []).map((w) => ({
      id: w.id,
      name: w.name,
      active: w.active,
      createdAt: w.createdAt,
      updatedAt: w.updatedAt,
    }));

    res.json({ workflows, configured: true });
  } catch (err) {
    console.error('n8n workflows error:', err);
    res.json({ workflows: [], configured: false, error: 'Unable to connect to n8n' });
  }
});

// GET /api/n8n/status
router.get('/status', authenticate, async (_req: AuthRequest, res: Response) => {
  try {
    if (!config.n8nBaseUrl || !config.n8nApiKey) {
      res.json({ configured: false, status: 'not_configured' });
      return;
    }

    const response = await fetch(`${config.n8nBaseUrl}/api/v1/workflows?limit=1`, {
      headers: {
        'X-N8N-API-KEY': config.n8nApiKey,
      },
    });

    if (response.ok) {
      res.json({ configured: true, status: 'connected' });
    } else {
      res.json({ configured: true, status: 'error', message: `n8n returned ${response.status}` });
    }
  } catch (err) {
    console.error('n8n status error:', err);
    res.json({ configured: false, status: 'disconnected' });
  }
});

export default router;
