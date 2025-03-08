import { Response } from "express";
export function successResponse(res: Response, statusCode: 200 | 201, data: any) {
  res.status(statusCode).json({
    data,
    status: "success",
    error: null,
  });
}

export function failureResponse(
  res: Response,
  statusCode: 400 | 405 | 403 | 404 | 401 | 500,
  error: any
) {
  res.status(statusCode).json({
    error,
    status: "failure",
    data: null,
  });
}
