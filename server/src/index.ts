import express from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const httpServer = createServer(app);

const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

// Middleware
app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

// Socket.IO setup
const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_URL,
    methods: ["GET", "POST"],
  },
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Socket.IO connection handling
io.on("connection", (socket: Socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });

  // Placeholder for game events - will be implemented in later steps
  socket.on("ping", () => {
    socket.emit("pong", { message: "Server is alive!", timestamp: Date.now() });
  });
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Socket.IO ready for connections`);
  console.log(`Accepting connections from: ${CLIENT_URL}`);
});

export { io };
