import Ranking from "../model/Ranking.model.js";
import { computeGlobalRanking,computeCategoryRankings,computeConsistencyRanking } from "../services/rankEngine.js";

export async function recomputeRankings() {
  console.log("[ranking job] recomputing rankings...");
  const start = Date.now();

  const [global, category, consistency] = await Promise.all([
    computeGlobalRanking(),
    computeCategoryRankings(),
    computeConsistencyRanking()
  ]);

  await Promise.all([
    Ranking.findOneAndUpdate(
      { type: "global" },
      { data: global, computedAt: new Date() },
      { upsert: true }
    ),
    Ranking.findOneAndUpdate(
      { type: "category" },
      { data: category, computedAt: new Date() },
      { upsert: true }
    ),
    Ranking.findOneAndUpdate(
      { type: "consistency" },
      { data: consistency, computedAt: new Date() },
      { upsert: true }
    )
  ]);

  console.log(`[ranking job] done in ${Date.now() - start}ms`);
}