import mongoose from "mongoose";
import { USER_ROLES } from "./Roles.js";

const userSchema = new mongoose.Schema({
    address: { type: String, required: true, unique: true, index: true, lowercase: true },
    role: { type: String, enum: Object.values(USER_ROLES), required: true },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model("User", userSchema);
