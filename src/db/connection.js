import mongoose from "mongoose";
const connectDB = async () => {
    try {
        mongoose.connect(process.env.MONGODB_URL);
        console.log("MONGODB CONNECTED SUCCESSFULLY");
    } catch (error) {
        console.log("MONGODB CONNECTION ID FAILED", error.message);
    }
}
export { connectDB };
