import pkg from "pg"
import dotenv from "dotenv"

dotenv.config()

const { Pool } = pkg

const pool = new Pool({
  user: process.env.DBUSER,
  host: process.env.DBHOST,
  database: process.env.DB,
  password: process.env.DBPWD,
  port: process.env.DBPORT,
  ssl: {
    rejectUnauthorized: false  
  }
})

export default pool
