import { CONTEST_START_DATE, ELIGIBLE_RESIDENCY,CONSISTENCY_WEEKS,CONSISTENCY_MIN_POSTS_PER_WEEK,CONSISTENCY_TOP_N_PER_WEEK } from "../config/contest.js";
import Post, { CATEGORIES } from "../model/Post.model.js";
import User from "../model/User.model.js";





export function getWeekNumber(date) {
  const msPerDay = 24 * 60 * 60 * 1000;
  const days = Math.floor((new Date(date) - CONTEST_START_DATE) / msPerDay);
  if (days < 0) return null; // post predates contest — shouldn't happen with clean data
  return Math.floor(days / 7) + 1; // weeks are 1-indexed
}


export function comparePosts(a, b) {
  if (b.counts.comments !== a.counts.comments) return b.counts.comments - a.counts.comments;
  if (b.counts.views !== a.counts.views) return b.counts.views - a.counts.views;
  return new Date(a.createdAt) - new Date(b.createdAt); // earlier wins
}

export async function getEligibleUserIds() {
  const users = await User.find({ residency: ELIGIBLE_RESIDENCY }).select('_id').lean();
  return new Set(users.map(u => String(u._id)));
}


export async function computeGlobalRanking() {
  const eligibleIds = await getEligibleUserIds();

  const posts = await Post.find({ creator: { $in: [...eligibleIds] } })
    .sort({ score: -1 })
    .lean();

  const bestPerCreator = new Map();
  for (const post of posts) {
    const creatorId = String(post.creator);
    const existing = bestPerCreator.get(creatorId);
    if (!existing || post.score > existing.score ||
        (post.score === existing.score && comparePosts(post, existing) < 0)) {
      bestPerCreator.set(creatorId, post);
    }
  }

  return [...bestPerCreator.values()].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return comparePosts(a, b);
  });
}



export async function computeCategoryRankings() {
  const eligibleIds = await getEligibleUserIds();
  const result = {}; 

  for (const category of CATEGORIES) {
    const posts = await Post.find({
      creator: { $in: [...eligibleIds] },
      category
    }).lean();

    const bestPerCreator = new Map();
    for (const post of posts) {
      const creatorId = String(post.creator);
      const existing = bestPerCreator.get(creatorId);
      if (!existing || post.score > existing.score ||
          (post.score === existing.score && comparePosts(post, existing) < 0)) {
        bestPerCreator.set(creatorId, post);
      }
    }

    result[category] = [...bestPerCreator.values()].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return comparePosts(a, b);
    });
  }

  return result;
}


export async function computeConsistencyRanking() {
  const eligibleIds = await getEligibleUserIds();

  const posts = await Post.find({ creator: { $in: [...eligibleIds] } }).lean();

  
  const byCreator = new Map();
  for (const post of posts) {
    const week = getWeekNumber(post.createdAt);
    if (week === null || week > CONSISTENCY_WEEKS) continue; 

    const creatorId = String(post.creator);
    if (!byCreator.has(creatorId)) byCreator.set(creatorId, new Map());
    const weeks = byCreator.get(creatorId);
    if (!weeks.has(week)) weeks.set(week, []);
    weeks.get(week).push(post);
  }

  const qualifying = [];

  for (const [creatorId, weeks] of byCreator.entries()) {
    // must have posts in ALL 4 weeks, each with >= 3 posts
    let qualifies = true;
    for (let w = 1; w <= CONSISTENCY_WEEKS; w++) {
      const weekPosts = weeks.get(w) || [];
      if (weekPosts.length < CONSISTENCY_MIN_POSTS_PER_WEEK) {
        qualifies = false;
        break;
      }
    }
    if (!qualifies) continue;

    
    let totalScore = 0;
    let bestSinglePost = null;

    for (let w = 1; w <= CONSISTENCY_WEEKS; w++) {
      const weekPosts = [...weeks.get(w)].sort((a, b) => b.score - a.score);
      const top3 = weekPosts.slice(0, CONSISTENCY_TOP_N_PER_WEEK);
      totalScore += top3.reduce((sum, p) => sum + p.score, 0);

      for (const p of top3) {
        if (!bestSinglePost || comparePosts(p, bestSinglePost) < 0) bestSinglePost = p;
      }
    }

    qualifying.push({ creator: creatorId, score: totalScore, tieBreakPost: bestSinglePost });
  }

  return qualifying.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return comparePosts(a.tieBreakPost, b.tieBreakPost);
  });
}

