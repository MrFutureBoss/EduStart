import mongoose from "mongoose"; 

// Method connect to database
const connectDB = () => {
    try {
        const db = mongoose.connect(process.env.URI_MONGODB);
        console.log("Connected to MongoDB successfully"); 
        return db;
    } catch (errors) {
        console.log(errors.toString());
    }
}
export default connectDB;