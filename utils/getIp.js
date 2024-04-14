function getClientIp(req) {
  return req.headers['x-forwarded-for'] ||
	req.ip ||
	req.connection?.remoteAddress ||
	req.socket?.remoteAddress ||
	req.connection?.socket?.remoteAddress ||
	'';
}
module.exports =  getClientIp;