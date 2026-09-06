import {Router} from "express"

import { requireInternalAuth } from "../middleware/requireInternalAuth.js"
import { getWeekNumber,comparePosts,getEligibleUserIds,computeGlobalRanking,computeCategoryRankings,computeConsistencyRanking } from "../services/rankEngine.js"
import Ranking from "../model/Ranking.model.js"


const rankingroute=Router()

rankingroute.get("/global", requireInternalAuth, async (req, res) => {
  const ranking = await Ranking.findOne({ type: "global" });
  res.json(ranking ? ranking.data : []);
});

rankingroute.get("/category", requireInternalAuth, async (req, res) => {
  const ranking = await Ranking.findOne({ type: "category" });
  res.json(ranking ? ranking.data : {});
});

rankingroute.get("/consistency", requireInternalAuth, async (req, res) => {
  const ranking = await Ranking.findOne({ type: "consistency" });
  res.json(ranking ? ranking.data : []);
});



export default rankingroute