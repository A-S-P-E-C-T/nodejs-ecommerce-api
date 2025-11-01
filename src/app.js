import express, { urlencoded } from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import path from "path";
import { globalErrorHandler } from "./middlewares/globalErrorHandler.middlewares.js";

const app = express();

import cors from "cors";
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// Middleware to serve static files (like images, CSS) from the "public" directory.
app.use(express.static(path.join(process.cwd(), "public")));

app.use(cookieParser()); // Now you can access req.cookies

// HTTP request logger (Morgan)
if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev")); // Pretty, color-coded logs
}

import { healthcheckRouter } from "./routes/healthcheck.routes.js";
import { userRouter } from "./routes/user.routes.js";
import { productRouter } from "./routes/product.routes.js";
import { cartRouter } from "./routes/cart.routes.js";
import { orderRouter } from "./routes/order.routes.js";
import { ratingRouter } from "./routes/rating.routes.js";

app.use("/api/v1/healthcheck", healthcheckRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/carts", cartRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/ratings", ratingRouter);

app.use(globalErrorHandler); //Must be at last

export { app };
