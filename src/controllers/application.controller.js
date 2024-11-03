import { Application } from "../models/application.model.js";
import { Job } from "../models/job.model.js";
import { asyncHandler } from "../utils.js/asyncHandler.utils.js";
import { apiResponse } from "../utils.js/apiResponse.utils.js";
import { apiError } from "../utils.js/apiError.utils.js"; // Ensure apiError is imported

//job apply krne k liye
const applyJob = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const jobId = req.params.id;

    if (!jobId) {
        throw new apiError(404, "jobId is required");
    }

    const existingApplication = await Application.findOne({
        job: jobId,
        applicant: userId,
    });
    if (existingApplication) {
        throw new apiError(400, "You have already applied for this job");
    }

    const job = await Job.findById(jobId);
    if (!job) {
        throw new apiError(404, "Job not found");
    }

    const newApplication = await Application.create({
        job: jobId,
        applicant: userId,
    });

    await Job.findByIdAndUpdate(jobId, {
        $push: { applications: newApplication._id }
    });

    return res
        .status(200)
        .json(new apiResponse("Job applied successfully", newApplication))

});
// Get applied jobs
const getAppliedJobs = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    const appliedJobs = await Application.find({ applicant: userId })
        .sort({ createdAt: -1 })
        .populate({
            path: "job",
            options: { sort: { createdAt: -1 } },
            populate: {
                path: "company",
                options: { sort: { createdAt: -1 } },
            },
        });

    if (appliedJobs.length === 0) {
        throw new apiError(404, "You have not applied to any jobs yet");
    }

    return res.status(200).json(new apiResponse(200, appliedJobs));
});
// Get applicants for a particular job
const getApplicants = asyncHandler(async (req, res) => {
    const jobId = req.params.id;
    console.log("jobId", jobId);
    const job = await Job.findById(jobId).populate({
        path: 'applications', // Correct path here
        options: { sort: { createdAt: -1 } },
        populate: {
            path: 'applicant', // Ensure correct path for applicants
        },
    });
    console.log("job is", job);
    if (!job || !job.applications.length) {
        throw new apiError(404, "No one has applied for this job");
    }

    return res.status(200).json(new apiResponse(200, job));
});
// Update application status
const updateStatus = asyncHandler(async (req, res) => {
    const applicationId = req.params.id; // Fixed this line to access id properly
    const { status } = req.body;

    if (!status) {
        throw new apiError(400, "Status is required");
    }

    const application = await Application.findById(applicationId);
    if (!application) {
        throw new apiError(400, "Application not found");
    }

    // Update the status
    application.status = status.toLowerCase(); // Fixed method call
    await application.save();

    return res.status(200).json(new apiResponse(200, application, "Application status updated successfully"));
});
export {
    applyJob,
    getAppliedJobs,
    getApplicants,
    updateStatus
};