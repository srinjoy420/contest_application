import {Router} from "express"

import { isLoggedIn } from "../middleware/auth.middleware.js"
import upload from "../middleware/multer.middleware.js"
import { createPost, likePost,unlikepost,commentpost } from "../controller/post.controller.js"


const postRouter=Router()
postRouter.post('/createpost',isLoggedIn,upload.single('media'),createPost)
postRouter.post('/:id/like',isLoggedIn,likePost)
postRouter.delete('/:id/like',isLoggedIn,unlikepost)
postRouter.post("/:id/comment",isLoggedIn,commentpost)
export default postRouter
