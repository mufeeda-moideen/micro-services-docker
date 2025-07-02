import nodemailer from "nodemailer";
import prisma from "../lib/prisma";

// Setup Nodemailer transporter using environment variables
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
    },
});

// In-memory map to track email verification attempts
const verificationAttempts = new Map<string, { count: number; lastAttempt: Date }>();

// Checks if verification email can be sent (max 3 per hour)
export const canSendVerificationEmail = async (email: string) => {
    const attempt = verificationAttempts.get(email);
    const now = new Date();
    const oneHour = 60 * 60 * 1000;

    if (attempt) {
        const timeSinceLast = now.getTime() - attempt.lastAttempt.getTime();

        if (attempt.count >= 3 && timeSinceLast < oneHour) return false;

        if (timeSinceLast >= oneHour) {
            verificationAttempts.set(email, { count: 1, lastAttempt: now });
            return true;
        }
    }

    return true;
};

// Increments the count for verification attempts
export const trackVerificationAttempt = (email: string) => {
    const now = new Date();
    const attempt = verificationAttempts.get(email) || { count: 0, lastAttempt: now };

    verificationAttempts.set(email, {
        count: attempt.count + 1,
        lastAttempt: now
    });
};

// Sends a verification email with a link
export const sendVerificationEmail = async (email: string, token: string) => {
    try {
        if (!await canSendVerificationEmail(email)) {
            throw new Error('Too many verification attempts. Please try again later.');
        }

        const verificationUrl = `${process.env.BASE_URL}/api/auth/verify-email?token=${token}`;

        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: email,
            subject: "Email Verification",
            html: `<p>Verify your email: <a href="${verificationUrl}">Click here</a></p>
                   <p>This link will expire in 24 hours.</p>`,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent:", info.messageId);

        trackVerificationAttempt(email);

        await prisma.verificationAttempt.create({
            data: {
                email,
                type: 'EMAIL_VERIFICATION',
                createdAt: new Date(),
            }
        });

        return true;
    } catch (error) {
        console.error("Email sending failed:", error);
        throw new Error("Failed to send verification email");
    }
};

// Sends a password reset OTP email
export const sendOtpEmail = async (email: string, otp: string) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: email,
            subject: "Password Reset OTP",
            html: `<p>Your password reset OTP is: <strong>${otp}</strong></p>
                   <p>This OTP is valid for 10 minutes.</p>`,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("OTP email sent:", info.messageId);

        return true;
    } catch (error) {
        console.error("OTP email sending failed:", error);
        throw new Error("Failed to send OTP email");
    }
};
