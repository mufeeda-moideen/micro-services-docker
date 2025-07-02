import { Router } from "express";
import { loginValidation } from "../middleware/loginValidation";
import login from "../controllers/loginController";
import { signupValidation } from "../middleware/signupValidation";
import signup from "../controllers/signUpController";
import verifyEmail from "../controllers/verifyEmailController";
import {
    validateRequestReset,
    validateVerifyOtp,
    validateResetPassword,
} from "../middleware/forgotPasswordValidation";
import {
    requestPasswordReset,
    verifyOtp,
    resetPassword,
} from "../controllers/forgotPasswordController";
import { asyncHandler } from "../utils/errorHandler";
import rateLimit from "express-rate-limit";

const router = Router();

// More aggressive rate limiting for sensitive endpoints
const sensitiveLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: "Too many attempts, please try again later",
});

router.post("/login", loginValidation, asyncHandler(login));
router.post("/signup", signupValidation, asyncHandler(signup));
router.get("/verify-email", asyncHandler(verifyEmail));

// Forgot password routes with stricter rate limiting
router.post(
    "/forgot-password/request",
    sensitiveLimiter,
    validateRequestReset,
    asyncHandler(requestPasswordReset)
);
router.post(
    "/forgot-password/verify",
    sensitiveLimiter,
    validateVerifyOtp,
    asyncHandler(verifyOtp)
);
router.post(
    "/forgot-password/reset",
    sensitiveLimiter,
    validateResetPassword,
    asyncHandler(resetPassword)
);

export { router as authRoutes };