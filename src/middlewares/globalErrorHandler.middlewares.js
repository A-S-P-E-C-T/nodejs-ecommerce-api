import { ApiError } from "../utils/ApiError.js";
const globalErrorHandler = (err, req, res, next) => {
    if (!(err instanceof ApiError)) {
        const statusCode = err.statusCode || 500;
        const message = err.message || "Something went wrong.";

        err = new ApiError(statusCode, message, [], err.stack);
    } // If the error was not an instance of ApiError, we convted it into one

    const response = {
        success: false,
        message: err.message,
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    };

    res.status(err.statusCode).json(response);
};

export { globalErrorHandler };
