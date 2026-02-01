import React from "react";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import PaymentIcon from '@mui/icons-material/Payment';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SellIcon from '@mui/icons-material/Sell';
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import HomeIcon from "@mui/icons-material/Home";
import InfoIcon from "@mui/icons-material/Info";
import PersonIcon from "@mui/icons-material/Person";
import Divider from "@mui/material/Divider";
import Box from "@mui/material/Box";
import { useNavigate, useLocation } from "react-router-dom";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { Toolbar, Typography } from "@mui/material";
import { useAuth } from "../context/AuthContext";
import { ROLE_PERMISSIONS } from "./ProtectedRoute";

const allNavItems = [
    { text: "Home", icon: <HomeIcon />, path: "/" },
    { text: "Banks", icon: <AccountBalanceIcon />, path: "/banks" },
    { text: "Sellers", icon: <SellIcon />, path: "/sellers" },
    { text: "Invoices", icon: <ReceiptLongIcon />, path: "/invoices" },
    { text: "Payments", icon: <PaymentIcon />, path: "/payments" },
    { text: "My Invoices", icon: <ReceiptLongIcon />, path: "/my-invoices" },
    { text: "My Payments", icon: <PaymentIcon />, path: "/my-payments" },
    { text: "View Sellers", icon: <SellIcon />, path: "/tax-sellers" },
    { text: "View Invoices", icon: <ReceiptLongIcon />, path: "/tax-invoices" },
    { text: "View Payments", icon: <PaymentIcon />, path: "/tax-payments" },
    { text: "Seller Reports", icon: <ReceiptLongIcon />, path: "/tax-seller-report" },
    { text: "Profile", icon: <PersonIcon />, path: "/profile" },
    { text: "About", icon: <InfoIcon />, path: "/about" },  
];

export default function ResponsiveDrawer({ drawerWidth, mobileOpen, onMobileToggle, open, onToggle }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    // Filter nav items based on user role
    const navItems = React.useMemo(() => {
        if (!user || !user.role) {
            return allNavItems;
        }

        const allowedPaths = ROLE_PERMISSIONS[user.role] || [];
        return allNavItems.filter((item) =>
            allowedPaths.some(
                (allowedPath) => item.path === allowedPath || item.path.startsWith(allowedPath + '/')
            )
        );
    }, [user]);

    // Get role display name
    const getRoleLabel = (role) => {
        const roleMap = {
            superAdmin: 'Admin',
            bank: 'Bank',
            seller: 'Seller',
            taxAdministration: 'Tax Admin',
            ttn: 'TTN',
        };
        return roleMap[role] || role;
    };

    const drawerContent = (
        <Box sx={{ width: drawerWidth }}>
            {/* <Toolbar /> */}
            {/* <Divider /> */}
            {user && (
                <Box sx={{ px: 2, py: 1.5, bgcolor: 'action.hover', height: '63px' }}>
                    <Typography variant="caption" color="text.secondary">
                        Logged in as
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                        {getRoleLabel(user.role)}
                    </Typography>
                </Box>
            )}
            <Divider />
            <List>
                {navItems.map((item) => (
                    <ListItem key={item.text} disablePadding>
                        <ListItemButton
                            selected={location.pathname === item.path}
                            onClick={() => {
                                navigate(item.path);
                                if (isMobile) onMobileToggle();
                            }}
                        >
                            <ListItemIcon>{item.icon}</ListItemIcon>
                            <ListItemText primary={item.text} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </Box>
    );

    if (isMobile) {
        return (
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={onMobileToggle}
                ModalProps={{ keepMounted: true }}
                sx={{
                    display: { xs: "block", md: "none" },
                    "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
                }}
            >
                {drawerContent}
            </Drawer>
        );
    }

    return (
        <Drawer
            variant="persistent"
            open={open}
            sx={{
                width: drawerWidth,
                flexShrink: 0,
                display: { xs: "none", md: "block" },
                "& .MuiDrawer-paper": {
                    width: drawerWidth,
                    boxSizing: "border-box",
                },
            }}
        >
            {drawerContent}
        </Drawer>
    );
}
