import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { getTheme } from "./theme";

import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import App from "./App";
import Home from "./pages/Home";
import About from "./pages/About";
import Profile from "./pages/Profile";
import Banks from "./pages/Banks";
import Sellers from "./pages/Sellers";
import Invoices from "./pages/Invoices";
import Payments from "./pages/Payments";
import Login from "./pages/Login";

// Role-specific pages
import SellerInvoices from "./pages/SellerInvoices";
import BankPayments from "./pages/BankPayments";
import TaxSellers from "./pages/TaxSellers";
import TaxInvoices from "./pages/TaxInvoices";
import TaxPayments from "./pages/TaxPayments";
import TaxSellerReport from "./pages/TaxSellerReport";

// Login wrapper to handle navigation after successful login
function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, getDefaultRoute } = useAuth();

  // If already authenticated, redirect to default route
  if (isAuthenticated) {
    return <Navigate to={getDefaultRoute()} replace />;
  }

  const handleLoginSuccess = (redirectPath) => {
    navigate(redirectPath || '/', { replace: true });
  };

  return <Login onLoginSuccess={handleLoginSuccess} />;
}

function AppRoutes({ mode, setMode }) {
  return (
    <Routes>
      {/* Public route - Login */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <App mode={mode} setMode={setMode} />
          </ProtectedRoute>
        }
      >
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="profile" element={<Profile />} />

        {/* SuperAdmin management pages */}
        <Route path="banks" element={<Banks />} />
        <Route path="sellers" element={<Sellers />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="payments" element={<Payments />} />

        {/* Seller-specific pages */}
        <Route path="my-invoices" element={<SellerInvoices />} />

        {/* Bank-specific pages */}
        <Route path="my-payments" element={<BankPayments />} />

        {/* Tax Admin pages */}
        <Route path="tax-sellers" element={<TaxSellers />} />
        <Route path="tax-invoices" element={<TaxInvoices />} />
        <Route path="tax-payments" element={<TaxPayments />} />
        <Route path="tax-seller-report" element={<TaxSellerReport />} />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function Root() {
  const [mode, setMode] = useState('light');
  const theme = getTheme(mode);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes mode={mode} setMode={setMode} />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <Root />
);
