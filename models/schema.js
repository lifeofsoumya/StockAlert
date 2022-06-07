
const mongoose = require('mongoose')
var schema = mongoose.Schema;

let userSchema = new schema({
    name: {type:String, required:true},
    email:{type:String, required:true},
    entryDate:{type:Date, default:Date.now} 
})

let users = mongoose.model('users', userSchema, 'users');

module.exports = users;