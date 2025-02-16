import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  MenuItem,
  Chip,
  IconButton,
  Alert,
  Snackbar,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import {
  getOrders,
  createOrder,
  updateOrderStatus,
  CreateOrderRequest,
} from "../../store/slices/ordersSlice";
import { getParts } from "../../store/slices/partsSlice";

interface OrderItem {
  part: string;
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  orderNumber: string;
  items: OrderItem[];
  totalAmount: number;
  paymentMethod?: "CASH" | "CARD";
  status: "PENDING" | "COMPLETED" | "CANCELLED";
  customerName?: string;
  customerPhone?: string;
  createdAt: string;
}

interface OrderFormData {
  items: OrderItem[];
  customerName?: string;
  customerPhone?: string;
}

interface PaymentDialogData {
  orderId: string;
  orderNumber: string;
  totalAmount: number;
  paymentMethod?: "CASH" | "CARD";
  cashReceived?: number;
}

const Orders: React.FC = () => {
  const [search, setSearch] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentDialogData>({
    orderId: "",
    orderNumber: "",
    totalAmount: 0,
  });
  const [alertInfo, setAlertInfo] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info" | "warning";
  }>({
    open: false,
    message: "",
    severity: "info",
  });
  const [formData, setFormData] = useState<OrderFormData>({
    items: [{ part: "", quantity: 1, price: 0 }],
    customerName: "",
    customerPhone: "",
  });

  const dispatch = useAppDispatch();
  const { orders, loading } = useAppSelector((state) => state.orders);
  const { parts } = useAppSelector((state) => state.parts);

  useEffect(() => {
    dispatch(getOrders());
    dispatch(getParts());
  }, [dispatch]);

  const handleAddOrder = () => {
    setFormData({
      items: [{ part: "", quantity: 1, price: 0 }],
      customerName: "",
      customerPhone: "",
    });
    setOpenDialog(true);
  };

  const handleAddItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { part: "", quantity: 1, price: 0 }],
    }));
  };

  const handleRemoveItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleItemChange = (
    index: number,
    field: keyof OrderItem,
    value: string | number
  ) => {
    setFormData((prev) => {
      const newItems = [...prev.items];
      if (field === "part") {
        const selectedPart = parts.find((p) => p._id === value);
        newItems[index] = {
          ...newItems[index],
          [field]: value as string,
          price: selectedPart ? selectedPart.price : 0,
        };
      } else {
        newItems[index] = {
          ...newItems[index],
          [field]: value,
        };
      }
      return { ...prev, items: newItems };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validate form data
      if (formData.items.some((item) => !item.part)) {
        setAlertInfo({
          open: true,
          message: "Please select parts for all items",
          severity: "error",
        });
        return;
      }

      if (formData.items.some((item) => item.quantity < 1)) {
        setAlertInfo({
          open: true,
          message: "Quantity must be at least 1 for all items",
          severity: "error",
        });
        return;
      }

      const total = calculateTotal(formData.items);
      const orderData: CreateOrderRequest = {
        ...formData,
        totalAmount: total,
        status: "PENDING",
      };

      const result = await dispatch(createOrder(orderData)).unwrap();
      setOpenDialog(false);
      setAlertInfo({
        open: true,
        message: `Order ${result.orderNumber} created successfully. Waiting for admin approval.`,
        severity: "success",
      });
    } catch (error: any) {
      setAlertInfo({
        open: true,
        message: error.message || "Failed to create order",
        severity: "error",
      });
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await dispatch(
        updateOrderStatus({
          id: orderId,
          status: newStatus as "PENDING" | "COMPLETED" | "CANCELLED",
        })
      ).unwrap();
      setAlertInfo({
        open: true,
        message: "Order status updated successfully",
        severity: "success",
      });
    } catch (error: any) {
      setAlertInfo({
        open: true,
        message: error.message || "Failed to update order status",
        severity: "error",
      });
    }
  };

  const calculateTotal = (items: OrderItem[]) => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "success";
      case "PENDING":
        return "warning";
      case "CANCELLED":
        return "error";
      default:
        return "default";
    }
  };

  const filteredOrders = orders.filter(
    (order) =>
      order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      (order.customerName &&
        order.customerName.toLowerCase().includes(search.toLowerCase()))
  );

  const handleCloseAlert = () => {
    setAlertInfo((prev) => ({ ...prev, open: false }));
  };

  const handlePaymentClick = (order: Order) => {
    setPaymentData({
      orderId: order._id,
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
    });
    setOpenPaymentDialog(true);
  };

  const handlePaymentSubmit = async () => {
    try {
      if (!paymentData.paymentMethod) {
        setAlertInfo({
          open: true,
          message: "Please select a payment method",
          severity: "error",
        });
        return;
      }

      if (
        paymentData.paymentMethod === "CASH" &&
        (!paymentData.cashReceived ||
          paymentData.cashReceived < paymentData.totalAmount)
      ) {
        setAlertInfo({
          open: true,
          message:
            "Cash received must be greater than or equal to total amount",
          severity: "error",
        });
        return;
      }

      console.log("Processing payment:", paymentData);
      const result = await dispatch(
        updateOrderStatus({
          id: paymentData.orderId,
          status: "COMPLETED",
          paymentMethod: paymentData.paymentMethod,
        })
      ).unwrap();

      console.log("Payment processed successfully:", result);
      const change = paymentData.cashReceived
        ? paymentData.cashReceived - paymentData.totalAmount
        : 0;

      setAlertInfo({
        open: true,
        message:
          paymentData.paymentMethod === "CASH"
            ? `Payment successful. Change to return: $${change.toFixed(2)}`
            : "Card payment processed successfully",
        severity: "success",
      });

      setOpenPaymentDialog(false);
    } catch (error: any) {
      console.error("Payment processing failed:", error);
      setAlertInfo({
        open: true,
        message:
          error.message || "Failed to process payment. Please try again.",
        severity: "error",
      });
    }
  };

  if (loading && orders.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Snackbar
        open={alertInfo.open}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseAlert}
          severity={alertInfo.severity}
          sx={{ width: "100%" }}
        >
          {alertInfo.message}
        </Alert>
      </Snackbar>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4">Orders Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddOrder}
        >
          Create Order
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Search orders"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by order number or customer name"
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary">
                Order Status Guide:
                <Chip
                  label="PENDING"
                  color="warning"
                  size="small"
                  sx={{ mx: 1 }}
                />{" "}
                Awaiting approval
                <Chip
                  label="COMPLETED"
                  color="success"
                  size="small"
                  sx={{ mx: 1 }}
                />{" "}
                Order fulfilled
                <Chip
                  label="CANCELLED"
                  color="error"
                  size="small"
                  sx={{ mx: 1 }}
                />{" "}
                Order cancelled
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order Number</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Items</TableCell>
              <TableCell>Total Amount</TableCell>
              <TableCell>Payment Status</TableCell>
              <TableCell>Order Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredOrders.map((order) => (
              <TableRow key={order._id}>
                <TableCell>{order.orderNumber}</TableCell>
                <TableCell>
                  {order.customerName || "N/A"}
                  {order.customerPhone && <br />}
                  {order.customerPhone}
                </TableCell>
                <TableCell>{order.items.length} items</TableCell>
                <TableCell>${order.totalAmount.toFixed(2)}</TableCell>
                <TableCell>
                  {order.paymentMethod ? (
                    <Chip
                      label={order.paymentMethod}
                      color="success"
                      size="small"
                    />
                  ) : (
                    <Chip label="UNPAID" color="error" size="small" />
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={order.status}
                    color={getStatusColor(order.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {!order.paymentMethod && order.status === "PENDING" && (
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={() => handlePaymentClick(order)}
                    >
                      Process Payment
                    </Button>
                  )}
                  {order.status === "PENDING" && (
                    <IconButton
                      color="error"
                      onClick={() => handleStatusChange(order._id, "CANCELLED")}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle>Create New Order</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="h6">Order Items</Typography>
              </Grid>
              {formData.items.map((item, index) => (
                <Grid item xs={12} key={index}>
                  <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                    <TextField
                      select
                      label="Part"
                      value={item.part}
                      onChange={(e) =>
                        handleItemChange(index, "part", e.target.value)
                      }
                      sx={{ flexGrow: 1 }}
                      required
                    >
                      {parts.map((part) => (
                        <MenuItem key={part._id} value={part._id}>
                          {part.name} - ${part.price}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      type="number"
                      label="Quantity"
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(
                          index,
                          "quantity",
                          parseInt(e.target.value)
                        )
                      }
                      sx={{ width: 100 }}
                      inputProps={{ min: 1 }}
                      required
                    />
                    <IconButton
                      color="error"
                      onClick={() => handleRemoveItem(index)}
                      disabled={formData.items.length === 1}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Grid>
              ))}
              <Grid item xs={12}>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={handleAddItem}
                  startIcon={<AddIcon />}
                >
                  Add Item
                </Button>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 2 }}>
                  Order Details
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Customer Name"
                  fullWidth
                  value={formData.customerName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      customerName: e.target.value,
                    }))
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Customer Phone"
                  fullWidth
                  value={formData.customerPhone}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      customerPhone: e.target.value,
                    }))
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6">
                  Total: ${calculateTotal(formData.items).toFixed(2)}
                </Typography>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              Create Order
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog
        open={openPaymentDialog}
        onClose={() => setOpenPaymentDialog(false)}
      >
        <DialogTitle>Process Payment</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Typography variant="body1">
                Order Number: {paymentData.orderNumber}
              </Typography>
              <Typography variant="h6" sx={{ mt: 1 }}>
                Total Amount: ${paymentData.totalAmount.toFixed(2)}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                label="Payment Method"
                fullWidth
                value={paymentData.paymentMethod || ""}
                onChange={(e) =>
                  setPaymentData((prev) => ({
                    ...prev,
                    paymentMethod: e.target.value as "CASH" | "CARD",
                    cashReceived: undefined,
                  }))
                }
              >
                <MenuItem value="CASH">Cash</MenuItem>
                <MenuItem value="CARD">Card</MenuItem>
              </TextField>
            </Grid>
            {paymentData.paymentMethod === "CASH" && (
              <Grid item xs={12}>
                <TextField
                  label="Cash Received"
                  type="number"
                  fullWidth
                  value={paymentData.cashReceived || ""}
                  onChange={(e) =>
                    setPaymentData((prev) => ({
                      ...prev,
                      cashReceived: parseFloat(e.target.value),
                    }))
                  }
                  InputProps={{
                    startAdornment: <span>$</span>,
                  }}
                />
                {paymentData.cashReceived &&
                  paymentData.cashReceived >= paymentData.totalAmount && (
                    <Typography color="success.main" sx={{ mt: 1 }}>
                      Change to return: $
                      {(
                        paymentData.cashReceived - paymentData.totalAmount
                      ).toFixed(2)}
                    </Typography>
                  )}
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPaymentDialog(false)}>Cancel</Button>
          <Button
            onClick={handlePaymentSubmit}
            variant="contained"
            color="primary"
          >
            Complete Payment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Orders;
