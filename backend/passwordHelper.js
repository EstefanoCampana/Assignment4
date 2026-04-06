const pool = require("./db");

async function isPasswordExpired(userId) {
  const conn = await pool.getConnection();

  try {
    const rows = await conn.query(
      `SELECT created_at 
       FROM passwords 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [userId],
    );

    if (rows.length === 0) return true;

    const lastChanged = new Date(rows[0].created_at);
    const now = new Date();

    const diffDays = (now - lastChanged) / (1000 * 60 * 60 * 24);

    return diffDays >= 90; // 3 months
  } finally {
    conn.release();
  }
}
const bcrypt = require("bcrypt");

async function isPasswordReused(userId, newPassword) {
  const conn = await pool.getConnection();

  try {
    const rows = await conn.query(
      `SELECT password FROM passwords WHERE user_id = ?`,
      [userId],
    );

    for (const row of rows) {
      const match = await bcrypt.compare(newPassword, row.password);
      if (match) return true;
    }

    return false;
  } finally {
    conn.release();
  }
}
async function changePassword(userId, newPassword) {
  const conn = await pool.getConnection();

  try {
    // 1. Check reuse
    const reused = await isPasswordReused(userId, newPassword);
    if (reused) {
      throw new Error("You cannot reuse a previous password");
    }

    // 2. Hash password
    const hashed = await bcrypt.hash(newPassword, 10);

    // 3. Update current password
    await conn.query(
      `UPDATE users SET current_password = ? WHERE user_id = ?`,
      [hashed, userId],
    );

    // 4. Store in history
    await conn.query(
      `INSERT INTO passwords (user_id, password) VALUES (?, ?)`,
      [userId, hashed],
    );

    return true;
  } finally {
    conn.release();
  }
}
async function login(username, password) {
  const conn = await pool.getConnection();

  try {
    const users = await conn.query(`SELECT * FROM users WHERE username = ?`, [
      username,
    ]);

    if (users.length === 0) throw new Error("User not found");

    const user = users[0];

    const valid = await bcrypt.compare(password, user.current_password);
    if (!valid) throw new Error("Invalid password");

    const expired = await isPasswordExpired(user.user_id);

    if (expired) {
      return {
        status: "EXPIRED",
        message: "Password expired. Please change your password.",
      };
    }

    return { status: "OK", user };
  } finally {
    conn.release();
  }
}
