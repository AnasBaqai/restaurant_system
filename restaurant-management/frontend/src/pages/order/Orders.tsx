import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { Print as PrintIcon } from "@mui/icons-material";
import {
  fetchOrders,
  updateOrderStatus,
  processPayment,
} from "../../features/order/orderSlice";
import { RootState } from "../../features/store";
import { AppDispatch } from "../../features/store";
import { Order, OrderStatus, PaymentMethod } from "../../types";
import orderService from "../../services/order.service";

const Orders = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { orders, isLoading } = useSelector((state: RootState) => state.order);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod>(PaymentMethod.CASH);

  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);

  const handleStatusChange = async (id: string, status: OrderStatus) => {
    await dispatch(updateOrderStatus({ id, status }));
  };

  const handlePaymentClick = (order: Order) => {
    setSelectedOrder(order);
    setPaymentDialog(true);
  };

  const handlePaymentSubmit = async () => {
    if (selectedOrder) {
      await dispatch(
        processPayment({
          id: selectedOrder._id,
          paymentMethod: selectedPaymentMethod,
        })
      );
      setPaymentDialog(false);
      setSelectedOrder(null);
    }
  };

  const handlePrint = () => {
    if (printComponentRef.current) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write("<html><head><title>Order Bill</title>");
        printWindow.document.write("</head><body>");
        printWindow.document.write(printComponentRef.current.innerHTML);
        printWindow.document.write("</body></html>");
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const handlePrintReceipt = async (orderId: string) => {
    try {
      await orderService.getReceipt(orderId);
    } catch (error) {
      console.error("Error printing receipt:", error);
      alert("Failed to print receipt. Please try again.");
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.COMPLETED:
        return "success";
      case OrderStatus.IN_PROGRESS:
        return "warning";
      case OrderStatus.CANCELLED:
        return "error";
      default:
        return "default";
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 3 }}
      >
        <Typography variant="h4">Orders</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate("/orders/new")}
        >
          New Order
        </Button>
      </Stack>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order #</TableCell>
              <TableCell>Table</TableCell>
              <TableCell>Waiter</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Payment</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order._id}>
                <TableCell>{order.orderNumber}</TableCell>
                <TableCell>{order.table}</TableCell>
                <TableCell>{order.waiter.name}</TableCell>
                <TableCell>
                  <Chip
                    label={order.status.toUpperCase()}
                    color={getStatusColor(order.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>${order.total.toFixed(2)}</TableCell>
                <TableCell>
                  {order.paymentStatus ? (
                    <Chip
                      label={`Paid (${order.paymentMethod})`}
                      color="success"
                      size="small"
                    />
                  ) : (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handlePaymentClick(order)}
                      disabled={isLoading}
                    >
                      Process Payment
                    </Button>
                  )}
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <Select
                        value={order.status}
                        onChange={(e) =>
                          handleStatusChange(
                            order._id,
                            e.target.value as OrderStatus
                          )
                        }
                        disabled={isLoading || order.paymentStatus}
                      >
                        <MenuItem value={OrderStatus.PENDING}>Pending</MenuItem>
                        <MenuItem value={OrderStatus.IN_PROGRESS}>
                          In Progress
                        </MenuItem>
                        <MenuItem value={OrderStatus.COMPLETED}>
                          Completed
                        </MenuItem>
                        <MenuItem value={OrderStatus.CANCELLED}>
                          Cancelled
                        </MenuItem>
                      </Select>
                    </FormControl>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<PrintIcon />}
                      onClick={() => handlePrintReceipt(order._id)}
                    >
                      Print Receipt
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Order Details Dialog */}
      <Dialog
        open={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        maxWidth="sm"
        fullWidth
      >
        {selectedOrder && (
          <>
            <DialogTitle>
              Order Details #{selectedOrder.orderNumber}
            </DialogTitle>
            <DialogContent>
              <div ref={printComponentRef}>
                <Box sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Restaurant Name
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    Order #{selectedOrder.orderNumber}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    Table: {selectedOrder.table}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    Waiter: {selectedOrder.waiter.name}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    Date: {new Date(selectedOrder.createdAt).toLocaleString()}
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  <List>
                    {selectedOrder.items.map((item, index) => (
                      <div key={index}>
                        <ListItem>
                          <ListItemText
                            primary={`${item.quantity}x ${item.menuItem.name}`}
                            secondary={
                              <>
                                <Typography variant="body2">
                                  ${item.menuItem.price.toFixed(2)} each
                                </Typography>
                                {item.customizations?.map((custom, idx) => (
                                  <Typography
                                    key={idx}
                                    variant="body2"
                                    color="textSecondary"
                                  >
                                    {custom.name}: {custom.option} (+$
                                    {custom.price.toFixed(2)})
                                  </Typography>
                                ))}
                              </>
                            }
                          />
                          <Typography variant="body1">
                            ${item.subtotal.toFixed(2)}
                          </Typography>
                        </ListItem>
                        {index < selectedOrder.items.length - 1 && <Divider />}
                      </div>
                    ))}
                  </List>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      Subtotal: ${selectedOrder.subtotal.toFixed(2)}
                    </Typography>
                    <Typography variant="body2">
                      Tax: ${selectedOrder.tax.toFixed(2)}
                    </Typography>
                    <Typography variant="body2">
                      Service Charge: ${selectedOrder.serviceCharge.toFixed(2)}
                    </Typography>
                    <Typography variant="h6">
                      Total: ${selectedOrder.total.toFixed(2)}
                    </Typography>
                  </Box>

                  {selectedOrder.notes && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="textSecondary">
                        Notes: {selectedOrder.notes}
                      </Typography>
                    </Box>
                  )}

                  {selectedOrder.paymentStatus && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="success.main">
                        Paid via {selectedOrder.paymentMethod}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </div>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedOrder(null)}>Close</Button>
              <Button
                onClick={handlePrint}
                variant="contained"
                startIcon={<PrintIcon />}
              >
                Print Bill
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Payment Dialog */}
      <Dialog
        open={paymentDialog}
        onClose={() => setPaymentDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Process Payment</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Payment Method</InputLabel>
            <Select
              value={selectedPaymentMethod}
              label="Payment Method"
              onChange={(e) =>
                setSelectedPaymentMethod(e.target.value as PaymentMethod)
              }
            >
              <MenuItem value={PaymentMethod.CASH}>Cash</MenuItem>
              <MenuItem value={PaymentMethod.CARD}>Card</MenuItem>
              <MenuItem value={PaymentMethod.DIGITAL_WALLET}>
                Digital Wallet
              </MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialog(false)}>Cancel</Button>
          <Button
            onClick={handlePaymentSubmit}
            variant="contained"
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : "Confirm Payment"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Orders;
