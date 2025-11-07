import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Cart } from "../models/cart.models.js";
import { Order } from "../models/order.models.js";

const createOrder = asyncHandler(async (req, res) => {
    const loggedInUser = req.user;
    const { offers } = req.body;

    if (!loggedInUser) {
        throw new ApiError(401, "User not logged in.");
    }

    const cart = await Cart.findOne({ user: loggedInUser._id });

    if (!cart || cart.items.length === 0) {
        throw new ApiError(400, "No items in the cart.");
    }

    const newOrder = await Order.create({
        customer: loggedInUser._id,
        items: cart.items,
        offers,
        delhiveryAddress: loggedInUser.address,
    });

    if (!newOrder) {
        throw new ApiError(500, "Failed to create order. Please try again.");
    }

    // Clear the user's cart
    await Cart.findOneAndDelete({ user: loggedInUser._id });

    return res
        .status(201)
        .json(new ApiResponse(201, newOrder, "Order created successfully."));
});

const getUserOrders = asyncHandler(async (req, res) => {
    const loggedInUser = req.user;

    if (!loggedInUser) {
        throw new ApiError(401, "User not logged in.");
    }

    const userOrders = await Order.aggregate([
        { $match: { customer: loggedInUser._id } },
        {
            $project: {
                items: 1,
                delhiveryAddress: 1,
                orderStatus: 1,
                total: "$totalPayableAmount",
                paymentStatus: 1,
            },
        },
    ]);

    if (!userOrders || userOrders.length === 0) {
        throw new ApiError(404, "No orders found.");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                userOrders,
                "User orders fetched successfully."
            )
        );
});

const getSingleOrder = asyncHandler(async (req, res) => {
    const loggedInUser = req.user;
    const { orderId } = req.params;

    if (!loggedInUser) {
        throw new ApiError(401, "User not logged in.");
    }

    if (!orderId) {
        throw new ApiError(400, "Order ID is required.");
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
        throw new ApiError(400, "Invalid order ID.");
    }

    const order = await Order.findOne({
        _id: orderId,
        customer: loggedInUser._id,
    });

    if (!order) {
        throw new ApiError(404, "Order not found.");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, order, "Order fetched successfully."));
});

const cancelOrder = asyncHandler(async (req, res) => {
    const loggedInUser = req.user;
    const { orderId } = req.params;

    if (!loggedInUser) {
        throw new ApiError(401, "User not logged in.");
    }

    if (!orderId) {
        throw new ApiError(400, "Order ID is required.");
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
        throw new ApiError(400, "Invalid order ID.");
    }

    const order = await Order.findOne({
        _id: orderId,
        customer: loggedInUser._id,
    });

    if (!order) {
        throw new ApiError(404, "Order not found.");
    }

    if (
        order.orderStatus !== "confirmed" &&
        order.orderStatus !== "processing"
    ) {
        throw new ApiError(
            409,
            "Order is already shipped. Cannot cancel the order."
        );
    }

    await order.deleteOne();

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Order cancelled successfully."));
});

const updateOrderStatus = asyncHandler(async (req, res) => {
    const loggedInUser = req.user;
    const { orderId } = req.params;
    const { orderStatus } = req.body;

    if (!loggedInUser) {
        throw new ApiError(401, "User not logged in.");
    }

    if (loggedInUser.role === "customer") {
        throw new ApiError(403, "Permission denied.");
    }

    if (!orderId) {
        throw new ApiError(400, "Order ID is required.");
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
        throw new ApiError(400, "Invalid order ID.");
    }

    if (!orderStatus) {
        throw new ApiError(400, "Order status is required.");
    }

    const order = await Order.findByIdAndUpdate(
        orderId,
        { $set: { orderStatus } },
        { new: true, runValidators: true }
    );

    if (!order) {
        throw new ApiError(404, "Order not found.");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, order, "Order status updated successfully.")
        );
});

const getAllOrder = asyncHandler(async (req, res) => {
    const loggedInUser = req.user;
    const { customer, orderStatus, date } = req.query;

    if (!loggedInUser) {
        throw new ApiError(401, "User not logged in.");
    }

    if (loggedInUser.role !== "admin") {
        throw new ApiError(403, "Permission denied.");
    }

    if (!(customer || orderStatus || date)) {
        throw new ApiError(400, "At least one filter is required.");
    }

    const matchQuery = {};

    if (customer) {
        if (!mongoose.Types.ObjectId.isValid(customer)) {
            throw new ApiError(400, "Invalid customer ID.");
        }
        matchQuery.customer = customer;
    }
    if (orderStatus) matchQuery.orderStatus = String(orderStatus);
    if (date) matchQuery.date = Date(date);

    const orders = await Order.find(matchQuery);

    if (!orders || orders.length === 0) {
        throw new ApiError(404, "No orders found for the given filters.");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, orders, "Orders fetched successfully."));
});

export {
    createOrder,
    getUserOrders,
    getSingleOrder,
    cancelOrder,
    updateOrderStatus,
    getAllOrder,
};
