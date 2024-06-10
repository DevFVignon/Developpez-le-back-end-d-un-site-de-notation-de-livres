const Book = require('../models/Book');
const fs = require('fs');


exports.createBook = (req, res, next) => {
    const bookObject = JSON.parse(req.body.book);
    console.log('Voici le book object parsé', bookObject);
    delete bookObject._id;
    delete bookObject._userId;
    const book = new Book ({
        ...bookObject,
        userId: req.auth.userId,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
        averageRating: bookObject.ratings[0].grade
    }); 

    book.save()
    .then(()=>res.status(201).json({message: 'Livre ajouté !'}))
    .catch(error=> (res.status(400).json({error})));
};

exports.getAllBooks = (req, res, next) => {
    Book.find()
    .then((books) => res.status(200).json(books))
    .catch(error => res.status(404).json({ error }));
};

// exports.createBook = (req, res, next) => {
//     const bookObject = req.body;
//     console.log(bookObject);
//     delete req.body._id;
//     const book = new Book({
//         ...req.body
//     });
//     book.save()
//     .then(()=>res.status(201).json({message: 'Livre ajouté !'}))
//     .catch(error=> ({error}));}