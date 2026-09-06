import { Router } from "express";
import {
    getCategoryRankingsController,
    getConsistencyRankings,
    getGlobalRankings,
    runAdminCascade
} from "../controllers/admin.controller.js";
import { isAdmin, isLoggedIn } from "../middleware/auth.middleware.js";

const adminRouter = Router();
adminRouter.use(isLoggedIn, isAdmin);

adminRouter.get("/rankings/global", getGlobalRankings);
adminRouter.get("/rankings/category", getCategoryRankingsController);
adminRouter.get("/rankings/consistency", getConsistencyRankings);
adminRouter.post("/run-cascade", runAdminCascade);

export default adminRouter;