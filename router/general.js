const dotenv = require("dotenv")
dotenv.config()
const express = require('express')
const MongoClient = require('mongodb').MongoClient
let isValid = require("./auth_users.js").isValid
let isNotEmpty = require("./auth_users.js").isNotEmpty
let checkPassword = require("./auth_users.js").checkPassword
let users = require("./auth_users.js").users
const bcrypt = require('bcrypt')
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.wpvcli3.mongodb.net/?retryWrites=true&w=majority`
const public_users = express.Router()

// Create a new MongoClient
const client = new MongoClient(uri, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
})

// register user localhost:5000/register
public_users.post("/register", async (req,res) => {
    const username = req.body.username
    const password = req.body.password

    if (username && password && isNotEmpty(username)) {
      if (!(await isValid(username))) {
        if (checkPassword(password)) {
            // Генерация соли
            const salt = await bcrypt.genSalt(10)
            // Хэширование пароля
            const hashedPassword = await bcrypt.hash(password, salt)

            const newUser = { username, password: hashedPassword }
            users.insertOne(newUser)
            return res.status(200).json({message: "User successfully registered"})
        } else {
          res.send('Пароль должен быть длиннее 6 символов, содержать заглавные и строчные буквы, а также специальные символы')
        }
      } else {
        return res.status(400).json({message: "User already exists"})
      }
  } 
  else {
    return res.send('No username or password')
  }
})

// Get the book list available in the shop. async
const getAllBooks = async () => {
	try {
		await client.connect() // Connect to the MongoDB cluster
        const collection = client.db("booksdb").collection("booksdb") // Access the books collection
        const allBooks = await collection.find().toArray() // Find all documents in the books collection
        return allBooks
    } catch (err) {
        console.log(err)
    } finally {
        await client.close() // Close the connection when finished
    }
}

public_users.get('/books', async (req, res) => {
    const data =  await getAllBooks()
    res.json(data) 
})

// Get book details based on ISBN done
const getBookByISBN = async (isbn) => {
    try {
        await client.connect() // Connect to the MongoDB cluster
        const collection = client.db("booksdb").collection("booksdb"); // Access the books collection
        const book = await collection.findOne({ isbn: isbn }) // Find the document in the books collection with the given isbn
        if (book) {
            return book
        } else {
            return `No books with ISBN ${isbn}` //выводит в браузер, правильно реализовано?
        }
    } catch (err) { // Не доходит?
        //Нужна ли проверка на пустой isbn? Например: localhost:5000/isbn/
        console.log(err)
    } finally {
        await client.close() // Closes the connection when finished
    }
}

public_users.get('/isbn/:isbn', async function (req, res) {
    try {
        const data = await getBookByISBN(req.params.isbn)
        res.send(data)
    } catch (err) { //не доходит?
        res.send(err.message)
    }
})

// Get book details based on author
const getBookByAuthor = async (author) => {
    try {
        await client.connect() //Connect to the MongoDB cluster
        const collection = client.db("booksdb").collection("booksdb") //Access the books collection
        const booksByAuthor = await collection.find({ author: author }).toArray()
        
        if (booksByAuthor.length === 0) {
            return `No books found for author ${author}`
        } else {
            return booksByAuthor
        }
    } catch (err) {
        console.log(err)
    } finally {
        await client.close()
    }
}

public_users.get('/author/:author', async function (req, res) {
    try {
        const booksByAuthor = await getBookByAuthor(req.params.author)
        res.send(booksByAuthor)
    } catch (err) {
        res.send(`We have no books by ${author}`)
    }
})

// Get all books based on title
const getBookByTitle = async (title) => {
    try {
        await client.connect(); // Connect to the MongoDB cluster
        const collection = client.db("booksdb").collection("booksdb") // Access the booksdb collection
        const booksByTitle = await collection.find({title: title}).toArray() // Find all books with the specified title in the booksdb collection
        if (booksByTitle.length === 0) {
            throw new Error(`We have no book ${title}`)
        } else {
            return booksByTitle
        }
    } catch (err) {
        console.log(err) //какая команда нужна чтобы выводить сообщение в браузер? или так и должно работать (в консоли)?
    } finally {
        await client.close() // Close the connection when finished
    }
}

public_users.get('/title/:title', async function (req, res) {
    try {
        const bookByTitle = await getBookByTitle(req.params.title)
        res.send(bookByTitle)
    } catch (err) {
        res.send(err.message) //выходит в консоль, но не в браузер???
    }
})

//  Get book review
const getReviews = async (isbn) => {
    try {
        await client.connect()
        const collection = client.db("booksdb").collection("booksdb")
        const book = await collection.findOne({isbn: isbn}, {reviews: 1, _id: 0})
        if (Object.keys(book.reviews).length === 0) {
            throw new Error('We have no reviews for the book you requested')
            // В консоли выводится `Error: We have no reviews for the book you requested`
            // at getReviews (D:\projects\bookReview\bookReview\router\general.js:147:19))
            // at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
            // at async D:\projects\bookReview\bookReview\router\general.js:160:28
            // В браузере ничего не выводится
        } else {
            return book.reviews
        }
    } catch (err) {
        console.log(err)
    } finally {
        await client.close()
    }
}

public_users.get('/review/:isbn', async function (req, res) {
    try {
        const bookReview = await getReviews(req.params.isbn)
        res.send(bookReview)
    } catch (err) {
        res.send(err.message)
    } 
})

module.exports.general = public_users
