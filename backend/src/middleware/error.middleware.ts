export function errorMiddleware(err: any, req: any, res: any, next: any) {
  if (err.isApiError) {
    return res.status(err.status).json(err.toResponse());
  }

  console.error(err);
  res.status(500).json({
    error: "INTERNAL_ERROR",
    message: "Unexpected server error"
  });
}