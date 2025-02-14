import api from "./api";
import { Order, OrderStatus, PaymentMethod, ApiResponse } from "../types";

interface OrderResponse extends ApiResponse<{ orders: Order[] }> {}
interface SingleOrderResponse extends ApiResponse<{ order: Order }> {}

interface CreateOrderData {
  table: number;
  items: {
    menuItem: string;
    quantity: number;
    customizations?: {
      name: string;
      option: string;
      price: number;
    }[];
  }[];
  notes?: string;
}

class OrderService {
  async createOrder(data: CreateOrderData): Promise<Order> {
    const response = await api.post<SingleOrderResponse>("/orders", data);
    return response.data.data.order;
  }

  async getAllOrders(): Promise<Order[]> {
    const response = await api.get<OrderResponse>("/orders");
    return response.data.data.orders;
  }

  async getOrderById(id: string): Promise<Order> {
    const response = await api.get<SingleOrderResponse>(`/orders/${id}`);
    return response.data.data.order;
  }

  async getMyOrders(): Promise<Order[]> {
    const response = await api.get<OrderResponse>("/orders/my-orders");
    return response.data.data.orders;
  }

  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
    const response = await api.patch<SingleOrderResponse>(
      `/orders/${id}/status`,
      {
        status,
      }
    );
    return response.data.data.order;
  }

  async processPayment(
    id: string,
    paymentMethod: PaymentMethod
  ): Promise<Order> {
    const response = await api.patch<SingleOrderResponse>(
      `/orders/${id}/payment`,
      {
        paymentMethod,
      }
    );
    return response.data.data.order;
  }
}

export default new OrderService();
