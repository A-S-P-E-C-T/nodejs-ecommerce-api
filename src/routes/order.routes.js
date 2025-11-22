import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import {
    createOrder,
    getUserOrders,
    getSingleOrder,
    cancelOrder,
    updateOrderStatus,
    getAllOrder,
} from "../controllers/order.controller.js";

const orderRouter = Router();

orderRouter.route("/create-order").post(verifyJWT, createOrder);
orderRouter.route("/get-user-orders").get(verifyJWT, getUserOrders);
orderRouter.route("/get-single-order/:orderId").get(verifyJWT, getSingleOrder);
orderRouter.route("/cancel-order/:orderId").delete(verifyJWT, cancelOrder);
orderRouter
    .route("/update-order-status/:orderId")
    .patch(verifyJWT, updateOrderStatus);
orderRouter.route("/get-all-orders").get(verifyJWT, getAllOrder);

export { orderRouter };
