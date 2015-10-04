var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');
var autoIncrement = require('mongoose-auto-increment');

var Account = new Schema({
    username: { required: true, unique: true, type: String},
    fullname: { type: String, trim: true}
});
Account.plugin(passportLocalMongoose);
module.exports = mongoose.model('Account', Account);
