import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/User.model';
import Turf from '../models/Turf.model';
import Booking from '../models/Booking.model';
import Court from '../models/Court.model';
import asyncHandler from '../utils/asyncHandler';
import { sendSuccess, sendError, sendPaginated } from '../utils/response.utils';
import { createNotification } from '../services/notification.service';
import {
  sendOwnerTurfApproved,
  sendOwnerTurfRejected,
} from '../services/email.service';

// ---- DASHBOARD STATS ----
export const getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
  const [
    totalUsers,
    totalOwners,
    totalTurfs,
    pendingTurfs,
    totalBookings,
    confirmedBookings,
    cancelledBookings,
    revenueData,
  ] = await Promise.all([
    User.countDocuments({ role: 'user', isActive: true }),
    User.countDocuments({ role: 'owner', isActive: true }),
    Turf.countDocuments({ isActive: true }),
    Turf.countDocuments({ isActive: true, isVerified: false }),
    Booking.countDocuments(),
    Booking.countDocuments({ status: 'confirmed' }),
    Booking.countDocuments({ status: 'cancelled' }),
    Booking.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } },
    ]),
  ]);

  const totalRevenue = revenueData[0]?.totalRevenue || 0;

  sendSuccess(
    res,
    {
      users: { total: totalUsers, owners: totalOwners },
      turfs: { total: totalTurfs, pendingApproval: pendingTurfs },
      bookings: {
        total: totalBookings,
        confirmed: confirmedBookings,
        cancelled: cancelledBookings,
      },
      revenue: { total: totalRevenue },
    },
    'Dashboard stats retrieved'
  );
});

// ---- GET PENDING TURFS ----
export const getPendingTurfs = asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', limit = '10' } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const filter = { isActive: true, isVerified: false };

  const [turfs, total] = await Promise.all([
    Turf.find(filter)
      .populate('owner', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Turf.countDocuments(filter),
  ]);

  sendPaginated(res, turfs, total, pageNum, limitNum, 'Pending turfs retrieved');
});

// ---- APPROVE TURF ----
export const approveTurf = asyncHandler(async (req: Request, res: Response) => {
  const { turfId } = req.params;

  const turf = await Turf.findById(turfId).populate('owner', 'name email');
  if (!turf) {
    sendError(res, 'Turf not found.', 404);
    return;
  }

  if (turf.isVerified) {
    sendError(res, 'Turf is already verified.', 400);
    return;
  }

  turf.isVerified = true;
  await turf.save();

  const owner = turf.owner as unknown as { _id: mongoose.Types.ObjectId; name: string; email: string };

  sendOwnerTurfApproved(
    owner as unknown as import('../models/User.model').IUser,
    turf as unknown as import('../models/Turf.model').ITurf
  ).catch(console.error);

  createNotification(
    owner._id,
    'turf_approved',
    'Your turf has been approved!',
    `Congratulations! ${turf.name} is now live on Turffy. Customers can start booking.`,
    { turfId }
  ).catch(console.error);

  sendSuccess(res, { turf: turf.toJSON() }, 'Turf approved and is now live');
});

// ---- REJECT TURF ----
export const rejectTurf = asyncHandler(async (req: Request, res: Response) => {
  const { turfId } = req.params;
  const { reason } = req.body as { reason: string };

  if (!reason || reason.trim().length < 10) {
    sendError(res, 'A detailed rejection reason (min 10 chars) is required.', 400);
    return;
  }

  const turf = await Turf.findById(turfId).populate('owner', 'name email');
  if (!turf) {
    sendError(res, 'Turf not found.', 404);
    return;
  }

  turf.isActive = false;
  await turf.save();

  const owner = turf.owner as unknown as { _id: mongoose.Types.ObjectId; name: string; email: string };

  sendOwnerTurfRejected(
    owner as unknown as import('../models/User.model').IUser,
    turf as unknown as import('../models/Turf.model').ITurf,
    reason.trim()
  ).catch(console.error);

  createNotification(
    owner._id,
    'turf_rejected',
    'Turf verification unsuccessful',
    `Your turf "${turf.name}" could not be verified. Reason: ${reason.trim()}`,
    { turfId, reason: reason.trim() }
  ).catch(console.error);

  sendSuccess(res, null, 'Turf rejected. Owner has been notified.');
});

// ---- GET ALL USERS ----
export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const { role, search, page = '1', limit = '20' } = req.query as Record<string, string>;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const filter: Record<string, unknown> = {};
  if (role) filter.role = role;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean()
      .select('-password -refreshToken -googleId -passwordResetOtp -passwordResetExpires'),
    User.countDocuments(filter),
  ]);

  sendPaginated(res, users, total, pageNum, limitNum, 'Users retrieved');
});

// ---- TOGGLE USER STATUS (ban/unban) ----
export const toggleUserStatus = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;

  if (userId === req.user!._id.toString()) {
    sendError(res, 'You cannot deactivate your own account.', 400);
    return;
  }

  const user = await User.findById(userId);
  if (!user) {
    sendError(res, 'User not found.', 404);
    return;
  }

  if (user.role === 'admin') {
    sendError(res, 'Cannot deactivate another admin account.', 403);
    return;
  }

  user.isActive = !user.isActive;
  await user.save();

  const action = user.isActive ? 'activated' : 'deactivated';
  sendSuccess(res, { userId, isActive: user.isActive }, `User ${action} successfully`);
});

// ---- GET ALL BOOKINGS ----
export const getAllBookings = asyncHandler(async (req: Request, res: Response) => {
  const {
    status,
    paymentStatus,
    turfId,
    startDate,
    endDate,
    page = '1',
    limit = '20',
  } = req.query as Record<string, string>;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (paymentStatus) filter.paymentStatus = paymentStatus;
  if (turfId) filter.turf = turfId;
  if (startDate || endDate) {
    const dateFilter: Record<string, Date> = {};
    if (startDate) {
      const sd = new Date(startDate);
      sd.setUTCHours(0, 0, 0, 0);
      dateFilter.$gte = sd;
    }
    if (endDate) {
      const ed = new Date(endDate);
      ed.setUTCHours(23, 59, 59, 999);
      dateFilter.$lte = ed;
    }
    filter.date = dateFilter;
  }

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate('user', 'name email phone')
      .populate('turf', 'name city')
      .populate('court', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Booking.countDocuments(filter),
  ]);

  sendPaginated(res, bookings, total, pageNum, limitNum, 'Bookings retrieved');
});

// ---- GET ALL TURFS (admin) ----
export const getAllTurfs = asyncHandler(async (req: Request, res: Response) => {
  const {
    city,
    isVerified,
    isActive,
    search,
    page = '1',
    limit = '20',
  } = req.query as Record<string, string>;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const filter: Record<string, unknown> = {};
  if (city) filter.city = { $regex: city, $options: 'i' };
  if (isVerified !== undefined) filter.isVerified = isVerified === 'true';
  if (isActive !== undefined) filter.isActive = isActive === 'true';
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { address: { $regex: search, $options: 'i' } },
    ];
  }

  const [turfs, total] = await Promise.all([
    Turf.find(filter)
      .populate('owner', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Turf.countDocuments(filter),
  ]);

  sendPaginated(res, turfs, total, pageNum, limitNum, 'Turfs retrieved');
});

// ---- GET ANALYTICS ----
export const getAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setUTCHours(0, 0, 0, 0);

  const [
    dailyBookings,
    revenueByCity,
    topTurfs,
    userGrowth,
  ] = await Promise.all([
    // Daily booking counts and revenue for last 30 days
    Booking.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
          },
          bookings: { $sum: 1 },
          revenue: {
            $sum: {
              $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$totalAmount', 0],
            },
          },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
      {
        $project: {
          _id: 0,
          date: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: {
                $dateFromParts: {
                  year: '$_id.year',
                  month: '$_id.month',
                  day: '$_id.day',
                },
              },
            },
          },
          bookings: 1,
          revenue: 1,
        },
      },
    ]),

    // Revenue by city
    Booking.aggregate([
      { $match: { paymentStatus: 'paid' } },
      {
        $lookup: {
          from: 'turfs',
          localField: 'turf',
          foreignField: '_id',
          as: 'turfData',
        },
      },
      { $unwind: '$turfData' },
      {
        $group: {
          _id: '$turfData.city',
          revenue: { $sum: '$totalAmount' },
          bookings: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 0,
          city: '$_id',
          revenue: 1,
          bookings: 1,
        },
      },
    ]),

    // Top-performing turfs by bookings
    Booking.aggregate([
      { $match: { status: { $in: ['confirmed', 'completed'] } } },
      {
        $group: {
          _id: '$turf',
          bookings: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
        },
      },
      { $sort: { bookings: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'turfs',
          localField: '_id',
          foreignField: '_id',
          as: 'turf',
        },
      },
      { $unwind: '$turf' },
      {
        $project: {
          _id: 0,
          turfId: '$_id',
          turfName: '$turf.name',
          city: '$turf.city',
          bookings: 1,
          revenue: 1,
        },
      },
    ]),

    // User growth over last 30 days
    User.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
          },
          newUsers: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
      {
        $project: {
          _id: 0,
          date: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: {
                $dateFromParts: {
                  year: '$_id.year',
                  month: '$_id.month',
                  day: '$_id.day',
                },
              },
            },
          },
          newUsers: 1,
        },
      },
    ]),
  ]);

  sendSuccess(
    res,
    {
      dailyBookings,
      revenueByCity,
      topTurfs,
      userGrowth,
    },
    'Analytics retrieved'
  );
});

// ---- FEATURE A TURF (admin) ----
export const featureTurf = asyncHandler(async (req: Request, res: Response) => {
  const { turfId } = req.params;
  const { days = 30, remove = false } = req.body as { days?: number; remove?: boolean };

  if (remove) {
    await Turf.findByIdAndUpdate(turfId, { $set: { isFeatured: false, featuredUntil: null } });
    sendSuccess(res, null, 'Turf removed from featured listings');
    return;
  }

  const featuredUntil = new Date();
  featuredUntil.setDate(featuredUntil.getDate() + days);

  const turf = await Turf.findByIdAndUpdate(
    turfId,
    { $set: { isFeatured: true, featuredUntil } },
    { new: true }
  )
    .select('name isFeatured featuredUntil')
    .lean();

  if (!turf) {
    sendError(res, 'Turf not found.', 404);
    return;
  }

  sendSuccess(res, { turf }, `Turf featured for ${days} days`);
});

// ---- GET REVENUE STATS ----
export const getRevenue = asyncHandler(async (req: Request, res: Response) => {
  const { period = 'monthly', year, month } = req.query as Record<string, string>;

  const currentYear = year ? parseInt(year, 10) : new Date().getFullYear();

  let groupId: Record<string, unknown>;
  let matchStage: Record<string, unknown> = { paymentStatus: 'paid' };

  if (period === 'daily' && month) {
    const currentMonth = parseInt(month, 10);
    matchStage = {
      paymentStatus: 'paid',
      date: {
        $gte: new Date(currentYear, currentMonth - 1, 1),
        $lt: new Date(currentYear, currentMonth, 1),
      },
    };
    groupId = {
      day: { $dayOfMonth: '$date' },
      month: { $month: '$date' },
      year: { $year: '$date' },
    };
  } else {
    // Monthly view for the year
    matchStage = {
      paymentStatus: 'paid',
      date: {
        $gte: new Date(currentYear, 0, 1),
        $lt: new Date(currentYear + 1, 0, 1),
      },
    };
    groupId = {
      month: { $month: '$date' },
      year: { $year: '$date' },
    };
  }

  const revenueData = await Booking.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: groupId,
        revenue: { $sum: '$totalAmount' },
        bookings: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
  ]);

  // Top turfs by revenue
  const topTurfs = await Booking.aggregate([
    { $match: { paymentStatus: 'paid' } },
    {
      $group: {
        _id: '$turf',
        revenue: { $sum: '$totalAmount' },
        bookings: { $sum: 1 },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'turfs',
        localField: '_id',
        foreignField: '_id',
        as: 'turf',
      },
    },
    { $unwind: '$turf' },
    {
      $project: {
        _id: 0,
        turfId: '$_id',
        turfName: '$turf.name',
        city: '$turf.city',
        revenue: 1,
        bookings: 1,
      },
    },
  ]);

  sendSuccess(
    res,
    { revenueByPeriod: revenueData, topTurfs },
    'Revenue stats retrieved'
  );
});
