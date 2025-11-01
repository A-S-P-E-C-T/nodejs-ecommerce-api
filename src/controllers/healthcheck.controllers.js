import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const healthcheck = asyncHandler(async (req, res) => {
    const dbStatus = mongoose.connection.readyState;
    const isdDbConnected = dbStatus === 1;

    if (!isdDbConnected) {
        throw new ApiError(
            503,
            "Service Unavailable: Database connection is not healthy."
        );
    }

    const healthStatus = {
        status: "OK",
        message: "Service is running and database is connected.",
    };

    return res
        .status(200)
        .json(new ApiResponse(200, healthStatus, "Health check successful."));
});

export { healthcheck };
