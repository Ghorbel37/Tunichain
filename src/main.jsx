

import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { getTheme } from "./theme";


import App from "./App";
import Home from "./pages/Home";
import About from "./pages/About";
import Profile from "./pages/Profile";
import Banks from "./pages/Banks";
import Sellers from "./pages/Sellers";
import Invoices from "./pages/Invoices";
import Login from "./pages/Login";


function Root() {
  const [mode, setMode] = useState('light');
  const [address, setAddress] = useState(null);
  const theme = getTheme(mode);

  if (!address) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Login onLogin={setAddress} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App mode={mode} setMode={setMode} address={address} />}>
            <Route index element={<Home />} />
            <Route path="about" element={<About />} />
            <Route path="profile" element={<Profile />} />
            <Route path="banks" element={<Banks />} />
            <Route path="sellers" element={<Sellers />} />
            <Route path="invoices" element={<Invoices />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
