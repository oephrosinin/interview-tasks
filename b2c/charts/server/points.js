const CONFIG = require('../config');


let Points = {

	// property to store scores of several diagrams
	arrays: [],

	// property to store scores
	points: [],

	// property for store socket and io instance
	io: false,
	socket: false,

	// intervals
	singleInterval: false,
	severalInterval: false,

	/**
	 * Get the points
	 * @param req
	 * @param res
	 */
	get(req, res) {
		if (!Points.points.length) {
			Points.initPoints();
		}
		res.json({points: Points.points});
	},


	/**
	 * Get the points for diagram by number
	 * @param req
	 * @param res
	 */
	getByNumber(req, res) {
		if (!Points.arrays.length) {
			return res.json({error: "No diagrams found"})
		}

		let n = parseInt(req.params.n);
		if (isNaN(n) || n > Points.arrays.length - 1) {
			n = 0;
		}
		res.json(Points.arrays[n] ? {points: Points.arrays[n]} : {error: "Cannot get the data"});
	},


	/**
	 * Init several graphs
	 * @param req
	 * @param res
	 */
	initSeveral(req, res) {
		let {n} = req.params;
		Points.arrays = [];

		for (let i = 0; i < n; i++) {
			Points.arrays.push(Points._getRandomPoints());
		}

		if (!Points.severalInterval) {
			Points.severalInterval = setInterval(Points._updateDiagrams, CONFIG.POINTS.UPDATE_INTERVAL);
			clearInterval(Points.singleInterval);
			Points.singleInterval = false;
		}
		res.json({n, data: Points.arrays});
	},


	/**
	 * Make socket emit and init coords
	 * @param io
	 * @param socket
	 */
	connect(io, socket) {
		Points.io = io;
		Points.socket = socket;

		if (!Points.points.length) {
			Points.initPoints();
		}

		io.emit('coordinates', Points.points);
	},


	/**
	 * Get random number
	 * @param min
	 * @param max
	 * @returns {number}
	 * @private
	 */
	_getRandom(min, max) {
		return Math.round(Math.random() * (max - min) + min);
	},


	/**
	 * Get array of random numbers
	 * @returns {Array}
	 * @private
	 */
	_getRandomPoints(){
		let arr = [];
		for (var pointIndex = 0; pointIndex < CONFIG.POINTS.QTY; pointIndex++) {
			arr.push(Points._getRandom(CONFIG.POINTS.MIN, CONFIG.POINTS.MAX));
		}
		return arr;
	},


	/**
	 * Create points set
	 * @param req
	 * @param res
	 */
	initPoints(req = {}, res = {}) {
		Points.points = Points._getRandomPoints();

		if (!Points.singleInterval) {
			Points.singleInterval = setInterval(Points._updatePoints, CONFIG.POINTS.UPDATE_INTERVAL);
			clearInterval(Points.severalInterval);
			Points.severalInterval = false;
		}

		if ("send" in res) {
			res.sendStatus(200);
		}
	},


	/**
	 * Update points data set
	 * @private
	 */
	_updatePoints() {
		Points.points.shift();
		Points.points.push(Points._getRandom(CONFIG.POINTS.MIN, CONFIG.POINTS.MAX));
		Points.io.emit('coordinates', Points.points);
	},


	/**
	 * Update diagrams data set
	 * @private
	 */
	_updateDiagrams() {
		Points.arrays.map(points => {
			points.shift();
			points.push(Points._getRandom(CONFIG.POINTS.MIN, CONFIG.POINTS.MAX));			
		});

		Points.io.emit('diagrams', Points.arrays);
	}
	
};

module.exports = Points;