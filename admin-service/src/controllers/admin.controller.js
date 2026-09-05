import { runCascade } from "../services/casecadeEngine.js";
import {
    getGlobalRanking,
    getCategoryRankings,
    getConsistencyRanking
} from "../services/userServiceClient.js";

export const getGlobalRankings = async (req, res) => {
    try {
        return res.json(await getGlobalRanking());
    } catch (error) {
        return res.status(502).json({ error: error.message });
    }
};

export const getCategoryRankingsController = async (req, res) => {
    try {
        return res.json(await getCategoryRankings());
    } catch (error) {
        return res.status(502).json({ error: error.message });
    }
};

export const getConsistencyRankings = async (req, res) => {
    try {
        return res.json(await getConsistencyRanking());
    } catch (error) {
        return res.status(502).json({ error: error.message });
    }
};

export const runAdminCascade = async (req, res) => {
    if (req.headers["x-internal-secret"] !== process.env.INTERNAL_SERVICE_SECRET) {
        return res.status(403).json({ error: "Forbidden" });
    }

    try {
        const winners = await runCascade();
        return res.status(201).json({ winners });
    } catch (error) {
        console.error("Cascade failed:", error);
        return res.status(409).json({ error: error.message });
    }
};