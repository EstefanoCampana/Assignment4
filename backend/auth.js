const pool = require("./db");
const bcrypt = require("bcrypt");

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
    return diffDays >= 90;
  } finally {
    conn.release();
  }
}

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

async function isUsernameReused(username) {
  const conn = await pool.getConnection();

  try {
    const rows = await conn.query(`SELECT * FROM users WHERE username = ?`, [
      username,
    ]);

    return rows.length > 0;
  } finally {
    conn.release();
  }
}

async function register(username, password) {
  const conn = await pool.getConnection();

  if (await isUsernameReused(username)) {
    return { error: "Username already exists" };
  }

  try {
    const hashed = await bcrypt.hash(password, 10);

    const result = await conn.query(
      `INSERT INTO users (username, current_password) VALUES (?, ?)`,
      [username, hashed],
    );

    const userId = Number(result.insertId);

    await conn.query(
      `INSERT INTO passwords (user_id, password) VALUES (?, ?)`,
      [userId, hashed],
    );

    return { userId };
  } finally {
    conn.release();
  }
}

async function login(username, password) {
  const conn = await pool.getConnection();

  try {
    const rows = await conn.query(`SELECT * FROM users WHERE username = ?`, [
      username,
    ]);

    if (rows.length === 0) throw new Error("User not found");

    const user = rows[0];

    const valid = await bcrypt.compare(password, user.current_password);
    if (!valid) throw new Error("Invalid password");

    const expired = await isPasswordExpired(user.user_id);

    if (expired) {
      return { status: "EXPIRED", userId: user.user_id };
    }

    return { status: "OK", userId: user.user_id };
  } finally {
    conn.release();
  }
}

async function changePassword(userId, newPassword) {
  const conn = await pool.getConnection();

  try {
    const reused = await isPasswordReused(userId, newPassword);
    if (reused) throw new Error("Cannot reuse old password");

    const hashed = await bcrypt.hash(newPassword, 10);

    await conn.query(
      `UPDATE users SET current_password = ? WHERE user_id = ?`,
      [hashed, userId],
    );

    await conn.query(
      `INSERT INTO passwords (user_id, password) VALUES (?, ?)`,
      [userId, hashed],
    );

    return true;
  } finally {
    conn.release();
  }
}

module.exports = {
  register,
  login,
  changePassword,
};
