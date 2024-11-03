import { Router } from 'express';
const router = Router();
import { upload } from '../middlewares/multer.middleware.js';
import { verifyJwt } from '../middlewares/auth.middleware.js'
import { getCompany, getCompanyById, registerCompany, updateCompany } from '../controllers/company.controller.js';


// Uncomment these lines if you have defined the respective controllers
router.route('/register').post(verifyJwt, upload.fields([{ name: "logo", maxCount: 1 }]) ,registerCompany);
router.route('/get').get(verifyJwt, getCompany);
router.route('/get/:id').get(verifyJwt,getCompanyById);
router.route('/update/:id').post(verifyJwt, upload.single('logo') ,updateCompany);


export default router;
