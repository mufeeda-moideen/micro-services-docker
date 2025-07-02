import { z } from "zod";
import { Request, Response, NextFunction } from "express";
import { ValidationError } from "../utils/errorHandler";

// Schema to request OTP (email only)
const requestResetSchema = z.object({
    email: z.string().email({ message: "Invalid email format" }),
});

// Schema to verify OTP
const verifyOtpSchema = z.object({
    email: z.string().email({ message: "Invalid email format" }),
    otp: z.string().length(4, { message: "OTP must be 4 digits" }),
});

// Schema to reset password (includes match check)
const resetPasswordSchema = z
    .object({
        email: z.string().email({ message: "Invalid email format" }),
        password: z
            .string()
            .min(6, { message: "Password must be at least 6 characters" })
            .regex(/[0-9]/, { message: "Password must contain at least one number" }),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"],
    });

// Middleware: validate request reset (email only)
export const validateRequestReset = (
    req: Request,
    _res: Response,
    next: NextFunction
) => {
    const result = requestResetSchema.safeParse(req.body);
    if (!result.success) {
        const formattedErrors = result.error.errors.map((err) => ({
            path: err.path.join("."),
            message: err.message,
        }));
        throw new ValidationError(formattedErrors);
    }
    next();
};

// Middleware: validate OTP verification
export const validateVerifyOtp = (
    req: Request,
    _res: Response,
    next: NextFunction
) => {
    const result = verifyOtpSchema.safeParse(req.body);
    if (!result.success) {
        const formattedErrors = result.error.errors.map((err) => ({
            path: err.path.join("."),
            message: err.message,
        }));
        throw new ValidationError(formattedErrors);
    }
    next();
};

// Middleware: validate password reset
export const validateResetPassword = (
    req: Request,
    _res: Response,
    next: NextFunction
) => {
    const result = resetPasswordSchema.safeParse(req.body);
    if (!result.success) {
        const formattedErrors = result.error.errors.map((err) => ({
            path: err.path.join("."),
            message: err.message,
        }));
        throw new ValidationError(formattedErrors);
    }
    next();
};
