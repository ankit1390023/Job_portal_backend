import { asyncHandler } from "../utils.js/asyncHandler.utils.js";
import { apiError } from "../utils.js/apiError.utils.js";
import { User } from "../models/user.model.js";
import { apiResponse } from "../utils.js/apiResponse.utils.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils.js/cloudinary.utils.js";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import getDataUri from "../utils.js/dataURI.utils.js";
import cloudinary from "../utils.js/file.cloudinary.utils.js";


const generateAcessTokenAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        console.log("from generate token", user)
        const accessToken = await user.genAccessToken();
        const refreshToken = await user.genRefreshToken();

        user.refreshToken = refreshToken; //yha hum ,user database me refreshToken save kra rhe h
        console.log("user.refreshToken", user.refreshToken)
        await user.save({ validateBeforeSave: false })//vaidation nhi lagao sidha ja k save kr do.
        return { accessToken, refreshToken }

    } catch (error) {
        throw new apiError(500, error, 'Something went wrong while  generating Access & Refresh token');
    }
}
const registerUser = asyncHandler(async (req, res) => {
    // console.log("HGCTJ LBLUI  YILG  UILL BIUG  UIH")
    const { fullName, email, password, phoneNumber, role, bio = "" } = req.body; // Default bio to an empty string if not provided

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    // console.log("existingUser from registerUser", existingUser);
    if (existingUser) {
        throw new apiError(400, "Email Already Exists");
    }

    // req.files from multer middleware
    const avatarLocalFilePath = req.files?.avatar?.[0]?.path;
    const coverImageLocalFilePath = req.files?.coverImage?.[0]?.path;

    // Upload to Cloudinary (assuming `uploadOnCloudinary` is a function that returns an object with `secure_url`)
    const avatar = avatarLocalFilePath ? await uploadOnCloudinary(avatarLocalFilePath) : null;
    const coverImage = coverImageLocalFilePath ? await uploadOnCloudinary(coverImageLocalFilePath) : null;
    console.log("avtar from register is ", avatar);
    // Create new user with nested profile fields
    const user = await User.create({
        fullName,
        email,
        password,
        phoneNumber,
        role,
        profile: {
            bio,
            avatar: avatar ? avatar.secure_url : null,
            coverImage: coverImage ? coverImage.secure_url : null,
        }
    });

    // Fetch created user without password and refreshToken
    const createdUser = await User.findById(user._id).select("-password -refreshToken");
    if (!createdUser) {
        throw new apiError(500, "Something went wrong while registering the user");
    }

    return res.status(200).json(
        new apiResponse(200, createdUser, `Welcome ${createdUser.fullName}! You are registered successfully`)
    );
});
const loginUser = asyncHandler(async (req, res) => {

    const { identifier, password } = req.body; // Single field for email/phoneNumber
    // console.log(" identifier, password ", identifier, password);
    // Check if identifier and password are provided
    if (!identifier || !password) {
        throw new apiError(400, "Both identifier and password are required");
    }
    const user = await User.findOne({
        $or: [{ email: identifier }, { phoneNumber: identifier }],
    });


    // console.log("user from lohgi user is ", user)

    if (!user || !(await bcrypt.compare(password, user.password))) {
        throw new apiError(401, "Invalid email or password");
    }
    // console.log(user.id);
    const { accessToken, refreshToken } = await generateAcessTokenAndRefreshToken(user._id);
    // console.log(accessToken, refreshToken);
    const loggedUser = await User.findById(user._id).select("-password -refreshToken");

    //options for cookies
    //cookie by default frontend se modifiable hoti,2 dono option true hone se,only can modify from server.
    const options = {
        httpOnly: true, // Prevents client-side access to the cookie
        secure: true, // Use secure cookies in production
        // sameSite: "Strict", // CSRF protection
        // maxAge: 24 * 60 * 60 * 1000 // Cookie expiration time (e.g., 1 day)
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new apiResponse(
                200,
                { user: loggedUser, accessToken, refreshToken },
                "User logged in successfully"
            )
        )
});
const logOut = asyncHandler(async (req, res) => {
    //remove data from database
    await User.findByIdAndUpdate(
        req.user._id,
        { $unset: { refreshToken: 1 } },  //$unset remove the refrehToken field entirely from document
        { new: true }
    );

    //remove data fromcookies
    const options = {
        httpOnly: true, // Prevents client-side access to the cookie
        secure: true, // Use secure cookies in production
    }
    return res
        .status(200)
        .clearCookie("accesstoken", options)
        .clearCookie("refreshToken", options)
        .json(
            new apiResponse(200, {}, "user LogOut Successfully")
        )
})
const refreshToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new apiError(400, "incomingRefreshToken Not found");
    }
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    // console.log("decodedToken", decodedToken)
    //ye decodedToken conatain kr rha h user ki _id,ye hr haal, me verify hoga ydi incomingrefreshToken ka structure shi h,but,problem is that,how to check this is actual user ki hi _id h, kisi dusre ki bhi to _id ho skti h.. ese check krne k liye   (incomingRefreshToken != user.refreshToken) ese check kro
    const user = await User.findById(decodedToken._id);
    if (!user) {
        throw new apiError(400, "Unauthorized access due to invalid refrshtoken");
    }
    // console.log("user is", user)
    // console.log("user.refreshToken", user.refreshToken);
    if (incomingRefreshToken != user.refreshToken) {
        throw new apiError(400, "refresh token is  expired or used");
    }

    const { accessToken, refreshToken } = await generateAcessTokenAndRefreshToken(user._id);
    //sending new refreshtoken
    const options = {
        httpOnly: true,
        secure: true,
    }
    return res
        .status(200)
        .cookie("accesstoken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new apiResponse(200, { accessToken, refreshToken }, "User token refreshed sucessfuuly")
        )
})
const changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    // console.log("oldPassword", oldPassword);
    // console.log("newPassword", newPassword);
    const user = await User.findById(req.user?._id);
    // console.log(user);
    const isPasswordCorrect = await user.comparePassword(oldPassword);
    console.log(isPasswordCorrect);
    if (!isPasswordCorrect) {
        throw new apiError(401, "Old password is incorrect");
    }
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });
    return res
        .status(200)
        .json(new apiResponse(200, {}, "Password changed successfully"));
})
const getCurrentUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user?._id).select('-password');
    // console.log(user);
    return res
        .status(200)
        .json(
            new apiResponse(200, user, "User data fetched successfully")
        )

})
const updateAvatar = asyncHandler(async (req, res) => {
    console.log(req.file);
    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) {
        throw new apiError(400, "Avatar file is missing");
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar.url) {
        throw new apiError(401, "Error while Uploading avatar on Cloudinary");
    }
    const user = await User.findByIdAndUpdate(req.user._id, {
        $set: {
            avatar: avatar.url,
        }
    }, { new: true }).select('-password');
    return res
        .status(200)
        .json(
            new apiResponse(200, user, "User Avatar Upadated Successfully")
        )
})
const updateUserCoverImage = asyncHandler(async (req, res) => {
    console.log(req.file);
    const coverImageLocalPath = req.file?.path; //it is from multer
    console.log("cover Image Local Path is --", coverImageLocalPath);
    if (!coverImageLocalPath) {
        throw new apiError(400, "CoverImage File Is Missing");
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!coverImage.url) {
        throw new apiError(401, "Error while uploading coverImage file on cloudinary");
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url,
            }
        },
        { new: true }
    ).select('-password');
    return res
        .status(200)
        .json(
            new apiResponse(200, user, "User CoverImage Updated Succesfully")
        )
})
const updateAccountDetails = asyncHandler(async (req, res) => {
    try {
        const { fullName, email, phoneNumber, bio, skills } = req.body;
        const file = req.file;

        // Process skills
        let skillsArray = [];
        if (skills) {
            skillsArray = skills.split(",").map(skill => skill.trim());
        }

        // Get user ID from middleware
        const userId = req.user._id;

        // Find user in the database
        let user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found.",
                success: false,
            });
        }

        // Update fields
        if (fullName) user.fullName = fullName;
        if (email) user.email = email;
        if (phoneNumber) user.phoneNumber = phoneNumber;
        if (bio) user.profile.bio = bio;
        if (skills) user.profile.skills = skillsArray;

        // Handle file upload for resume
        if (file) {
            const fileUri = getDataUri(file);
            const cloudResponse = await cloudinary.uploader.upload(fileUri.content, {
                resource_type: 'raw', // Ensure PDF files are uploaded correctly
                folder: 'resumes',    // Optional: Organize files in Cloudinary
            });
            // Update user profile with resume details
            user.profile.resume = cloudResponse.secure_url;
            user.profile.resumeOriginalName = file.originalname;
        }
        // Save updated user details to the database
        await user.save();
        // Send response
        return res.status(200).json({
            message: "Profile updated successfully.",
            user: {
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                phoneNumber: user.phoneNumber,
                role: user.role,
                profile: user.profile,
            },
            success: true,
        });
    } catch (error) {
        console.error("Error updating profile:", error);
        return res.status(500).json({
            message: "An error occurred while updating the profile.",
            success: false,
            error: error.message,
        });
    }
});

export {
    registerUser,
    loginUser,
    logOut,
    refreshToken,
    changePassword,
    getCurrentUser,
    updateAvatar,
    updateUserCoverImage,
    updateAccountDetails
};