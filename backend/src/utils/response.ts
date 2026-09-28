import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    [key: string]: any;
  };
}

export const sendSuccess = <T>(res: Response, data: T, statusCode: number = 200, meta?: any): Response => {
  const body: ApiResponse<T> = {
    success: true,
    data,
  };
  if (meta) {
    body.meta = meta;
  }
  return res.status(statusCode).json(body);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode: number = 500,
  code: string = 'INTERNAL_SERVER_ERROR',
  details?: any
): Response => {
  const body: ApiResponse = {
    success: false,
    error: {
      code,
      message,
    }
  };
  if (details && process.env.NODE_ENV !== 'production') {
    body.error!.details = details;
  }
  return res.status(statusCode).json(body);
};
