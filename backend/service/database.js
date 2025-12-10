// service/database.js
import pkg from "pg"
import dotenv from "dotenv"

dotenv.config()

const { Pool } = pkg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false   // ต้องมีสำหรับ Render PostgreSQL
  }
})

export default pool
