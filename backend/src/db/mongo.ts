import mongoose from "mongoose";

export async function connectDB() {
    const dbUri = process.env.MONGODB_URI;
    if (!dbUri) throw new Error("MONGODB_URI is not set"); 
    
    await mongoose.connect(dbUri, {
        dbName: process.env.MONGODB_DBNAME || undefined
    });
}