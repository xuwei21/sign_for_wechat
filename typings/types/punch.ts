// types/punch.ts
export interface PunchRecord {
  _id?: string;
  date: string; // 格式: yyyy-MM-dd
  clockInTime: string | null;
  clockOutTime: string | null;
  createdAt?: any;
  updatedAt?: any;
  _openid?: string;
}

export interface CloudFunctionResult<T = any> {
  success: boolean;
  data?: T;
  message: string;
  error?: any;
}