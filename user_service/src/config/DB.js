import mongoose from "mongoose"
import config from "./config.js"

const ConnectDB=async()=>{
    try {
        await mongoose.connect(config.mongoUri)
        console.log("connect to database succesfully");

       
    } catch (error) {
        console.log("There is a problem to connect mongoDb",error);
        process.exit(1)
        
    }
}
export default ConnectDB