const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const tutorSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    collegename: {
        type: String,
        required: true,
    },
    doubt: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
});

const Tutor = mongoose.model('Tutor', tutorSchema);

module.exports = Tutor;
