import { asyncHandler } from "../utils.js/asyncHandler.utils.js";
import { apiError } from "../utils.js/apiError.utils.js";
import { User } from "../models/user.model.js";
import { apiResponse } from "../utils.js/apiResponse.utils.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils.js/cloudinary.utils.js";
import jwt from 'jsonwebtoken';
// import { generateToken } from '../models/user.model.js';
import bcrypt from 'bcrypt';

const generateAcessTokenAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        console.log(user)
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
    const { fullName, email, password, phoneNumber, role, bio = "" } = req.body; // Default bio to an empty string if not provided

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new apiError(400, "Email Already Exists");
    }

    // req.files from multer middleware
    const avatarLocalFilePath = req.files?.avatar?.[0]?.path;
    const coverImageLocalFilePath = req.files?.coverImage?.[0]?.path;

    // Upload to Cloudinary (assuming `uploadOnCloudinary` is a function that returns an object with `secure_url`)
    const avatar = avatarLocalFilePath ? await uploadOnCloudinary(avatarLocalFilePath) : null;
    const coverImage = coverImageLocalFilePath ? await uploadOnCloudinary(coverImageLocalFilePath) : null;

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

    const { email, fullName, password } = req.body;

    const user = await User.findOne({
        $or: [{ email: email }, { fullName: fullName }]
    });


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
    console.log("decodedToken", decodedToken)
    //ye decodedToken conatain kr rha h user ki _id,ye hr haal, me verify hoga ydi incomingrefreshToken ka structure shi h,but,problem is that,how to check this is actual user ki hi _id h, kisi dusre ki bhi to _id ho skti h.. ese check krne k liye   (incomingRefreshToken != user.refreshToken) ese check kro
    const user = await User.findById(decodedToken._id);
    if (!user) {
        throw new apiError(400, "Unauthorized access due to invalid refrshtoken");
    }
    console.log("user is", user)
    console.log("user.refreshToken", user.refreshToken);
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
    const { oldPassowrd, newPassword } = req.body;
    // console.log("oldPassword", oldPassowrd);
    // console.log("newPassword", newPassword);
    const user = await User.findById(req.user?._id);
    // console.log(user);
    const isPasswordCorrect = await user.comparePassword(oldPassowrd);
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
    console.log(user);
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
    const { fullName, email, phoneNumber, bio, skills, role } = req.body;
    const updateFields = {};

    // Update only provided fields
    if (fullName) updateFields.fullName = fullName;
    if (email) updateFields.email = email;
    if (phoneNumber) updateFields.phoneNumber = phoneNumber;
    if (role) updateFields.role = role;

    // Profile-specific updates
    let updateProfile = {};
    if (bio) updateProfile.bio = bio;
    if (skills) {
        const skillsArray = skills.split(',').map(skill => skill.trim());
        updateProfile.skills = skillsArray;
    }
    // const myString = "apple,banana,orange";  // Example string
    // const array = myString.split(',');        // Split the string into an array


    // Add profile updates if any exist
    if (Object.keys(updateProfile).length > 0) { //check kr rha h ki updateProfile ka length kitna h,ydi 0 h, to profile me koi change nhi hua h,i.e (Skill,bio) no change ,ydi esa h to updateFiels ke profile me updateProfile ko update kr do,otherwise,leave as it is
        updateFields.profile = updateProfile;
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        { $set: updateFields },
        { new: true }
    ).select('-password');

    // Handle case where user is not found
    if (!user) {
        return res.status(404).json(
            new apiResponse(404, null, "User not found")
        );
    }
   
    return res.status(200).json(
        new apiResponse(200, user, "User Account Details Updated Successfully")
    );
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
