import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { AppError, NotFoundError, asyncHandler } from "../utils/errorHandler";

interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
    };
}

const updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    const updateFields = req.body;

    if (!userId) {
        throw new AppError("User not authenticated", 401);
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!user) {
        throw new NotFoundError("User");
    }

    // Prepare update data
    const updateData: any = {};

    // Handle each possible field update
    if (updateFields.name !== undefined) {
        updateData.name = updateFields.name;
    }
    if (updateFields.dob !== undefined) {
        updateData.dob = updateFields.dob ? new Date(updateFields.dob) : null;
    }
    if (updateFields.gender !== undefined) {
        updateData.gender = updateFields.gender;
    }
    if (updateFields.phone !== undefined) {
        updateData.phone = updateFields.phone;
    }
    if (updateFields.address !== undefined) {
        updateData.address = updateFields.address;
    }
    if (updateFields.preferredLanguage !== undefined) {
        updateData.preferredLanguage = updateFields.preferredLanguage;
    }

    // Validate that we have something to update
    if (Object.keys(updateData).length === 0) {
        throw new AppError("No valid fields to update", 400);
    }

    // Update user
    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            dob: true,
            gender: true,
            address: true,
            preferredLanguage: true,
            profilePic: true,
            emailVerified: true,
            phoneVerified: true,
        },
    });

    res.json({
        message: "Profile updated successfully",
        user: updatedUser,
    });
});

export default updateProfile;