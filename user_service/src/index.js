import express from "express"

import cookieparser from "cookie-parser"
import dotenv from "dotenv"
import cors from "cors"
import ConnectDB from "./config/DB.js"
import authRouter from "./routes/user.routes.js"
import postRouter from "./routes/post.routes.js"

dotenv.config()




const app=express()

app.use(express.json())
app.use(cookieparser())
app.use(cors({
    origin:"http://localhost:5173",
    credentials:true,
    methods:["GET","POST","PUT","DELETE"]
}))
const port=process.env.PORT || 3000

app.get("/",(req,res)=>{
    res.send("hello server is running")
})
app.use("/api/v1/auth",authRouter)
app.use("/api/v1/post",postRouter)
ConnectDB()

app.listen(port,()=>{
    console.log(`app is running on port ${port}`);
    
})
