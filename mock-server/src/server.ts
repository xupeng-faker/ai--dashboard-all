import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import router from './routes'

const app = express()

app.use(cors())
app.use(express.json())
app.use(morgan('dev'))

app.use(router)

app.use((req, res) => {
  res.status(404).json({
    code: 404,
    message: `Not Found: ${req.originalUrl}`,
    data: null,
    timestamp: Date.now(),
  })
})

const PORT = Number(process.env.MOCK_SERVER_PORT) || 8080

app.listen(PORT, () => {
  console.log(`[mock-server] listening on http://localhost:${PORT}`)
})
