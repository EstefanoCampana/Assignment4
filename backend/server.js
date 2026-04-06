const express = require("express");
const cors = require("cors");
const { register, login, changePassword } = require("./auth");

const app = express();
app.use(cors());
app.use(express.json());

// REGISTER
app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await register(username, password);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// LOGIN
app.post("/login", async (req, res) => {
  try {
    const result = await login(req.body.username, req.body.password);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// CHANGE PASSWORD
app.post("/change-password", async (req, res) => {
  try {
    const { userId, newPassword } = req.body;
    await changePassword(userId, newPassword);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
