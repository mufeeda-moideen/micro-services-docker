import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import prisma from "./lib/prisma";
import { authRoutes } from "./routes/authRoutes";
import { cleanupOldVerificationAttempts } from "./utils/cleanup";
import { errorHandler, notFoundHandler } from "./utils/errorHandler";

dotenv.config();

// Check for required environment variables before starting the server
const requiredEnvVars = [
    "JWT_SECRET",
    "EMAIL_SERVICE",
    "EMAIL_USERNAME",
    "EMAIL_PASSWORD",
    "EMAIL_FROM",
    "BASE_URL",
    "DATABASE_URL",
];

const missingEnvVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
);

if (missingEnvVars.length > 0) {
    console.error("Missing required environment variables:");
    console.error(missingEnvVars.join(", "));
    process.exit(1); // Stop server if any required variable is missing
}

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy only in production (needed for rate limiting, HTTPS, etc.)
app.set('trust proxy', process.env.NODE_ENV === 'production' ? 1 : false);

// Basic rate limiting for auth routes (to prevent brute-force attacks)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Max 20 failed requests per IP
    message: "Too many requests from this IP, please try again later",
    skipSuccessfulRequests: true, // Only count failed requests
});

app.use("/api/auth", authLimiter); // Apply limiter to auth routes

// Basic security and parsing middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Mount auth routes
app.use("/api/auth", authRoutes);

// Handle 404 errors
app.use(notFoundHandler);

// Handle all other errors
app.use(errorHandler);

// Start the server and connect to the database
app.listen(PORT, async () => {
    try {
        await prisma.$connect();
        console.log("Connected to database successfully");

        // Remove expired verification attempts on startup
        cleanupOldVerificationAttempts();

        console.log(`Server is running on port ${PORT}`);
    } catch (error) {
        console.error("Failed to connect to database:", error);
        process.exit(1);
    }
});
