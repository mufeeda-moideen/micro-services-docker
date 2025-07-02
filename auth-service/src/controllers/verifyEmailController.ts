import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { AppError, asyncHandler } from "../utils/errorHandler";

const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.query;

    if (!token) {
        throw new AppError("Verification token is required", 400);
    }

    const user = await prisma.user.findFirst({
        where: {
            verificationToken: token as string,
            verificationTokenExpiresAt: {
                gt: new Date(), // Check if token hasn't expired
            },
        },
    });

    if (!user) {
        // Check if token exists but is expired
        const expiredUser = await prisma.user.findFirst({
            where: {
                verificationToken: token as string,
            },
        });

        if (expiredUser) {
            throw new AppError("Verification token has expired. Please request a new one.", 400);
        }

        throw new AppError("Invalid verification token", 400);
    }

    // Update user
    await prisma.user.update({
        where: { id: user.id },
        data: {
            emailVerified: true,
            verifiedAt: new Date(),
            verificationToken: null,
            verificationTokenExpiresAt: null,
        },
    });

    res.json({ message: "Email verified successfully" });
});

export default verifyEmail;