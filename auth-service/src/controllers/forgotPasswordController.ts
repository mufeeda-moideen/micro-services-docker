import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { sendOtpEmail } from "../utils/email";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { AppError, asyncHandler } from "../utils/errorHandler";

export const requestPasswordReset = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
        // Type-safe check for rateLimit properties
        if (req.rateLimit) {
            res.setHeader('X-RateLimit-Remaining', req.rateLimit?.remaining.toString() ?? '0');
            res.setHeader('X-RateLimit-Limit', req.rateLimit?.limit.toString() ?? '0');
            if (req.rateLimit?.resetTime) {
                res.setHeader('X-RateLimit-Reset', req.rateLimit.resetTime.toISOString());
            }
        }
        throw new AppError("Email is required", 400);
    }

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        // For security, don't reveal if email doesn't exist
        return res.json({
            message: "If this email is registered, you'll receive an OTP shortly",
        });
    }

    // Generate 4-digit OTP
    const otp = crypto.randomInt(1000, 9999).toString();
    const otpExpiresAt = new Date();
    otpExpiresAt.setMinutes(otpExpiresAt.getMinutes() + 10); // 10 minutes expiry

    // Save OTP to user
    await prisma.user.update({
        where: { email },
        data: {
            resetPasswordOtp: otp,
            resetPasswordOtpExpiresAt: otpExpiresAt,
        },
    });

    // Send OTP email
    await sendOtpEmail(email, otp);

    res.json({
        message: "OTP sent to your email. Valid for 10 minutes.",
    });
});

export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        // Type-safe check for rateLimit properties
        if (req.rateLimit) {
            res.setHeader('X-RateLimit-Remaining', req.rateLimit?.remaining.toString() ?? '0');
            res.setHeader('X-RateLimit-Limit', req.rateLimit?.limit.toString() ?? '0');
            if (req.rateLimit?.resetTime) {
                res.setHeader('X-RateLimit-Reset', req.rateLimit.resetTime.toISOString());
            }
        }
        throw new AppError("Email and OTP are required", 400);
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        throw new AppError("User not found", 404);
    }

    // Check OTP validity
    if (
        user.resetPasswordOtp !== otp ||
        !user.resetPasswordOtpExpiresAt ||
        new Date() > user.resetPasswordOtpExpiresAt
    ) {
        throw new AppError("Invalid or expired OTP", 400);
    }

    res.json({
        message: "OTP verified successfully",
        email, // Return email for the next step
    });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email, password, confirmPassword } = req.body;

    if (!email || !password || !confirmPassword) {
        // Type-safe check for rateLimit properties
        if (req.rateLimit) {
            res.setHeader('X-RateLimit-Remaining', req.rateLimit?.remaining.toString() ?? '0');
            res.setHeader('X-RateLimit-Limit', req.rateLimit?.limit.toString() ?? '0');
            if (req.rateLimit?.resetTime) {
                res.setHeader('X-RateLimit-Reset', req.rateLimit.resetTime.toISOString());
            }
        }
        throw new AppError("Email, password and confirmation are required", 400);
    }

    if (password !== confirmPassword) {
        throw new AppError("Passwords don't match", 400);
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        throw new AppError("User not found", 404);
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Update password and clear OTP fields
    await prisma.user.update({
        where: { email },
        data: {
            password: hashedPassword,
            resetPasswordOtp: null,
            resetPasswordOtpExpiresAt: null,
        },
    });

    res.json({ message: "Password reset successfully" });
});