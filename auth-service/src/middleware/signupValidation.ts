import { z } from "zod";
import { Request, Response, NextFunction } from "express";


const signupSchema = z
    .object({
        email: z.string().email({ message: "Invalid email format" }),
        password: z
            .string()
            .min(6, { message: "Password must be at least 6 characters" })
            .regex(/[0-9]/, { message: "Password must contain at least one number" }),
        name: z.string().min(2, { message: "Name must be at least 2 characters" }),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"],
    });

export const signupValidation = (
    req: Request,
    _res: Response,
    next: NextFunction
) => {
    const result = signupSchema.safeParse(req.body);
    if (!result.success) {
        const formattedErrors = result.error.errors.map((err) => ({
            path: err.path.join("."),
            message: err.message,
        }));
    }
    next();
};