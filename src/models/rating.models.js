import mongoose, { Schema } from "mongoose";

const ratingSchema = new Schema(
    {
        product: {
            type: mongoose.Types.ObjectId,
            ref: "Product",
            required: true,
            maxlength: 500,
        },
        ratedStars: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
            index: true,
        },
        reviewText: {
            type: String,
            required: true,
        },
        reviewImages: [
            {
                imageUrl: String,
                imagePublicId: String,
            },
        ],
        reviewedBy: {
            type: mongoose.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

ratingSchema.index({ product: 1, reviewedBy: 1 }, { unique: true }); //each user to review a product only once

export const Rating = mongoose.model("Rating", ratingSchema);
