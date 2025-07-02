import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";
import { sendVerificationEmail } from "../utils/email";
import crypto from "crypto";
import { AuthenticationError, AppError, asyncHandler } from "../utils/errorHandler";

const login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        // Type-safe check for rateLimit properties
        if (req.rateLimit) {
            res.setHeader('X-RateLimit-Remaining', req.rateLimit?.remaining.toString() ?? '0');
            res.setHeader('X-RateLimit-Limit', req.rateLimit?.limit.toString() ?? '0');
            if (req.rateLimit?.resetTime) {
                res.setHeader('X-RateLimit-Reset', req.rateLimit.resetTime.toISOString());
            }
        }
        throw new AppError("Email and password are required", 400);
    }

    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        // Type-safe check for rateLimit properties
        if (req.rateLimit) {
            res.setHeader('X-RateLimit-Remaining', req.rateLimit?.remaining.toString() ?? '0');
            res.setHeader('X-RateLimit-Limit', req.rateLimit?.limit.toString() ?? '0');
            if (req.rateLimit?.resetTime) {
                res.setHeader('X-RateLimit-Reset', req.rateLimit.resetTime.toISOString());
            }
        }
        throw new AuthenticationError();
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        // Type-safe check for rateLimit properties
        if (req.rateLimit) {
            res.setHeader('X-RateLimit-Remaining', req.rateLimit?.remaining.toString() ?? '0');
            res.setHeader('X-RateLimit-Limit', req.rateLimit?.limit.toString() ?? '0');
            if (req.rateLimit?.resetTime) {
                res.setHeader('X-RateLimit-Reset', req.rateLimit.resetTime.toISOString());
            }
        }
        throw new AuthenticationError();
    }

    // Check if email is verified
    if (!user.emailVerified) {
        // Generate new verification token
        const verificationToken = crypto.randomBytes(32).toString("hex");
        const verificationTokenExpiresAt = new Date();
        verificationTokenExpiresAt.setHours(
            verificationTokenExpiresAt.getHours() + 24
        ); // 24 hours expiry

        // Update user with new verification token
        await prisma.user.update({
            where: { id: user.id },
            data: {
                verificationToken,
                verificationTokenExpiresAt,
            },
        });

        // Resend verification email
        await sendVerificationEmail(email, verificationToken);

        throw new AppError(
            "Email not verified. A new verification email has been sent.",
            403
        );
    }

    if (!process.env.JWT_SECRET) {
        throw new AppError("Server configuration error", 500);
    }

    const token = jwt.sign(
        {
            id: user.id,
            email: user.email,
        },
        process.env.JWT_SECRET!,
        { expiresIn: "30d" }
    );

    res.json({
        token,
        user: {
            id: user.id,
            email: user.email,
        },
    });
});

export default login;