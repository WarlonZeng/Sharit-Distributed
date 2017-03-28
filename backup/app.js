var express = require('express');
var http = require('http');
var path = require('path');

//var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser'); // we dont actually need to parse cookies
var bodyParser = require('body-parser');
var session = require('express-session');

var app = express();

var api = require('./api/api');

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '/public')));

var sessionOptions = {
	secret: 'as89audacn123kjx24n238x',
	saveUninitialized: false, 
	resave: false
}

app.use(session(sessionOptions));

app.use('/', api);

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
	res.render('error');
});

module.exports = app;
