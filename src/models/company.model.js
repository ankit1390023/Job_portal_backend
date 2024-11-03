import mongoose from "mongoose";
// Define the company schema
const companySchema = new mongoose.Schema({
    companyName: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    website: {
        type: String,
        trim: true,
    },
    location: {
        type: String,
        required: true,
        trim: true,
    },
    logo: {
        type: String,
        required: true,
        trim:true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required:true
     }
},{timestamps:true});

// Create the company model
const Company = mongoose.model('Company', companySchema);
export { Company };
