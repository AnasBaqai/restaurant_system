import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import reportService from "../../services/report.service";
import type {
  DailySalesReport,
  WaiterPerformanceReport,
  InventoryReport,
  MonthlyRevenueReport,
  WaiterStats,
  InventoryStats,
  MonthlyRevenueData,
} from "../../services/report.service";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`report-tabpanel-${index}`}
      aria-labelledby={`report-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const Reports = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dailySales, setDailySales] = useState<DailySalesReport | null>(null);
  const [waiterPerformance, setWaiterPerformance] =
    useState<WaiterPerformanceReport | null>(null);
  const [inventoryReport, setInventoryReport] =
    useState<InventoryReport | null>(null);
  const [monthlyRevenue, setMonthlyRevenue] =
    useState<MonthlyRevenueReport | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );

  useEffect(() => {
    fetchDailySales();
  }, []);

  const fetchDailySales = async () => {
    setLoading(true);
    try {
      const data = await reportService.getDailySalesReport();
      setDailySales(data);
    } catch (error) {
      console.error("Error fetching daily sales:", error);
    }
    setLoading(false);
  };

  const fetchWaiterPerformance = async () => {
    setLoading(true);
    try {
      const data = await reportService.getWaiterPerformanceReport(
        startDate?.toISOString(),
        endDate?.toISOString()
      );
      setWaiterPerformance(data);
    } catch (error) {
      console.error("Error fetching waiter performance:", error);
    }
    setLoading(false);
  };

  const fetchInventoryReport = async () => {
    setLoading(true);
    try {
      const data = await reportService.getInventoryReport(
        startDate?.toISOString(),
        endDate?.toISOString()
      );
      setInventoryReport(data);
    } catch (error) {
      console.error("Error fetching inventory report:", error);
    }
    setLoading(false);
  };

  const fetchMonthlyRevenue = async () => {
    setLoading(true);
    try {
      const data = await reportService.getMonthlyRevenueReport(selectedYear);
      setMonthlyRevenue(data);
    } catch (error) {
      console.error("Error fetching monthly revenue:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (tabValue === 1 && startDate && endDate) {
      fetchWaiterPerformance();
    }
  }, [tabValue, startDate, endDate]);

  useEffect(() => {
    if (tabValue === 2 && startDate && endDate) {
      fetchInventoryReport();
    }
  }, [tabValue, startDate, endDate]);

  useEffect(() => {
    if (tabValue === 3) {
      fetchMonthlyRevenue();
    }
  }, [tabValue, selectedYear]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (loading) {
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
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Typography variant="h4" gutterBottom>
          Reports
        </Typography>

        <Paper sx={{ width: "100%", mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
          >
            <Tab label="Daily Sales" />
            <Tab label="Waiter Performance" />
            <Tab label="Inventory" />
            <Tab label="Monthly Revenue" />
          </Tabs>
        </Paper>

        {/* Daily Sales Report */}
        <TabPanel value={tabValue} index={0}>
          {dailySales && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Total Sales
                    </Typography>
                    <Typography variant="h5">
                      ${dailySales.totalSales.toFixed(2)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Total Orders
                    </Typography>
                    <Typography variant="h5">
                      {dailySales.totalOrders}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Sales by Category
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={Object.entries(dailySales.salesByCategory).map(
                          ([category, sales]) => ({
                            category,
                            sales,
                          })
                        )}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="category" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="sales" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </TabPanel>

        {/* Waiter Performance Report */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={(date) => setStartDate(date)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={(date) => setEndDate(date)}
                />
              </Grid>
            </Grid>
          </Box>
          {waiterPerformance && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Waiter</TableCell>
                    <TableCell align="right">Total Orders</TableCell>
                    <TableCell align="right">Total Sales</TableCell>
                    <TableCell align="right">Average Order Value</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {waiterPerformance.waiterStats.map((stat: WaiterStats) => (
                    <TableRow key={stat.waiter.id}>
                      <TableCell>{stat.waiter.name}</TableCell>
                      <TableCell align="right">{stat.totalOrders}</TableCell>
                      <TableCell align="right">
                        ${stat.totalSales.toFixed(2)}
                      </TableCell>
                      <TableCell align="right">
                        ${stat.averageOrderValue.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        {/* Inventory Report */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={(date) => setStartDate(date)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={(date) => setEndDate(date)}
                />
              </Grid>
            </Grid>
          </Box>
          {inventoryReport && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Item</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Quantity Sold</TableCell>
                    <TableCell align="right">Revenue</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {inventoryReport.inventoryStats.map(
                    (stat: InventoryStats, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{stat.name}</TableCell>
                        <TableCell>{stat.category}</TableCell>
                        <TableCell align="right">
                          {stat.totalQuantitySold}
                        </TableCell>
                        <TableCell align="right">
                          ${stat.totalRevenue.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        {/* Monthly Revenue Report */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ mb: 3 }}>
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Year</InputLabel>
              <Select
                value={selectedYear}
                label="Year"
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                {Array.from(
                  { length: 5 },
                  (_, i) => new Date().getFullYear() - i
                ).map((year) => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          {monthlyRevenue && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Monthly Revenue Trend
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart
                    data={monthlyRevenue.monthlyRevenue.map(
                      (data: MonthlyRevenueData) => ({
                        month: new Date(2024, data._id - 1).toLocaleString(
                          "default",
                          { month: "short" }
                        ),
                        revenue: data.totalRevenue,
                        orders: data.totalOrders,
                      })
                    )}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="revenue"
                      stroke="#8884d8"
                      name="Revenue"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="orders"
                      stroke="#82ca9d"
                      name="Orders"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabPanel>
      </Box>
    </LocalizationProvider>
  );
};

export default Reports;
