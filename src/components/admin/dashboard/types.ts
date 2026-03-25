export interface StatData {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
  bg: string;
  text: string;
  subText: string;
  iconBg: string;
  iconColor: string;
}

export interface ChartDataPoint {
  name: string;
  value: number;
}

export interface RecentOrder {
  id: string | number;
  name: string;
  avatar: string;
  productId: string;
  amount: string | number;
  status: "succeeded" | "failed" | "pending" | string;
}

export interface GoalData {
  current: number;
  target: number;
  percentage: number;
}
