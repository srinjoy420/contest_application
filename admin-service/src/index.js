import express from "express"
import cors from "cors"

import cookieparser from "cookie-parser"
import kycRouter from "./routes/kyc.routes.js"
import adminRoutes from "./routes/admin.routes.js"
import config from "./config/config.js"

const app=express()
app.use(express.json())
app.use(cookieparser())
app.use(cors({
    origin:"http://localhost:5173",
    credentials:true,
    methods:["GET","POST","PUT","DELETE"]
}))


const port=config.port || 5000


app.get("/",(req,res)=>{
    res.send("hello server is running")
})
app.use('/api/v1/admin',kycRouter)
app.use('/api/v1/admin',adminRoutes)
app.listen(port,()=>{
    console.log(`app is running on port ${port}`);
    
})
