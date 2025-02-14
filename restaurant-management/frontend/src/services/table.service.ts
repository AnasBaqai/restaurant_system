import api from "./api";
import { Table, TableStatus, ApiResponse } from "../types";

type TableResponse = ApiResponse<{ tables: Table[] }>;
type SingleTableResponse = ApiResponse<{ table: Table }>;

interface CreateTableData {
  tableNumber: number;
  capacity: number;
}

class TableService {
  async createTable(data: CreateTableData): Promise<Table> {
    const response = await api.post<SingleTableResponse>("/tables", data);
    return response.data.data.table;
  }

  async getAllTables(): Promise<Table[]> {
    const response = await api.get<TableResponse>("/tables");
    return response.data.data.tables;
  }

  async getTableById(id: string): Promise<Table> {
    const response = await api.get<SingleTableResponse>(`/tables/${id}`);
    return response.data.data.table;
  }

  async getAvailableTables(): Promise<Table[]> {
    const response = await api.get<TableResponse>("/tables/available");
    return response.data.data.tables;
  }

  async updateTableStatus(id: string, status: TableStatus): Promise<Table> {
    const response = await api.patch<SingleTableResponse>(
      `/tables/${id}/status`,
      {
        status,
      }
    );
    return response.data.data.table;
  }

  async assignWaiter(id: string, waiterId: string): Promise<Table> {
    const response = await api.patch<SingleTableResponse>(
      `/tables/${id}/waiter`,
      {
        waiterId,
      }
    );
    return response.data.data.table;
  }
}

export default new TableService();
