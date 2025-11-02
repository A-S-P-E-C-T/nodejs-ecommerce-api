import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import {
    addRating,
    updateRating,
    deleteRating,
} from "../controllers/rating.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";

const ratingRouter = Router();

ratingRouter.route("/add-rating").post(verifyJWT, upload.any(), addRating);
ratingRouter.route("/update-rating").patch(verifyJWT, updateRating);
ratingRouter.route("/delete-rating/:productId").delete(verifyJWT, deleteRating);

export { ratingRouter };
