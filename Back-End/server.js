const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });
const path = require("path");
const os = require("os");
const { spawn } = require("child_process");
const mongoose = require("mongoose");
const http = require("http");
const socketIo = require("socket.io");
const app = require("./app");
const initDefaultUser = require("./Controller/initDefaultUser");

// Import your model
const loginSchema = require("./Models/LogInSchema");

app.set("trust proxy", true);
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
  allowEIO3: true,
  transports: ["websocket", "polling"],
});

app.set("io", io);

if (process.env.NODE_ENV === "development") {
    const pythonCmd = process.platform === "win32" ? "py" : "python3";
    const desktopPath = path.join(os.homedir(), "Desktop", "RFID-Bridge", "scan.py");

    console.log(`🛠️ Dev Mode: Spawning local Python at ${desktopPath}`);
    const rfidPython = spawn(pythonCmd, [desktopPath]);

    rfidPython.stdout.on('data', (data) => {
        const cardUID = data.toString().trim();
        if (cardUID && cardUID !== "NO_READER") {
            console.log(`Local Scan: ${cardUID}`);
            io.emit("rfid-scanned", { uid: cardUID, timestamp: new Date(), source: "Local-Spawn" });
        }
    });

    rfidPython.stderr.on('data', (data) => console.error(`Python Error: ${data}`));
} else {
    console.log("🚀 Production Mode: Waiting for remote RFID bridge from your Desktop...");
}
// Global storage para sa active connections
global.connectedUsers = {};

io.on("connection", (socket) => {
  console.log(`🔌 New Connection: ${socket.id}`);

  // RFID Scanner
  socket.on("rfid-scanned", (data) => {
    console.log("UID received from Remote Desktop:", data.uid);
    io.emit("rfid-scanned", { ...data, timestamp: new Date() });
  });

  

  // REGISTER USER
  socket.on("register-user", (userId, role) => {
    if (!userId) {
      return console.log("⚠️ Registration failed: No User ID provided");
    }

    socket.userId = userId;
    socket.role = role;

    socket.join(`user:${userId}`);

    if (role === "admin") {
      socket.join("admin-incharge-shared");
      socket.join("role:admin");
      socket.join(`private:admin:${userId}`);
      console.log(`🛡️ ADMIN Joined: ${userId}`);
    } else if (role === "in-charge") {
      socket.join("admin-incharge-shared");
      socket.join("role:in-charge");
      socket.join(`private:in-charge:${userId}`);
      console.log(`📋 IN-CHARGE Joined: ${userId}`);
    }
  });

  socket.on("admin:send-to-incharge", (targetUserId, messageData) => {
    if (socket.role !== "admin") return;
    io.to(`private:in-charge:${targetUserId}`).emit(
      "private-alert",
      messageData,
    );
  });

  socket.on("incharge:send-to-admin", (targetUserId, messageData) => {
    if (socket.role !== "in-charge") return;
    io.to(`private:admin:${targetUserId}`).emit("private-alert", messageData);
  });

  // ==========================================
  // EQUIPMENT UPDATE (Admin & In-Charge logic)
  // ==========================================
  socket.on("updatestatusequipment:send", (payload) => {
    const inchargeId = payload.loan?.inchargeId;

    // 🔹 Admins get all updates
    io.to("role:admin").emit("updatestatusequipment:update", payload);

    // 🔹 In-charge sender only
    if (inchargeId) {
      io.to(`user:${inchargeId}`).emit("updatestatusequipment:update", payload);
    }
  });

  // ==========================================
  // DISCONNECT LOGIC
  // ==========================================
  socket.on("disconnect", async () => {
    const OFFLINE_DELAY = 5000;

    if (socket.userId && socket.role === "rescuer") {
      setTimeout(async () => {
        try {
          await loginSchema.findOneAndUpdate(
            { userId: socket.userId },
            { $set: { status: "offline" } },
          );

          console.log(`💤 Rescuer ${socket.userId} OFFLINE`);

          io.to("admin-incharge-shared").emit("rescuer:status-changed", {
            userId: socket.userId,
            status: "offline",
          });
        } catch (err) {
          console.error("Error setting rescuer offline:", err);
        }
      }, OFFLINE_DELAY);
    }

    console.log(`❌ Disconnected: ${socket.id}`);
  });
});

// ==========================================
// MONGODB CONNECTION
// ==========================================
mongoose
  .connect(process.env.CONN_STR)
  .then(async () => {
    console.log("✅ DB connected successfully");

    // Initialize default user
    await initDefaultUser();

    const port = process.env.PORT || 3000;

    server.listen(port, () => console.log(`🚀 Server running on port ${port}`));
  })
  .catch((err) => {
    console.error("❌ DB connection error:", err);
  });
