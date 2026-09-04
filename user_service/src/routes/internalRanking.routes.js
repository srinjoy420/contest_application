import {Router} from "express"
import { requireInternalAuth } from "../middleware/requireInternalAuth.js"
import { getWeekNumber,comparePosts,getEligibleUserIds,computeGlobalRanking,computeCategoryRankings,computeConsistencyRanking } from "../services/rankEngine.js"


const rankingroute=Router()

rankingroute.get('/global',requireInternalAuth,async(req,res)=>{
    const ranking=await computeGlobalRanking()
  res.json(ranking)
})
rankingroute.get('/category', requireInternalAuth, async (req, res) => {
  const ranking = await computeCategoryRankings();
  res.json(ranking);
});
rankingroute.get('/consistency', requireInternalAuth, async (req, res) => {
  const ranking = await computeConsistencyRanking();
  res.json(ranking);
});



export default rankingroute