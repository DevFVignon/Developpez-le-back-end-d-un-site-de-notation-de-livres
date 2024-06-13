const Book = require('../models/Book');
const fs = require('fs');

exports.getBestRating = (req, res, next) => {
    //renvoyer un tableau des 3 livres de la BdD ayant la meilleure
    //note moyenne
    Book.find().sort({averageRating: -1}).limit(3)
    .then((books)=>res.status(200).json(books))
    .catch((error)=>res.status(404).json({error}));
};

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

exports.modifyBook = (req, res, next) => {
    console.log('Requête PUT reçue pour /api/books/:id');
    const bookObject = req.file ? {
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : { ...req.body };
  
    delete bookObject._userId;
    Book.findOne({_id: req.params.id})
        .then((book) => {
            if (book.userId != req.auth.userId) {
                res.status(401).json({ message : 'Non autorisé'});
            } else {
                Book.updateOne({ _id: req.params.id}, { ...bookObject, _id: req.params.id})
                .then(() => res.status(200).json({message : 'Livre modifié!'}))
                .catch(error => res.status(401).json({ error }));
            }
        })
        .catch((error) => {
            res.status(400).json({ error });
        });
 };

exports.getAllBooks = (req, res, next) => {
    Book.find()
    .then((books) => res.status(200).json(books))
    .catch(error => res.status(404).json({ error }));
};

exports.getOneBook = (req, res, next) => {
    Book.findOne({_id: req.params.id})
        .then((book) => res.status(200).json(book))
        .catch(error => res.status(404).json({ error }));
};

exports.deleteBook = (req, res, next) => {
    Book.findOne({ _id: req.params.id})
        .then(book => {
            if (book.userId != req.auth.userId) {
                res.status(401).json({message: 'Non autorisé'});
            } else {
                const filename = book.imageUrl.split('/images/')[1];
                fs.unlink(`images/${filename}`, () => {
                    Book.deleteOne({_id: req.params.id})
                        .then(() => { res.status(200).json({message: 'Livre supprimé !'})})
                        .catch(error => res.status(401).json({ error }));
                });
            }
        })
        .catch( error => {
            res.status(500).json({ error });
        });
 };





 exports.createRating = (req, res, next) => {
    // Vérification de la note entre 0 et 5
    if (req.body.rating >= 0 && req.body.rating <= 5) {
        // Recherche si le livre existe
        const bookId = req.params.id;
        Book.findById(bookId)
            .then(book => {
                if (!book) {
                    return res.status(400).json({ message: 'Livre non trouvé' });
                }

                // Vérification si l'utilisateur a déjà noté le livre
                const userId = req.auth.userId;
                const userHasRated = book.ratings.some(rating => rating.userId === userId);
                if (userHasRated) {
                    return res.status(404).json({ message: 'Vous avez déjà noté ce livre' });
                }

                // Push de la nouvelle note avec l'ID de l'utilisateur
                const newRating = {
                    userId: userId,
                    grade: req.body.rating
                };
                book.ratings.push(newRating);

                // Mise à jour de l'average rating
                const totalRatings = book.ratings.length;
                const totalRatingSum = book.ratings.reduce((sum, rating) => sum + rating.grade, 0);
                book.averageRating = (totalRatingSum / totalRatings).toFixed(0);

                // Sauvegarde des modifications
                return book.save();
            })
            .then(updatedBook => res.status(200).json(updatedBook))
            .catch(error => res.status(500).json({ error }));
    } else {
        return res.status(400).json({ message: 'La note doit être comprise entre 0 et 5.' });
    }
};


//avant implémentation multer et vérification user id

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

// Book.updateOne({_id: req.params.id}, {...req.body, _id: req.params.id})
// .then(()=>res.status(200).json({message: 'Livre modifié'}))
// .catch(error=> res.status(400).json({error}));

// Book.deleteOne({_id: req.params.id})
// .then(() => res.status(200).json({ message: 'Livre supprimé !'}))
// .catch(error => res.status(400).json({ error }));