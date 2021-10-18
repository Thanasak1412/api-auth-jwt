const router = require("express").Router();
const { signup, login, refreshToken, logout } = require("../controllers/auth");
const verifyToken = require("../middleware/auth");

router.get("/", verifyToken, (req, res) => res.send("User home page."));
router.post("/signup", signup);
router.post("/login", login);
router.post("/refresh-token", refreshToken);
router.delete("/logout", logout)

module.exports = router;
