import jwt from "jsonwebtoken"
import config from "../config/config.js"
export const isLoggedIn=(req,res,next)=>{
    try {
        const token=req.cookies?.accessToken
        console.log("token found",token ?"yes":"no");
        if(!token){
            return res.status(401).json({message:"the token not found"})
        }
        const decode=jwt.verify(token,config.accessTokenSecret)
        req.user = {
            ...decode,
            id: decode.id || decode._id?.toString?.() || decode._id
        }
        next()
        
    } catch (error) {
        console.log("Authentication middleware failed",error.message);
        return res.status(401).json({message:"Invalid or expired token"})
        
        
    }
}