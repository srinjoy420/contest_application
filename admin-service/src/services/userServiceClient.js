import dotenv from "dotenv"
dotenv.config()


const USER_SERVICE_URL = process.env.USER_SERVICE_URL; 
const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET;

export async function fetchFromUserService(path) {
  const res = await fetch(`${USER_SERVICE_URL}${path}`, {
    headers: { 'x-internal-secret': INTERNAL_SECRET }
  });

  if (!res.ok) {
    throw new Error(`User Service request failed: ${path} → ${res.status}`);
  }

  return res.json();
}

export async function getGlobalRanking() {
  return fetchFromUserService('/api/v1/ranking/global');
}

export async function getCategoryRankings() {
  return fetchFromUserService('/api/v1/ranking/category');
}

export async function getConsistencyRanking() {
  return fetchFromUserService('/api/v1/ranking/consistency');
}

