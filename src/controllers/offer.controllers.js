import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Offer } from "../models/offer.models.js";

const createOffer = asyncHandler(async (req, res) => {
    const loggedInUser = req.user;

    if (!loggedInUser) {
        throw new ApiError(400, "User not logged in.");
    }

    if (loggedInUser.role === "customer") {
        throw new ApiError(409, "Permission denied.");
    }

    const { statement, discountPercent, offerExpiry } = req.body;

    if (!(statement && discountPercent)) {
        throw new ApiError(400, "All fields are required.");
    }

    const newOffer = await Offer.create({
        statement: String(statement),
        discountPercent: Number(discountPercent),
        offerExpiry: new Date(String(offerExpiry)),
        "offeredBy.label": String(loggedInUser.role),
    });

    const cretedOffer = await Offer.findById(newOffer._id);

    if (!cretedOffer) {
        throw new ApiError(500, "Error creating offer.");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, cretedOffer, "Offer created successfully."));
});

const updateOffer = asyncHandler(async (req, res) => {
    const loggedInUser = req.user;

    if (!loggedInUser) {
        throw new ApiError(400, "User not logged in.");
    }

    if (loggedInUser.role === "customer") {
        throw new ApiError(409, "Permission denied.");
    }
    const { offerId } = req.params;
    if (!offerId) {
        throw new ApiError(400, "Offer Id is required.");
    }
    const { statement, discountPercent, offerExpiry } = req.body;

    if (!(statement && discountPercent)) {
        throw new ApiError(400, "All fields are required.");
    }

    const offer = await Offer.findByIdAndUpdate(
        new mongoose.Types.ObjectId(offerId),
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

export { createOffer, updateOffer };
