import Notification, { NotificationType } from '../models/Notification.model';
import mongoose from 'mongoose';
import { emitNotification } from '../socket/notification.socket';

/**
 * Create a notification record in DB and push it to the user via Socket.io.
 */
export const createNotification = async (
  userId: string | mongoose.Types.ObjectId,
  type: NotificationType,
  title: string,
  body: string,
  data: Record<string, unknown> = {}
): Promise<void> => {
  const notification = await Notification.create({
    user: userId,
    type,
    title,
    body,
    data,
  });

  // Real-time push via Socket.io
  emitNotification(userId.toString(), notification.toJSON());
};

/**
 * Mark a single notification as read.
 */
export const markAsRead = async (
  notificationId: string,
  userId: string
): Promise<boolean> => {
  const result = await Notification.updateOne(
    { _id: notificationId, user: userId },
    { $set: { isRead: true } }
  );
  return result.modifiedCount > 0;
};

/**
 * Mark all notifications for a user as read.
 */
export const markAllAsRead = async (userId: string): Promise<number> => {
  const result = await Notification.updateMany(
    { user: userId, isRead: false },
    { $set: { isRead: true } }
  );
  return result.modifiedCount;
};

/**
 * Get count of unread notifications for a user.
 */
export const getUnreadCount = async (userId: string): Promise<number> => {
  return Notification.countDocuments({ user: userId, isRead: false });
};
