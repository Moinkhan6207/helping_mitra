export interface SuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

export interface ErrorDetail {
  code: string;
  details: any;
}

export interface ErrorResponse {
  success: false;
  message: string;
  error: ErrorDetail;
}

export interface AppHealthData {
  status: string;
}

export interface DbHealthData {
  database: string;
}
export type AppHealthResponse = SuccessResponse<AppHealthData>;
export type DbHealthResponse = SuccessResponse<DbHealthData>;
