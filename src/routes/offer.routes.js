import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { createOffer } from "../controllers/offer.controllers.js";

const offerRouter = Router();

offerRouter.route("/create-offer").post(verifyJWT, createOffer);

export { offerRouter };
