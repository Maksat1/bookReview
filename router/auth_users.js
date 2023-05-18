const dotenv = require("dotenv")
dotenv.config()
const express = require('express')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const regd_users = express.Router()
const MongoClient = require('mongodb').MongoClient
const uri2 = `mongodb+srv://${process.env.DB2_USERNAME}:${process.env.DB2_PASSWORD}@cluster0.3eskrin.mongodb.net/?retryWrites=true&w=majority`
const client2 = new MongoClient(uri2, { useNewUrlParser: true, useUnifiedTopology: true })

// База данных где хранятся данные пользователей
const dbName = 'usersdb'
const db2 = client2.db(dbName)
const users = db2.collection('users')

// Проверка пароля: больше 6 символов, цифры, прописные и строчные, спецсимволы
const checkPassword = (password) => {
  let pattern = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[$#%&@]).{6,}$/
  if (password.length && pattern.test(password)) {
    return true
  } else {
    return false
  }
}

//check if username is empty
let isNotEmpty = (username) => {
  let uName = username.trim()
  if (uName.length > 0) {
    return true
  } else {
    return false
  }
}
// Проверка было ли имя пользователя зарегистрировано ранее
const isValid = async (username) => {
  try {
    const user = await users.findOne({ username: username })
    return !!user
  } catch (error) {
    console.error(error)
    return true
  }
}

const authenticatedUser = async (username,password)=>{ //returns boolean
//write code to check if username and password match the one we have in records.
try {
  const user = await users.findOne({ username: username });
  if (user) {
    const isPasswordMatch = await bcrypt.compare(password, user.password);
      return isPasswordMatch;
    } else {
      return false;
    }
  } catch (error) {
    console.error(error);
    return false;
  }
}
  // let validusers = users.findOne((user)=>{
  //   return (user.username === username && user.password === password)
  // })
  // if(validusers.length > 0){
  //   return true;
  // } else {
  //   return false;
  // } 
// }

//only registered users can login
regd_users.post("/login", async (req,res) => { //url localhost:5000/login
  const username = req.body.username;
  const password = req.body.password;

  if (!username || !password) {
      return res.status(404).json({message: "Error logging in"});
  }

  if (await authenticatedUser(username,password)) {
    let accessToken = jwt.sign({
      data: password
    }, 'access', 
    { expiresIn: 60 * 60 });
    
    // Create a session object if it doesn't exist
    req.session = req.session || {} //17.05
    req.session.authorization = {
      accessToken, 
      username
    }
    return res.status(200).send("User successfully logged in");
  } else {
    return res.status(208).json({message: "Invalid Login. Check username and password"});
  }
})

// Add a book review, only registered users can add reviews
regd_users.put("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn
  const review_username = req.session.authorization.username
  const review_text = req.body.review_text

  if (!books[isbn].reviews) {
    books[isbn].reviews = {}
  }
  books[isbn].reviews[review_username] = review_text
  
  res.json({ message: "Review added successfully" })
})

// delete review of the logged in user
regd_users.delete("/auth/review/:isbn", (req,res) => {
  const isbn = req.params.isbn
  const username = req.session.authorization.username

  if (isbn in books) {
    let keyToDelete = username
    delete books[isbn].reviews[keyToDelete]
    res.send(books[isbn].reviews)
  }
})

module.exports.authenticated = regd_users
module.exports.isValid = isValid
module.exports.isNotEmpty = isNotEmpty
module.exports.checkPassword = checkPassword
module.exports.users = users
