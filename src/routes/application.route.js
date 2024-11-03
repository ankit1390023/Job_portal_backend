import { application, Router } from 'express';
const router = Router();
import { verifyJwt } from '../middlewares/auth.middleware.js'
import { applyJob, getApplicants, getAppliedJobs, updateStatus } from '../controllers/application.controller.js';

// Uncomment these lines if you have defined the respective controllers
router.route('/applyJob/:id').get(verifyJwt,applyJob);
router.route('/getAppliedJobs').get(verifyJwt, getAppliedJobs);
router.route('/:id/getApplicants').get(verifyJwt, getApplicants);
router.route('/updateStatus/:id').get(verifyJwt, updateStatus);
export default router;
