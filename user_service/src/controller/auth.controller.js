import User from "../model/User.model.js";
export const generateAccessTokenRefreshToken = async (userId) => {
    const user = await User.findById(userId)
    if (!user) {
        throw new Error("user not found")
    }
    try {
        const accessToken = user.generateAcessToken()
        const refreshToken = user.generateRfreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })
        return { accessToken, refreshToken }
    } catch (error) {
        console.log("cant generate AcessTokrn rfreshToken", error);
        throw new Error("cant generate accessTokrn")

    }
}
export const registerUser=async(req,res)=>{
     const { name, email, password,residency } = req.body

    
    if (!name || !email || !password || !residency) {
        return res.status(400).json({ message: "All credentials are required" })
    }
    if (residency.trim().toLowerCase() !== "chhattisgarh") {
        return res.status(400).json({message:"your are from other "})
    }
    try{
        const existingUser = await User.findOne({ email })
        if (existingUser) {
            return res.status(400).json({ message: "User already exists, please login" })
        }
         const user = await User.create({ name, email, password,residency })
          const { accessToken, refreshToken } = await generateAccessTokenRefreshToken(user._id)
          const cookieOptions = {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            path: "/",
            maxAge: 24 * 60 * 60 * 1000
        }
        res.cookie("accessToken", accessToken, cookieOptions)
        res.cookie("refreshToken", refreshToken, cookieOptions)
        return res.status(201).json({
            message: "User registered successfully. Please verify your email.",
            user
        })
    }
    catch(error){
         console.log("Failed to register", error)
        return res.status(500).json({ message: "Registration failed, please try again" })
    }

}
export const login=async(req,res)=>{
     const {  email, password } = req.body

    
    if ( !email || !password) {
        return res.status(400).json({ message: "All credentials are required" })
    }
    try {
        const user=await User.findOne({email})
        if(!user){
            return res.status(404).json({message:"the user not found please create a account first "})

        }
        const isPasswordMatch=await user.comparePassword(password)
        if(!isPasswordMatch){
            return res.status(400).json({message:"password not match"})
        }
        const {accessToken,refreshToken}=await generateAccessTokenRefreshToken(user._id)
        const cookieOptions = {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            path: "/",
            maxAge: 24 * 60 * 60 * 1000
        }
        res.cookie("accessToken", accessToken, cookieOptions)
        res.cookie("refreshToken", refreshToken, cookieOptions)
        const loggedinUser=await User.findById(user._id).select("-password -refreshToken")
        res.status(200).json({message:"the user loggedin succesfully", user: loggedinUser})
    } catch (error) {
         console.log("there was a problem in loggedin",error);
        res.status(400).json({message:" the user cant loggedin"})
        
    }
}
export const currentUser=async(req,res)=>{
 try {
       const userId=req.user?._id
       const user=await User.findById(userId).select("-password -refreshToken")
       if(!user){
           return res.status(401).json({message: "User not found or not logged in"})
       }
       return res.status(200).json({
         success: true,
         message: "account fetched succesfully",
         user
       })
 } catch (error) {
    console.log("the problem to fetched the user", error)
    return res.status(400).json({ message: "cant find the user please try again later" })
 }
}
export const logout=async(req,res)=>{
    try {
        const cookieOptions = {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      expires: new Date(0),
    }
    res.cookie("accessToken", "", cookieOptions)
    res.cookie("refreshToken", "", cookieOptions)
     return res.status(200).json({
      success: true,
      message: "loggedout succesfully"
    })
    } catch (error) {
        console.log("problem in loggingout", error)
    return res.status(500).json({ message: "something went wrong" })
    }
}