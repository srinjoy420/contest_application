import dotenv from "dotenv"
dotenv.config()
export const requireInternalAuth = (req, res, next) => {
    const internalSecret = req.headers['x-internal-secret'];
    if (!internalSecret || internalSecret !== process.env.INTERNAL_SERVICE_SECRET) {
        return res.status(403).json({ error: 'Forbidden: internal service access only' });
    }
    next()
}