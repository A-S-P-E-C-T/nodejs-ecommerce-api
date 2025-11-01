import mongoose, { mongo } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Product } from "../models/product.models.js";
import {
    uploadOnCloudinary,
    deleteFromCloudinary,
} from "../utils/cloudinary.js";

const addProduct = asyncHandler(async (req, res) => {
    const loggedInUser = req.user;

    if (!loggedInUser) {
        throw new ApiError(400, "No Admin/Seller logged in.");
    }

    if (loggedInUser.role !== "seller" && loggedInUser.role !== "admin") {
        throw new ApiError(400, "Unauthorized request.");
    }

    const {
        label,
        color,
        size,
        material,
        category,
        brand,
        price,
        stock,
        warrantyMonths,
    } = req.body;

    if (!req.files || req.files.length === 0) {
        throw new ApiError(400, "Please provide at least one product image.");
    }

    let images = [];

    try {
        images = await Promise.all(
            req.files.map((file) =>
                uploadOnCloudinary(file.path, "e-commerce", "images")
            )
        );
    } catch (error) {
        await Promise.all(
            images.map((file) => deleteFromCloudinary(file.public_id, "image"))
        );
    }

    if (!images || images.length === 0) {
        throw new ApiError(500, "No Product images uploaded.");
    }

    const imagesUrls = images.map((image) => image.url);
    const imagesPublicIds = images.map((image) => image.public_id);

    const newProduct = await Product.create({
        item: {
            label,
            color,
            size,
            material,
        },
        category,
        brand,
        seller: loggedInUser._id,
        price,
        stock,
        isAvailable: stock >= 1,
        imagesUrl: imagesUrls,
        imagesPublicId: imagesPublicIds,
        warrantyMonths: Number(warrantyMonths),
    });

    if (!newProduct) {
        await Promise.all(
            req.files.map((file) =>
                deleteFromCloudinary(file.public_id, "images")
            )
        );
        throw new ApiError(500, "Error creating product.");
    }

    return res
        .status(201)
        .json(
            new ApiResponse(201, newProduct, "Product created successfully!")
        );
});

const getAllProducts = asyncHandler(async (req, res) => {
    console.log(req.query);

    const { label, category, brand, seller, price, rating } = req.query;

    if (!(label || category || brand || seller || price || rating)) {
        throw new ApiError(
            400,
            "No information of products provided, can not fetch."
        );
    }

    const matchQuery = {};

    if (label) matchQuery["item.label"] = label;
    if (category) matchQuery.category = category;
    if (brand) matchQuery.brand = brand;
    if (seller) matchQuery.seller = seller;
    if (price) matchQuery.price = Number(price);
    if (rating) matchQuery.rating = Number(rating);

    console.log(matchQuery);

    const fetchedProducts = await Product.aggregate([
        {
            $match: matchQuery,
        },
        {
            $project: {
                stock: 0,
                imagesPublicId: 0,
            },
        },
    ]);

    console.log(matchQuery);
    console.log(fetchedProducts);

    if (!fetchedProducts || fetchedProducts.length === 0) {
        throw new ApiError(404, "No products found for the given filters");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                fetchedProducts,
                "Products fetched successfully."
            )
        );
});

const getSingleProduct = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    if (!productId) {
        throw new ApiError(400, "Product id is required.");
    }

    const product = await Product.findById(productId).select(
        "-stock -imagesPublicId"
    );

    if (!product) {
        throw new ApiError(404, "Product not found.");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, product, "Product fetched successfully."));
});

const updateProduct = asyncHandler(async (req, res) => {
    const loggedInUser = req.user;

    if (!loggedInUser) {
        throw new ApiError("No logged in user.");
    }

    const { productId } = req.params;

    if (!productId) {
        throw new ApiError(400, "Product Id is needed.");
    }

    if (loggedInUser.role !== "seller") {
        throw new ApiError(409, "Unauthorized request.");
    }

    const { price, stock, isAvailable } = req.body;
    if (!(price || stock || isAvailable)) {
        throw new ApiError(400, "Please provide a field to update.");
    }

    const updateFields = {};
    if (price !== undefined) updateFields.price = price;
    if (stock !== undefined) updateFields.stock = stock;
    if (isAvailable !== undefined) updateFields.isAvailable = isAvailable;

    let product = {};
    if (loggedInUser.role === "seller") {
        product = await Product.findOneAndUpdate(
            {
                _id: new mongoose.Types.ObjectId(productId),
                seller: new mongoose.Types.ObjectId(loggedInUser._id),
            },
            { $set: updateFields },
            { new: true }
        );
    }

    product = await Product.findOneAndUpdate(
        {
            _id: new mongoose.Types.ObjectId(productId),
        },
        { $set: updateFields },
        { new: true }
    );

    if (!product) {
        throw new ApiError(404, "Product not found.");
    }
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                product,
                "Product details updated successfully."
            )
        );
});

const deleteProduct = asyncHandler(async (req, res) => {
    const loggedInUser = req.user;

    if (!loggedInUser) {
        throw new ApiError("No logged in user.");
    }

    const { productId } = req.params;

    if (!productId) {
        throw new ApiError(400, "Product Id is needed.");
    }

    if (loggedInUser.role === "customer") {
        throw new ApiError(409, "Unauthorized request.");
    }

    if (loggedInUser.role === "seller") {
        await Product.findOneAndDelete({
            _id: new mongoose.Types.ObjectId(productId),
            seller: new mongoose.Types.ObjectId(loggedInUser._id),
        });
    }

    await Product.findOneAndDelete({
        _id: new mongoose.Types.ObjectId(productId),
    });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Product deleted Successfully."));
});

export {
    addProduct,
    getAllProducts,
    getSingleProduct,
    updateProduct,
    deleteProduct,
};
