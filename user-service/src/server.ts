import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import prisma from "./lib/prisma";
import { userRoutes } from "./routes/userRoutes";
import { errorHandler, notFoundHandler } from "./utils/errorHandler";

dotenv.config();

const requiredEnvVars = [
    "JWT_SECRET",
    "RAZORPAY_KEY_ID",
    "RAZORPAY_KEY_SECRET",
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
    process.exit(1);
}

const app = express();

app.set('trust proxy', process.env.NODE_ENV === 'production' ? 1 : false);

const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());


app.use("/api/user", userRoutes);


// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Start server
app.listen(PORT, async () => {
    try {
        await prisma.$connect();
        console.log("Connected to database successfully");
        console.log(`Server is running on port ${PORT}`);
    } catch (error) {
        console.error("Failed to connect to database:", error);
        process.exit(1);
    }
});