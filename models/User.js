const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: {
      type: String, 
      unique: true, 
      required: true 
    },
    // usiamo anche la mail per eventuali notifiche (?)
    email: {    
      type: String,
      unique: true, 
      required: true
    },
    password: { 
      type: String, 
      required: true 
    },
    realName: {
      type: String, 
      required: true
    },
    birthday: {
      type: Date, 
      required: true
    }
  });

module.exports = mongoose.model('User', userSchema);