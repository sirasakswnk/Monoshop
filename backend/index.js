import express from "express"
import database from "./service/database.js"
import dotenv from 'dotenv'
import bodyParser from "body-parser"

import productRoute from "./Routes/productRoute.js"
import memberRoute from "./Routes/memberRoute.js"
import cartRoute from "./Routes/cartRoute.js"

import cors from "cors"
import cookieParser from "cookie-parser"

dotenv.config()

const app = express()
const port = process.env.PORT || 3000

app.set('trust proxy', 1)

const allowedOrigins = [
  process.env.FRONTEND_ORIGIN, 
  'http://localhost:5173',
  'http://127.0.0.1:5173',
].filter(Boolean)

app.use(cors({
  origin: function(origin, callback) {
    // สำหรับเครื่องมือที่ไม่ส่ง origin (postman/curl)
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    }
    return callback(new Error('Not allowed by CORS'), false)
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true, 
}))

// Preflight
app.options('*', cors({
  origin: allowedOrigins,
  credentials: true,
}))

// เสิร์ฟรูป
app.use("/img_pd", express.static("img_pd"))
app.use("/img_mem", express.static("img_mem"))

// body + cookie
app.use(bodyParser.json())
app.use(cookieParser())

// routes
app.use(productRoute)
app.use(memberRoute)
app.use(cartRoute)

app.get('/', (req, res) => {
  console.log(`GET / is Requested!!.`)
  res.status(200).json({ message: "ok" })
})

app.listen(port, () => {
  console.log(`Server is listen on Port ${port}`)
})
