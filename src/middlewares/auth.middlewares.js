import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";

const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const token =
            req.cookies?.accessToken ||
            req.header("Authorization")?.replace("Bearer", "");

        if (!token) {
            throw new ApiError(400, "Access token is required.");
        }

        const veriiedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(veriiedToken._id).select(
            "-password -refreshToken"
        );

        if (!user) {
            throw new ApiError("Unauthorized request.");
        }

        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token.");
    }
});

export { verifyJWT };
