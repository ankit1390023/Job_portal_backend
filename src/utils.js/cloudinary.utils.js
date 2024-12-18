import { v2 as cloudinary } from 'cloudinary';
import { apiError } from './apiError.utils.js'; // Ensure this module is 


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_SECRET_KEY,
});



const uploadOnCloudinary = async (fileContent) => {
    try {
        const uploadResponse = await cloudinary.uploader.upload(fileContent, { resource_type: 'auto' });
        return uploadResponse;
    } catch (error) {
        console.error('Error while Uploading to Cloudinary', error);
        throw new apiError(500, "Internal Server Error");
    }
};

const deleteFromCloudinary = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        if (result.result === 'ok') {
            return result;
        } else {
            throw new apiError(400, 'Error deleting from Cloudinary');
        }
    } catch (error) {
        console.log('Cloudinary deletion error', error.message || error);
        throw new apiError(400, 'Error while deleting from Cloudinary');
    }
};


export {
    uploadOnCloudinary,
    deleteFromCloudinary
};
