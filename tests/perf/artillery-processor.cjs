function setAuthToken(req, context, ee, next) {
  if (context.vars && context.vars.token) {
    req.headers = req.headers || {};
    req.headers.Authorization = `Bearer ${context.vars.token}`;
  }
  return next();
}

function captureToken(req, res, context, ee, next) {
  try {
    const body = JSON.parse(res.body);
    if (body && body.accessToken) {
      context.vars = context.vars || {};
      context.vars.token = body.accessToken;
    }
  } catch (e) {}
  return next();
}

module.exports = { setAuthToken, captureToken };


