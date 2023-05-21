const dotenv = require("dotenv")
dotenv.config()
const express = require('express')
const jwt = require('jsonwebtoken')
const session = require('express-session')
const customer_routes = require('./router/auth_users.js').authenticated
const genl_routes = require('./router/general.js').general
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.wpvcli3.mongodb.net/?retryWrites=true&w=majority`

const app = express()

app.use(express.json())
app.use("/customer",session({secret:"fingerprint_customer",resave: true, saveUninitialized: true}))

// what it does?
app.use("/customer/auth/*", function auth(req,res,next){
    if(req.session.authorization) {
        token = req.session.authorization['accessToken']
        jwt.verify(token, "access",(err,user)=>{
            if(!err){
                req.user = user
                next()
            }
            else{
                return res.status(403).json({message: "User not authenticated"})
            }
        })
    } else {
        return res.status(403).json({message: "User not logged in"})
    }
})

const PORT =5000

app.use("/customer", customer_routes)
app.use("/", genl_routes)

app.listen(PORT,()=>console.log("Server is running"))
