import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Offer } from "../models/offer.models.js";

const createOffer = asyncHandler(async (req, res) => {
    const loggedInUser = req.user;

    if (!loggedInUser) {
        throw new ApiError(401, "User not logged in.");
    }

    if (loggedInUser.role === "customer") {
        throw new ApiError(403, "Permission denied.");
    }

    const { statement, discountPercent, offerExpiry } = req.body;

    if (!(statement && discountPercent)) {
        throw new ApiError(400, "All required fields must be provided.");
    }

    if (!offerExpiry || isNaN(new Date(offerExpiry))) {
        throw new ApiError(400, "Invalid or missing offer expiry date.");
    }
    if (new Date(offerExpiry) <= new Date()) {
        throw new ApiError(400, "Offer expiry must be a future date.");
    }

    const existingOffer = await Offer.findOne({
        statement,
        offerExpiry: { $gt: Date.now() },
    });
    if (existingOffer)
        throw new ApiError(
            409,
            "An active offer with the same statement already exists."
        );

    const newOffer = await Offer.create({
        statement: String(statement),
        discountPercent: Number(discountPercent),
        offerExpiry: new Date(String(offerExpiry)),
        "offeredBy.label": String(loggedInUser.role),
        "offeredBy.id": loggedInUser._id,
    });

    const createdOffer = await Offer.findById(newOffer._id);

    if (!createdOffer) {
        throw new ApiError(500, "Failed to create offer.");
    }

    return res
        .status(201)
        .json(
            new ApiResponse(201, createdOffer, "Offer created successfully.")
        );
});

const updateOffer = asyncHandler(async (req, res) => {
    const loggedInUser = req.user;

    if (!loggedInUser) {
        throw new ApiError(401, "User not logged in.");
    }

    if (loggedInUser.role === "customer") {
        throw new ApiError(403, "Permission denied.");
    }

    const { offerId } = req.params;

    if (!offerId) {
        throw new ApiError(400, "Offer ID is required.");
    }

    if (!mongoose.Types.ObjectId.isValid(offerId)) {
        throw new ApiError(400, "Invalid offer ID.");
    }

    const { statement, discountPercent, offerExpiry } = req.body;

    if (!(statement && discountPercent)) {
        throw new ApiError(400, "All required fields must be provided.");
    }

    if (!offerExpiry || isNaN(new Date(offerExpiry))) {
        throw new ApiError(400, "Invalid or missing offer expiry date.");
    }
    if (new Date(offerExpiry) <= new Date()) {
        throw new ApiError(400, "Offer expiry must be a future date.");
    }

    const offer = await Offer.findByIdAndUpdate(
        offerId,
        {
            statement: String(statement),
            discountPercent: Number(discountPercent),
            offerExpiry: new Date(String(offerExpiry)),
        },
        { new: true }
    );

    if (!offer) {
        throw new ApiError(404, "Offer not found.");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, offer, "Offer updated successfully."));
});

const deleteOffer = asyncHandler(async (req, res) => {
    const loggedInUser = req.user;

    if (!loggedInUser) {
        throw new ApiError(401, "User not logged in.");
    }

    if (loggedInUser.role === "customer") {
        throw new ApiError(403, "Permission denied.");
    }

    const { offerId } = req.params;

    if (!offerId) {
        throw new ApiError(400, "Offer ID is required.");
    }

    if (!mongoose.Types.ObjectId.isValid(offerId)) {
        throw new ApiError(400, "Invalid offer ID.");
    }

    const offer = await Offer.findByIdAndDelete(offerId);

    if (!offer) {
        throw new ApiError(404, "Offer not found.");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Offer deleted successfully."));
});

const getActiveOffers = asyncHandler(async (req, res) => {
    const activeOffers = await Offer.find({
        offerExpiry: { $gt: Date.now() },
    });

    const message =
        !activeOffers || activeOffers.length === 0
            ? "No active offers available."
            : "Active offers fetched successfully.";

    return res.status(200).json(new ApiResponse(200, activeOffers, message));
});

export { createOffer, updateOffer, deleteOffer, getActiveOffers };
