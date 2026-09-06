import express from "express"
import cron from "node-cron"
import cookieparser from "cookie-parser"
import cors from "cors"
import config from "./config/config.js"
import ConnectDB from "./config/DB.js"
import authRouter from "./routes/user.routes.js"
import postRouter from "./routes/post.routes.js"
import rankingroute from "./routes/internalRanking.routes.js"
import { recomputeRankings } from "./job/rankingJob.js"


const app=express()

app.use(express.json())
app.use(cookieparser())
app.use(cors({
    origin:"http://localhost:5173",
    credentials:true,
    methods:["GET","POST","PUT","DELETE"]
}))
const port=config.port || 3000

app.get("/",(req,res)=>{
    res.send("hello server is running")
})
app.use("/api/v1/auth",authRouter)
app.use("/api/v1/post",postRouter)
app.use("/api/v1/ranking",rankingroute)
//corns job runs every 5 min adjust based on fresh rankings need to be 
cron.schedule("*/5 * * * *", () => {
  recomputeRankings().catch(err => console.error("[ranking job] failed:", err));
});
recomputeRankings().catch(err => console.error("[ranking job] initial run failed:", err));
ConnectDB()

app.listen(port,()=>{
    console.log(`app is running on port ${port}`);
    
})
