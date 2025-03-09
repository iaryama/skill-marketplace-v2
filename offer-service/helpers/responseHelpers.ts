import { Response } from "express";
import { HTTP_STATUS_CODE } from "./constants";
export function successResponse(res: Response, statusCode: HTTP_STATUS_CODE.OK | HTTP_STATUS_CODE.CREATED, data: any) {
  res.status(statusCode).json({
    data,
    status: "success",
    error: null,
  });
}

export function failureResponse(
  res: Response,
  statusCode: HTTP_STATUS_CODE.BAD_REQUEST | HTTP_STATUS_CODE.ACCESS_FORBIDDEN | HTTP_STATUS_CODE.METHOD_NOT_ALLOWED | HTTP_STATUS_CODE.NOT_FOUND | HTTP_STATUS_CODE.UNAUTHORIZED | HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR,
  error: any
) {
  res.status(statusCode).json({
    error,
    status: "failure",
    data: null,
  });
}
