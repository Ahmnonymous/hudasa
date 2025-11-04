// models/authModel.js
const pool = require("../config/db");

const Auth = {
  findByUsername: async (username) => {
    const res = await pool.query(
      "SELECT * FROM Employee WHERE Username=$1",
      [username]
    );
    return res.rows[0];
  },
};

module.exports = Auth;
