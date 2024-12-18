import { User } from "../models/user.model.js";
import jwt from 'jsonwebtoken';
import { apiError } from "../utils.js/apiError.utils.js";
import { asyncHandler } from "../utils.js/asyncHandler.utils.js";


const verifyJwt = asyncHandler(async (req, res, next) => {
    // Extract token from cookies or Authorization header
    const token = req.cookies?.accessToken || req.headers.authorization?.split(' ')[1];

    {/*ydi frontend me 
     1. withCredential=true krte h to req.cookies ke ander accessToken aega 
     2. ydi headers ke ander token pass krte h ex:  'Authorization': `Bearer ${token}` 
   */}
    
    if (!token) {
        throw new apiError(401, "ACCESS DENIED: NO TOKEN PROVIDED");
    }

    // Verify the token
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    // console.log("decoded token is ", decodedToken);
    // Find user by ID in the decoded token
    const user = await User.findById(decodedToken._id).select('-password -refreshToken');

    if (!user) {
        throw new apiError(401, "ACCESS DENIED: USER NOT FOUND");
    }
    // console.log('user is', user);
    // Attach the user to the request object
    req.user = user;
    next();
});

export { verifyJwt };
