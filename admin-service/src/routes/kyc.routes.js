import {Router} from "express"
import { validate } from "../middleware/validate.js"
import { kycSchema } from "../schemas/kyc.schema.js"
import { getwinners,winnerByid } from "../controllers/kyc.controller.js"
const kycRouter=Router()
kycRouter.get("/winners",getwinners)
kycRouter.patch("/winners/:id/kyc",validate(kycSchema),winnerByid)


export default kycRouter