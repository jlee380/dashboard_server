const express = require('express');
const app = express();
const cors = require('cors');
const pool = require('./db');
const bcrypt = require('bcrypt');
const session = require('express-session');
const flash = require('express-flash');
const passport = require('passport');

//middleware
app.use(cors());
app.use(express.json()); // req.body

const initializePassport = require('./passport-config');
initializePassport(passport);

const PORT = process.env.PORT || 8001;

app.use(
	session({
		secret: 'secret',
		resave: false,
		saveUninitialized: false,
	})
);
app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

// Routes

// Create a todo

app.post('/todos', async (req, res) => {
	try {
		const { description } = req.body;
		const newTodo = await pool.query(
			'INSERT INTO todo (description) VALUES ($1) RETURNING *',
			[description]
		);

		res.json(newTodo.rows[0]);
	} catch (err) {
		console.error(err.message);
	}
});

// get all todos

app.get('/todos', async (req, res) => {
	try {
		const allTodos = await pool.query('SELECT * FROM todo');
		res.json(allTodos.rows);
	} catch (err) {
		console.error(err.message);
	}
});

// get a todo

app.get('/todos/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const todo = await pool.query('SELECT * FROM todo WHERE todo_id = $1', [
			id,
		]);

		res.json(todo.rows[0]);
	} catch (error) {
		console.error(error.message);
	}
});

// update a todo

app.put('/todos/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const { description } = req.body;
		const updateTodo = await pool.query(
			'UPDATE todo SET description = $1 WHERE todo_id = $2',
			[description, id]
		);

		res.json('todo was updated!');
	} catch (error) {
		console.error(error.message);
	}
});

// delete a todo
app.delete('/todos/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const deleteTodo = await pool.query(
			'DELETE FROM todo WHERE todo_id = $1',
			[id]
		);

		res.json('Todo was deleted');
	} catch (error) {
		console.error(error.massage);
	}
});

// user registration
app.post('/users/register', async (req, res) => {
	try {
		const { firstname, lastname, email, password } = req.body;
		let hashedPassword = await bcrypt.hash(password, 10);
		const registerUser = await pool.query(
			'INSERT INTO users (firstname, lastname, email, password) VALUES ($1, $2, $3, $4) RETURNING id, password',
			[firstname, lastname, email, hashedPassword],
			(err, results) => {
				if (err) {
					throw err;
				}
				console.log(results.rows);
				req.flash(
					'success_msg',
					'Now you are registerd. Please log in'
				);
				// res.redirect('/users/login');
			}
		);
		res.json(registerUser);
	} catch (error) {
		console.error(error.message);
	}
});

app.post(
	'/users/login',
	passport.authenticate('local', {
		successRedirect: '/users/dashboard',
		failureRedirect: '/users/login',
		failureFlash: true,
	})
);

app.get('users/logout', (req, res) => {
	req.logOut();
	req.flash('success_msg', 'You have logged out');
	res.redirect('users/login');
});

app.get('/', (req, res) => {
	res.send('index');
});

app.get('/users/register', checkAuthenticated, (req, res) => {
	res.send('register');
});

app.get('/users/login', checkAuthenticated, (req, res) => {
	console.log(req.session.flash.error);
	res.send('login');
});

app.get('/users/dashboard', checkNotAuthenticated, (req, res) => {
	console.log(req.isAuthenticated());
	res.send('dashboard', { user: req.user.name });
});

app.get('/alluser', async (req, res) => {
	try {
		const alluser = await pool.query('SELECT * FROM users');
		res.json(alluser.rows);
	} catch (error) {
		console.error(error.message);
	}
});

const checkAuthenticated = (req, res, next) => {
	if (req.isAuthenticated()) {
		return res.redirect('/users/dashboard');
	}
	next();
};

const checkNotAuthenticated = (req, res, next) => {
	if ((req, isAuthenticated())) {
		return next();
	}
	res.redirect('users/login');
};

app.listen(PORT, () => {
	console.log(`server has started on port ${PORT}`);
});
``;
