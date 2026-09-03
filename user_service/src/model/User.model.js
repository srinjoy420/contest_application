import mongoose,{Schema} from "mongoose";
import dotenv from "dotenv"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
dotenv.config()
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
            name:this.name,
            email:this.email
        },
        process.env.ACESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY || "5d"
        }
    )

}
userSchema.methods.generateRfreshToken=function(){
    return jwt.sign(
        {
            _id:this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {expiresIn:process.env.REFRESH_TOKEN_EXPIRY || "1d"}
    )
}
const User=mongoose.model("User",userSchema)
export default User