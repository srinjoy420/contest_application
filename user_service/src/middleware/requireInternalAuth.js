import config from "../config/config.js"
export const requireInternalAuth = (req, res, next) => {
    const internalSecret = req.headers['x-internal-secret'];
    if (!internalSecret || internalSecret !== config.internalServiceSecret) {
        return res.status(403).json({ error: 'Forbidden: internal service access only' });
    }
    next()
}