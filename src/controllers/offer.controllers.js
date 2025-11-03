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

    const { statement, discountPercent, offeredBy } = req.body;

    if (!(statement && discountPercent)) {
        throw new ApiError(400, "All fields are required.");
    }

    const newOffer = await Offer.create({
        statement: String(statement),
        discountPercent: Number(discountPercent),
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

export { createOffer };
