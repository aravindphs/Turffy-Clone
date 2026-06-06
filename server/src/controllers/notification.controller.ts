import { Request, Response } from 'express';
import Notification from '../models/Notification.model';
import asyncHandler from '../utils/asyncHandler';
import { sendSuccess, sendPaginated } from '../utils/response.utils';
import * as notificationService from '../services/notification.service';

// ---- GET NOTIFICATIONS ----
export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', limit = '20', unreadOnly } = req.query as Record<string, string>;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const filter: Record<string, unknown> = { user: req.user!._id };
  if (unreadOnly === 'true') filter.isRead = false;

  const [notifications, total] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Notification.countDocuments(filter),
  ]);

  sendPaginated(res, notifications, total, pageNum, limitNum, 'Notifications retrieved');
});

// ---- GET UNREAD COUNT ----
export const getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
  const count = await notificationService.getUnreadCount(req.user!._id.toString());
  sendSuccess(res, { count }, 'Unread count retrieved');
});

// ---- MARK AS READ ----
export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const { notificationId } = req.params;
  const updated = await notificationService.markAsRead(
    notificationId,
    req.user!._id.toString()
  );
  if (!updated) {
    sendSuccess(res, null, 'Notification not found or already read');
    return;
  }
  sendSuccess(res, null, 'Notification marked as read');
});

// ---- MARK ALL AS READ ----
export const markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
  const count = await notificationService.markAllAsRead(req.user!._id.toString());
  sendSuccess(res, { count }, `${count} notification(s) marked as read`);
});

// ---- DELETE NOTIFICATION ----
export const deleteNotification = asyncHandler(async (req: Request, res: Response) => {
  const { notificationId } = req.params;
  await Notification.findOneAndDelete({ _id: notificationId, user: req.user!._id });
  sendSuccess(res, null, 'Notification deleted');
});
