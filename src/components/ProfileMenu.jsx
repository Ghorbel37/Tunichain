import React, { useState } from "react";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Avatar from "@mui/material/Avatar";
import ListItemIcon from "@mui/material/ListItemIcon";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import PersonIcon from "@mui/icons-material/Person";
import LogoutIcon from "@mui/icons-material/Logout";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Truncate address for display
function truncateAddress(address) {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Get role display name
function getRoleDisplay(role) {
    const roleNames = {
        bank: 'Bank',
        seller: 'Seller',
        taxAdministration: 'Tax Admin',
        superAdmin: 'Super Admin',
    };
    return roleNames[role] || role;
}

export default function ProfileMenu() {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const handleMenu = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleProfile = () => {
        handleClose();
        navigate("/profile");
    };

    const handleLogout = () => {
        handleClose();
        logout();
        navigate("/login", { replace: true });
    };

    return (
        <>
            <IconButton onClick={handleMenu} color="inherit" size="large">
                <Avatar sx={{ bgcolor: 'secondary.main', width: 36, height: 36 }}>
                    {user?.address ? user.address.slice(2, 4).toUpperCase() : '?'}
                </Avatar>
            </IconButton>
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                PaperProps={{
                    sx: { minWidth: 200 }
                }}
            >
                {user && (
                    <MenuItem disabled sx={{ opacity: 1, flexDirection: 'column', alignItems: 'flex-start' }}>
                        <Typography variant="body2" fontWeight="bold">
                            {truncateAddress(user.address)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {getRoleDisplay(user.role)}
                        </Typography>
                    </MenuItem>
                )}
                <Divider />
                <MenuItem onClick={handleProfile}>
                    <ListItemIcon>
                        <PersonIcon fontSize="small" />
                    </ListItemIcon>
                    My Profile
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                    <ListItemIcon>
                        <LogoutIcon fontSize="small" color="error" />
                    </ListItemIcon>
                    <Typography color="error">Logout</Typography>
                </MenuItem>
            </Menu>
        </>
    );
}
