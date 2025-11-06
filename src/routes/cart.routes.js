import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import {
    addItemToCart,
    getUserCart,
    updateItemQuantity,
    removeItemFromCart,
    clearCart,
} from "../controllers/cart.controllers.js";
const cartRouter = Router();

cartRouter.route("/add-product-to-cart").post(verifyJWT, addItemToCart);
cartRouter.route("/get-cart").get(verifyJWT, getUserCart);
cartRouter.route("/updateItemQunatity").patch(verifyJWT, updateItemQuantity);
cartRouter
    .route("/removeItemFromCart/:productId")
    .delete(verifyJWT, removeItemFromCart);
cartRouter.route("/clearCart").delete(verifyJWT, clearCart);
export { cartRouter };
