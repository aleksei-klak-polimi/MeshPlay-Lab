export function successResponse(res, message, data = null, status = 200) {
  return res.status(status).json({ success: true, message, data });
}

export function errorResponse(res, message, code = 'GENERIC_ERROR', status = 400, details = null) {
  return res.status(status).json({
    success: false,
    message,
    error: { code, details }
  });
}