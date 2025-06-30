import { z } from "zod";
import { Request, Response, NextFunction } from "express";
import { ValidationError } from "../utils/errorHandler";

const updateProfileSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters" }).optional(),
    dob: z.string().optional(),
    gender: z.enum(["Male", "Female", "Other"], {
        errorMap: () => ({ message: "Gender must be Male, Female or Other" })
    }).optional(),
    address: z
        .object({
            street: z.string().optional(),
            city: z.string().optional(),
            state: z.string().optional(),
            zip: z.string().optional(),
            country: z.string().optional(),
        })
        .optional(),
    preferredLanguage: z.string().optional(),
    phone: z.string().optional(),
});

export const updateProfileValidation = (
    req: Request,
    _res: Response,
    next: NextFunction
) => {
    const result = updateProfileSchema.safeParse(req.body);
    if (!result.success) {
        const formattedErrors = result.error.errors.map((err) => ({
            path: err.path.join("."),
            message: err.message,
        }));
        throw new ValidationError(formattedErrors);
    }
    next();
};