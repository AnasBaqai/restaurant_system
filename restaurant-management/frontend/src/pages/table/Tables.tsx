import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import api from "../../services/api";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
} from "@mui/material";
import {
  Add as AddIcon,
  Person as PersonIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import {
  fetchTables,
  createTable,
  updateTableStatus,
  assignWaiter,
} from "../../features/table/tableSlice";
import { RootState } from "../../features/store";
import { AppDispatch } from "../../features/store";
import { Table, TableStatus, User } from "../../types";
import { AxiosError } from "axios";

interface TableFormData {
  tableNumber: number;
  capacity: number;
}

const initialFormData: TableFormData = {
  tableNumber: 0,
  capacity: 2,
};

const Tables = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { tables, isLoading } = useSelector((state: RootState) => state.table);
  const { user } = useSelector((state: RootState) => state.auth);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<TableFormData>(initialFormData);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [assignDialog, setAssignDialog] = useState(false);
  const [selectedWaiter, setSelectedWaiter] = useState<string>("");
  const [statusDialog, setStatusDialog] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<TableStatus>(
    TableStatus.AVAILABLE
  );
  const [availableWaiters, setAvailableWaiters] = useState<User[]>([]);

  useEffect(() => {
    dispatch(fetchTables());
  }, [dispatch]);

  const fetchAvailableWaiters = async () => {
    try {
      console.log("Fetching available waiters");
      const response = await api.get("/users/waiters/available");
      const waiters = response.data.data.users;
      console.log("Available waiters:", waiters);
      setAvailableWaiters(waiters);
    } catch (error) {
      console.error("Failed to fetch available waiters:", error);
      alert("Failed to fetch available waiters");
    }
  };

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setFormData(initialFormData);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name as string]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await dispatch(createTable(formData));
    handleClose();
  };

  const handleStatusClick = async (table: Table) => {
    try {
      // Check if table has an unpaid order
      const response = await api.get(`/orders/table/${table.tableNumber}`);
      const orders = response.data.data.orders;
      const hasUnpaidOrder = orders.some(
        (order: { paymentStatus: boolean; status: string }) =>
          !order.paymentStatus && order.status !== "cancelled"
      );

      if (hasUnpaidOrder) {
        alert(
          "Cannot change table status. There is an unpaid order for this table."
        );
        return;
      }

      setSelectedTable(table);
      setSelectedStatus(table.status);
      setStatusDialog(true);
    } catch (error: unknown) {
      console.error("Error checking table orders:", error);
      const errorMessage =
        error instanceof AxiosError
          ? error.response?.data?.message ||
            "Failed to check table status. Please try again."
          : "Failed to check table status. Please try again.";
      alert(errorMessage);
    }
  };

  const handleStatusChange = async () => {
    if (selectedTable) {
      try {
        console.log("Updating table status:", {
          tableId: selectedTable._id,
          currentStatus: selectedTable.status,
          newStatus: selectedStatus,
        });

        const result = await dispatch(
          updateTableStatus({ id: selectedTable._id, status: selectedStatus })
        ).unwrap();

        console.log("Table status updated successfully:", result);
        setStatusDialog(false);
        setSelectedTable(null);
      } catch (error) {
        console.error("Failed to update table status:", {
          tableId: selectedTable._id,
          currentStatus: selectedTable.status,
          newStatus: selectedStatus,
          error: error instanceof Error ? error.message : error,
        });

        alert(
          `Failed to update table status: ${
            error instanceof Error ? error.message : "Please try again"
          }`
        );
      }
    }
  };

  const handleAssignClick = async (table: Table) => {
    setSelectedTable(table);
    setSelectedWaiter(table.currentWaiter?._id || "");
    await fetchAvailableWaiters();
    setAssignDialog(true);
  };

  const handleAssignSubmit = async () => {
    if (selectedTable && selectedWaiter) {
      try {
        await dispatch(
          assignWaiter({ id: selectedTable._id, waiterId: selectedWaiter })
        ).unwrap();
        setAssignDialog(false);
        setSelectedTable(null);
        setSelectedWaiter("");
      } catch (error) {
        console.error("Failed to assign waiter:", error);
        alert(
          `Failed to assign waiter: ${
            error instanceof Error ? error.message : "Please try again"
          }`
        );
      }
    }
  };

  const getStatusColor = (status: TableStatus) => {
    switch (status) {
      case TableStatus.AVAILABLE:
        return "success.main";
      case TableStatus.OCCUPIED:
        return "error.main";
      case TableStatus.RESERVED:
        return "warning.main";
      case TableStatus.CLEANING:
        return "info.main";
      default:
        return "text.primary";
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h4">Tables</Typography>
        {user?.role === "admin" && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpen}
            disabled={isLoading}
          >
            Add Table
          </Button>
        )}
      </Box>

      <Grid container spacing={3}>
        {tables.map((table) => (
          <Grid item xs={12} sm={6} md={4} key={table._id}>
            <Card>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography variant="h5">
                    Table {table.tableNumber}
                  </Typography>
                  <Box>
                    <IconButton
                      size="small"
                      onClick={() => handleAssignClick(table)}
                      disabled={isLoading}
                    >
                      <PersonIcon />
                    </IconButton>
                    {user?.role === "admin" && (
                      <IconButton
                        size="small"
                        onClick={() => handleStatusClick(table)}
                        disabled={isLoading}
                      >
                        <EditIcon />
                      </IconButton>
                    )}
                  </Box>
                </Box>
                <Typography variant="body2" gutterBottom>
                  Capacity: {table.capacity} people
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: getStatusColor(table.status) }}
                >
                  Status: {table.status.toUpperCase()}
                </Typography>
                {table.currentWaiter && (
                  <Typography variant="body2" color="textSecondary">
                    Assigned to: {table.currentWaiter.name}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Add Table Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>Add New Table</DialogTitle>
          <DialogContent>
            <TextField
              margin="normal"
              required
              fullWidth
              type="number"
              label="Table Number"
              name="tableNumber"
              value={formData.tableNumber}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              type="number"
              label="Capacity"
              name="capacity"
              value={formData.capacity}
              onChange={handleChange}
              inputProps={{ min: 1 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Table"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog
        open={statusDialog}
        onClose={() => setStatusDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Change Table Status</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={selectedStatus}
              label="Status"
              onChange={(e) => setSelectedStatus(e.target.value as TableStatus)}
            >
              {Object.values(TableStatus).map((status) => (
                <MenuItem key={status} value={status}>
                  {status.toUpperCase()}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialog(false)}>Cancel</Button>
          <Button
            onClick={handleStatusChange}
            variant="contained"
            disabled={isLoading}
          >
            {isLoading ? "Updating..." : "Update Status"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Waiter Dialog */}
      <Dialog
        open={assignDialog}
        onClose={() => setAssignDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Assign Waiter</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Waiter</InputLabel>
            <Select
              value={selectedWaiter}
              label="Waiter"
              onChange={(e) => setSelectedWaiter(e.target.value as string)}
            >
              <MenuItem value="">None</MenuItem>
              {availableWaiters.map((waiter) => (
                <MenuItem key={waiter._id} value={waiter._id}>
                  {waiter.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialog(false)}>Cancel</Button>
          <Button
            onClick={handleAssignSubmit}
            variant="contained"
            disabled={isLoading}
          >
            {isLoading ? "Assigning..." : "Assign"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Tables;
