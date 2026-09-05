import {z} from "zod"
import { CATEGORIES } from "../model/Post.model.js"
export const createPostSchema = z.object({
  caption: z.string().max(500).optional(),
  category: z.enum(CATEGORIES, {
    errorMap: () => ({ message: `category must be one of: ${CATEGORIES.join(', ')}` })
  })
});

export const commentSchema = z.object({
  text: z.string().trim().min(1, 'Comment text is required').max(1000)
});
