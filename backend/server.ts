const app = require('./app')
const port = process.env.BACKEND_PORT
const url = process.env.VITE_BACKEND_URL

app.listen(port, () => {
  console.log(`Backend listening at ${url}`)
})