import dotenv from "dotenv";
dotenv.config();

const required = [
  "PORT",
  "DATABASE_URL",
  "USER_SERVICE_URL",
  "INTERNAL_SERVICE_SECRET"
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required env var: ${key}`);
  }
}

const config = {
  port: parseInt(process.env.PORT, 10),
  databaseUrl: process.env.DATABASE_URL,
  userServiceUrl: process.env.USER_SERVICE_URL,
  internalServiceSecret: process.env.INTERNAL_SERVICE_SECRET,
  nodeEnv: process.env.NODE_ENV || "development"
};

export default config;