import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthenticationError, AppError } from "../utils/errorHandler";

interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
    };
}

export const authenticateToken = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(" ")[1];

        if (!token) {
            throw new AuthenticationError();
        }

        if (!process.env.JWT_SECRET) {
            throw new AppError("Server configuration error", 500);
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET) as {
            id: string;
            email: string;
        };
        req.user = decoded;
        next();
    } catch (error) {
        next(new AuthenticationError("Invalid or expired token"));
    }
};