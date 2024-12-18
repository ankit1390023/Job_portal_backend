import { registerUser, loginUser, logOut, refreshToken, changePassword, getCurrentUser, updateAvatar, updateUserCoverImage, updateAccountDetails } from '../controllers/user.controller.js';
import { Router } from 'express';
const router = Router();
import { upload } from '../middlewares/multer.middleware.js';
import { verifyJwt } from '../middlewares/auth.middleware.js'
import { singleUpload } from '../middlewares/fileMulter.middleware.js';

router.route('/register').post(
    upload.fields([
        { name: "avatar", maxCount: 1 },
        { name: "coverImage", maxCount: 1 }
    ]),
    registerUser
);

// Uncomment these lines if you have defined the respective controllersz
router.route('/login').post(loginUser);
router.route('/logout').post(verifyJwt,logOut);
router.route('/refreshToken').post(refreshToken);
router.route('/changePassword').post(verifyJwt, changePassword);
router.route('/profile').get(verifyJwt, getCurrentUser);
router.route('/avatar').patch(verifyJwt,upload.single("avatar"), updateAvatar);
router.route('/coverImage').post(verifyJwt, upload.single("coverImage"), updateUserCoverImage);

router.route('/update-account').patch(verifyJwt,singleUpload,updateAccountDetails);

export default router;
