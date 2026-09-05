import { Router } from "express";
import {
    getCategoryRankingsController,
    getConsistencyRankings,
    getGlobalRankings,
    runAdminCascade
} from "../controllers/admin.controller.js";

const adminRouter = Router();

adminRouter.get("/rankings/global", getGlobalRankings);
adminRouter.get("/rankings/category", getCategoryRankingsController);
adminRouter.get("/rankings/consistency", getConsistencyRankings);
adminRouter.post("/run-cascade", runAdminCascade);

export default adminRouter;