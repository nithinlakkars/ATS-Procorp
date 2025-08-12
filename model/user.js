// models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    role: {
      type: String,
      required: true,
      enum: ["admin", "lead", "recruiter"], // Add "sales" here if needed
    },
    team: {
      type: String,
      enum: ["OmPrakash Team", "Ravi Team", null],
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("user", userSchema);
