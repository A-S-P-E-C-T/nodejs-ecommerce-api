import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { createOffer, updateOffer } from "../controllers/offer.controllers.js";

const offerRouter = Router();

offerRouter.route("/create-offer").post(verifyJWT, createOffer);
offerRouter.route("/update-offer/:offerId").post(verifyJWT, updateOffer);

export { offerRouter };
