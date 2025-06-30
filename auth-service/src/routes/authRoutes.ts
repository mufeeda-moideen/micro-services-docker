import { Router } from "express";
import { signupValidation } from "../middleware/signupValidation"
import signup from "../controllers/signUpController";

import { asyncHandler } from "../utils/errorHandler";

const router = Router();

router.post("/signup", signupValidation, asyncHandler(signup));

export { router as authRoutes };