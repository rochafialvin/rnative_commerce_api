const express = require('express')
const cors = require('cors')
const app = express()
const port = 2020
const conn = require('./config/db')

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
   res.status(200).send('<h1>API IS RUNNING AT 2020</h1>')
})

// REGISTER
app.post('/user', (req, res) => {
   const sql = `INSERT INTO users SET ?`
   const data = req.body

   conn.query(sql, data, (err, result) => {
      if(err) return res.status(500).send({err})

      res.status(200).send({message: "Register berhasil"})
   })

})

app.listen(port, () => console.log('API is Running'))