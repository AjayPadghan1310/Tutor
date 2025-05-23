const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const teacherSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    subject: {
        type: String,
        required: true,
    },
    experience: {
        type: Number,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    photoUrl: {
        type: String,
        required: true,
    },
});

const Teacher = mongoose.model('Teacher', teacherSchema);

module.exports = Teacher;
