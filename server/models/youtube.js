var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');

var Youtube = new Schema({
    UserId:{type: Number, min: 0},
    GoogleId:{type: String, trim: true},
    ChannelId:{type: String, trim: true},
    Views:{type: Number,min:0},
    AverageViewDuration:{type: Number,min: 0},
    Likes: {type: Number,min: 0},
    Comments: {type: Number,min: 0},
    Shares: {type: Number,min: 0},
    Subscribers: {type: Number,min: 0},
    Searches: {type: Number,min: 0}
})

var YoutubeInfo = mongoose.model('YoutubeInfo', Youtube);
module.exports = YoutubeInfo;
