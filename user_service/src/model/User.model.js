import mongoose,{Schema} from "mongoose";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import config from "../config/config.js"
const userSchema=new Schema({
    name:{
        type:String,
        required:true,
        trim:true
        
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true
    },
    password:{
        type:String,
        required:true,
        
    },
    residency:{
        type:String,
        required:true
    },
    role:{
        type:String,
        enum:["user","admin"],
        default:"user"
    },
    
    
    
    refreshToken:{
        type:String
    },
    
},{timestamps:true})
userSchema.pre("save",async function() {
    if(!this.isModified("password")) return
    this.password=await bcrypt.hash(this.password,10)
    
})

userSchema.methods.comparePassword=async function(password){
    return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAcessToken=function(){
    return jwt.sign(
        {
            _id:this._id,
            id:this._id.toString(),
            name:this.name,
            email:this.email,
            role:this.role
        },
        config.accessTokenSecret,
        {
            expiresIn:config.accessTokenExpiry || "5d"
        }
    )

}
userSchema.methods.generateRfreshToken=function(){
    return jwt.sign(
        {
            _id:this._id
        },
        config.refreshTokenSecret,
        {expiresIn:config.refreshTokenExpiry || "1d"}
    )
}
const User=mongoose.model("User",userSchema)
export default User