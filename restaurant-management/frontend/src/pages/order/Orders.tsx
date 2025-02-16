import { useEffect, useState, useRef } from "react";
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
  IconButton,
  TextField,
  Grid,
  Card,
  CardContent,
  FormControlLabel,
  Checkbox,
  TablePagination,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { Print as PrintIcon } from "@mui/icons-material";
import EditIcon from "@mui/icons-material/Edit";
import TableRestaurantIcon from "@mui/icons-material/TableRestaurant";
import {
  Remove as RemoveIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import {
  fetchOrders,
  updateOrderStatus,
  processPayment,
} from "../../features/order/orderSlice";
import { RootState } from "../../features/store";
import { AppDispatch } from "../../features/store";
import {
  Order,
  OrderStatus,
  PaymentMethod,
  Table as TableType,
  MenuItem as MenuItemType,
} from "../../types";
import orderService from "../../services/order.service";
import { fetchTables } from "../../features/table/tableSlice";
import { fetchMenuItems } from "../../features/menu/menuSlice";

const Orders = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { orders, isLoading } = useSelector((state: RootState) => state.order);
  const { items: menuItems } = useSelector((state: RootState) => state.menu);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod>(PaymentMethod.CASH);
  const [editDialog, setEditDialog] = useState(false);
  const [tableDialog, setTableDialog] = useState(false);
  const [availableTables, setAvailableTables] = useState<TableType[]>([]);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const { tables } = useSelector((state: RootState) => state.table);
  const [editedItems, setEditedItems] = useState<
    {
      menuItem: string;
      quantity: number;
      customizations?: {
        name: string;
        option: string;
        price: number;
      }[];
    }[]
  >([]);
  const [editedNotes, setEditedNotes] = useState("");
  const printComponentRef = useRef<HTMLDivElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [menuItemsDialogOpen, setMenuItemsDialogOpen] = useState(false);
  const [selectedMenuItems, setSelectedMenuItems] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Group menu items by category
  const categorizedItems = menuItems.reduce(
    (acc: { [key: string]: MenuItemType[] }, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    },
    {}
  );

  useEffect(() => {
    dispatch(fetchOrders());
    dispatch(fetchTables());
    dispatch(fetchMenuItems());
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

  const handleEditClick = (order: Order) => {
    if (order.status === OrderStatus.COMPLETED || order.paymentStatus) {
      alert("Cannot edit completed or paid orders");
      return;
    }
    setSelectedOrder(order);
    setEditedItems(
      order.items.map((item) => ({
        menuItem: item.menuItem._id,
        quantity: item.quantity,
        customizations: item.customizations,
      }))
    );
    setEditedNotes(order.notes || "");
    setEditDialog(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedOrder) return;

    try {
      await orderService.updateOrder(selectedOrder._id, {
        items: editedItems,
        notes: editedNotes,
      });
      dispatch(fetchOrders()); // Refresh orders
      setEditDialog(false);
      setSelectedOrder(null);
      setEditedItems([]);
      setEditedNotes("");
    } catch (error) {
      console.error("Error updating order:", error);
      alert("Failed to update order");
    }
  };

  const handleQuantityChange = (index: number, change: number) => {
    const newItems = [...editedItems];
    newItems[index].quantity = Math.max(1, newItems[index].quantity + change);
    setEditedItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    setEditedItems(editedItems.filter((_, i) => i !== index));
  };

  const handleTableChange = async (order: Order) => {
    try {
      if (order.status === OrderStatus.COMPLETED || order.paymentStatus) {
        alert("Cannot change table for completed or paid orders");
        return;
      }

      // Get available tables
      const availableTables = tables.filter(
        (table) =>
          table.status === "available" || table.tableNumber === order.table
      );
      setAvailableTables(availableTables);
      setSelectedOrder(order);
      setSelectedTable(order.table);
      setTableDialog(true);
    } catch (error) {
      console.error("Error preparing table change:", error);
      alert("Failed to prepare table change");
    }
  };

  const handleTableChangeSubmit = async () => {
    if (!selectedOrder || !selectedTable) return;

    try {
      await orderService.updateOrderTable(selectedOrder._id, selectedTable);
      dispatch(fetchOrders()); // Refresh orders
      dispatch(fetchTables()); // Refresh tables
      setTableDialog(false);
      setSelectedOrder(null);
      setSelectedTable(null);
    } catch (error) {
      console.error("Error changing table:", error);
      alert("Failed to change table");
    }
  };

  const handlePrint = () => {
    if (!selectedOrder) return;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write("<html><head><title>Order Bill</title>");
      printWindow.document.write("</head><body>");
      printWindow.document.write(
        document.getElementById("order-receipt")?.innerHTML || ""
      );
      printWindow.document.write("</body></html>");
      printWindow.document.close();
      printWindow.print();
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

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    setSelectedMenuItems([]);
    setMenuItemsDialogOpen(true);
  };

  const handleMenuItemSelect = (itemId: string) => {
    setSelectedMenuItems((prev) => {
      if (prev.includes(itemId)) {
        return prev.filter((id) => id !== itemId);
      }
      return [...prev, itemId];
    });
  };

  const handleAddSelectedItems = () => {
    const newItems = selectedMenuItems.map((itemId) => ({
      menuItem: itemId,
      quantity: 1,
    }));
    setEditedItems([...editedItems, ...newItems]);
    setMenuItemsDialogOpen(false);
    setSelectedMenuItems([]);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Calculate paginated orders
  const paginatedOrders = orders.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

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
              {/* <TableCell>Order #</TableCell> */}
              <TableCell>Table</TableCell>
              <TableCell>Waiter</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Payment</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedOrders.map((order) => (
              <TableRow key={order._id}>
                {/* <TableCell>{order.orderNumber}</TableCell> */}
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
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => handleEditClick(order)}
                      disabled={
                        order.status === OrderStatus.COMPLETED ||
                        order.paymentStatus
                      }
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<TableRestaurantIcon />}
                      onClick={() => handleTableChange(order)}
                      disabled={
                        order.status === OrderStatus.COMPLETED ||
                        order.paymentStatus
                      }
                    >
                      Change Table
                    </Button>
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
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={orders.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
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
                <Box sx={{ p: 2 }} id="order-receipt">
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

      {/* Table Change Dialog */}
      <Dialog
        open={tableDialog}
        onClose={() => setTableDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Change Table</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Select Table</InputLabel>
            <Select
              value={selectedTable || ""}
              label="Select Table"
              onChange={(e) => setSelectedTable(Number(e.target.value))}
            >
              {availableTables.map((table) => (
                <MenuItem key={table.tableNumber} value={table.tableNumber}>
                  Table {table.tableNumber} ({table.capacity} seats)
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTableDialog(false)}>Cancel</Button>
          <Button
            onClick={handleTableChangeSubmit}
            variant="contained"
            disabled={!selectedTable}
          >
            Change Table
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Order Dialog */}
      <Dialog
        open={editDialog}
        onClose={() => setEditDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Order</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Order Items
                </Typography>
                <List>
                  {editedItems.map((item, index) => {
                    const menuItem = menuItems.find(
                      (m: MenuItemType) => m._id === item.menuItem
                    );
                    if (!menuItem) return null;

                    return (
                      <div key={index}>
                        <ListItem>
                          <ListItemText
                            primary={menuItem.name}
                            secondary={
                              <>
                                <Typography variant="body2">
                                  ${menuItem.price.toFixed(2)} each
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
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            <IconButton
                              size="small"
                              onClick={() => handleQuantityChange(index, -1)}
                            >
                              <RemoveIcon />
                            </IconButton>
                            <Typography>{item.quantity}</Typography>
                            <IconButton
                              size="small"
                              onClick={() => handleQuantityChange(index, 1)}
                            >
                              <AddIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleRemoveItem(index)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Stack>
                        </ListItem>
                        <Divider />
                      </div>
                    );
                  })}
                </List>

                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Notes"
                  value={editedNotes}
                  onChange={(e) => setEditedNotes(e.target.value)}
                  sx={{ mt: 2 }}
                />
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom>
                Menu Categories
              </Typography>
              <Grid container spacing={2}>
                {Object.keys(categorizedItems).map((category) => (
                  <Grid item xs={12} key={category}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6">{category}</Typography>
                        <Typography color="text.secondary">
                          {categorizedItems[category].length} items
                        </Typography>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={() => handleCategoryClick(category)}
                          sx={{ mt: 1 }}
                        >
                          Select Items
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button onClick={handleEditSubmit} variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Menu Items Selection Dialog */}
      <Dialog
        open={menuItemsDialogOpen}
        onClose={() => setMenuItemsDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{selectedCategory} Items</DialogTitle>
        <DialogContent>
          <List>
            {categorizedItems[selectedCategory]?.map((item) => (
              <ListItem key={item._id}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedMenuItems.includes(item._id)}
                      onChange={() => handleMenuItemSelect(item._id)}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="subtitle1">{item.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        ${item.price.toFixed(2)}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMenuItemsDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAddSelectedItems}
            variant="contained"
            disabled={selectedMenuItems.length === 0}
          >
            Add Selected Items
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Orders;
