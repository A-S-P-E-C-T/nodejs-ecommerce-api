import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Cart } from "../models/cart.models.js";

const addItemToCart = asyncHandler(async (req, res) => {
    const loggedInUser = req.user;

    if (!loggedInUser) {
        throw new ApiError(400, "No user logged in.");
    }

    console.log(req.body);

    const { productId, quantity, price } = req.body;

    if (!productId) {
        throw new ApiError(400, "Product id is needed.");
    }

    if (!quantity || quantity <= 0) {
        throw new ApiError(400, "Quantity must be greater than zero.");
    }

    if (!price || price < 0) {
        throw new ApiError(400, "Price must be a positive number.");
    }

    let cart = await Cart.findOne({
        user: new mongoose.Types.ObjectId(loggedInUser._id),
    });

    let newCart = {};
    if (!cart) {
        newCart = await Cart.create({
            user: loggedInUser._id,
            items: [
                {
                    productId,
                    quantity,
                    price,
                },
            ],
        });

        if (!newCart) {
            throw new ApiError(502, "Cart creation failed, cannot add item.");
        }

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    newCart,
                    "Item added to your newly created cart."
                )
            );
    }

    const existingItem = cart.items.find(
        (item) => item.productId.toString() === productId
    );

    if (!existingItem) {
        cart.items.push({
            productId,
            quantity,
            price,
        });
    } else {
        existingItem.quantity += Number(quantity);
    }

    await cart.save({ validateBeforeSave: true });

    return res
        .status(200)
        .json(new ApiResponse(200, cart, "Item added to your cart."));
});

const getUserCart = asyncHandler(async (req, res) => {
    const loggedInUser = req.user;

    if (!loggedInUser) {
        throw new ApiError(409, "No logged in user found.");
    }

    const cart = await Cart.findOne({
        user: new mongoose.Types.ObjectId(loggedInUser._id),
    }).select("-user");

    if (!cart) {
        throw new ApiError(404, "Cart not found.");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, cart, "User cart fetched successfully."));
});

const updateItemQuantity = asyncHandler(async (req, res) => {
    const loggedInUser = req.user;

    if (!loggedInUser) {
        throw new ApiError(409, "No logged in user found.");
    }

    const { productId, change = 0 } = req.body;

    if (!productId || change === undefined) {
        throw new ApiError("Please provide required fields.");
    }

    const cart = await Cart.findOne({
        user: new mongoose.Types.ObjectId(loggedInUser._id),
    });

    const item = cart.items.find(
        (item) => item.productId.toString() === productId
    );

    if (!item) {
        throw new ApiError("Item not found in the cart.");
    }

    item.quantity += Number(change);

    if (item.quantity <= 0) {
        cart.items = cart.items.filter((item) => item.quantity > 0);
    }

    await cart.save({ validateBeforeSave: true });

    if (!cart.items.length) {
        await Cart.findOneAndDelete({ user: loggedInUser._id });
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, cart, "Item quantity changed successfully.")
        );
});

const removeItemFromCart = asyncHandler(async (req, res) => {
    const loggedInUser = req.user;

    if (!loggedInUser) {
        throw new ApiError(409, "No logged in user found.");
    }

    const { productId } = req.params;

    if (!productId) {
        throw new ApiError("Product Id is required.");
    }

    const cart = await Cart.findOne({ user: loggedInUser._id }).select("-user");

    if (!cart) {
        throw new ApiError(404, "Cart not found.");
    }

    cart.items = cart.items.filter(
        (item) => item.productId === new mongoose.Types.ObjectId(productId)
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
                "Item removed successfully from the cart."
            )
        );
});

const clearCart = asyncHandler(async (req, res) => {
    const loggedInUser = req.user;

    if (!loggedInUser) {
        throw new ApiError(409, "No logged in user found.");
    }

    const cart = await Cart.findOneAndDelete({ user: loggedInUser._id });

    if (!cart) {
        throw new ApiError(404, "Cart not found.");
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
