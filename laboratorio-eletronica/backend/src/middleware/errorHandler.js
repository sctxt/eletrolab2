class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

function errorHandler(err, req, res, next) {
  console.error('[Erro]', err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'Já existe um registro com esses dados.' });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Registro não encontrado.' });
  }

  return res.status(500).json({ error: 'Erro interno do servidor. Tente novamente mais tarde.' });
}

function notFoundHandler(req, res) {
  res.status(404).json({ error: `Rota não encontrada: ${req.method} ${req.originalUrl}` });
}

module.exports = { AppError, errorHandler, notFoundHandler };
