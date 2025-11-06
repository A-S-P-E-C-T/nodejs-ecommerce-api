import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Cart } from "../models/cart.models.js";
import { Product } from "../models/product.models.js";

const addItemToCart = asyncHandler(async (req, res) => {
    const loggedInUser = req.user;

    if (!loggedInUser) {
        throw new ApiError(401, "User not logged in.");
    }

    const { productId, quantity } = req.body;

    if (!productId) {
        throw new ApiError(400, "Product ID is required.");
    }

    if (!quantity || quantity <= 0) {
        throw new ApiError(400, "Quantity must be greater than zero.");
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
        throw new ApiError(400, "Invalid product ID format.");
    }

    const product = await Product.findById(productId);

    if (!product) {
        throw new ApiError(404, "Product not found.");
    }

    let cart = await Cart.findOne({ user: loggedInUser._id });

    let newCart = {};
    if (!cart) {
        newCart = await Cart.create({
            user: loggedInUser._id,
            items: [
                {
                    "product.Id": product._id,
                    "product.name": product.item.label,
                    "product.color": product.item.color,
                    "product.size": product.item.size,
                    "product.brand": product.brand,
                    quantity,
                    price: product.price,
                },
            ],
        });

        if (!newCart) {
            throw new ApiError(500, "Failed to create cart. Please try again.");
        }

        return res
            .status(201)
            .json(new ApiResponse(201, newCart, "Item added to a new cart."));
    }

    const existingItem = cart.items.find(
        (item) => item.product.Id.toString() === productId
    );

    if (!existingItem) {
        cart.items.push({
            "product.Id": product._id,
            "product.name": product.item.label,
            "product.color": product.item.color,
            "product.size": product.item.size,
            "product.brand": product.brand,
            quantity,
            price: product.price,
        });
    } else {
        existingItem.quantity += Number(quantity);
    }

    await cart.save({ validateBeforeSave: true });

    return res
        .status(200)
        .json(
            new ApiResponse(200, cart, "Item added to your cart successfully.")
        );
});

const getUserCart = asyncHandler(async (req, res) => {
    const loggedInUser = req.user;

    if (!loggedInUser) {
        throw new ApiError(401, "User not logged in.");
    }

    const cart = await Cart.findOne({ user: loggedInUser._id }).select("-user");

    if (!cart) {
        throw new ApiError(404, "Your cart is empty.");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, cart, "Cart retrieved successfully."));
});

const updateItemQuantity = asyncHandler(async (req, res) => {
    const loggedInUser = req.user;

    if (!loggedInUser) {
        throw new ApiError(401, "User not logged in.");
    }

    const { productId, change = 0 } = req.body;

    if (!productId || change === undefined) {
        throw new ApiError(400, "Product ID and quantity change are required.");
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
        throw new ApiError(400, "Invalid product ID format.");
    }

    const cart = await Cart.findOne({ user: loggedInUser._id });

    if (!cart) {
        throw new ApiError(404, "Cart not found.");
    }

    const item = cart.items.find(
        (item) => item.product.Id.toString() === productId
    );

    if (!item) {
        throw new ApiError(404, "Item not found in the cart.");
    }

    item.quantity += Number(change);

    if (item.quantity <= 0) {
        cart.items = cart.items.filter((item) => item.quantity > 0);
    }

    // If no items are left, delete the cart
    if (cart.items.length === 0) {
        await Cart.findOneAndDelete({ user: loggedInUser._id });
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    {},
                    "Cart is now empty and has been deleted."
                )
            );
    }

    await cart.save({ validateBeforeSave: true });

    return res
        .status(200)
        .json(
            new ApiResponse(200, cart, "Item quantity updated successfully.")
        );
});

const removeItemFromCart = asyncHandler(async (req, res) => {
    const loggedInUser = req.user;

    if (!loggedInUser) {
        throw new ApiError(401, "User not logged in.");
    }

    const { productId } = req.params;

    if (!productId) {
        throw new ApiError(400, "Product ID is required.");
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
        throw new ApiError(400, "Invalid product ID format.");
    }

    const cart = await Cart.findOne({ user: loggedInUser._id }).select("-user");

    if (!cart) {
        throw new ApiError(404, "Cart not found.");
    }

    cart.items = cart.items.filter(
        (item) => item.product.Id.toString() !== productId
    );

    await cart.save({ validateBeforeSave: true });

    if (!cart.items.length) {
        await Cart.findOneAndDelete({ user: loggedInUser._id });
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                cart,
                "Item removed from your cart successfully."
            )
        );
});

const clearCart = asyncHandler(async (req, res) => {
    const loggedInUser = req.user;

    if (!loggedInUser) {
        throw new ApiError(401, "User not logged in.");
    }

    const cart = await Cart.findOneAndDelete({ user: loggedInUser._id });

    if (!cart) {
        throw new ApiError(404, "Cart not found or already empty.");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, cart, "Cart cleared successfully."));
});

export {
    addItemToCart,
    getUserCart,
    updateItemQuantity,
    removeItemFromCart,
    clearCart,
};
