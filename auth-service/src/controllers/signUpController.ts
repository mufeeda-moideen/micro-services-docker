import { Request, Response } from "express";
import prisma from "../lib/prisma";
import crypto from "crypto";
import { AppError, asyncHandler } from "../utils/errorHandler";

const signup = asyncHandler(async (req: Request, res: Response) => {
    const { email, password, name } = req.body;

    // Validate required fields
    if (!email || !password || !name) {
        throw new AppError("Email, password and name are required", 400);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        throw new AppError("Email already in use", 400);
    }

    
    // Hash password
    

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpiresAt = new Date();
    verificationTokenExpiresAt.setHours(
        verificationTokenExpiresAt.getHours() + 24
    ); // 24 hours expiry

    // Create new user
    const newUser = await prisma.user.create({
        data: {
            email,
            password,
            name,
            verificationToken,
            verificationTokenExpiresAt,
        },
    });

    // Send verification email


    res.status(201).json({
        message:
            "User registered successfully. Please check your email to verify your account.",
        user: {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
        },
    });
});

export default signup;