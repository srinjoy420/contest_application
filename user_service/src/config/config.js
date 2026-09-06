import dotenv from "dotenv";
dotenv.config();

const required = [
    "PORT",
    "MONGO_URI",
    "ACESS_TOKEN_SECRET",
    "REFRESH_TOKEN_SECRET",
    "ACCESS_TOKEN_EXPIRY",
    "REFRESH_TOKEN_EXPIRY",
    "INTERNAL_SERVICE_SECRET"
];

for (const key of required) {
    if (!process.env[key]) {
        throw new Error(`Missing required env var: ${key}`);
    }
}


const config = {
    port: parseInt(process.env.PORT, 10),
    mongoUri: process.env.MONGO_URI,
    accessTokenSecret: process.env.ACESS_TOKEN_SECRET,
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
    accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY,
    refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY,
    internalServiceSecret: process.env.INTERNAL_SERVICE_SECRET,
    nodeEnv: process.env.NODE_ENV || "development"
};

export default config;