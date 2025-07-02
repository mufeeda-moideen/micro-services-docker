import { Request, Response, NextFunction } from "express";

// Base application error
export class AppError extends Error {
    statusCode: number;
    isOperational: boolean;

    constructor(message: string, statusCode: number, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}

// Validation error with detailed messages
export class ValidationError extends AppError {
    details: any[];

    constructor(errors: any[]) {
        super("Validation failed", 400);
        this.details = errors;
    }
}

// Thrown when authentication fails (e.g. invalid token)
export class AuthenticationError extends AppError {
    constructor(message = "Authentication failed") {
        super(message, 401);
    }
}

// Thrown when user is not authorized
export class AuthorizationError extends AppError {
    constructor(message = "Not authorized") {
        super(message, 403);
    }
}

// Thrown when a resource is not found
export class NotFoundError extends AppError {
    constructor(resource = "Resource") {
        super(`${resource} not found`, 404);
    }
}

// Formats and sends error response
const errorResponse = (error: any, res: Response) => {
    if (process.env.NODE_ENV === "development") {
        console.error(error);
    }

    const response: any = {
        success: false,
        message: error.message || "Something went wrong",
    };

    if (error instanceof ValidationError) {
        response.errors = error.details;
    }

    if (process.env.NODE_ENV === "development") {
        response.stack = error.stack;
        if (error instanceof AppError) {
            response.isOperational = error.isOperational;
        }
    }

    res.status(error.statusCode || 500).json(response);
};

// Global error handler middleware
export const errorHandler = (
    error: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    errorResponse(error, res);
};

// Handles undefined routes (404)
export const notFoundHandler = (req: Request, res: Response) => {
    errorResponse(new NotFoundError("Endpoint"), res);
};

// Catches async errors in route handlers
export const asyncHandler = (fn: Function) =>
    (req: Request, res: Response, next: NextFunction) =>
        Promise.resolve(fn(req, res, next)).catch(next);
