import { Router } from "express";
import {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    forgotPasswordRequest,
    resendEmailVerificationRequest,
    verifyEmail,
    resetForgotPassword,
    updateUserAccountDetails,
    updateUserAvatar,
    updateUserAddress,
    deleteUserAccountRequest,
    deleteUser,
    getCurrentUser,
} from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const userRouter = Router();

// public routes
userRouter.route("/register").post(
    upload.fields([
        { name: "avatar", maxCount: 1 },
        { name: "coverImage", maxCount: 1 },
    ]),
    registerUser
);
userRouter.route("/login").post(loginUser);
userRouter.route("/forgot-password-request").post(forgotPasswordRequest);
userRouter.route("/verify-email/:incomingUnhashedToken").post(verifyEmail);
userRouter
    .route("/forgot-password-reset/:incomingUnhashedToken")
    .post(resetForgotPassword);
userRouter.route("/delete-user/:incomingUnhashedToken").delete(deleteUser);

// secure routes
userRouter.route("/logout").post(verifyJWT, logoutUser);
userRouter.route("/refreshAccessToken").post(refreshAccessToken);
userRouter.route("/password-change").patch(verifyJWT, changeCurrentPassword);
userRouter.route("/get-current-user").get(verifyJWT, getCurrentUser);
userRouter
    .route("/update-account-details")
    .patch(verifyJWT, updateUserAccountDetails);
userRouter
    .route("/update-user-avatar")
    .patch(
        verifyJWT,
        upload.fields([{ name: "avatar", maxCount: 1 }]),
        updateUserAvatar
    );
userRouter
    .route("/resend-email-verification-request")
    .post(verifyJWT, resendEmailVerificationRequest);
userRouter.route("/update-user-address").patch(verifyJWT, updateUserAddress);
userRouter
    .route("/delete-user-request")
    .post(verifyJWT, deleteUserAccountRequest);

export { userRouter };
