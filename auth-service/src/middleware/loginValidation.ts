import { z } from "zod";
import { Request, Response, NextFunction } from "express";
import { ValidationError } from "../utils/errorHandler";

// Login schema: checks for valid email and strong password
const loginSchema = z.object({
    email: z.string().email({ message: "Invalid email format" }),
    password: z
        .string()
        .min(6, { message: "Password must be at least 6 characters" })
        .regex(/[0-9]/, { message: "Password must contain at least one number" }),
});

// Middleware to validate login request
export const loginValidation = (
    req: Request,
    _res: Response,
    next: NextFunction
) => {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
        const formattedErrors = result.error.errors.map((err) => ({
            path: err.path.join("."),
            message: err.message,
        }));
        throw new ValidationError(formattedErrors);
    }
    next();
};
