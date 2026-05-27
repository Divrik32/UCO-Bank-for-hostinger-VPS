require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const userRoutes = require("./routes/UserRoutes.js");
const thriftRoutes = require("./routes/ThriftFundRoutes.js");
const cookieParser = require("cookie-parser");
const app = express();
const path = require("path");
const shareRoutes = require("./routes/shareRoutes.js");
const loanRoutes = require("./routes/loanRoutes.js");

// DB CONNECT
connectDB();

// MIDDLEWARES
app.use(cookieParser());
app.use(cors({
  origin: "http://localhost:5173", // frontend URL (Vite)
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// STATIC FILES
app.use("/uploads", express.static("uploads"));

// ROUTES
app.use("/api/users", userRoutes);
app.use("/api/thrift-fund", thriftRoutes);
app.use("/api/share", shareRoutes);
app.use("/api/loan", loanRoutes);

// TEST ROUTE
app.get("/", (req, res) => {
  res.send("API Running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});