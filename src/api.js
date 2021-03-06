const express = require('express')
const cors = require('cors')
const app = express()
const port = 2020
const conn = require('./config/db')
const isEmail = require('validator/lib/isEmail')
const bcrypt = require('bcrypt')
const jwt = require('./config/token')
const path = require('path')
const auth = require('./config/auth')
const multer = require('multer')
const sharp = require('sharp')
const shortid = require('shortid')

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
   res.status(200).send('<h1>API IS RUNNING AT 2020</h1>')
})

// REGISTER
// path
app.post('/user', (req, res) => {
   const sql = `INSERT INTO users SET ?`
    // data = {username, name, email, password}
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

// GET PROFILE
app.get('/user', auth, (req, res) => {

    // req.user = {id, username, name, email, avatar}
    res.status(200).send({
        user: req.user,
        avatarlink: `http://localhost:2020/user/avatar/${req.user.avatar}`
    })

})

// UPDATE PROFILE
app.patch('/user/profile', auth, (req, res) => {
    const sql = `UPDATE users SET ? WHERE id = ?;`
    // data[0] = {name, email, password}
    // data[1] = 12
    const data = [req.body, req.user.id]

    // cek email
   if(!isEmail(data[0].email)) return res.status(400).send({message: "Email is not valid"})

    // Jika user mengirim password baru / Edit password
    if(data[0].password){
        data[0].password = bcrypt.hashSync(data[0].password, 8)
    } else {
        delete data[0].password
    }

    conn.query(sql, data, (err, result) => {
        if(err) return res.status(500).send(err)

        res.status(201).send({message: 'Update berhasil'})
    })

})

// AVATAR
const avatarDirectory = path.join(__dirname, 'assets/avatar')

const upload = multer({
   // storage: storage,
   limits: {
       fileSize: 10000000 // Byte , default 1MB
   },
   fileFilter(req, file, cb) {
       if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){ // will be error if the extension name is not one of these
           return cb(new Error('Please upload image file (jpg, jpeg, or png)')) 
       }

       cb(undefined, true)
   }
})

// POST AVATAR
app.post('/user/avatar', auth, upload.single('avatar'), async (req,res) => {

   try {
       const sql = `UPDATE users SET avatar = ? WHERE username = ?`
       const fileName = `${req.user.username}-avatar.png`
       const data = [fileName, req.user.username]
       const final = await sharp(req.file.buffer).resize(200).png().toFile(`${avatarDirectory}/${fileName}`)

       conn.query(sql, data, (err, result) => {
           if (err) return res.status(500).send(err)

           res.status(200).send({message: fileName})

       })
   } catch (error) {
       res.status(500).send(error.message)
   }
   
}, (err, req, res, next) => { // it should declare 4 parameters, so express know this is function for handling any uncaught error
   res.status(400).send(err.message)
})

// READ AVATAR
app.get('/user/avatar/:fileName', (req, res) => {
    var options = { 
        root: avatarDirectory // Direktori foto disimpan
    };      
    
    var fileName = req.params.fileName;
    
    res.status(200).sendFile(fileName, options, function (err) {
        if (err) {
            return res.status(404).send({message: "Image not found"})
        } 

        console.log('Sent:', fileName);
    });
})

//////////////////////
// P R O D U C T S //
/////////////////////

// PRODUCTS
const productsDirectory = path.join(__dirname, 'assets/products')

const product = multer({
   // storage: storage,
   limits: {
       fileSize: 10000000 // Byte , default 1MB
   },
   fileFilter(req, file, cb) {
       if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){ // will be error if the extension name is not one of these
           return cb(new Error('Please upload image file (jpg, jpeg, or png)')) 
       }

       cb(undefined, true)
   }
})

// POST PRODUCT
app.post('/product', auth, product.single("picture"),  (req, res) => {
    try {
        // {name, description, stock, price} = req.body
        // {picture} = req.file
        const sqlInsert = `INSERT INTO products SET ?`
        const dataInsert = {...req.body, user_id : req.user.id}

        // insert semua data text
        conn.query(sqlInsert, dataInsert,async (err, result) => {
            if (err) return res.status(500).send(err)
            
            // Generate file name
            const fileName = `${shortid.generate()}.png`
            // Simpan gambar
            await sharp(req.file.buffer).resize(300).png().toFile(`${productsDirectory}/${fileName}`)
            
            const sqlUpdate = `UPDATE products SET picture = ? WHERE id = ?`
            const dataUpdate = [fileName, result.insertId]
            
            // Simpan nama gambar
            conn.query(sqlUpdate, dataUpdate, (err, result) => {
                if (err) return res.status(500).send(err)

                res.status(200).send({message: "Insert data berhasil"})
            })

        })
    } catch (err) {
        es.status(500).send(err)
    }
})

// READ ALL PRODUCTS
app.get('/products', auth, (req, res) => {
    const sqlSelect = `
        SELECT 
            u.id 'usrId' , u.name 'usrName', u.avatar 'usrAvatar',
            p.id, p.name , p.picture, p.description, p.stock, p.price
        FROM users u
        JOIN products p ON u.id = p.user_id WHERE u.id != ${req.user.id}
    `

    conn.query(sqlSelect, (err, result) => {
        if(err) return res.status(500).send(err)
        
        res.status(200).send(result)
    })
})

// READ OWN PRODUCTS
app.get('/products/me', auth, (req, res) => {
    const sqlSelect = `SELECT * FROM products WHERE user_id = ${req.user.id}`

    conn.query(sqlSelect, (err, result) => {
        if(err) return res.status(500).send(err)
        
        res.status(200).send(result)
    })
    
})

// READ PRODUCT IMAGE
app.get('/product/picture/:fileName', (req, res) => {
    var options = { 
        root: productsDirectory // Direktori foto disimpan
    };      
    
    var fileName = req.params.fileName;
    
    res.status(200).sendFile(fileName, options, function (err) {
        if (err) {
            return res.status(404).send({message: "Image not found"})
        } 
        
        console.log('Sent:', fileName);
    });
})

// READ DETAIL PRODUCT
app.get('/product/:id', auth, (req, res) => {
    const sqlSelect = `SELECT * FROM products WHERE id = ${req.params.id}`
    conn.query(sqlSelect, (err, result) => {
        if(err) return res.status(500).send(err)
        
        res.status(200).send(result[0])
    })
})

////////////////
// C A R T S //
//////////////

// POST CART
app.post('/cart', auth, (req, res) => {
    const sqlInsert = `INSERT INTO carts SET ?`
    // req.body = product_id : 12, seller_id : 99, name : tamiya, qty : 3, price : 20, total_amount : 60
    // req.user.id = user_id, 98
    const dataInsert = {user_id : req.user.id, ...req.body}

    conn.query(sqlInsert, dataInsert, (err, result) => {
        if(err) return res.status(500).send(err)

        // 201 = Created
        res.status(201).send({message : "Insert Cart berhasil"})
    })
})

// READ CARTS
app.get('/carts', auth, (req, res) => {
    const sqlSelect = `SELECT * FROM carts WHERE user_id = ${req.user.id}`

    conn.query(sqlSelect, (err, result) => {
        if(err) return res.status(500).send(err)

        // 200 = OK
        res.status(200).send(result)
    })
})

//////////////////////////////
// T R A N S A C T I O N  S //
/////////////////////////////

// Post Trx
app.post('/transaction', auth, (req, res) => {

    // {user_id, total_amount}
    // Add to transactions
        // id 87 : 3 products
    const sqlInsertTrx = `INSERT INTO transactions SET ?`
    // req.body.transaction = total_amount
    const dataInsertTrx = {
        user_id : req.user.id,
        total_amount: req.body.total_amount
    }

    conn.query(sqlInsertTrx, dataInsertTrx, (err, result) => {
        if(err) return res.status(500).send(err)

        // Add to detail_transactions
        // id 13 trx id : 87
        // id 14 trx id : 87
        // id 15 trx id : 87
        // req.body.carts
        const sqlInsertTrxDetail = `
            INSERT INTO 
                detail_transaction(trx_id, seller_id, product_id, name, qty, price, total_amount)
            VALUES ?
        `
        let trx_id = result.insertId
        // {trx_id, seller_id, product_id, name, qty, price total_amount}
        const dataInsertTrxDetail = req.body.carts.map(cart => (
            [trx_id, cart.seller_id, cart.product_id, cart.name, cart.qty, cart.price, cart.total_amount]
        ))

        conn.query(sqlInsertTrxDetail, [dataInsertTrxDetail], (err, result) => {
            if(err) return res.status(500).send(err)
            
            // Delete carts
            const sqlDeleteCarts = `DELETE FROM carts WHERE user_id = ${req.user.id}`
            conn.query(sqlDeleteCarts, (err, results) => {
                if(err) return res.status(500).send(err)

                res.status(201).send("Insert Trx Berhasil")
            })

        })
    })

})

// Read Trx Buy
app.get('/transactions/buy', auth, (req, res) => {
    const sqlSelect = `SELECT * FROM transactions WHERE user_id = ${req.user.id} `

    conn.query(sqlSelect, (err, result) => {
        if(err) return res.status(500).send(err)

        res.status(200).send(result)
    })
})

// Read Trx Jual
app.get('/transactions/sell', auth, (req, res) => {
    const sqlSelect = `SELECT * FROM detail_transaction WHERE seller_id = ${req.user.id} `

    conn.query(sqlSelect, (err, result) => {
        if(err) return res.status(500).send(err)

        res.status(200).send(result)
    })
})



app.listen(port, () => console.log('API is Running at ' + port))

// Buat route untuk READ CARTS