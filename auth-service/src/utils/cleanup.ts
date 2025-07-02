import prisma from "../lib/prisma";

// Removes verification attempts older than 7 days
export const cleanupOldVerificationAttempts = async () => {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    await prisma.verificationAttempt.deleteMany({
        where: {
            createdAt: {
                lt: oneWeekAgo
            }
        }
    });

    console.log('Cleaned up old verification attempts');
};

// Run cleanup daily
setInterval(cleanupOldVerificationAttempts, 24 * 60 * 60 * 1000);