// const asyncHandler = (requestHandler) => {
//     return async (req, res, next) => {
//         Promise.resolve(requestHandler(req, res, next))
//             .catch((error) => {
//                 next(error);
//                 });
//     }
// }
// export { asyncHandler };

import { apiError } from "./apiError.utils.js";

const asyncHandler = (requestHandler) => {
    return async (req, res, next) => {
        try {
            await requestHandler(req, res, next);
        } catch (error) {
            if (error instanceof apiError) {
                // Handle custom API errors
                return res.status(error.statusCode || 500).json({
                    success: false,
                    message: error.message,
                    errors: error.errors,
                });
            }
            // Handle other unexpected errors
            return res.status(500).json({
                success: false,
                message: "Internal Server Error",
                errors: [error.message],
            });
        }
    };
};
export { asyncHandler };
