import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (
    localFilePath,
    { folder = "e-commerce", resourceType = "auto" } = {}
) => {
    try {
        if (!localFilePath || !fs.existsSync(localFilePath)) {
            console.error(
                "File does not exist or path is invalid: ",
                localFilePath
            );
            return null;
        }

        const response = await cloudinary.uploader.upload(localFilePath, {
            folder,
            resource_type: resourceType,
        });

        if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);

        return response;
    } catch (error) {
        console.error("Cloudinary upload error: ", error);
        if (localFilePath && fs.existsSync(localFilePath))
            fs.unlinkSync(localFilePath);
        return null;
    }
};

const deleteFromCloudinary = async (publicID, resourceType = "image") => {
    if (!publicID) return null;

    try {
        await cloudinary.uploader.destroy(publicID, {
            resource_type: resourceType,
        });
    } catch (error) {
        console.error("Error deleting from Cloudinary: ", error);
    }
};

export { uploadOnCloudinary, deleteFromCloudinary };
