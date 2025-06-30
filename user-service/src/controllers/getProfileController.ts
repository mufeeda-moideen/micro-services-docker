import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { AppError, NotFoundError, asyncHandler } from "../utils/errorHandler";

interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
    };
}

const getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
        throw new AppError("User not authenticated", 401);
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            dob: true,
            gender: true,
            address: true,
            preferredLanguage: true,
            profilePic: true,
            emailVerified: true,
            phoneVerified: true,
        },
    });

    if (!user) {
        throw new NotFoundError("User");
    }

    res.json({ user });
});

export default getProfile;