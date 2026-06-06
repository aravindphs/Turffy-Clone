import { Request, Response } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import Review from '../models/Review.model';
import Booking from '../models/Booking.model';
import Turf from '../models/Turf.model';
import asyncHandler from '../utils/asyncHandler';
import { sendSuccess, sendError, sendPaginated } from '../utils/response.utils';
import { createNotification } from '../services/notification.service';

const createReviewSchema = z.object({
  turfId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid turf ID'),
  bookingId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid booking ID'),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(10, 'Comment must be at least 10 characters').max(1000),
});

const ownerReplySchema = z.object({
  reply: z.string().trim().min(5, 'Reply must be at least 5 characters').max(1000),
});

// ---- CREATE REVIEW ----
export const createReview = asyncHandler(async (req: Request, res: Response) => {
  const body = createReviewSchema.parse(req.body);

  // Verify booking is completed and belongs to user
  const booking = await Booking.findOne({
    _id: body.bookingId,
    user: req.user!._id,
    turf: body.turfId,
    status: 'completed',
  }).lean();

  if (!booking) {
    sendError(
      res,
      'You can only review turfs for completed bookings.',
      403
    );
    return;
  }

  // Check no existing review for this booking
  const existingReviewForBooking = await Review.findOne({ booking: body.bookingId }).lean();
  if (existingReviewForBooking) {
    sendError(res, 'You have already reviewed this booking.', 409);
    return;
  }

  // Check one-review-per-turf rule (upsert approach)
  const existingReview = await Review.findOne({
    user: req.user!._id,
    turf: body.turfId,
  }).lean();

  if (existingReview) {
    sendError(res, 'You have already reviewed this turf.', 409);
    return;
  }

  const review = await Review.create({
    user: req.user!._id,
    turf: body.turfId,
    booking: body.bookingId,
    rating: body.rating,
    comment: body.comment,
  });

  // Update turf's aggregate rating
  const reviewStats = await Review.aggregate([
    { $match: { turf: new mongoose.Types.ObjectId(body.turfId), isVisible: true } },
    {
      $group: {
        _id: null,
        avgRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  if (reviewStats.length > 0) {
    await Turf.findByIdAndUpdate(body.turfId, {
      rating: Math.round(reviewStats[0].avgRating * 10) / 10,
      totalReviews: reviewStats[0].totalReviews,
    });
  }

  // Notify turf owner
  const turf = await Turf.findById(body.turfId).lean();
  if (turf) {
    createNotification(
      turf.owner,
      'review_reply',
      'New Review Received',
      `${req.user!.name} gave your turf ${body.rating} star(s): "${body.comment.slice(0, 80)}..."`,
      { reviewId: review._id.toString(), turfId: body.turfId }
    ).catch(console.error);
  }

  const populatedReview = await Review.findById(review._id)
    .populate('user', 'name avatar')
    .lean();

  sendSuccess(res, { review: populatedReview }, 'Review submitted successfully', 201);
});

// ---- GET REVIEWS FOR A TURF ----
export const getReviews = asyncHandler(async (req: Request, res: Response) => {
  const { turfId } = req.params;
  const { page = '1', limit = '10' } = req.query as Record<string, string>;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const filter = { turf: turfId, isVisible: true };

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Review.countDocuments(filter),
  ]);

  // Calculate rating distribution
  const ratingDist = await Review.aggregate([
    { $match: { turf: new mongoose.Types.ObjectId(turfId), isVisible: true } },
    { $group: { _id: '$rating', count: { $sum: 1 } } },
    { $sort: { _id: -1 } },
  ]);

  sendPaginated(
    res,
    reviews,
    total,
    pageNum,
    limitNum,
    'Reviews retrieved'
  );
});

// ---- OWNER REPLY TO REVIEW ----
export const ownerReply = asyncHandler(async (req: Request, res: Response) => {
  const { reviewId } = req.params;
  const body = ownerReplySchema.parse(req.body);

  const review = await Review.findById(reviewId).populate('turf', 'owner');
  if (!review) {
    sendError(res, 'Review not found.', 404);
    return;
  }

  const turfOwnerId = (review.turf as unknown as { owner: mongoose.Types.ObjectId }).owner?.toString();
  if (turfOwnerId !== req.user!._id.toString()) {
    sendError(res, 'Only the turf owner can reply to reviews.', 403);
    return;
  }

  review.ownerReply = body.reply;
  review.ownerRepliedAt = new Date();
  await review.save();

  // Notify the reviewer
  createNotification(
    review.user,
    'review_reply',
    'Owner replied to your review',
    `The turf owner replied: "${body.reply.slice(0, 80)}..."`,
    { reviewId }
  ).catch(console.error);

  sendSuccess(res, { review: review.toJSON() }, 'Reply added successfully');
});

// ---- DELETE REVIEW ----
export const deleteReview = asyncHandler(async (req: Request, res: Response) => {
  const { reviewId } = req.params;

  const review = await Review.findById(reviewId).lean();
  if (!review) {
    sendError(res, 'Review not found.', 404);
    return;
  }

  const userId = req.user!._id.toString();
  const isReviewer = review.user.toString() === userId;
  const isAdmin = req.user!.role === 'admin';

  if (!isReviewer && !isAdmin) {
    sendError(res, 'You are not authorized to delete this review.', 403);
    return;
  }

  await Review.findByIdAndDelete(reviewId);

  // Recalculate turf rating
  const reviewStats = await Review.aggregate([
    { $match: { turf: review.turf, isVisible: true } },
    {
      $group: {
        _id: null,
        avgRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  await Turf.findByIdAndUpdate(review.turf, {
    rating: reviewStats.length > 0 ? Math.round(reviewStats[0].avgRating * 10) / 10 : 0,
    totalReviews: reviewStats.length > 0 ? reviewStats[0].totalReviews : 0,
  });

  sendSuccess(res, null, 'Review deleted successfully');
});
