import {PrismaClient} from "../generated/prisma/client.js"
import {PrismaPg} from "@prisma/adapter-pg"
import config from "../config/config.js"


const adapter=new PrismaPg({
    connectionString:config.databaseUrl
})

const globalForPrisma=global;

const prisma=globalForPrisma.prisma ||new PrismaClient({adapter})

if(config.nodeEnv!=="production") globalForPrisma.prisma=prisma;
export {prisma}