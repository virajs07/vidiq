// app.js

// BASE SETUP
// ==============================================

'use strict'
var express = require('express');
var http = require("http");
var app = express();
var mongoose = require("mongoose");
var fs = require("fs");
var modelsPath = __dirname + '/server/models';
var express = require('express');
var compress = require('compression');
var multer = require('multer');
var logger = require('morgan');
var methodOverride = require('method-override');
var bodyParser = require('body-parser');
var errorHandler = require('error-handler');
var engine = require('ejs-locals');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var HttpStatus = require('http-status-codes');
var cookieParser = require('cookie-parser');
var session= require('express-session');
var assets = "/static/";
var staticPath = __dirname + assets;
var google = require("googleapis");
var youtube = google.youtube("v3");
var gPlus = google.plus("v1");
var youtubeAnalytics = google.youtubeAnalytics("v1");
var CLIENT_ID = "667644960205-67b919j8ir1cabi8lsi91fbfajbnoigg.apps.googleusercontent.com";
var CLIENT_SECRET = "xIUjFU8HjkJCEFN9T6qAu2SM";
var OAuth2 = google.auth.OAuth2;
var scopes = ["https://www.googleapis.com/auth/plus.login","https://www.googleapis.com/auth/youtube.force-ssl","https://www.googleapis.com/auth/youtube","https://www.googleapis.com/auth/youtube.readonly","https://www.googleapis.com/auth/youtube.upload","https://www.googleapis.com/auth/youtubepartner-channel-audit","https://www.googleapis.com/auth/yt-analytics.readonly","https://www.googleapis.com/auth/yt-analytics-monetary.readonly","https://www.googleapis.com/auth/youtubepartner"];
var redirect_url="http://localhost:8080/authenticate";
var oauth2Client =  new OAuth2(CLIENT_ID, CLIENT_SECRET,redirect_url);
var UserId = -1;
var userName = "";
var Account = require('./server/models/account');
var YoutubeInfo = require('./server/models/youtube');

app.engine('ejs',engine);
app.set('view engine', 'ejs');
app.use(compress());
app.use(express.static(staticPath));
app.use(logger('dev'));
app.use(methodOverride());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended : true }));
app.use(session({ secret: 'keyboard', cookie: { maxAge: 600000 }, resave:false, saveUninitialized:true}));
app.use(passport.initialize());
app.use(passport.session());


// passport config
passport.use(new LocalStrategy(Account.authenticate()));
passport.serializeUser(Account.serializeUser());
passport.deserializeUser(Account.deserializeUser());
// mongoose
mongoose.connect('mongodb://localhost/Vidiq');

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

app.all('/*', function(req, res, next) {
  // CORS headers
  res.header("Access-Control-Allow-Origin", "*"); // restrict it to the required domain
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  // Set custom headers for CORS
  res.header('Access-Control-Allow-Headers', 'Content-type,Accept,X-Access-Token,X-Key');
  if (req.method == 'OPTIONS') {
    res.status(200).end();
  } else {
    next();
  }
});

app.get('/',function(req,res){
    res.render('templates/index');
});

app.get('/login',function(req,res){
    res.render('templates/login');
});

app.post('/login',passport.authenticate('local',{
    successRedirect:'/welcome',
    failureRedirect:'/login'
}));

function getUserId(user,startDate,endDate){
    if(user=="new"){
        gPlus.people.get({userId:'me'},function(err,response){
            UserId = response.id;
            getUserChannel(startDate,endDate);
        });
    }
    else{
        //get userId from db
    }
}

function getUserChannel(startDate,endDate){
    youtube.channels.list({
        mine:true,
        part:"id",
    },function(err,response){
        for(var i=0;i<response.items.length;i++){
            getAnalyticsReport(startDate,endDate,response.items[i].id);
        }
    });
}

function formatNumber(number){
    if(number < 10)
        number = "0" + number
    return number;
}

function saveAnalyticsReport(channelId,data){
    var views,i,day,estimatedMinutesWatched,likes,dislikes,subscribersgained,subscriberslost,comments,averageviewduration,shares,searches;
    console.log("data is:"+data);
    for (i=0;i<data.columnHeaders.length;i++){
        if(data.columnHeaders[i].name == "day")
            day = i;
        else if(data.columnHeaders[i].name == "views")
            views = i;
        else if(data.columnHeaders[i].name == "estimatedMinutesWatched")
            estimatedMinutesWatched = i;
        else if(data.columnHeaders[i].name == "likes")
            likes = i;
        else if(data.columnHeaders[i].name == "dislikes")
            dislikes = i;
        else if(data.columnHeaders[i].name == "subscribersGained")
            subscribersgained = i;
        else if(data.columnHeaders[i].name == "subscribersGained")
            shares = i;
        else if(data.columnHeaders[i].name == "subscribersLost")
            subscriberslost = i;
        else if(data.columnHeaders[i].name == "comments")
            comments = i;
        else
            averageviewduration = i;
    }
    for(i=0;i<data.rows.length;i++){
        var subscribers = data.rows[i][subscribersgained] - data.rows[i][subscriberslost];
        var views = 0, eMW = 0,likes = 0,comments = 0,shares = 0,searches = 0;
        if(data.rows[i][views]>=0)
            views = data.rows[i][views];
        if(data.rows[i][estimatedMinutesWatched]>=0)
            eMW = data.rows[i][estimatedMinutesWatched];
        if(data.rows[i][likes]>=0)
            likes = data.rows[i][likes];
        if(data.rows[i][comments]>=0)
            comments = data.rows[i][comments];
        if(data.rows[i][shares]>=0)
            shares = data.rows[i][shares];
        if(data.rows[i][searches]>=0)
            searches = data.rows[i][searches];

        var info = new YoutubeInfo({UserName:userName,GoogleId:UserId,ChannelId:channelId,Views:views,EstimatedMinutesWatched:eMW,Likes:likes,Comments:comments,Shares:shares,Subscribers:subscribers,Searches:searches,Day:data.rows[i][day]});
        info.save(function(err){
        if(err){
            console.log("Error is" + err);
        }
        else{
            console.log("Saved Successfully" );
        }
    });
  }
}

function getAnalyticsReport(startDate,endDate,channelId){
    var startdate  = startDate.getFullYear() + "-" + formatNumber(startDate.getMonth() + 1) + "-01";
    var enddate = endDate.getFullYear() + "-" + formatNumber(endDate.getMonth()+1) + "-01";
    var metrics = "views,estimatedMinutesWatched,likes,dislikes,shares,subscribersGained,subscribersLost,comments,averageViewDuration";
    var dimensions = "day";
    youtubeAnalytics.reports.query({ids:"channel=="+channelId,"start-date":startdate,"end-date":enddate,metrics:metrics,dimensions:dimensions,sort:"day"},function(error,response){
        console.log(response);
        saveAnalyticsReport(channelId,response);
    });
}

app.get("/authenticate",function(req,res){
    var code = req.query.code;
    oauth2Client.getToken(code, function(err, tokens) {
        if(!err) {
            oauth2Client.setCredentials(tokens);
            google.options({auth:oauth2Client});
            var date = new Date();
            getUserId("new",new Date(date.getTime() - (1000*60*60*24*30*6)),date);
        }
        else{
            res.redirect("/welcome");
        }
    });
});

app.get('/register',function(req,res){
    if(!req.session.passport.user)
        res.render('templates/register',{message:""});
    else
        return res.redirect("/welcome");
});

app.get('/welcome',function(req,res){
    if(!req.session.passport.user){
        userName = req.session.passport.user;
        res.redirect('/register');
    }
    else{
        //see if user has synced youtube
         var url = oauth2Client.generateAuthUrl({
             access_type: 'offline',
             scope: scopes
         });
        res.redirect(url);
    }
});

var register = function(req,res){
    var password = req.body.password;
    Account.register(new Account({username:req.body.username,fullname:req.body.fullname}),password,function(err,account){
        if(err){
            res.status(400);
        }
        else{
            res.status(200);
            console.log("status is" + res.statusCode);
        }
         sendRegisterResponse(req,res);
    });
}

var sendRegisterResponse = function(req,res){
    if(req.originalUrl.indexOf("api")!=-1){
        if(res.statusCode == 400)
            res.send({"message" : "User is already registered with this UserId"});
        else{
             passport.authenticate('local',function(err,user,info){
                if(err || !user)
                   return res.send({"message" : "User is already registered with this UserId"});
                req.logIn(user,function(err){
                    if(err)
                        return  res.send({"message" : "User is already registered with this UserId"});
                    res.send({"message" : " New User successfully created ","user":user.username});
                });
            })(req,res);
        }
    }
    else{
        if(res.statusCode == 400)
            res.render('templates/register',{message:"User is already registered with this UserId"});
        else{
            passport.authenticate('local',function(err,user,info){
                if(err || !user)
                   return res.render('templates/register',{message:"Problem in authenticating the user. Please try again"});
                req.logIn(user,function(err){
                    if(err)
                        return  res.render('templates/register',{message:"Problem in authenticating the user. Please try again"});
                    res.redirect('/welcome');
                });
            })(req,res);
        }
    }
};

app.post('/register',function(req,res){
    register(req,res);
});


// START THE SERVER
// ==============================================
app.listen('8080');

// ROUTES
// ==============================================
// we'll create our routes here
var router = express.Router();

//app.all('/api/*',[require('./middlewares/validateRequest')])

// route middleware that will happen on every request
router.use(function(err,req, res, next){
});


// home page route
router.get('/', function(req, res) {
    res.send('im the home page!');
});

//authenticate user
router.post('/login',function(req,res){
    
});

router.post('/register',function(req,res){
    register(req,res);
});


app.use('/api', router);

module.exports = app;


