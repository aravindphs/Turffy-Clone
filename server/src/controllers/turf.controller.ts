import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Turf from '../models/Turf.model';
import Court from '../models/Court.model';
import Booking from '../models/Booking.model';
import BlockedSlot from '../models/BlockedSlot.model';
import asyncHandler from '../utils/asyncHandler';
import { sendSuccess, sendError, sendPaginated } from '../utils/response.utils';
import {
  createTurfSchema,
  updateTurfSchema,
  updatePricingSchema,
  updateOperatingHoursSchema,
} from '../validators/turf.validator';
import { generateSlots, calculateSlotPrice, isSlotAvailable } from '../utils/slot.utils';
import { cloudinary } from '../middleware/upload';

// ---- CREATE TURF ----
export const createTurf = asyncHandler(async (req: Request, res: Response) => {
  const body = createTurfSchema.parse(req.body);

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const turf = await Turf.create(
      [
        {
          owner: req.user!._id,
          name: body.name,
          description: body.description,
          address: body.address,
          city: body.city,
          state: body.state,
          pincode: body.pincode,
          location: {
            type: 'Point',
            coordinates: [body.longitude, body.latitude],
          },
          amenities: body.amenities,
          sports: body.sports,
          operatingHours: body.operatingHours,
          slotInterval: body.slotInterval,
          basePrice: body.basePrice,
          peakHours: body.peakHours,
        },
      ],
      { session }
    );

    const courts = await Court.create(
      body.courts.map((c) => ({
        turf: turf[0]._id,
        name: c.name,
        sport: c.sport,
        description: c.description,
      })),
      { session }
    );

    await session.commitTransaction();

    sendSuccess(
      res,
      { turf: turf[0].toJSON(), courts },
      'Turf created successfully. Pending admin verification.',
      201
    );
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
});

// ---- UPDATE TURF ----
export const updateTurf = asyncHandler(async (req: Request, res: Response) => {
  const body = updateTurfSchema.parse(req.body);
  const { turfId } = req.params;

  const turf = await Turf.findOne({ _id: turfId, owner: req.user!._id });
  if (!turf) {
    sendError(res, 'Turf not found or you do not own this turf.', 404);
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (body.name) updateData.name = body.name;
  if (body.description) updateData.description = body.description;
  if (body.address) updateData.address = body.address;
  if (body.city) updateData.city = body.city;
  if (body.state) updateData.state = body.state;
  if (body.pincode) updateData.pincode = body.pincode;
  if (body.latitude !== undefined && body.longitude !== undefined) {
    updateData.location = {
      type: 'Point',
      coordinates: [body.longitude, body.latitude],
    };
  }
  if (body.amenities) updateData.amenities = body.amenities;
  if (body.sports) updateData.sports = body.sports;
  if (body.operatingHours) updateData.operatingHours = body.operatingHours;
  if (body.slotInterval !== undefined) updateData.slotInterval = body.slotInterval;
  if (body.basePrice !== undefined) updateData.basePrice = body.basePrice;
  if (body.peakHours) updateData.peakHours = body.peakHours;

  const updatedTurf = await Turf.findByIdAndUpdate(
    turfId,
    { $set: updateData },
    { new: true, runValidators: true }
  ).lean();

  sendSuccess(res, { turf: updatedTurf }, 'Turf updated successfully');
});

// ---- SOFT DELETE TURF ----
export const deleteTurf = asyncHandler(async (req: Request, res: Response) => {
  const { turfId } = req.params;

  const turf = await Turf.findOne({ _id: turfId, owner: req.user!._id });
  if (!turf) {
    sendError(res, 'Turf not found or you do not own this turf.', 404);
    return;
  }

  await Turf.findByIdAndUpdate(turfId, { isActive: false });
  await Court.updateMany({ turf: turfId }, { isActive: false });

  sendSuccess(res, null, 'Turf deactivated successfully');
});

// ---- GET MY TURF (owner) ----
export const getMyTurf = asyncHandler(async (req: Request, res: Response) => {
  const turf = await Turf.findOne({ owner: req.user!._id, isActive: true })
    .populate('courts')
    .lean();

  if (!turf) {
    sendError(res, 'You have not created a turf yet.', 404);
    return;
  }

  sendSuccess(res, { turf }, 'Turf retrieved');
});

// ---- GET TURFS (public, with filters + proximity sort) ----
export const getTurfs = asyncHandler(async (req: Request, res: Response) => {
  const {
    city,
    sport,
    date,
    lat,
    lng,
    page = '1',
    limit = '10',
    minPrice,
    maxPrice,
    amenities,
    sort = 'rating',
  } = req.query as Record<string, string>;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  // Build match stage
  const match: Record<string, unknown> = {
    isActive: true,
    isVerified: true,
  };

  if (city) match.city = { $regex: new RegExp(city, 'i') };
  if (sport) match.sports = { $in: [new RegExp(sport, 'i')] };
  if (minPrice || maxPrice) {
    const priceFilter: Record<string, number> = {};
    if (minPrice) priceFilter.$gte = parseFloat(minPrice);
    if (maxPrice) priceFilter.$lte = parseFloat(maxPrice);
    match.basePrice = priceFilter;
  }
  if (amenities) {
    const amenityList = amenities.split(',').map((a) => a.trim());
    match.amenities = { $all: amenityList };
  }

  let pipeline: mongoose.PipelineStage[] = [];

  // Geo proximity sort
  if (lat && lng) {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    pipeline.push({
      $geoNear: {
        near: { type: 'Point', coordinates: [longitude, latitude] },
        distanceField: 'distance',
        spherical: true,
        query: match,
        distanceMultiplier: 0.001, // metres to km
      },
    });
  } else {
    pipeline.push({ $match: match });
  }

  // Add sort stage if not geo
  if (!lat || !lng) {
    const sortMap: Record<string, Record<string, 1 | -1>> = {
      rating: { rating: -1 },
      price_asc: { basePrice: 1 },
      price_desc: { basePrice: -1 },
      newest: { createdAt: -1 },
    };
    pipeline.push({ $sort: sortMap[sort] ?? { rating: -1 } });
  }

  // Count total before pagination
  const countPipeline: mongoose.PipelineStage[] = [...pipeline, { $count: 'total' }];
  pipeline.push({ $skip: skip }, { $limit: limitNum });

  // Add courts virtual via lookup
  pipeline.push({
    $lookup: {
      from: 'courts',
      localField: '_id',
      foreignField: 'turf',
      as: 'courts',
      pipeline: [{ $match: { isActive: true } }],
    },
  });

  // Optionally filter by date availability (exclude fully booked turfs) - simplified
  const [turfs, countResult] = await Promise.all([
    Turf.aggregate(pipeline),
    Turf.aggregate(countPipeline),
  ]);

  const total = countResult[0]?.total || 0;

  sendPaginated(res, turfs, total, pageNum, limitNum, 'Turfs retrieved');
});

// ---- GET SINGLE TURF (public) ----
export const getTurf = asyncHandler(async (req: Request, res: Response) => {
  const { slugOrId } = req.params;

  const isObjectId = mongoose.isValidObjectId(slugOrId);
  const query = isObjectId ? { _id: slugOrId } : { slug: slugOrId };

  const turf = await Turf.findOne({ ...query, isActive: true })
    .populate({
      path: 'courts',
      match: { isActive: true },
    })
    .populate('owner', 'name avatar')
    .lean();

  if (!turf) {
    sendError(res, 'Turf not found.', 404);
    return;
  }

  sendSuccess(res, { turf }, 'Turf retrieved');
});

// ---- GET TURF AVAILABILITY ----
export const getTurfAvailability = asyncHandler(async (req: Request, res: Response) => {
  const { turfId, courtId } = req.params;
  const { date } = req.query as { date: string };

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    sendError(res, 'Date is required in YYYY-MM-DD format.', 400);
    return;
  }

  const turf = await Turf.findOne({ _id: turfId, isActive: true }).lean();
  if (!turf) {
    sendError(res, 'Turf not found.', 404);
    return;
  }

  const court = await Court.findOne({ _id: courtId, turf: turfId, isActive: true }).lean();
  if (!court) {
    sendError(res, 'Court not found.', 404);
    return;
  }

  const queryDate = new Date(date);
  queryDate.setUTCHours(0, 0, 0, 0);
  const nextDate = new Date(queryDate);
  nextDate.setUTCDate(nextDate.getUTCDate() + 1);

  // Fetch bookings and blocked slots in parallel
  const [bookings, blockedSlots] = await Promise.all([
    Booking.find({
      court: courtId,
      date: { $gte: queryDate, $lt: nextDate },
      status: { $in: ['pending', 'confirmed'] },
    })
      .lean()
      .select('startTime endTime status'),
    BlockedSlot.find({
      court: courtId,
      date: { $gte: queryDate, $lt: nextDate },
    })
      .lean()
      .select('startTime endTime reason _id'),
  ]);

  // Generate all slots for the day
  const allSlots = generateSlots(
    turf.operatingHours.open,
    turf.operatingHours.close,
    turf.slotInterval
  );

  // Annotate each slot with status + price
  const annotatedSlots = allSlots.map((slot) => {
    const isBooked = !isSlotAvailable(
      bookings.map((b) => ({ startTime: b.startTime, endTime: b.endTime })),
      slot.startTime,
      slot.endTime
    );

    const blockedBy = blockedSlots.find(
      (b) => b.startTime === slot.startTime && b.endTime === slot.endTime
    );

    let status: 'available' | 'booked' | 'blocked' = 'available';
    if (isBooked) status = 'booked';
    else if (blockedBy) status = 'blocked';

    const price = calculateSlotPrice(
      slot.startTime,
      slot.endTime,
      turf.basePrice,
      turf.peakHours
    );

    return {
      ...slot,
      status,
      price,
      blockedSlotId: blockedBy?._id?.toString() || null,
      blockReason: blockedBy?.reason || null,
    };
  });

  sendSuccess(
    res,
    {
      turfId,
      courtId,
      date,
      operatingHours: turf.operatingHours,
      slotInterval: turf.slotInterval,
      slots: annotatedSlots,
    },
    'Availability retrieved'
  );
});

// ---- UPLOAD TURF IMAGES ----
export const uploadTurfImages = asyncHandler(async (req: Request, res: Response) => {
  const { turfId } = req.params;

  const turf = await Turf.findOne({ _id: turfId, owner: req.user!._id });
  if (!turf) {
    sendError(res, 'Turf not found or you do not own this turf.', 404);
    return;
  }

  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    sendError(res, 'No images uploaded.', 400);
    return;
  }

  const remainingSlots = 8 - turf.images.length;
  if (req.files.length > remainingSlots) {
    sendError(res, `You can only add ${remainingSlots} more image(s). Max is 8.`, 400);
    return;
  }

  const newImages = (req.files as (Express.Multer.File & { path: string; filename: string })[]).map(
    (file) => ({
      url: file.path,
      publicId: file.filename,
    })
  );

  turf.images.push(...newImages);
  await turf.save();

  sendSuccess(res, { images: turf.images }, 'Images uploaded successfully');
});

// ---- DELETE TURF IMAGE ----
export const deleteTurfImage = asyncHandler(async (req: Request, res: Response) => {
  const { turfId } = req.params;
  const { publicId } = req.body;

  if (!publicId) {
    sendError(res, 'publicId is required.', 400);
    return;
  }

  const turf = await Turf.findOne({ _id: turfId, owner: req.user!._id });
  if (!turf) {
    sendError(res, 'Turf not found or you do not own this turf.', 404);
    return;
  }

  const imageIndex = turf.images.findIndex((img) => img.publicId === publicId);
  if (imageIndex === -1) {
    sendError(res, 'Image not found.', 404);
    return;
  }

  // Delete from Cloudinary
  await cloudinary.uploader.destroy(publicId);

  turf.images.splice(imageIndex, 1);
  await turf.save();

  sendSuccess(res, { images: turf.images }, 'Image deleted successfully');
});

// ---- UPDATE AMENITIES ----
export const updateAmenities = asyncHandler(async (req: Request, res: Response) => {
  const { turfId } = req.params;
  const { amenities } = req.body as { amenities: string[] };

  if (!Array.isArray(amenities)) {
    sendError(res, 'amenities must be an array.', 400);
    return;
  }

  const turf = await Turf.findOneAndUpdate(
    { _id: turfId, owner: req.user!._id },
    { $set: { amenities } },
    { new: true }
  ).lean();

  if (!turf) {
    sendError(res, 'Turf not found or you do not own this turf.', 404);
    return;
  }

  sendSuccess(res, { amenities: turf.amenities }, 'Amenities updated');
});

// ---- UPDATE OPERATING HOURS ----
export const updateOperatingHours = asyncHandler(async (req: Request, res: Response) => {
  const { turfId } = req.params;
  const body = updateOperatingHoursSchema.parse(req.body);

  const turf = await Turf.findOneAndUpdate(
    { _id: turfId, owner: req.user!._id },
    { $set: { operatingHours: { open: body.open, close: body.close } } },
    { new: true }
  ).lean();

  if (!turf) {
    sendError(res, 'Turf not found or you do not own this turf.', 404);
    return;
  }

  sendSuccess(res, { operatingHours: turf.operatingHours }, 'Operating hours updated');
});

// ---- UPDATE PRICING ----
export const updatePricing = asyncHandler(async (req: Request, res: Response) => {
  const { turfId } = req.params;
  const body = updatePricingSchema.parse(req.body);

  const updateFields: Record<string, unknown> = {};
  if (body.basePrice !== undefined) updateFields.basePrice = body.basePrice;
  if (body.peakHours !== undefined) updateFields.peakHours = body.peakHours;

  const turf = await Turf.findOneAndUpdate(
    { _id: turfId, owner: req.user!._id },
    { $set: updateFields },
    { new: true }
  ).lean();

  if (!turf) {
    sendError(res, 'Turf not found or you do not own this turf.', 404);
    return;
  }

  sendSuccess(
    res,
    { basePrice: turf.basePrice, peakHours: turf.peakHours },
    'Pricing updated successfully'
  );
});
