import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { Provider } from "react-redux";
import { store } from "./features/store";
import theme from "./theme";

// Layout Components
import Layout from "./components/layout/Layout";
import PrivateRoute from "./components/auth/PrivateRoute";

// Auth Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

// Main Pages
import Dashboard from "./pages/Dashboard";
import Menu from "./pages/menu/Menu";
import Orders from "./pages/order/Orders";
import CreateOrder from "./pages/order/CreateOrder";
import Tables from "./pages/table/Tables";
import Reports from "./pages/reports/Reports";
import Categories from "./pages/menu/Categories";

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes */}
            <Route element={<PrivateRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/menu/*" element={<Menu />} />
                <Route path="/menu/categories" element={<Categories />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/orders/new" element={<CreateOrder />} />
                <Route path="/tables/*" element={<Tables />} />
                <Route path="/reports/*" element={<Reports />} />
              </Route>
            </Route>
          </Routes>
        </Router>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
