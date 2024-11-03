import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import { apiError } from './apiError.utils.js';
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_SECRET_KEY,
});
const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        const uploadResponse = await cloudinary.uploader.upload(localFilePath, { resource_type: 'auto' });
        
        //remove the file from localStorage
        fs.unlinkSync(localFilePath);

        return uploadResponse;
    } catch (error) {
        console.error('Error while Uploading to cloudinary', error);

        if (fs.existsSync(localFilePath)) {
            //removethe file  from localStorage if upload fails
            fs.unlinkSync(localFilePath);
            console.log("FILE REMOVED FROM LOCAL SERVER DUE TO UPLOAD FAILURE");

        }
        return null;
    }
}
const deleteFromCloudinary = async (publicId) => {
    try {
        const result=await cloudinary.uploader.destroy(publicId);
        //check if delettion was successfull
        if (result.result == 'ok') {
            return result;
        } else {
            throw new apiError(400, "Error deleting from cloudinary");
        }
    } catch (error) {
        console.log("Cloudinary deletion error", error.message || error);
        throw new apiError(400, "Error while deleting from cloudinary");
    }
}
export {
    uploadOnCloudinary,
    deleteFromCloudinary
 };
