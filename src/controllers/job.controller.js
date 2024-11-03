import { Job } from "../models/job.model.js";
import { apiError } from "../utils.js/apiError.utils.js";
import { asyncHandler } from "../utils.js/asyncHandler.utils.js";
import { apiResponse } from "../utils.js/apiResponse.utils.js";
import mongoose from 'mongoose';

const postJob = asyncHandler(async (req, res) => {
    const { title, description, requirements, salary, location, jobType, position, companyId,experience} = req.body;

    // Check for required fields
    if (!title || !description || !requirements || !salary || !location || !experience || !jobType || !position || !companyId) {
        throw new apiError(400, "All fields are required");
    }

    console.log("Received job data:", req.body); // Debugging log

    // Create the new job
    const newJob = await Job.create({
        title,
        description,
        requirements: requirements.split(",").map(req => req.trim()), // Trimming spaces
        salary: Number(salary), // Convert salary to number
        location: Array.isArray(location) ? location : location.split(",").map((loc) => loc.trim()), // Ensure location is an array
        jobType,
        experience,
        position,
        company: companyId,
        created_by: req.user._id // Assuming user ID comes from auth middleware
    });

    return res.status(201).json(new apiResponse(201, newJob, "Job Posted Successfully"));
});

const getAllJobs = asyncHandler(async (req, res) => {
    const keyword = req.query.keyword || "";
    const query = {
        $or: [
            { title: { $regex: keyword, $options: "i" } },
            { description: { $regex: keyword, $options: "i" } }
        ]
    };
    const jobs = await Job.find(query)
        .populate({ path: "company" })
        .sort({ createdAt: -1 }); // Assuming you have createdAt field in your job model

    if (!jobs || jobs.length == 0) {
        throw new apiError(404, "No jobs found");
    }

    return res.status(200).json(new apiResponse(200, jobs, "Jobs Retrieved Successfully"));
});

const getJobById = asyncHandler(async (req, res) => {
    const jobId = req.params.id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
        throw new apiError(400, "Invalid Job ID");
    }

    const job = await Job.findById(jobId).populate({ path: "company" });
    if (!job) {
        throw new apiError(404, "Job not found");
    }

    return res.status(200).json(new apiResponse(200, job, "Job Retrieved Successfully"));
});

const getJobsByAdmin = asyncHandler(async (req, res) => {
    const adminId = req.user?._id;

    // Validate adminId
    if (!adminId) {
        throw new apiError(403, "Admin ID not found");
    }

    const jobs = await Job.find({ created_by: adminId })
        .populate({ path: 'company' });

    if (!jobs || jobs.length == 0) {
        throw new apiError(404, "No jobs found");
    }

    return res.status(200).json(new apiResponse(200, jobs, "Jobs Retrieved Successfully"));
});

export {
    postJob,
    getAllJobs,
    getJobById,
    getJobsByAdmin
};
