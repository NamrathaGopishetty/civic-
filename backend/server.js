const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config();
const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/civic-app";

const app = express();
const server = http.createServer(app);
let currentPort = parseInt(process.env.PORT, 10) || 4000;

// CORS
app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true }));

// --------------------------
// CONNECT TO MONGODB
// --------------------------
mongoose
  .connect(uri)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Error:", err));

// --------------------------
// SOCKET.IO (optional for updates)
// --------------------------
const { Server } = require("socket.io");

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  socket.on("register-user", (userId) => {
    if (!userId) return;
    socket.join(`user:${userId}`);
    console.log(`👤 Socket ${socket.id} registered for user ${userId}`);
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

// attach io to req for routes if needed
app.use((req, res, next) => {
  req.io = io;
  next();
});

// --------------------------
// SERVE WEB PORTAL
// --------------------------
app.use("/portal", express.static(path.join(__dirname, "..", "web-portal")));

// --------------------------
// SERVE UPLOADED MEDIA
// --------------------------
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// --------------------------
// ROUTES
// --------------------------
app.get("/", (req, res) => {
  res.send("🚀 Civic Backend Running Successfully");
});

app.use("/api/auth", require("./routes/auth"));
app.use("/api/issues", require("./routes/issues"));

// --------------------------
// START SERVER
// --------------------------
const startServer = (port) => {
  server.listen(port, () => {
    currentPort = port;
    console.log(`🚀 Server running on port ${port}`);
  });
};

const handleServerError = (err) => {
  if (err.code === "EADDRINUSE") {
    console.warn(
      `⚠️  Port ${currentPort} is busy. ${
        process.env.PORT
          ? "Set PORT to another value or stop the other process."
          : "Attempting the next available port..."
      }`
    );

    if (process.env.PORT) {
      process.exit(1);
    } else {
      const nextPort = currentPort + 1;
      setTimeout(() => startServer(nextPort), 500);
    }
  } else {
    throw err;
  }
};

server.on("error", handleServerError);
startServer(currentPort);
