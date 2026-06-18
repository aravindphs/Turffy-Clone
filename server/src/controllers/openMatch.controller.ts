import { Request, Response } from 'express';
import mongoose from 'mongoose';
import OpenMatch, { IMatchPlayer } from '../models/OpenMatch.model';
import Booking from '../models/Booking.model';
import Turf from '../models/Turf.model';
import Court from '../models/Court.model';
import asyncHandler from '../utils/asyncHandler';
import { sendSuccess, sendError, sendPaginated } from '../utils/response.utils';
import { createNotification } from '../services/notification.service';

// ---- CREATE OPEN MATCH ----
export const createOpenMatch = asyncHandler(async (req: Request, res: Response) => {
  const { bookingId, maxPlayers, minPlayers, notes } = req.body as {
    bookingId: string;
    maxPlayers: number;
    minPlayers: number;
    notes?: string;
  };

  if (!bookingId || !maxPlayers || !minPlayers) {
    sendError(res, 'bookingId, maxPlayers, and minPlayers are required.', 400);
    return;
  }

  if (!mongoose.Types.ObjectId.isValid(bookingId)) {
    sendError(res, 'Invalid booking ID.', 400);
    return;
  }

  if (minPlayers < 2 || maxPlayers < 2 || minPlayers > maxPlayers) {
    sendError(res, 'minPlayers must be >= 2 and <= maxPlayers.', 400);
    return;
  }

  const booking = await Booking.findOne({
    _id: bookingId,
    user: req.user!._id,
    status: 'confirmed',
  }).lean();

  if (!booking) {
    sendError(res, 'Confirmed booking not found or it does not belong to you.', 404);
    return;
  }

  // Check if an open match already exists for this booking
  const existing = await OpenMatch.findOne({ booking: bookingId });
  if (existing) {
    sendError(res, 'An open match has already been created for this booking.', 409);
    return;
  }

  // Denormalize city from the Turf document
  const turf = await Turf.findById(booking.turf).select('city').lean();
  if (!turf) {
    sendError(res, 'Turf not found.', 404);
    return;
  }

  // Determine sport from the court
  const court = await Court.findById(booking.court).select('sport').lean();
  const sport = (court as unknown as { sport: string } | null)?.sport ?? 'football';

  const match = await OpenMatch.create({
    turf: booking.turf,
    court: booking.court,
    booking: booking._id,
    organizer: req.user!._id,
    sport,
    city: turf.city,
    date: booking.date,
    startTime: booking.startTime,
    endTime: booking.endTime,
    maxPlayers,
    minPlayers,
    notes: notes ?? '',
    status: 'open',
    // Organizer is automatically added as an approved player
    players: [
      {
        user: req.user!._id,
        status: 'approved',
        joinedAt: new Date(),
      },
    ],
  });

  sendSuccess(res, { match }, 'Open match created successfully.', 201);
});

// ---- LIST OPEN MATCHES ----
export const listOpenMatches = asyncHandler(async (req: Request, res: Response) => {
  const {
    sport,
    city,
    date,
    turfId,
    page = '1',
    limit = '20',
  } = req.query as Record<string, string>;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const filter: Record<string, unknown> = { status: 'open' };

  if (sport) filter.sport = sport;
  if (city) filter.city = city.toLowerCase();
  if (turfId && mongoose.Types.ObjectId.isValid(turfId)) filter.turf = turfId;
  if (date) {
    const queryDate = new Date(date);
    queryDate.setUTCHours(0, 0, 0, 0);
    const nextDate = new Date(queryDate);
    nextDate.setUTCDate(nextDate.getUTCDate() + 1);
    filter.date = { $gte: queryDate, $lt: nextDate };
  }

  const [matches, total] = await Promise.all([
    OpenMatch.find(filter)
      .populate('turf', 'name city address images')
      .populate('court', 'name sport')
      .populate('organizer', 'name avatar')
      .sort({ date: 1 })
      .skip(skip)
      .limit(limitNum)
      .lean({ virtuals: true }),
    OpenMatch.countDocuments(filter),
  ]);

  sendPaginated(res, matches, total, pageNum, limitNum, 'Open matches retrieved');
});

// ---- GET SINGLE OPEN MATCH ----
export const getOpenMatch = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    sendError(res, 'Invalid match ID.', 400);
    return;
  }

  const match = await OpenMatch.findById(id)
    .populate('turf', 'name city address images operatingHours')
    .populate('court', 'name sport description')
    .populate('organizer', 'name avatar')
    .populate('players.user', 'name avatar');

  if (!match) {
    sendError(res, 'Match not found.', 404);
    return;
  }

  sendSuccess(res, { match }, 'Match details retrieved');
});

// ---- JOIN MATCH ----
export const joinMatch = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    sendError(res, 'Invalid match ID.', 400);
    return;
  }

  const match = await OpenMatch.findById(id);
  if (!match) {
    sendError(res, 'Match not found.', 404);
    return;
  }

  const userId = req.user!._id.toString();

  // Cannot join your own match (already organizer/approved player)
  if (match.organizer.toString() === userId) {
    sendError(res, 'You are the organizer of this match.', 400);
    return;
  }

  // Check if already in players array
  const alreadyIn = match.players.some((p: IMatchPlayer) => p.user.toString() === userId);
  if (alreadyIn) {
    sendError(res, 'You have already requested to join this match.', 409);
    return;
  }

  if (match.status !== 'open') {
    sendError(res, `Cannot join a match with status: ${match.status}.`, 400);
    return;
  }

  // Calculate spotsLeft
  const approvedCount = match.players.filter((p: IMatchPlayer) => p.status === 'approved').length;
  const spotsLeft = match.maxPlayers - approvedCount;

  if (spotsLeft <= 0) {
    sendError(res, 'This match is full.', 400);
    return;
  }

  match.players.push({
    user: req.user!._id,
    status: 'pending',
    joinedAt: new Date(),
  });

  await match.save();

  // Notify organizer
  createNotification(
    match.organizer,
    'booking_confirmed', // closest available type for join request
    'New Join Request',
    `${req.user!.name} has requested to join your match.`,
    { matchId: match._id.toString(), userId }
  ).catch(console.error);

  sendSuccess(res, { match }, 'Join request sent successfully.');
});

// ---- RESPOND TO JOIN REQUEST ----
export const respondToJoin = asyncHandler(async (req: Request, res: Response) => {
  const { id, userId } = req.params;
  const { status } = req.body as { status: 'approved' | 'rejected' };

  if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(userId)) {
    sendError(res, 'Invalid match or user ID.', 400);
    return;
  }

  if (!['approved', 'rejected'].includes(status)) {
    sendError(res, 'Status must be "approved" or "rejected".', 400);
    return;
  }

  const match = await OpenMatch.findById(id);
  if (!match) {
    sendError(res, 'Match not found.', 404);
    return;
  }

  // Only the organizer can respond
  if (match.organizer.toString() !== req.user!._id.toString()) {
    sendError(res, 'Only the organizer can respond to join requests.', 403);
    return;
  }

  const playerEntry = match.players.find((p: IMatchPlayer) => p.user.toString() === userId);
  if (!playerEntry) {
    sendError(res, 'Player not found in this match.', 404);
    return;
  }

  playerEntry.status = status;

  // If approving: check if match is now full
  if (status === 'approved') {
    const approvedCount = match.players.filter((p: IMatchPlayer) => p.status === 'approved').length;
    if (approvedCount >= match.maxPlayers) {
      match.status = 'full';
    }
  }

  await match.save();

  // Notify the player
  const actionText = status === 'approved' ? 'approved' : 'rejected';
  createNotification(
    userId,
    status === 'approved' ? 'booking_confirmed' : 'booking_cancelled',
    `Join Request ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}`,
    `Your request to join the match has been ${actionText}.`,
    { matchId: match._id.toString() }
  ).catch(console.error);

  sendSuccess(res, { match }, `Player ${actionText} successfully.`);
});

// ---- CANCEL OPEN MATCH ----
export const cancelOpenMatch = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    sendError(res, 'Invalid match ID.', 400);
    return;
  }

  const match = await OpenMatch.findById(id);
  if (!match) {
    sendError(res, 'Match not found.', 404);
    return;
  }

  const userId = req.user!._id.toString();
  const isOrganizer = match.organizer.toString() === userId;
  const isAdmin = req.user!.role === 'admin';

  if (!isOrganizer && !isAdmin) {
    sendError(res, 'Only the organizer or an admin can cancel this match.', 403);
    return;
  }

  if (['cancelled', 'completed'].includes(match.status)) {
    sendError(res, `Match is already ${match.status}.`, 400);
    return;
  }

  match.status = 'cancelled';
  await match.save();

  sendSuccess(res, { match }, 'Match cancelled successfully.');
});

// ---- GET TURF OPEN MATCHES ----
export const getTurfOpenMatches = asyncHandler(async (req: Request, res: Response) => {
  const { turfId } = req.params;
  const { date } = req.query as { date?: string };

  if (!mongoose.Types.ObjectId.isValid(turfId)) {
    sendError(res, 'Invalid turf ID.', 400);
    return;
  }

  const queryDate = date ? new Date(date) : new Date();
  queryDate.setUTCHours(0, 0, 0, 0);
  const nextDate = new Date(queryDate);
  nextDate.setUTCDate(nextDate.getUTCDate() + 1);

  const matches = await OpenMatch.find({
    turf: turfId,
    date: { $gte: queryDate, $lt: nextDate },
    status: { $in: ['open', 'full'] },
  })
    .populate('court', 'name sport')
    .populate('organizer', 'name avatar')
    .sort({ startTime: 1 })
    .lean({ virtuals: true });

  sendSuccess(res, { matches }, 'Turf open matches retrieved');
});
