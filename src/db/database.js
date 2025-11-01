import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error(
                "FATAL: MONGODB_URI is not defined in the .env file."
            );
        }

        const connectionInstance = await mongoose.connect(
            process.env.MONGODB_URI,
            {
                dbName: DB_NAME,
            }
        );
        console.log(
            `\n✅ MongoDB connected! DB HOST: ${connectionInstance.connection.host}`
        );
    } catch (error) {
        console.error("❌ MONGODB connection error: ", error);
        throw error;
    }
};

export { connectDB };
