// Error con código HTTP para que los controladores respondan de forma consistente.
function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

module.exports = { httpError };
