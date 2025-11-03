import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import {
    createOffer,
    deleteOffer,
    updateOffer,
    getActiveOffers,
} from "../controllers/offer.controllers.js";

const offerRouter = Router();

offerRouter.route("/create-offer").post(verifyJWT, createOffer);
offerRouter.route("/update-offer/:offerId").post(verifyJWT, updateOffer);
offerRouter.route("/delete-offer/:offerId").delete(verifyJWT, deleteOffer);
offerRouter.route("/get-active-offers").get(getActiveOffers);

export { offerRouter };
