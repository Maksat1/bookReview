import React, { useState, useEffect } from 'react'
const API_ENDPOINT = 'http://localhost:5000/books'

function App() {
  const [books, setBooks] = useState([]);
  
  useEffect(() => {
    console.log('use effect hook triggered')

    fetch(API_ENDPOINT)
      .then(response => response.json())
      .then(data => {
        console.log('API endpoint called successfully')
        setBooks(data)
      })
      .catch(error => console.log(error));
  }, []);

  console.log('Component rendered')
  return (
    <div>
      <h1>Book List</h1>
      <ul>
        {books.map(book => (
          <li key={book._id}>
            <h3>{book.title}</h3>
            <p>{book.author}</p>
            <ul>
              {Object.entries(book.reviews).map(([key, value]) => (
                <li key={key}>
                  <strong>Review {key}:</strong> {value}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App