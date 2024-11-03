import mongoose from 'mongoose';
const jobSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Please add a job title"],
        // trim: true,
        // maxlength: [100, "Job title cannot be more than 100 characters"]
    },
    description: {
        type: String,
        required: [true, "Please add a job description"],
        // trim: true
    },
    requirements: [
        {
            type: String,
        }
    ],
    salary: {
        type: Number,
        required: [true, "Please add a salary range"]
    },
    location: [{
        type: String,
        required: [true, "Please add a job location"],
        trim: true
    }],
    jobType: {
        type: String,
        required: true
    },
    experience: {
        type: Number,
        default:0,
    },
    position: {
        type: Number,
        required: [true, "Please add a job position"],
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: [true, "Please add the company name"],
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, "Please add the user name"],
    },
    applications: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Application',
        }
    ],
}, { timestamps: true });

const Job = mongoose.model('Job', jobSchema);

export { Job };
