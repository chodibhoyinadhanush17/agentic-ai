import express from 'express';
import integrationController from '../controllers/integrationController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public / Browser OAuth redirects
router.get('/oauth/:provider/callback', integrationController.handleOAuthCallback.bind(integrationController));
router.get('/oauth/error', integrationController.oauthError.bind(integrationController));

// Protected API routes
router.use(requireAuth);

router.get('/', integrationController.listIntegrations.bind(integrationController));
router.get('/status', integrationController.getStatus.bind(integrationController));
router.get('/oauth/:provider/start', integrationController.startOAuth.bind(integrationController));
router.post('/', integrationController.saveManual.bind(integrationController));
router.post('/:provider/disconnect', integrationController.disconnect.bind(integrationController));

export default router;
