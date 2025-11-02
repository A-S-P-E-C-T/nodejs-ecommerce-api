import { request } from "express";
import mongoose, { Schema } from "mongoose";

const productSchema = new Schema(
    {
        item: {
            label: { type: String, required: true },
            color: String,
            size: String,
            material: String,
        },
        category: {
            type: String,
            required: true,
            index: true, // single-field index
        },
        brand: {
            type: String,
            index: true, // useful in filtering by brand often
        },
        seller: {
            type: mongoose.Types.ObjectId,
            ref: "User",
            required: true,
        },
        price: {
            type: Number,
            required: true,
            index: true, // good for price range queries
        },
        stock: {
            type: Number,
            required: true,
        },
        isAvailable: {
            type: Boolean,
            default: true, // available by default
            index: true, // useful for filtering
        },
        imagesUrl: [{ type: String, required: true }],
        imagesPublicId: [{ type: String, required: true }],
        warrantyMonths: {
            type: Number,
            default: 0,
        },
        lastMonthSale: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

// compound index for common filtering queries
productSchema.index({ category: 1, price: 1, isAvailable: 1 });

export const Product = mongoose.model("Product", productSchema);
