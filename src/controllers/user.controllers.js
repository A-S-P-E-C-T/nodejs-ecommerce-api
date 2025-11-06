import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";
import {
    uploadOnCloudinary,
    deleteFromCloudinary,
} from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import {
    sendEmail,
    emailVerificationMailgenContent,
    forgotPasswordMailgenContent,
    deleteUserMailgenContent,
} from "../utils/mail.js";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { Rating } from "../models/rating.models.js";
import ms from "ms";

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);

        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();

        user.refreshToken = refreshToken;
        user.save({ validateBeforeSave: false });

        return { refreshToken, accessToken };
    } catch (error) {
        throw new ApiError(
            500,
            "Something went wrong while generating access and refresh tokens."
        );
    }
};

const registerUser = asyncHandler(async (req, res) => {
    const {
        userName,
        email,
        fullName,
        password,
        role,
        label,
        street,
        city,
        state,
        pin,
        country,
    } = req.body;

    if (!userName || !email || !fullName || !password) {
        throw new ApiError(400, "Please fill the required fields.");
    }

    if (await User.findOne({ userName: userName })) {
        throw new ApiError(400, "Username not available.");
    }
    if (await User.findOne({ email: email })) {
        throw new ApiError(400, "Email already used.");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError("400", "Avatar file is required.");
    }

    const avatar = await uploadOnCloudinary(
        avatarLocalPath,
        "e-commerce",
        "image"
    );

    if (!avatar) {
        throw new ApiError(505, "Avatar upload failed");
    }

    const newUser = await User.create({
        userName,
        email,
        fullName,
        password,
        role,
        avatarUrl: avatar.url,
        avatarPublicId: avatar.public_id,
        address: {
            label,
            street,
            city,
            state,
            pin,
            country,
        },
        isEmailVerified: false,
    });

    const cretedUser = await User.findById(newUser._id).select(
        "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
    );

    if (!cretedUser) {
        await deleteFromCloudinary(avatar?.public_id);
        throw new ApiError(501, "User not created.");
    }

    const { unhashedToken, hashedToken, tokenExpiry } =
        cretedUser.generateTemporaryToken();

    cretedUser.emailVerificationToken = hashedToken;
    cretedUser.emailVerificationExpiry = tokenExpiry;
    await cretedUser.save({ validateBeforeSave: false });

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${unhashedToken}`;

    await sendEmail({
        email: cretedUser.email,
        subject: "Verify your email",
        mailgenContent: emailVerificationMailgenContent(
            cretedUser.userName,
            verificationUrl
        ),
    });

    return res
        .status(201)
        .json(new ApiResponse(201, cretedUser, "User registered successfuly."));
});

const loginUser = asyncHandler(async (req, res) => {
    const { userName, email, password } = req.body;

    if (!(userName || email)) {
        throw new ApiError(400, "Username or email is required.");
    }

    if (!password) {
        throw new ApiError(400, "Password is required.");
    }

    // Find a user whose username or email matches the given values
    const user = await User.findOne({
        $or: [{ userName: userName }, { email: email }],
    });

    if (!user) {
        throw new ApiError(404, "User does not exist.");
    }

    if (!(await user.isPasswordCorrect(password))) {
        throw new ApiError(409, "Incorrect password.");
    }

    const { refreshToken, accessToken } = await generateAccessAndRefreshToken(
        user._id
    );

    // Get logged-in user's details without the sensitive fields
    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    // Cookie options to keep it safe: only server can access, sent only over HTTPS
    // Refresh token cookie options
    const refreshTokenOptions = {
        httpOnly: true,
        secure: true,
        maxAge: ms(process.env.REFRESH_TOKEN_EXPIRY), // Convert to milliseconds
    };

    // Access token cookie options
    const accessTokenOptions = {
        httpOnly: true,
        secure: true,
        maxAge: ms(process.env.ACCESS_TOKEN_EXPIRY),
    };

    return res
        .status(200)
        .cookie("refreshToken", refreshToken, refreshTokenOptions)
        .cookie("accessToken", accessToken, accessTokenOptions)
        .json(
            new ApiResponse(200, loggedInUser, "User logged in successfully.")
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    const loggedInUser = req.user;

    if (!loggedInUser) {
        throw new ApiError(400, "No logged in user.");
    }

    const user = await User.findByIdAndUpdate(
        loggedInUser._id,
        {
            $unset: {
                refreshToken: "",
            },
            $inc: {
                tokenVersion: 1,
            },
        },
        { new: true }
    );

    if (!user) {
        throw new ApiError(404, "User does not exist.");
    }

    // Save user without running validation checks
    user.save({ validateBeforeSave: false });

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .clearCookie("refreshToken", options)
        .clearCookie("accessToken", options)
        .json(new ApiResponse(200, {}, "User logout successful."));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken =
        req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(400, "Unauthorized access.");
    }

    const verifiedRefreshToken = jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
    );

    // Fixed the missing declearation of user
    const user = await User.findById(verifiedRefreshToken._id);

    if (!user) {
        throw new ApiError(403, "Invalid referesh token");
    }

    if (
        user?.refreshToken !== incomingRefreshToken ||
        user?.tokenVersion !== verifiedRefreshToken?.tokenVersion
    ) {
        throw new ApiError(409, "Refresh token is either invalid or expired.");
    }

    const { refreshToken, accessToken } = await generateAccessAndRefreshToken(
        user._id
    );

    const refreshTokenOptions = {
        httpOnly: true,
        secure: true,
        maxAge: ms(process.env.REFRESH_TOKEN_EXPIRY),
    };

    const accessTokenOptions = {
        httpOnly: true,
        secure: true,
        maxAge: ms(process.env.ACCESS_TOKEN_EXPIRY),
    };

    return res
        .status(200)
        .cookie("refreshToken", refreshToken, refreshTokenOptions)
        .cookie("accessToken", accessToken, accessTokenOptions)
        .json(new ApiResponse(200, {}, "Access token refreshed successfully."));
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword, confirmedNewPassword } = req.body;
    const loggedInUser = req.user;

    if (!loggedInUser) {
        throw new ApiError(400, "No logged in user found.");
    }

    if (!oldPassword || !newPassword || !confirmedNewPassword) {
        throw new ApiError(400, "All fields are required.");
    }

    if (newPassword !== confirmedNewPassword) {
        throw new ApiError(402, "Password not confirmed.");
    }
    if (oldPassword === newPassword) {
        throw new ApiError(409, "Old and new password can not be the same.");
    }

    const user = await User.findById(loggedInUser._id);
    if (!user) {
        throw new ApiError(404, "User not found.");
    }

    if (!(await user.isPasswordCorrect(oldPassword))) {
        throw new ApiError(403, "Incorrect password.");
    }

    user.password = newPassword;
    user.refreshToken = ""; // Invalidate the old refresh token
    user.tokenVersion += 1; // Invalidate all older tokens by incrementing token version

    await user.save();

    // Generate new tokens after changing the password
    const { refreshToken, accessToken } = await generateAccessAndRefreshToken(
        user._id
    );

    // Set the cookie options for new tokens
    const refreshTokenOptions = {
        httpOnly: true,
        secure: true,
        maxAge: ms(process.env.REFRESH_TOKEN_EXPIRY),
    };

    const accessTokenOptions = {
        httpOnly: true,
        secure: true,
        maxAge: ms(process.env.ACCESS_TOKEN_EXPIRY),
    };

    return res
        .status(200)
        .cookie("refreshToken", refreshToken, refreshTokenOptions)
        .cookie("accessToken", accessToken, accessTokenOptions)
        .json(new ApiResponse(200, {}, "Password changed successfully."));
});

const getCurrentUser = asyncHandler(async (req, res) => {
    const currentUser = req.user;

    if (!currentUser) {
        throw new ApiError(400, "No logged in user found.");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                currentUser,
                "Current user fetched successfully."
            )
        );
});

const resendEmailVerificationRequest = asyncHandler(async (req, res) => {
    const loggedInUser = req?.user;

    if (!loggedInUser) {
        throw new ApiError(404, "No logged in user found.");
    }

    if (loggedInUser.isEmailVerified) {
        throw new ApiError(409, "Email is already verified.");
    }

    const { unhashedToken, hashedToken, tokenExpiry } =
        loggedInUser.generateTemporaryToken();

    loggedInUser.emailVerificationToken = hashedToken;
    loggedInUser.emailVerificationExpiry = tokenExpiry;
    await loggedInUser.save({ validateBeforeSave: false });

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${unhashedToken}`;

    await sendEmail({
        email: loggedInUser.email,
        subject: "Verify your email",
        mailgenContent: emailVerificationMailgenContent(
            loggedInUser.userName,
            verificationUrl
        ),
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Email verification request is sent to your email."
            )
        );
});

const forgotPasswordRequest = asyncHandler(async (req, res) => {
    const { userName, email } = req.body;

    if (!(email || userName)) {
        throw new ApiError(400, "Username or Email is required.");
    }

    const user = await User.findOne({
        $or: [{ userName: userName }, { email: email }],
    }).select(
        "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
    );

    if (!user) {
        throw new ApiError("No user exists with the given credentials.");
    }

    const { unhashedToken, hashedToken, tokenExpiry } =
        user.generateTemporaryToken();

    user.forgotPasswordToken = hashedToken;
    user.forgotPasswordExpiry = tokenExpiry;
    await user.save({ validateBeforeSave: false });

    const resetForgottenPasswordUrl = `${process.env.FRONTEND_URL}/forgot-password/${unhashedToken}`;

    await sendEmail({
        email: user.email,
        subject: "Forgotten password reset request",
        mailgenContent: forgotPasswordMailgenContent(
            user.userName,
            resetForgottenPasswordUrl
        ),
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Password reset mail has been sent to your email."
            )
        );
});

const verifyEmail = asyncHandler(async (req, res) => {
    const { incomingUnhashedToken } = req.params;

    if (!incomingUnhashedToken) {
        throw new ApiError(400, "Invalid verification URI");
    }

    const incomingHashedToken = crypto
        .createHash("sha256")
        .update(incomingUnhashedToken)
        .digest("hex");

    const user = await User.findOneAndUpdate(
        {
            emailVerificationToken: incomingHashedToken.trim(),
            emailVerificationExpiry: { $gt: Date.now() },
        },
        {
            $set: {
                isEmailVerified: true,
                emailVerificationExpiry: Date.now(),
            },
            $unset: {
                emailVerificationToken: "",
            },
        },
        { new: true }
    );

    if (!user) {
        throw new ApiError(404, "User not found, can not varify the email.");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { isEmailVerified: user.isEmailVerified },
                "Email verified successfully."
            )
        );
});

const resetForgotPassword = asyncHandler(async (req, res) => {
    const { incomingUnhashedToken } = req.params;
    const { newPassword, confirmedNewPassword } = req.body;

    if (!incomingUnhashedToken) {
        throw new ApiError(400, "Invalid verification URI");
    }

    if (!newPassword || !confirmedNewPassword) {
        throw new ApiError(400, "Please fill the required fields.");
    }

    if (newPassword !== confirmedNewPassword) {
        throw new ApiError(409, "Password not confirmed.");
    }

    const newHashedPassword = await bcrypt.hash(newPassword, 10);

    const incomingHashedToken = crypto
        .createHash("sha256")
        .update(incomingUnhashedToken)
        .digest("hex");

    const user = await User.findOneAndUpdate(
        {
            forgotPasswordToken: incomingHashedToken,
            forgotPasswordExpiry: { $gt: Date.now() },
        },
        {
            $set: {
                password: newHashedPassword,
                forgotPasswordExpiry: Date.now(),
            },
            $unset: {
                forgotPasswordToken: "",
            },
        },
        { new: true }
    );

    if (!user) {
        throw new ApiError(404, "User not found, can not reset password.");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { isEmailVerified: user.isEmailVerified },
                "Password reset succesful."
            )
        );
});

const updateUserAccountDetails = asyncHandler(async (req, res) => {
    const { userName, fullName } = req.body;
    const loggedInUser = req.user;

    if (!loggedInUser) {
        throw new ApiError(400, "No logged in user found.");
    }

    if (!(userName || fullName)) {
        throw new ApiError(400, "Please provide atleast one field to update.");
    }

    if (user.findOne({ userName: userName })) {
        throw new ApiError(409, "A user with theis username already exists.");
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                userName: userName,
                fullName: fullName,
            },
        },
        { new: true }
    );

    if (!user) {
        throw new ApiError(
            404,
            "User not found so can not update the details."
        );
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user,
                "User account details updated successfully."
            )
        );
});

const updateUserAvatar = asyncHandler(async (req, res) => {
    const loggedInUser = req.user;

    if (!loggedInUser) {
        throw new ApiError(400, "No logged in user found.");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;

    if (!req.files) {
        return res.status(400).send("No file uploaded");
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "No avatar file found.");
    }

    const avatar = await uploadOnCloudinary(
        avatarLocalPath,
        "e-commerce",
        "image"
    );

    const user = await User.findByIdAndUpdate(
        loggedInUser._id,
        {
            $set: {
                avatarUrl: avatar?.url,
                avatarPublicId: avatar?.public_id,
            },
        },
        { new: true }
    );

    if (loggedInUser.avatarPublicId && loggedInUser.avatarPublicId !== "") {
        await deleteFromCloudinary(loggedInUser.avatarPublicId, "image");
    }

    if (!user) {
        await deleteFromCloudinary(avatar.public_id, "image");
        throw new ApiError(404, "User not found, can not update avatar.");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Avatar updated successfully!"));
});

const updateUserAddress = asyncHandler(async (req, res) => {
    const loggedInUser = req.user;

    if (!loggedInUser) {
        throw new ApiError(400, "No logged in user found.");
    }

    const { label, street, city, state, pin, country } = req.body;

    if (!(label || street || city || state || pin || country)) {
        throw new ApiError(400, "Please provide atleast one field to update.");
    }

    const user = await User.findByIdAndUpdate(
        loggedInUser._id,
        {
            $set: {
                address: { label, street, city, state, pin, country },
            },
        },
        { new: true, runValidators: "True" } // Follow schema rules so that the enum fieleds should be followed (example in label)
    );

    console.log(user);

    if (!user) {
        throw new ApiError(404, "User not found, can not update address.");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Address updated successfully!"));
});

const deleteUserAccountRequest = asyncHandler(async (req, res) => {
    const loggedInUser = req.user;

    if (!loggedInUser) {
        throw new ApiError(400, "No logged in user found.");
    }

    const { unhashedToken, hashedToken, tokenExpiry } =
        loggedInUser.generateTemporaryToken();

    const user = await User.findByIdAndUpdate(
        loggedInUser._id,
        {
            $set: {
                deleteUserVerificationToken: hashedToken,
                deleteUserVerificationExpiry: tokenExpiry,
            },
        },
        { new: true }
    );

    if (!user) {
        throw new ApiError("No user exists with the given credentials.");
    }

    const deleteUserUrl = `${process.env.FRONTEND_URL}/delete-user/${unhashedToken}`;

    await sendEmail({
        email: user.email,
        subject: "Account deletation request",
        mailgenContent: deleteUserMailgenContent(user.userName, deleteUserUrl),
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Account deletation mail has been sent to your email."
            )
        );
});

const deleteUser = asyncHandler(async (req, res) => {
    const { incomingUnhashedToken } = req.params;

    if (!incomingUnhashedToken) {
        throw new ApiError(400, "Invalid delete URI");
    }

    const incomingHashedToken = crypto
        .createHash("sha256")
        .update(incomingUnhashedToken)
        .digest("hex");

    const user = await User.findOneAndDelete({
        deleteUserVerificationToken: incomingHashedToken.trim(),
        deleteUserVerificationExpiry: { $gt: Date.now() },
    });

    if (!user) {
        throw new ApiError(404, "User does not exist.");
    }

    // Anonymizing all ratings made by the user
    await Rating.updateMany(
        {
            reviewedBy: user._id,
        },
        {
            $set: { reviewedBy: null },
        }
    );

    // Anonymizing and expiring all offers made by the user
    if (user.role !== "customer") {
        await Offer.updateMany(
            {
                "offeredBy.label": user._id,
            },
            {
                $set: {
                    "offeredBy.label": null,
                    "offeredBy.id": null,
                    offerExpiry: Date.now(),
                },
            }
        );
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "User deleted successfully."));
});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    resendEmailVerificationRequest,
    forgotPasswordRequest,
    verifyEmail,
    resetForgotPassword,
    updateUserAccountDetails,
    updateUserAvatar,
    updateUserAddress,
    deleteUserAccountRequest,
    deleteUser,
};
