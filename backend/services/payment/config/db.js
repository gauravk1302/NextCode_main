import mongoose from "mongoose";

const connectDB = async () =>{
    try {
       await mongoose.connect(process.env.MONGODB_URI);
       console.log("DB connected.") 
    } catch (error) {
        console.log(`DB error ${error}.`)
    }
}

export default connectDB;