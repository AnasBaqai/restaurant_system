import api from "./api";
import { Order, OrderStatus, PaymentMethod, ApiResponse } from "../types";

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

interface UpdateOrderData {
  table?: number;
  items?: {
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
    const response = await api.post<ApiResponse<{ order: Order }>>(
      "/orders",
      data
    );
    return response.data.data.order;
  }

  async getAllOrders(): Promise<Order[]> {
    const response = await api.get<ApiResponse<{ orders: Order[] }>>("/orders");
    return response.data.data.orders;
  }

  async getOrderById(id: string): Promise<Order> {
    const response = await api.get<ApiResponse<{ order: Order }>>(
      `/orders/${id}`
    );
    return response.data.data.order;
  }

  async getMyOrders(): Promise<Order[]> {
    const response = await api.get<ApiResponse<{ orders: Order[] }>>(
      "/orders/my-orders"
    );
    return response.data.data.orders;
  }

  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
    const response = await api.patch<ApiResponse<{ order: Order }>>(
      `/orders/${id}/status`,
      {
        status,
      }
    );
    return response.data.data.order;
  }

  async processPayment(
    id: string,
    paymentMethod: PaymentMethod,
    cashAmount?: number
  ): Promise<Order> {
    const response = await api.patch<ApiResponse<{ order: Order }>>(
      `/orders/${id}/payment`,
      {
        paymentMethod,
        cashAmount,
      }
    );
    return response.data.data.order;
  }

  async getReceipt(id: string): Promise<string> {
    const response = await api.get<ApiResponse<{ receipt: string }>>(
      `/orders/${id}/receipt`
    );
    const receipt = response.data.data.receipt;

    // Create a hidden iframe to handle the print
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    document.body.appendChild(iframe);

    // Write the receipt content to the iframe
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(`
            <html>
                <head>
                    <style>
                        @page {
                            margin: 0;
                            size: 80mm 297mm;  /* Standard thermal paper width */
                        }
                        body {
                            font-family: monospace;
                            font-size: 12px;
                            white-space: pre;
                            margin: 0;
                            padding: 0;
                        }
                    </style>
                </head>
                <body>${receipt}</body>
            </html>
        `);
      doc.close();

      // Print and remove the iframe
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }

    return receipt;
  }

  async updateOrder(id: string, data: UpdateOrderData): Promise<Order> {
    // Check if order can be edited
    const order = await this.getOrderById(id);
    if (order.status === OrderStatus.COMPLETED || order.paymentStatus) {
      throw new Error("Cannot edit completed or paid orders");
    }

    const response = await api.patch<ApiResponse<{ order: Order }>>(
      `/orders/${id}`,
      data
    );
    return response.data.data.order;
  }

  async updateOrderTable(id: string, newTable: number): Promise<Order> {
    // Check if order can be edited
    const order = await this.getOrderById(id);
    if (order.status === OrderStatus.COMPLETED || order.paymentStatus) {
      throw new Error("Cannot change table for completed or paid orders");
    }

    const response = await api.patch<ApiResponse<{ order: Order }>>(
      `/orders/${id}/table`,
      { table: newTable }
    );
    return response.data.data.order;
  }
}

export default new OrderService();
