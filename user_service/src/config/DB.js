import mongoose from "mongoose"
import dotenv from "dotenv"
dotenv.config()

const ConnectDB=async()=>{
    try {
        await mongoose.connect(process.env.MONGO_URI)
        console.log("connect to database succesfully");

       
    } catch (error) {
        console.log("There is a problem to connect mongoDb",error);
        process.exit(1)
        
    }
}
export default ConnectDB