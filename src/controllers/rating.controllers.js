import mongoose, { mongo } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Rating } from "../models/rating.models.js";
import { Product } from "../models/product.models.js";
import {
    uploadOnCloudinary,
    deleteFromCloudinary,
} from "../utils/cloudinary.js";
import { param } from "express-validator";

const addRating = asyncHandler(async (req, res) => {
    const loggedInUser = req.user;
    const { productId, ratedStars, reviewText } = req.body;

    if (!loggedInUser) {
        throw new ApiError(409, "User not logged in.");
    }

    if (!(productId && ratedStars && reviewText)) {
        throw new ApiError(400, "All fields are required.");
    }

    if (loggedInUser.role !== "customer") {
        throw new ApiError(409, "Permission denied.");
    }

    if (ratedStars < 1 || ratedStars > 5) {
        throw new ApiError(409, "Invalid rating.");
    }

    const existingRating = await Rating.findOne({
        product: productId,
        reviewedBy: loggedInUser._id,
    });

    if (existingRating) {
        throw new ApiError(409, "You have already rated this product.");
    }

    let reviewImages = [];

    if (req.files && req.files.length >= 1) {
        try {
            reviewImages = await Promise.all(
                req.files.map((file) =>
                    uploadOnCloudinary(file.path, "e-commerce", "images")
                )
            );
        } catch (error) {
            await Promise.all(
                reviewImages.map((file) =>
                    deleteFromCloudinary(file.public_id, "image")
                )
            );
            throw new ApiError(500, "Error uploading images.");
        }
    }

    if (!reviewImages || reviewImages.length === 0) {
        throw new ApiError(500, "No Product images uploaded.");
    }

    const formattedReviewImages = reviewImages.map((image) => ({
        imageUrl: image.url,
        imagePublicId: image.public_id,
    }));

    const newRating = await Rating.create({
        product: new mongoose.Types.ObjectId(productId),
        ratedStars: Number(ratedStars),
        reviewText: String(reviewText),
        reviewImages: formattedReviewImages,
        reviewedBy: loggedInUser._id,
    });

    if (!newRating) {
        throw new ApiError(500, "Error creating rating.");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, newRating, "Rating added successfully."));
});

const updateRating = asyncHandler(async (req, res) => {
    const loggedInUser = req.user;
    const { productId, ratedStars, reviewText } = req.body;

    if (!loggedInUser) {
        throw new ApiError(409, "User not logged in.");
    }

    if (!(productId && ratedStars && reviewText)) {
        throw new ApiError(400, "All fields are required.");
    }

    if (loggedInUser.role !== "customer") {
        throw new ApiError(409, "Permission denied.");
    }

    if (ratedStars < 1 || ratedStars > 5) {
        throw new ApiError(409, "Invalid rating.");
    }

    const rating = await Rating.findOneAndUpdate(
        { product: productId, reviewedBy: loggedInUser._id },
        {
            $set: {
                ratedStars: Number(ratedStars),
                reviewText: String(reviewText),
            },
        },
        { new: true, runValidators: true }
    );

    console.log(rating);

    if (!rating) {
        throw new ApiError(404, "Can not update rating.");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, rating, "Rating updated successfully."));
});

const deleteRating = asyncHandler(async (req, res) => {
    const loggedInUser = req.user;
    const { productId } = req.params;

    if (!loggedInUser) {
        throw new ApiError(409, "User not logged in.");
    }

    if (!productId) {
        throw new ApiError(400, "Product Id is required.");
    }

    const rating = await Rating.findOneAndDelete({
        product: new mongoose.Types.ObjectId(productId),
        reviewedBy: loggedInUser._id,
    });

    if (!rating) {
        throw new ApiError(
            404,
            "User has not rated this product, cannot delete."
        );
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Rating deleted successfully."));
});

const getProductRatings = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    if (!productId) {
        throw new ApiError(400, "Product Id is needed.");
    }

    const productRatings = await Rating.aggregate([
        {
            $match: {
                product: new mongoose.Types.ObjectId(productId),
            },
        },
        {
            $group: {
                _id: "$product",
                averageRating: { $avg: "$ratedStars" },
                totalRatings: { $sum: 1 },
                reviews: {
                    $push: {
                        ratedStars: "$ratedStars",
                        reviewText: "$reviewText",
                        reviewImages: "$reviewImages.imageUrl", // already an array; no need to wrap again
                        reviewedBy: "$reviewedBy",
                        createdAt: "$createdAt",
                    },
                },
            },
        },
        {
            $project: {
                _id: 0,
                product: "$_id",
                averageRating: { $round: ["$averageRating", 1] },
                totalRatings: 1,
                reviews: 1,
            },
        },
    ]);

    if (!productRatings || productRatings.length === 0) {
        throw new ApiError(404, "No ratings found for this product.");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                productRatings[0],
                "Rating and reviews fetched successfully."
            )
        );
});

export { addRating, updateRating, deleteRating, getProductRatings };
