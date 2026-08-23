import express from 'express';
import { Notification } from '../models/Notification.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = await Notification.find({ owner: userId });
    return res.json({ success: true, data: notifications });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'NOTIFICATIONS_FAILED', message: err.message } });
  }
});

router.post('/mark-read', async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationIds } = req.body;

    if (notificationIds && Array.isArray(notificationIds)) {
      await Notification.updateMany({ owner: userId, _id: { $in: notificationIds } }, { $set: { isRead: true } });
    } else {
      // Mark all read
      await Notification.updateMany({ owner: userId }, { $set: { isRead: true } });
    }

    return res.json({ success: true, message: 'Notifications marked as read' });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'MARK_READ_FAILED', message: err.message } });
  }
});

export default router;
