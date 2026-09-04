import { prisma } from "../lib/DB.js";
import { getGlobalRanking, getCategoryRankings, getConsistencyRanking } from "./userServiceClient.js";


export async function processKyc(winnerId, passed) {
  const winner = await prisma.winner.findUnique({ where: { id: winnerId } });
  if (!winner) throw new Error('Winner not found');
  if (winner.status !== 'ACTIVE') throw new Error('Winner is not currently active');

  await prisma.kycRequest.upsert({
    where: { winnerId },
    update: { status: passed ? 'PASSED' : 'FAILED', reviewedAt: new Date() },
    create: { winnerId, status: passed ? 'PASSED' : 'FAILED', reviewedAt: new Date() }
  });

  if (passed) {
    return { winner, replacement: null };
  }


  await prisma.winner.update({
    where: { id: winnerId },
    data: { status: 'CASCADED' }
  });


  const replacement = await findNextCandidate(winner);

  if (!replacement) {

    return { winner, replacement: null };
  }

  const newWinner = await prisma.winner.create({
    data: {
      userId: replacement.userId,
      tier: winner.tier,
      category: winner.category,
      rank: winner.rank,
      score: replacement.score,
      status: 'ACTIVE',
      cascadedFromId: winner.id
    }
  });

  return { winner, replacement: newWinner };
}


async function findNextCandidate(winner) {
  const activeWinnerIds = await getActiveWinnerUserIds();

  let ranking;
  switch (winner.tier) {
    case 'GRAND_PRIZE':
    case 'TOP_PERFORMER':
      ranking = await getGlobalRanking();
      break;
    case 'CONSISTENCY_1ST':
    case 'CONSISTENCY_2ND':
      ranking = await getConsistencyRanking();
      break;
    case 'CATEGORY_1ST':
    case 'CATEGORY_2ND': {
      const allCategories = await getCategoryRankings();
      ranking = allCategories[winner.category] || [];
      break;
    }
    default:
      throw new Error(`Unknown tier: ${winner.tier}`);
  }

  for (const candidate of ranking) {
    const userId = String(candidate.creator);
    if (userId === winner.userId) continue;       
    if (activeWinnerIds.has(userId)) continue;    
    return { userId, score: candidate.score };
  }

  return null; 
}

async function getActiveWinnerUserIds() {
  const active = await prisma.winner.findMany({
    where: { status: 'ACTIVE' },
    select: { userId: true }
  });
  return new Set(active.map(w => w.userId));
}

