class ApiError extends Error {
    constructor(
        statusCode,
        message = "Something went wrong.",
        errors = [],
        stack = ""
    ) {
        super(message);
        this.name = this.constructor.name; // Helpful in Debugging
        this.statusCode = statusCode;
        this.success = statusCode < 400;
        this.errors = Array.isArray(errors) ? errors : [errors]; // Normalize errors
        this.data = null;

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export { ApiError };
