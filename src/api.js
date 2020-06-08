const express = require('express')
const cors = require('cors')
const app = express()
const port = 2020
const conn = require('./config/db')
const isEmail = require('validator/lib/isEmail')
const bcrypt = require('bcrypt')
const jwt = require('./config/token')

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
   res.status(200).send('<h1>API IS RUNNING AT 2020</h1>')
})

// REGISTER
app.post('/user', (req, res) => {
   const sql = `INSERT INTO users SET ?`
   const data = req.body

   // cek email
   if(!isEmail(data.email)) return res.status(400).send({message: "Email is not valid"})

   // encrypt password
   data.password = bcrypt.hashSync(data.password, 8)

   conn.query(sql, data, (err, result) => {
      if(err) return res.status(500).send({err})

      res.status(200).send({message: "Register berhasil"})
   })

})

// LOGIN
app.post('/user/login', (req, res) => {
   const {username, password} = req.body
   const sql = `SELECT * FROM users WHERE username = '${username}'`
   const sql2 = `INSERT INTO tokens SET ? `

   conn.query(sql, async (err, result) => {
       // Error saat running query
       if(err) return res.status(500).send(err) 
       // res dari select adalah array
      //  user = {id, username, name, email, password, avatar}
       const user = result[0] 
       // User tidak ditemukan
       if(!user) return res.status(404).send({message: "User not found"})
       // Compare password dari input user dengan yang ada pada database
       const hash = await bcrypt.compare(password, user.password)
       // Jika proses compare tidak valid
       if(!hash) return res.status(400).send({message: "Wrong password"})
       // Create token
       const token = jwt.sign({ id: user.id })
       // Save token
       const data = { user_id: user.id, token }
       conn.query(sql2, data , (err, result) => {
           // Error saat running query
           if(err) return res.status(500).send(err)
           
           // Kirim user
           res.status(200).send({username: user.username, token})
       })
       
   })

})

app.listen(port, () => console.log('API is Running'))