import {Router} from "express"
import { registerUser,login,currentUser,logout } from "../controller/auth.controller.js"
import { isLoggedIn } from "../middleware/auth.middleware.js"

const  authRouter=Router()
authRouter.post('/signup',registerUser)
authRouter.post('/login',login)
authRouter.get('/aboutme',isLoggedIn,currentUser)
authRouter.post('/logout',isLoggedIn,logout)
export default authRouter