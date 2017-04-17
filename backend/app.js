var express = require('express');
var path = require('path');
//var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var redis   = require("redis");
var redisClient  = redis.createClient();
var session = require('express-session');
var redisStore = require('connect-redis')(session);

var index = require('./routes/index');
var subDom = require('./routes/subdomain');
var thread = require('./routes/thread');
var comment = require('./routes/comment');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

var sessionOptions = {
	secret: 'as89audacn123kjx24n238x',
	saveUninitialized: false, 
	resave: false,
	cookie: {
		httpOnly: false,
		expires: false,
		secure: false
	},
	store: new redisStore({ host: 'localhost', port: 6379, client: redisClient, ttl: 260}),
}

app.use(session(sessionOptions));

app.use('/', index);
app.use('/', subDom);
app.use('/', thread);
app.use('/', comment);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// error handler
app.use(function(err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	// render the error page
	res.status(err.status || 500);
	res.json('error');
});

// app.use(function(req, res, next) {
// 	res.setHeader('Access-Control-Allow-Credentials', 'true');
// 	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
// 	res.setHeader('Access-Control-Allow-Origin', 'http://localhost');
// 	res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, content-type, Authorization, Accept');
// 	next();
// });

module.exports = app;