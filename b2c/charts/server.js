var express = require('express');
var path = require('path');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

var CONFIG = require('./config');
var Points = require('./server/points');

io.on('connection', Points.connect.bind(this, io));

// view engine setup
app.set('views', path.join(__dirname, 'templates'));
app.set('view engine', 'jade');

app.use(express.static(path.join(__dirname, '/client/public')));

app.get('/api/v1/config', (req, res) => {
	res.json(CONFIG);
});

app.get('/api/v1/points', Points.get);
app.get('/api/v1/points/:n', Points.getByNumber);
app.get('/api/v1/init/single', Points.initPoints);
app.get('/api/v1/init/several/:n', Points.initSeveral);

app.get('/', (req, res) => {
	res.render('index');
});

server.listen(3000, () => {
	console.log('listening on port 3000');
});
