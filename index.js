import express from "express";
import cors from "cors";
import sellerRoutes from "./routes/sellerRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import bankRoutes from "./routes/bankRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { USER_ROLES } from "./models/Roles.js";
import { authMiddleware } from "./middleware/auth.js";
import { requireRoles } from "./middleware/rbac.js";
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from "swagger-jsdoc";
import swaggerFile from './swagger/swagger-output.json' with { type: 'json' };

const app = express();

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/sellers", sellerRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/banks", bankRoutes);
app.use("/api/payments", paymentRoutes);

// ============================================
// EXAMPLE: Protected endpoint with RBAC
// ============================================
// Only taxAdministration and superAdmin can access this endpoint
app.get("/api/admin/stats",
    authMiddleware,
    requireRoles(USER_ROLES.TAX_ADMIN, USER_ROLES.SUPER_ADMIN),
    (req, res) => {
        res.json({
            message: "Admin stats endpoint",
            user: req.user,
            accessedAt: new Date().toISOString()
        });
    }
);

// Swagger setup
const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Bank API",
            version: "1.0.0",
            description: "API documentation for managing banks",
        },
        servers: [{ url: "http://localhost:4000" }],
    },
    apis: ["./routes/*.js"], // path to your annotated route files
};

const specs = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));

export default app;
