import api from "./api";
import { ApiResponse } from "../types";

export interface DailySalesReport {
  date: Date;
  totalSales: number;
  totalOrders: number;
  salesByCategory: Record<string, number>;
}

export interface WaiterStats {
  waiter: {
    id: string;
    name: string;
  };
  totalOrders: number;
  totalSales: number;
  averageOrderValue: number;
}

export interface WaiterPerformanceReport {
  startDate: Date;
  endDate: Date;
  waiterStats: WaiterStats[];
}

export interface InventoryStats {
  name: string;
  category: string;
  totalQuantitySold: number;
  totalRevenue: number;
}

export interface InventoryReport {
  startDate: Date;
  endDate: Date;
  inventoryStats: InventoryStats[];
}

export interface MonthlyRevenueData {
  _id: number;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
}

export interface MonthlyRevenueReport {
  year: number;
  monthlyRevenue: MonthlyRevenueData[];
}

class ReportService {
  async getDailySalesReport(): Promise<DailySalesReport> {
    const response = await api.get<ApiResponse<DailySalesReport>>(
      "/reports/daily-sales"
    );
    return response.data.data;
  }

  async getWaiterPerformanceReport(
    startDate?: string,
    endDate?: string
  ): Promise<WaiterPerformanceReport> {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const response = await api.get<ApiResponse<WaiterPerformanceReport>>(
      `/reports/waiter-performance?${params.toString()}`
    );
    return response.data.data;
  }

  async getInventoryReport(
    startDate?: string,
    endDate?: string
  ): Promise<InventoryReport> {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const response = await api.get<ApiResponse<InventoryReport>>(
      `/reports/inventory?${params.toString()}`
    );
    return response.data.data;
  }

  async getMonthlyRevenueReport(year?: number): Promise<MonthlyRevenueReport> {
    const params = new URLSearchParams();
    if (year) params.append("year", year.toString());

    const response = await api.get<ApiResponse<MonthlyRevenueReport>>(
      `/reports/monthly-revenue?${params.toString()}`
    );
    return response.data.data;
  }
}

export default new ReportService();
