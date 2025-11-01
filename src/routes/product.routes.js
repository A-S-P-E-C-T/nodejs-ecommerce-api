import { Router } from "express";
import {
    addProduct,
    getAllProducts,
    getSingleProduct,
    updateProduct,
    deleteProduct,
} from "../controllers/product.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const productRouter = Router();

productRouter
    .route("/add-product")
    .post(verifyJWT, upload.array("images", 3), addProduct);
productRouter.route("/get-products").get(getAllProducts);
productRouter.route("/get-single-product/:productId").get(getSingleProduct);
productRouter
    .route("/update-product-details/:productId")
    .patch(verifyJWT, updateProduct);
productRouter
    .route("/delete-product/:productId")
    .delete(verifyJWT, deleteProduct);

export { productRouter };
