import mongoose from 'mongoose';

const CATEGORIES = [
  'Music', 'Dance', 'Comedy', 'Art', 'Sports',
  'Cooking', 'Fashion', 'Tech', 'Travel', 'Education'
]; 

const postSchema = new mongoose.Schema({
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  caption: {
    type: String,
    trim: true,
    maxlength: 500
  },
  category: {
    type: String,
    enum: CATEGORIES,
    required: true,
    index: true
  },
  media: {
    url: { type: String, required: true },       
    type: { type: String, enum: ['image', 'video'], required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true }
  },
  counts: {
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    views: { type: Number, default: 0 }
  },
  score: {
    type: Number,
    default: 0,
    index: true 
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true // used as the final tie-break (earliest timestamp)
  }
});


postSchema.index({ creator: 1, score: -1 });                 
postSchema.index({ category: 1, creator: 1, score: -1 });    
postSchema.index({ creator: 1, createdAt: 1 });                
postSchema.methods.computeScore = function () {
  return (this.counts.likes * 1) + (this.counts.comments * 3) + (this.counts.views * 0.2);
};

const Post = mongoose.model('Post', postSchema);

export { CATEGORIES };
export default Post;