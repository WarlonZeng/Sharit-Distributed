var express = require('express');
var pg = require('pg');
var bcrypt = require('bcryptjs');
var router = express.Router();

var configDB = require('../config/dbconfig.js');
var pool = new pg.Pool(configDB);

var defaultSub = {
	Bio: 1,
	Math: 2,
	CS: 3,
	Chem: 4
}

/* GET home page. */
router.get('/', function(req, res) {
	var user = req.query.username;
	if(user){
		for(var key in req.session[user].subnav){
			console.log(key, req.session[user].subnav[key]);
		}
		res.render('index', {nav: req.session[user].nav, subnav: req.session[user].subnav});
	}else{
		res.render('initial');
	}
});

router.get('/login', function(req, res){
	res.render('login');
});

router.get('/register', function(req, res){
	res.render('register');
});

router.post('/register', function(req, res){
	var salt =  bcrypt.genSaltSync(10);
	var {username, password, first_name, last_name, email, phone, company} = req.body;
	var hash = bcrypt.hashSync(password, salt);
	pool.connect(function(err, client, done){
		var queryFind = 'SELECT username FROM users.user WHERE username=$1';
		var queryInsert = 'INSERT INTO users.user(username, hash, first_name, last_name, email, phone, company, salt) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING username';
		var domainInsert = 'INSERT INTO permissions.domain_user VALUES($1, $2, $3)';
		var subInsert = 'INSERT INTO permissions.subdomain_user VALUES($1, $2, $3)';

		client.query(queryFind, [username], function(err, result){
			if(err){
				console.log('Error running query', err);
				return res.render('error', {error: err})
			}
			if(result.rows.length === 0){
				client.query(queryInsert, [username, hash, first_name, last_name, email, phone, company, salt], function(err, result){
					done();
					if(err){
						console.log('Error running query', err);
						return res.render('error', {error: err})
					}
					console.log(result.rows);
					res.redirect('/');
					client.query(domainInsert, [1, username, false], function(err, result){
						if(err) console.log('Error running query', err);
						for(var key in defaultSub){
							client.query(subInsert, [defaultSub[key], username, false]);
						}
						done();
					});
				});
			}else{
				done();
				res.redirect('/register');
			}
		});
	});
});

router.post('/login', function(req, res){
	var findSalt = 'SELECT salt FROM users.user WHERE username=$1';
	var validLogin = 'SELECT * FROM users.user WHERE username=$1 and hash=$2';
	var findDomains = 'SELECT name, id from permissions.domain_user NATURAL JOIN domains.domain WHERE username = $1';
	var findsubDomains = 'SELECT name, id from permissions.subdomain_user as perm JOIN domains.subdomain as dom ON(perm.subdomain_id = dom.id) WHERE username = $1';
	console.log(req.body);
	pool.connect(function(err, client, done){
		if(err){
			console.log('Error running query', err);
			return res.render('error', {error: err})
		}
		client.query(findSalt, [req.body.username], function(err, result){
			if(err){
				console.log('Error running query', err);
				return res.render('error', {error: err})
			}
			if(result.rows.length !== 0){
				var hash = bcrypt.hashSync(req.body.password, result.rows[0].salt);
				client.query(validLogin, [req.body.username, hash], function(err, result){
					if(result.rows.length != 0){
						
						client.query(findDomains, [req.body.username], function(err, result){

							var domains = result.rows;
							client.query(findsubDomains, [req.body.username], function(err, result){

								done();
								var subs = result.rows;
								req.session[req.body.username] = {nav: domains, subnav: subs};
								res.redirect('/?username=' + req.body.username);
							});
						});

					}
					else
						return res.redirect('/login');
				});
			}else{
				return res.redirect('/login');
			}
			done();
		});
	});
});

router.post('/getDomain', function(req, res){
	var findDomains = 'SELECT name, id from permissions.domain_user NATURAL JOIN domains.domain WHERE username = $1';
	console.log(req.body);
	pool.connect(function(err, client, done){
		client.query(findDomains, [req.body.username], function(err, result){
			console.log(result.rows);
			done();
			res.json(result.rows);
		});
	});
});

router.post('/getsubDomain', function(req, res){
	var findsubDomains = 'SELECT name, id from permissions.subdomain_user as perm JOIN domains.subdomain as dom ON(perm.subdomain_id = dom.id) WHERE username = $1';
	console.log(req.body);
	pool.connect(function(err, client, done){
		client.query(findsubDomains, [req.body.username], function(err, result){
			console.log(result.rows);
			done();
			res.json(result.rows);
		});
	});
});

router.post('/createThread', function(req, res){
	var createThread = 'INSERT INTO posts.thread(subdomain_id, title, author, context) VALUES($1, $2, $3, $4)';
	pool.connect(function(err, client, done){
		client.query(createThread, [req.body.subdomain_id, req.body.title, req.body.author, req.body.context], function(err, result){
			console.log(result.rows);
			done();
			res.json(result.rows);
		});
	});
});

router.post('/getThread', function(req, res){
	var findThreads = 'SELECT * from posts.thread WHERE subdomain_id = $1';
	console.log(req.body);
	pool.connect(function(err, client, done){
		client.query(findThreads, [req.body.subdomain_id], function(err, result){
			console.log(result.rows);
			done();
			res.json(result.rows);
		});
	});
});

router.post('/createComment', function(req, res){
	var createComment = 'INSERT into posts.comment(thread_id, author, comment) values($1, $2, $3)';
	console.log(req.body);
	pool.connect(function(err, client, done){
		client.query(createComment, [req.body.thread_id, req.body.author, req.body.comment], function(err, result){
			console.log(result.rows);
			done();
			res.json(result.rows);
		});
	});
});

router.post('/getComment', function(req, res){
	var findComments = 'SELECT * from posts.comment JOIN posts.thread on(thread_id = $1)';
	console.log(req.body);
	pool.connect(function(err, client, done){
		client.query(findComments, [req.body.thread_id], function(err, result){
			console.log(result.rows);
			done();
			res.json(result.rows);
		});
	});
});

router.post('/voteThread', function(req, res){
	var voteThread;
	if (req.body.vote == 1) 
		voteThread = 'UPDATE posts.thread SET points = points + $1 WHERE posts.thread.id = $2';
	else
		voteThread = 'UPDATE posts.thread SET points = points - $1 WHERE posts.thread.id = $2';
	console.log(req.body);
	pool.connect(function(err, client, done){
		client.query(voteThread, [req.body.vote, req.body.thread_id], function(err, result){
			console.log(result.rows);
			done();
			res.json(result.rows);
		});
	});
});

router.post('/voteComment', function(req, res){
	var voteComment;
	if (req.body.vote == 1) 
		var voteComment = 'UPDATE posts.comment SET points = points + $1 WHERE post.comment.id = $2';
	else
		var voteComment = 'UPDATE posts.comment SET points = points - $1 WHERE post.comment.id = $2';
	console.log(req.body);
	pool.connect(function(err, client, done){
		client.query(voteComment, [req.body.vote, req.body.comment_id], function(err, result){
			console.log(result.rows);
			done();
			res.json(result.rows);
		});
	});
});

module.exports = router;