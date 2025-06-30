import { Router } from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import { updateProfileValidation } from "../middleware/updateProfileValidation";
import updateProfile from "../controllers/updateProfileController";
import getProfile from "../controllers/getProfileController";
import { asyncHandler } from "../utils/errorHandler";

const router = Router();

router.get("/profile", authenticateToken, asyncHandler(getProfile));
router.put(
    "/update-profile",
    authenticateToken,
    updateProfileValidation,
    asyncHandler(updateProfile)
);

export { router as userRoutes };