import { Request, Response, NextFunction } from "express";

// Custom error classes
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

export class ValidationError extends AppError {
    details: any[];

    constructor(errors: any[]) {
        super("Validation failed", 400);
        this.details = errors;
    }
}

export class AuthenticationError extends AppError {
    constructor(message = "Authentication failed") {
        super(message, 401);
    }
}

export class AuthorizationError extends AppError {
    constructor(message = "Not authorized") {
        super(message, 403);
    }
}

export class NotFoundError extends AppError {
    constructor(resource = "Resource") {
        super(`${resource} not found`, 404);
    }
}

// Error response formatter
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

// Main error handling middleware
export const errorHandler = (
    error: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    errorResponse(error, res);
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response) => {
    errorResponse(new NotFoundError("Endpoint"), res);
};

// Async handler wrapper to catch async errors
export const asyncHandler = (fn: Function) =>
    (req: Request, res: Response, next: NextFunction) =>
        Promise.resolve(fn(req, res, next)).catch(next);