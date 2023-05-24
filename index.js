const dotenv = require("dotenv")
dotenv.config()
const express = require('express')
const jwt = require('jsonwebtoken')
const session = require('express-session')
const customer_routes = require('./router/auth_users.js').authenticated
const genl_routes = require('./router/general.js').general
const cors = require('cors')
// const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.wpvcli3.mongodb.net/?retryWrites=true&w=majority`

const app = express()

app.use(express.json())
app.use("/customer",session({secret:"fingerprint_customer",resave: true, saveUninitialized: true}))
app.use(cors())

// mw функция, которая выполняется для всех маршрутов, начинающихся с customer/auth
// Для проверки аутентиикации пользователя перед обработкой запроса
/*
1. Проверяет наличие authorization в сессии (req.session.authorization), что предполагает, что пользователь уже прошел аутентификацию и имеет доступ к сессионному токену.
2. Если токен найден, функция jwt.verify проверяет его подлинность и декодирует его, используя секретный ключ "access".
3. Если токен действителен и успешно декодирован, req.user устанавливается равным информации о пользователе из токена.
4. Если все проверки пройдены успешно, вызывается функция next(), чтобы передать управление следующей функции-обработчику.
5. Если токен отсутствует, недействителен или возникла ошибка, возвращается соответствующий HTTP-статус и сообщение об ошибке.*/
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
