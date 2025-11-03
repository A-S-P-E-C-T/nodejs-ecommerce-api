import mongoose, { Schema } from "mongoose";

const offerSchema = new Schema(
    {
        statement: {
            type: String,
            required: true,
        },
        discountPercent: {
            type: Number,
            required: true,
            min: 0,
        },
        offerExpiry: {
            type: Date,
            required: true,
        },
        offeredBy: {
            label: {
                type: String,
                enum: ["seller", "brand"],
                default: "brand",
                required: true,
            },
            sellerId: {
                type: mongoose.Types.ObjectId,
                ref: "User",
            },
        },
    },
    { timestamps: true }
);

export const Offer = mongoose.model("Offer", offerSchema);
