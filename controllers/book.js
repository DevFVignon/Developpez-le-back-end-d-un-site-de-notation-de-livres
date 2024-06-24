const Book = require('../models/Book');
const fs = require('fs');
const path = require('path');

exports.getBestRating = (req, res, next) => {
    //renvoyer un tableau des 3 livres de la BdD ayant la meilleure note moyenne
    Book.find().sort({averageRating: -1}).limit(3)
    .then((books)=>res.status(200).json(books))
    .catch((error)=>res.status(404).json({error}));
};

exports.createBook = (req, res, next) => {
    const bookObject = JSON.parse(req.body.book);
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

exports.modifyBook = async (req, res, next) => {
    try {
        const bookObject = req.file ? {
            ...JSON.parse(req.body.book),
            imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
        } : { ...req.body };
      
        try {
            delete bookObject._userId;
        } catch (deleteError) {
            return res.status(500).json({ message: 'Error deleting _userId', error: deleteError });
        }

        const book = await Book.findOne({_id: req.params.id});
        
        if (!book) {
            return res.status(404).json({ message: 'Livre non trouvé' });
        }

        if (book.userId != req.auth.userId) {
            return res.status(403).json({ message: '403: unauthorized request' });
        } 
        
        if (req.file && book.imageUrl) {
            const oldImagePath = path.join(__dirname, '..', 'images', path.basename(book.imageUrl));
            fs.unlink(oldImagePath, (err) => {
                if (err) {
                    console.error('Error deleting old image:', err);
                }
            });
        }

        await Book.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id });
        res.status(200).json({ message: 'Livre modifié!' });

    } catch (error) {
        if (error.kind === 'ObjectId') {
            res.status(400).json({ message: 'Invalid book ID' });
        } else {
            res.status(500).json({ error });
        }
    }
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
                res.status(403).json({message: '403: unauthorized reques'});
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
                    return res.status(403).json({ message: '403 : unauthorized request, vous avez déjà noté ce livre' });
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