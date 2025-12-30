const express = require("express");
const router = express.Router();

const {
  registeredUser,
  loginUser,
  logoutUser,
  getUsers,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

router.get("/me", protect, async (req, res) => {
  res.json(req.user); // req.user is set in protect middleware
});

router.get("/", protect, getUsers);
router.post("/register", registeredUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);

module.exports = router;
