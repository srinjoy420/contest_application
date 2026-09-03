import Comment from "../model/Comment.model.js";
import Like from "../model/Like.model.js";
import Post, { CATEGORIES } from "../model/Post.model.js";


export const createPost = async (req, res) => {
    try {
        const { caption, category } = req.body;
        const userId = req.user?.id || req.user?._id;

        if (!req.file) {
            return res.status(400).json({ error: 'Media file is required' });
        }
        if (!CATEGORIES.includes(category)) {
            return res.status(400).json({ error: `category must be one of: ${CATEGORIES.join(', ')}` });
        }
        const mediaType = req.file.mimetype.startsWith('video') ? 'video' : 'image';
        const post = await Post.create({
            creator: userId,
            caption,
            category,
            media: {
                url: `/uploads/${userId}/${req.file.filename}`,
                type: mediaType,
                mimeType: req.file.mimetype,
                size: req.file.size
            }
        });
        res.status(201).json({ message: "the new post created succesfully", post })

    } catch (error) {
        console.error('Create post failed:', error);
        if (error.message === 'Unsupported file type') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to create post' });
    }
}
export const likePost = async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.id || req.user?._id;

    if (!id) {
        return res.status(400).json({ message: "post id is required" });
    }
    if (!userId) {
        return res.status(401).json({ message: "user is not authenticated" });
    }

    try {
        const postExists = await Post.findById(id);
        if (!postExists) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const alreadyLiked = await Like.findOne({ post: id, user: userId });
        if (alreadyLiked) {
            return res.status(200).json({ message: 'post already liked', liked: true, post: postExists });
        }

        await Like.create({ post: id, user: userId });

        const post = await Post.findByIdAndUpdate(
            id,
            { $inc: { 'counts.likes': 1, score: 1 } },
            { new: true }
        );

        return res.status(201).json({ message: 'post liked successfully', liked: true, post });
    } catch (error) {
        console.log('error in like the post', error);
        return res.status(500).json({ error: 'Failed to like post' });
    }
};

export const unlikepost = async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.id || req.user?._id;

    if (!id) {
        return res.status(400).json({ message: "post id is required" });
    }
    if (!userId) {
        return res.status(401).json({ message: "user is not authenticated" });
    }

    try {
        const deleted = await Like.findOneAndDelete({ post: id, user: userId });
        if (!deleted) {
            return res.status(404).json({ error: 'Like not found' });
        }

        const post = await Post.findByIdAndUpdate(
            id,
            { $inc: { 'counts.likes': -1, score: -1 } },
            { new: true }
        );

        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        return res.status(200).json({ message: 'post unliked successfully', liked: false, post });
    } catch (error) {
        console.log('error in unlike the post', error);
        return res.status(500).json({ message: 'the external server error' });
    }
};

export const commentpost = async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.id || req.user?._id;
    const { text } = req.body;

    if (!id) {
        return res.status(400).json({ message: "post id is required" });
    }
    if (!userId) {
        return res.status(401).json({ message: "user is not authenticated" });
    }
    if (!text || !text.trim()) {
        return res.status(400).json({ message: "comment text required" });
    }

    try {
        const postExists = await Post.findById(id);
        if (!postExists) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const comment = await Comment.create({
            post: id,
            user: userId,
            text: text.trim()
        });

        const post = await Post.findByIdAndUpdate(
            id,
            { $inc: { 'counts.comments': 1, score: 3 } },
            { new: true }
        );

        return res.status(201).json({
            message: 'the comment created succesfylly',
            comment,
            post
        });
    } catch (error) {
        console.log('error in commenting a post', error);
        return res.status(500).json({ message: 'internal server error' });
    }
};