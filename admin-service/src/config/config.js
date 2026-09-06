import dotenv from "dotenv";
import { fileURLToPath } from "url";

dotenv.config({ path: fileURLToPath(new URL("../../.env", import.meta.url)) });

const required = [
  "PORT",
  "DATABASE_URL",
  "USER_SERVICE_URL",
  "INTERNAL_SERVICE_SECRET",
  "ACESS_TOKEN_SECRET"
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
  accessTokenSecret: process.env.ACESS_TOKEN_SECRET,
  nodeEnv: process.env.NODE_ENV || "development"
};

export default config;