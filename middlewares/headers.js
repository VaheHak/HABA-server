module.exports = function headers(req, res, next) {
	try {
		const {headers: {origin = '*'}} = req;
		const allowOrigins = [
			process.env.DOMAIN,
			'http://localhost:3001',
			'http://46.101.57.223',
			'http://192.168.100.32:3000',
			'https://console.habaexpress.com'
		];
		if (allowOrigins.includes(origin) || 1){
			res.setHeader('Access-Control-Allow-Origin', origin);
			res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,Content-Type,Authorization,X-API-KEY');
			res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,GET,POST,PUT,DELETE,PATCH');
			res.setHeader('Access-Control-Allow-Credentials', true);
		}
		next();
	} catch (e) {
		next(e);
	}
}
//Todo
