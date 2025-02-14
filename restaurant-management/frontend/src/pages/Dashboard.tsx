import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";
import { fetchOrders } from "../features/order/orderSlice";
import { fetchTables } from "../features/table/tableSlice";
import { RootState } from "../features/store";
import { AppDispatch } from "../features/store";
import { Order, Table } from "../types";

const Dashboard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { orders } = useSelector((state: RootState) => state.order);
  const { tables } = useSelector((state: RootState) => state.table);

  useEffect(() => {
    dispatch(fetchOrders());
    dispatch(fetchTables());
  }, [dispatch]);

  const getTotalSales = () => {
    return orders.reduce((total, order) => total + order.total, 0).toFixed(2);
  };

  const getPendingOrders = () => {
    return orders.filter((order) => order.status === "pending").length;
  };

  const getOccupiedTables = () => {
    return tables.filter((table) => table.status === "occupied").length;
  };

  const getRecentOrders = () => {
    return orders
      .slice(0, 5)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Sales Today
              </Typography>
              <Typography variant="h5">${getTotalSales()}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Pending Orders
              </Typography>
              <Typography variant="h5">{getPendingOrders()}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Occupied Tables
              </Typography>
              <Typography variant="h5">
                {getOccupiedTables()} / {tables.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Orders */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Orders
            </Typography>
            <List>
              {getRecentOrders().map((order, index) => (
                <div key={order._id}>
                  <ListItem>
                    <ListItemText
                      primary={`Order #${order.orderNumber}`}
                      secondary={`Table ${order.table} - ${new Date(
                        order.createdAt
                      ).toLocaleString()} - $${order.total.toFixed(2)}`}
                    />
                    <Typography
                      variant="body2"
                      sx={{
                        color:
                          order.status === "completed"
                            ? "success.main"
                            : order.status === "pending"
                            ? "warning.main"
                            : "error.main",
                      }}
                    >
                      {order.status.toUpperCase()}
                    </Typography>
                  </ListItem>
                  {index < getRecentOrders().length - 1 && <Divider />}
                </div>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
