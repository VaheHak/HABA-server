module.exports = function serverHost(req, res, next) {
    try {
        global.serverUrl = req.protocol + '://' + req.headers.host;
        next();
    } catch (e) {
        next(e);
    }
}
