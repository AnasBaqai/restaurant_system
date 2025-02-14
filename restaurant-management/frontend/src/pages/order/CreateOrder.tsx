import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Card,
  CardContent,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import DeleteIcon from "@mui/icons-material/Delete";
import { createOrder } from "../../features/order/orderSlice";
import { RootState, AppDispatch } from "../../features/store";
import { MenuItem as MenuItemType, User, UserRole } from "../../types";
import { fetchMenuItems } from "../../features/menu/menuSlice";
import { fetchAvailableTables } from "../../features/table/tableSlice";
import api from "../../services/api";

interface CategoryMenuItems {
  [category: string]: MenuItemType[];
}

const CreateOrder = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { tables } = useSelector((state: RootState) => state.table);
  const { items: menuItems } = useSelector((state: RootState) => state.menu);
  const { isLoading } = useSelector((state: RootState) => state.order);
  const { user } = useSelector((state: RootState) => state.auth);

  const [selectedTable, setSelectedTable] = useState<string>("");
  const [orderItems, setOrderItems] = useState<
    Array<{
      menuItem: string;
      quantity: number;
    }>
  >([]);
  const [notes, setNotes] = useState<string>("");
  const [menuItemsDialogOpen, setMenuItemsDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedMenuItems, setSelectedMenuItems] = useState<string[]>([]);
  const [availableWaiters, setAvailableWaiters] = useState<User[]>([]);
  const [selectedWaiter, setSelectedWaiter] = useState<string>("");

  // Group menu items by category
  const categorizedItems = menuItems.reduce((acc: CategoryMenuItems, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  useEffect(() => {
    dispatch(fetchMenuItems());
    dispatch(fetchAvailableTables());
    if (user?.role === UserRole.ADMIN) {
      fetchAvailableWaiters();
    } else if (user?.role === UserRole.WAITER) {
      setSelectedWaiter(user._id);
    }
  }, [dispatch, user]);

  const fetchAvailableWaiters = async () => {
    try {
      const response = await api.get("/users/waiters/available");
      setAvailableWaiters(response.data.data.users);
    } catch (error) {
      console.error("Failed to fetch available waiters:", error);
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
    setOrderItems([...orderItems, ...newItems]);
    setMenuItemsDialogOpen(false);
    setSelectedMenuItems([]);
  };

  const handleQuantityChange = (index: number, change: number) => {
    const newOrderItems = [...orderItems];
    newOrderItems[index].quantity = Math.max(
      1,
      newOrderItems[index].quantity + change
    );
    setOrderItems(newOrderItems);
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const calculateTotal = (): number => {
    return orderItems.reduce((total, item) => {
      const menuItem = menuItems.find(
        (m: MenuItemType) => m._id === item.menuItem
      );
      if (!menuItem) return total;

      const itemTotal = menuItem.price * item.quantity;
      return total + itemTotal;
    }, 0);
  };

  const handleSubmit = async () => {
    if (!selectedTable || orderItems.length === 0) {
      alert("Please select a table and at least one menu item");
      return;
    }

    if (user?.role === UserRole.ADMIN && !selectedWaiter) {
      alert("Please assign a waiter to this order");
      return;
    }

    const orderData = {
      table: parseInt(selectedTable),
      items: orderItems.map((item) => ({
        menuItem: item.menuItem,
        quantity: item.quantity,
      })),
      waiter: user?.role === UserRole.ADMIN ? selectedWaiter : user?._id,
      notes,
    };

    try {
      await dispatch(createOrder(orderData)).unwrap();
      navigate("/orders");
    } catch (error) {
      console.error("Failed to create order:", error);
      alert("Failed to create order. Please try again.");
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Create New Order
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Table</InputLabel>
            <Select
              value={selectedTable}
              label="Table"
              onChange={(e) => setSelectedTable(e.target.value as string)}
            >
              {tables
                .filter((table) => table.status === "available")
                .map((table) => (
                  <MenuItem key={table._id} value={table.tableNumber}>
                    Table {table.tableNumber} (Capacity: {table.capacity})
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </Grid>

        {user?.role === UserRole.ADMIN && (
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Assign Waiter</InputLabel>
              <Select
                value={selectedWaiter}
                label="Assign Waiter"
                onChange={(e) => setSelectedWaiter(e.target.value as string)}
              >
                {availableWaiters.map((waiter) => (
                  <MenuItem key={waiter._id} value={waiter._id}>
                    {waiter.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        )}

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Order Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              sx={{ mb: 2 }}
            />

            <Typography variant="h6" gutterBottom>
              Selected Items
            </Typography>

            <List>
              {orderItems.map((item, index) => {
                const menuItem = menuItems.find((m) => m._id === item.menuItem);
                if (!menuItem) return null;

                return (
                  <div key={index}>
                    <ListItem>
                      <ListItemText
                        primary={menuItem.name}
                        secondary={`£${(menuItem.price * item.quantity).toFixed(
                          2
                        )}`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => handleQuantityChange(index, -1)}
                        >
                          <RemoveIcon />
                        </IconButton>
                        <Typography sx={{ mx: 2 }} display="inline">
                          {item.quantity}
                        </Typography>
                        <IconButton
                          edge="end"
                          onClick={() => handleQuantityChange(index, 1)}
                        >
                          <AddIcon />
                        </IconButton>
                        <IconButton
                          edge="end"
                          onClick={() => handleRemoveItem(index)}
                          sx={{ ml: 1 }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider />
                  </div>
                );
              })}
            </List>

            <Box sx={{ mt: 2, mb: 2, textAlign: "right" }}>
              <Typography variant="h6">
                Total: £{calculateTotal().toFixed(2)}
              </Typography>
            </Box>
          </Paper>

          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleSubmit}
            disabled={isLoading || !selectedTable || orderItems.length === 0}
          >
            {isLoading ? "Creating Order..." : "Create Order"}
          </Button>
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
                        £{item.price.toFixed(2)}
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

export default CreateOrder;
