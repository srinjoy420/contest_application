import {Router} from "express"
import { registerUser,login,currentUser,logout } from "../controller/auth.controller.js"
import { isLoggedIn } from "../middleware/auth.middleware.js"
import { validate } from "../middleware/validate.js"
import { registerSchema,loginSchema } from "../schemas/auth.schema.js"


const  authRouter=Router()
authRouter.post('/signup',validate(registerSchema),registerUser)
authRouter.post('/login',validate(loginSchema),login)
authRouter.get('/aboutme',isLoggedIn,currentUser)
authRouter.post('/logout',isLoggedIn,logout)
export default authRouter