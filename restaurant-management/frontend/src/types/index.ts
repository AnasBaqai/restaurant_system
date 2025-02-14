export enum UserRole {
  ADMIN = "admin",
  MANAGER = "manager",
  WAITER = "waiter",
  CHEF = "chef",
}

export enum OrderStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum TableStatus {
  AVAILABLE = "available",
  OCCUPIED = "occupied",
  RESERVED = "reserved",
  CLEANING = "cleaning",
}

export enum PaymentMethod {
  CASH = "cash",
  CARD = "card",
  DIGITAL_WALLET = "digital_wallet",
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  lastLogin?: Date;
}

export interface MenuItem {
  _id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  image?: string;
  customizations?: {
    name: string;
    options: {
      name: string;
      price: number;
    }[];
  }[];
  available: boolean;
  preparationTime: number;
}

export interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
  customizations?: {
    name: string;
    option: string;
    price: number;
  }[];
  subtotal: number;
}

export interface Order {
  _id: string;
  orderNumber: string;
  table: number;
  waiter: User;
  items: OrderItem[];
  status: OrderStatus;
  subtotal: number;
  tax: number;
  serviceCharge: number;
  total: number;
  paymentMethod?: PaymentMethod;
  paymentStatus: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Table {
  _id: string;
  tableNumber: number;
  capacity: number;
  status: TableStatus;
  currentWaiter?: User;
  currentOrder?: string;
  lastCleaned?: Date;
}

export interface AuthResponse {
  status: string;
  token: string;
  data: {
    user: User;
  };
}

export interface ApiResponse<T> {
  status: string;
  data: T;
  results?: number;
}
