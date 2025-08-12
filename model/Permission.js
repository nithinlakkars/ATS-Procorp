import mongoose, { Schema } from "mongoose";

const permissionSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
});

export default mongoose.model("Permission", permissionSchema);
