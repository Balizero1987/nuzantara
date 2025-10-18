export function generateTestData(context, events, done) {
  context.vars.testId = Math.random().toString(36).substring(7);
  context.vars.timestamp = Date.now();
  return done();
}

export function logResult(requestParams, response, context, ee, next) {
  if (response.statusCode >= 400) {
    console.log(`Error ${response.statusCode} for ${requestParams.url}`);
  }
  return next();
}

export function validateHealthResponse(requestParams, response, context, ee, next) {
  if (response.body && JSON.parse(response.body).status !== 'HEALTHY') {
    ee.emit('error', 'Health check failed');
  }
  return next();
}