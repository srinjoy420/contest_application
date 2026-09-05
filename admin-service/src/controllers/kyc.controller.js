import { prisma } from "../lib/DB.js";
import { processKyc } from "../services/kycService.js";
export const getwinners = async (req, res) => {
    try {
        const { tier } = req.query;
        const where = { status: "ACTIVE" };
        if (tier) where.tier = tier;

        const winners = await prisma.winner.findMany({
            where,
            include: { kyc: true },
            orderBy: [{ tier: "asc" }, { rank: "asc" }]
        });

        res.status(200).json({message:"the winner find succesfully",winners});
    } catch (error) {
        console.log("there are some errorrs getting the winner",error);
        res.status(500).json({message:"internal server error"});
        
    }
}

export const winnerByid=async(req,res)=>{
    const { passed } = req.body;
    const {id}=req.params;
    try {
        const result = await processKyc(id, passed);
       return res.status(200).json({result});
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
}