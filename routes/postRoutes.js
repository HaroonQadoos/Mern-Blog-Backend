const express = require("express");
const router = express.Router();
const {
  getPosts,
  getPostById,
  updatePost,
  deletePost,
  createPost,
  getMyPosts,
  togglePublishPosts,
} = require("../controllers/postController");
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");
const Post = require("../models/post");

router.get("/admin/all", protect, adminOnly, async (req, res) => {
  const posts = await Post.find()
    .populate("author", "username")
    .sort({ createdAt: -1 });

  res.json(posts);
});

router.get("/my-posts", protect, getMyPosts);

router.get("/", getPosts);
router.post("/", protect, createPost); //protected
router.get("/:id", getPostById);
router.put("/:id", protect, adminOnly, updatePost); //protected
router.delete("/:id", protect, adminOnly, deletePost); //protected
router.put("/:id/publish", protect, adminOnly, togglePublishPosts);

module.exports = router;
