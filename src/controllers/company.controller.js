import { compare } from "bcrypt";
import { Company } from "../models/company.model.js";
import { apiError } from "../utils.js/apiError.utils.js";
import { apiResponse } from "../utils.js/apiResponse.utils.js";
import { asyncHandler } from "../utils.js/asyncHandler.utils.js";
import { uploadOnCloudinary } from "../utils.js/cloudinary.utils.js";


const registerCompany = asyncHandler(async (req, res) => {
    const { companyName, location, website, description } = req.body;

    if (!companyName) {
        throw new apiError(404, "companyName is required");
    }
    let company = await Company.findOne({ companyName: companyName });
    if (company) {
        throw new apiError(401, "Company Name Already Exist");
    }
    const logoLocalFilePath = req.files?.logo[0]?.path;
    const logo = await uploadOnCloudinary(logoLocalFilePath);
    company = await Company.create({
        companyName: companyName,
        description: description,
        location: location,
        website: website,
        logo: logo.secure_url || null,
        userId: req.user._id
    })
    console.log("Created company is:", company);
    return res
        .status(200)
        .json(
            new apiResponse(200, company, "Company created successfully")
        )
});
const getCompany = asyncHandler(async (req, res) => {
    console.log("this is getCompany", req.user._id);
    const company = await Company.find({ userId: req.user?._id });
    // console.log(company);
    // Check if the company was found
    if (!company) {
        throw new apiError(404, "Company not found");
    }

    // Send response with company details
    return res.status(200).json(
        new apiResponse(200, company, "Company found successfully")
    );
});

const getCompanyById = asyncHandler(async (req, res) => {
    const company = await Company.findById(req.params.id);
    if (!company) {
        throw new apiError(404, "Company not found");
    }
    return res
        .status(200)
        .json(
            new apiResponse(200, company, "Company found successfully")
        )
})
const updateCompany = asyncHandler(async (req, res) => {
    const { companyName, description, website, location } = req.body;

    const logoLocalFilePath = req.file?.path;
    const logo = await uploadOnCloudinary(logoLocalFilePath);

    const updateData = {};
    if (companyName) updateData.companyName = companyName;
    if (description) updateData.description = description;
    if (website) updateData.website = website;
    if (location) updateData.location = location;
    if (logo) updateData.logo = logo?.secure_url;

    let company = await Company.findByIdAndUpdate(req.params.id,{"$set":updateData}, { new: true });
    if (!company) {
        throw new apiError(404, "Company not found");
    }
    return res.status(200).json(
        new apiResponse(200, company, "Company details updated successfully")
    );
});
export {
    registerCompany,
    getCompany,
    getCompanyById,
    updateCompany,
}