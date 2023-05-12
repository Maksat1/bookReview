const express = require('express');
const jwt = require('jsonwebtoken');
// let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

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

const isValid = (username)=>{
  //check if username is already registered
  let usersWithSameName = users.filter((user)=>{ //creates array with registered users
    return user.username === username //return boolean
  })
   
  if(usersWithSameName.length > 0){
    return true;
  } else {
    return false; 
  }
}

const authenticatedUser = (username,password)=>{ //returns boolean
//write code to check if username and password match the one we have in records.
  let validusers = users.filter((user)=>{
    return (user.username === username && user.password === password)
  })
  if(validusers.length > 0){
    return true;
  } else {
    return false;
  } 
}

//only registered users can login
regd_users.post("/login", (req,res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (!username || !password) {
      return res.status(404).json({message: "Error logging in"});
  }

  if (authenticatedUser(username,password)) {
    let accessToken = jwt.sign({
      data: password
    }, 'access', { expiresIn: 60 * 60 });
    //console.log(accessToken)
    req.session.authorization = {
      accessToken, username
    }
    return res.status(200).send("User successfully logged in");
  } else {
    return res.status(208).json({message: "Invalid Login. Check username and password"});
  }
});

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
