import express from "express"
import dotenv from "dotenv"
import cors from "cors"

import cookieparser from "cookie-parser"
import { runCascade } from "./services/casecadeEngine.js"
dotenv.config()

const app=express()
app.use(express.json())
app.use(cookieparser())
app.use(cors({
    origin:"http://localhost:5173",
    credentials:true,
    methods:["GET","POST","PUT","DELETE"]
}))


const port=process.env.PORT || 5000


app.get("/",(req,res)=>{
    res.send("hello server is running")
})
app.post("/api/v1/admin/run-cascade", async (req, res) => {
    if (req.headers["x-internal-secret"] !== process.env.INTERNAL_SERVICE_SECRET) {
        return res.status(403).json({ error: "Forbidden" })
    }

    try {
        const winners = await runCascade()
        return res.status(201).json({ winners })
    } catch (error) {
        console.error("Cascade failed:", error)
        return res.status(409).json({ error: error.message })
    }
})
app.listen(port,()=>{
    console.log(`app is running on port ${port}`);
    
})
