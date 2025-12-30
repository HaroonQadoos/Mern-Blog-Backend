const Post = require("../models/post");
const mongoose = require("mongoose");

// Helper to validate ObjectId
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// GET all posts
const getPosts = async (req, res) => {
  const posts = await Post.find({ status: "published" })
    .populate("author", "username email")
    .sort({ createdAt: -1 });
  res.json(posts);
};

// GET my posts
const getMyPosts = async (req, res) => {
  const posts = await Post.find({ author: req.user._id });
  res.json(posts);
};

// CREATE new post
const createPost = async (req, res) => {
  const { title, body, image, status } = req.body;
  if (!title || !body)
    return res.status(400).json({ message: "Title and body are required" });

  const post = await Post.create({
    title,
    body,
    author: req.user._id,
    image,
    status: status || "draft",
  });

  res.status(201).json(post);
};

// GET post by ID
const getPostById = async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id))
    return res.status(400).json({ message: "Invalid post ID" });

  try {
    const post = await Post.findById(id).populate("author", "username email");
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// UPDATE post
const updatePost = async (req, res) => {
  const { id } = req.params;
  console.log("PARAM ID:", req.params.id);
  console.log("REQ BODY:", req.body);
  console.log("REQ USER:", req.user);

  if (!req.body) {
    return res.status(400).json({ message: "Request body missing" });
  }

  const { title, body, image, tags } = req.body;

  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (
      post.author.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    post.title = title ?? post.title;
    post.body = body ?? post.body;
    post.image = image ?? post.image;
    post.tags = tags ?? post.tags;

    const updatedPost = await post.save();
    res.status(200).json(updatedPost);
  } catch (err) {
    console.error("UPDATE ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// DELETE post
const deletePost = async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id))
    return res.status(400).json({ message: "Invalid post ID" });

  try {
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (
      post.author.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    )
      return res.status(403).json({ message: "Not authorized" });

    await post.deleteOne();
    res.json({ message: "Post deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
//PublishTogglePost

const togglePublishPosts = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      res.status(404).json({ message: "Post not found" });
    }
    post.status = post.status === "published" ? "draft" : "published";
    await post.save();

    res.json({ message: `Post ${post.status}`, status: post.status });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPosts,
  getMyPosts,
  createPost,
  getPostById,
  updatePost,
  deletePost,
  togglePublishPosts,
};
