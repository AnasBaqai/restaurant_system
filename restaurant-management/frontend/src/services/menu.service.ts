import api from "./api";
import { MenuItem, ApiResponse } from "../types";

interface MenuResponse extends ApiResponse<{ menuItems: MenuItem[] }> {}
interface SingleMenuResponse extends ApiResponse<{ menuItem: MenuItem }> {}

class MenuService {
  async getAllItems(): Promise<MenuItem[]> {
    const response = await api.get<MenuResponse>("/menu");
    return response.data.data.menuItems;
  }

  async getItemById(id: string): Promise<MenuItem> {
    const response = await api.get<SingleMenuResponse>(`/menu/${id}`);
    return response.data.data.menuItem;
  }

  async getItemsByCategory(category: string): Promise<MenuItem[]> {
    const response = await api.get<MenuResponse>(`/menu/category/${category}`);
    return response.data.data.menuItems;
  }

  async searchItems(query: string): Promise<MenuItem[]> {
    const response = await api.get<MenuResponse>(`/menu/search?query=${query}`);
    return response.data.data.menuItems;
  }

  async createItem(data: Partial<MenuItem>): Promise<MenuItem> {
    const response = await api.post<SingleMenuResponse>("/menu", data);
    return response.data.data.menuItem;
  }

  async updateItem(id: string, data: Partial<MenuItem>): Promise<MenuItem> {
    const response = await api.patch<SingleMenuResponse>(`/menu/${id}`, data);
    return response.data.data.menuItem;
  }

  async deleteItem(id: string): Promise<void> {
    await api.delete(`/menu/${id}`);
  }
}

export default new MenuService();
