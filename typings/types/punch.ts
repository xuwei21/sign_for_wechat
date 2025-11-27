export interface PunchRecord {
  _id?: string;
  date: string; // 格式: yyyy-MM-dd
  clockInTime: string | null;
  clockOutTime: string | null;
  weekday: string; // 星期几
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

// 新增统计相关类型
export interface MonthlyStat {
  month: string;
  totalHours: string;
  workDays: number;
  dailyAverage: string;
}

export interface YearSummary {
  totalHours: string;
  monthlyAverage: string;
  workMonths: number;
}