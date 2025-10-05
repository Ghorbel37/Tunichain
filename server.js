// server.js
import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";

import sellerRoutes from "./routes/sellerRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import bankRoutes from "./routes/bankRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";

dotenv.config();
connectDB();

const app = express();
app.use(express.json());

// API routes
app.use("/api/sellers", sellerRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/banks", bankRoutes);
app.use("/api/payments", paymentRoutes);


// Swagger setup
// const swaggerUi = require('swagger-ui-express');
// const swaggerFile = require('./swagger/swagger-output.json');
import swaggerUi from 'swagger-ui-express';
import swaggerFile from './swagger/swagger-output.json' with { type: 'json' };

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
