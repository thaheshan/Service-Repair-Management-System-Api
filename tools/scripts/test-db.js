require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,          
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || undefined,
});

(async () => {
  const r = await pool.query("SELECT current_database() as db, now() as now");
  console.log(r.rows[0]);
  await pool.end();
})();
