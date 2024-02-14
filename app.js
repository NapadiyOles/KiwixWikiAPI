const express = require('express');
const path = require('path');
const logger = require('morgan');

const languagesRouter = require('./routes/languages');
const categoriesRouter = require('./routes/categories');
const booksRouter = require('./routes/books');
const downloadRouter = require('./routes/download');
const app = express();


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', languagesRouter);
app.use('/categories', categoriesRouter);
app.use('/books', booksRouter);
app.use('/download', downloadRouter);

app.use((req, res) => {
    res.status(404).json({ message: 'Current route is not found' });
});

module.exports = app;