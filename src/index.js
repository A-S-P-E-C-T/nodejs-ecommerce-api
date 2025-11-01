import dotenv from "dotenv";
import { app } from "./app.js";
import { connectDB } from "./db/database.js";

dotenv.config({ path: "./.env" });

(async () => {
    try {
        await connectDB();

        app.on("error", (error) => {
            console.error("EXPRESS APP ERROR: ", error);
        });

        const port = process.env.PORT || 5000;

        app.listen(port, () => {
            console.log(`🚀 Server is running at port: ${port}`);
        });
    } catch (error) {
        console.error("❌ FAILED to start server: ", error);
        process.exit(1);
    }
})(); //IIFE
