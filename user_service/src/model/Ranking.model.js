import mongoose from "mongoose";

const rankingSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["global", "category", "consistency"],
    required: true,
    unique: true 
  },
  data: {
    type: mongoose.Schema.Types.Mixed, 
    required: true
  },
  computedAt: {
    type: Date,
    default: Date.now
  }
});

const Ranking=mongoose.model("Ranking",rankingSchema)
export default Ranking;