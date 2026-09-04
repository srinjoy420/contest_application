import { prisma } from "../lib/DB.js";
import { getGlobalRanking, getCategoryRankings, getConsistencyRanking } from "./userServiceClient.js";




export async function runCascade() {
  const activeWinner = await prisma.winner.findFirst({ where: { status: 'ACTIVE' } });
  if (activeWinner) {
    throw new Error('Active winners already exist; cascade has already been run');
  }

  const winnersByUser = new Map(); 
  const winnerRows = [];           
  const global = await getGlobalRanking();      
  const category = await getCategoryRankings();  
  const consistency = await getConsistencyRanking(); 
  function isAvailable(userId) {
    return !winnersByUser.has(userId);
  }

  function assign(userId, tier, extra = {}) {
    const entry = { userId, tier, ...extra };
    winnersByUser.set(userId, entry);
    winnerRows.push(entry);
    return entry;
  }

  // ---- Tier 1: Grand Prize ----
  for (const candidate of global) {
    const userId = String(candidate.creator);
    if (isAvailable(userId)) {
      assign(userId, 'GRAND_PRIZE', { score: candidate.score, rank: 1 });
      break; // only one
    }
  }

  // ---- Tier 2 & 3: Consistency 1st, 2nd ----
  const consistencyTiers = ['CONSISTENCY_1ST', 'CONSISTENCY_2ND'];
  let consistencyIdx = 0;
  for (const candidate of consistency) {
    if (consistencyIdx >= consistencyTiers.length) break;
    const userId = String(candidate.creator);
    if (isAvailable(userId)) {
      assign(userId, consistencyTiers[consistencyIdx], { score: candidate.score, rank: consistencyIdx + 1 });
      consistencyIdx++;
    }
  }

  
  let topPerformerRank = 0;
  for (const candidate of global) {
    if (topPerformerRank >= 10) break;
    const userId = String(candidate.creator);
    if (isAvailable(userId)) {
      assign(userId, 'TOP_PERFORMER', { score: candidate.score, rank: topPerformerRank + 1 });
      topPerformerRank++;
    }
  }

 

  await assignCategoryTier(category, winnersByUser, winnerRows, 'CATEGORY_1ST', 0);
  await assignCategoryTier(category, winnersByUser, winnerRows, 'CATEGORY_2ND', 1);

  
  await prisma.$transaction(
    winnerRows.map(w =>
      prisma.winner.create({
        data: {
          userId: w.userId,
          tier: w.tier,
          category: w.category || null,
          rank: w.rank,
          score: w.score,
          status: 'ACTIVE'
        }
      })
    )
  );

  return winnerRows;
}


async function assignCategoryTier(categoryRankings, winnersByUser, winnerRows, tierName, positionIndex) {
  const categories = Object.keys(categoryRankings);

  
  const provisional = {}; 

  for (const cat of categories) {
    const ranking = categoryRankings[cat];
    let picked = null;
    let pickedIdx = -1;

    for (let i = 0; i < ranking.length; i++) {
      const userId = String(ranking[i].creator);
      if (!winnersByUser.has(userId)) {
        picked = { userId, score: ranking[i].score };
        pickedIdx = i;
        break;
      }
    }

    provisional[cat] = { picked, nextSearchIdx: pickedIdx + 1 };
  }


  let hasCollision = true;
  while (hasCollision) {
    hasCollision = false;

    const byUser = new Map(); 
    for (const cat of categories) {
      const p = provisional[cat].picked;
      if (!p) continue;
      if (!byUser.has(p.userId)) byUser.set(p.userId, []);
      byUser.get(p.userId).push(cat);
    }

    for (const [userId, cats] of byUser.entries()) {
      if (cats.length <= 1) continue;
      hasCollision = true;

      let bestCat = cats[0];
      for (const c of cats) {
        if (provisional[c].picked.score > provisional[bestCat].picked.score) bestCat = c;
      }

      for (const c of cats) {
        if (c === bestCat) continue;

        
        const ranking = categoryRankings[c];
        let nextIdx = provisional[c].nextSearchIdx;
        let newPick = null;

        while (nextIdx < ranking.length) {
          const candidateId = String(ranking[nextIdx].creator);
          const alreadyProvisional = Object.values(provisional).some(
            p => p.picked && p.picked.userId === candidateId
          );
          if (!winnersByUser.has(candidateId) && !alreadyProvisional) {
            newPick = { userId: candidateId, score: ranking[nextIdx].score };
            nextIdx++;
            break;
          }
          nextIdx++;
        }

        provisional[c] = { picked: newPick, nextSearchIdx: nextIdx };
      }
    }
  
  }

  
  for (const cat of categories) {
    const p = provisional[cat].picked;
    if (!p) continue; 

    const entry = { userId: p.userId, tier: tierName, category: cat, score: p.score, rank: positionIndex + 1 };
    winnersByUser.set(p.userId, entry);
    winnerRows.push(entry);
  }
}

