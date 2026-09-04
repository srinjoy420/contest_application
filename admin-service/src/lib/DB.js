import {PrismaClient} from "../generated/prisma/client.js"
import dotenv from "dotenv"
import {PrismaPg} from "@prisma/adapter-pg"

dotenv.config()


const adapter=new PrismaPg({
    connectionString:process.env.DATABASE_URL
})

const globalForPrisma=global;

const prisma=globalForPrisma.prisma ||new PrismaClient({adapter})

if(process.env.NODE_ENV!=="production") globalForPrisma.prisma=prisma;
export {prisma}