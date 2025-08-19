import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import authRoutes from "./routes/auth";
import clientRoutes from "./routes/clients";
import workoutRoutes from "./routes/workouts";
import progressRoutes from "./routes/progress";
import chatRoutes from "./routes/chat";
import { authenticateToken } from "./middleware/auth";
import { setupSocketIO } from "./services/socket";

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Rotas públicas
app.use("/api/auth", authRoutes);

// Rotas protegidas
app.use("/api/clients", authenticateToken, clientRoutes);
app.use("/api/workouts", authenticateToken, workoutRoutes);
app.use("/api/progress", authenticateToken, progressRoutes);
app.use("/api/chat", authenticateToken, chatRoutes);

// Setup Socket.IO
setupSocketIO(io);

// Error handling middleware
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).json({
      success: false,
      message: "Algo deu errado!",
      ...(process.env.NODE_ENV === "development" && { error: err.message }),
    });
  }
);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Rota não encontrada",
  });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📊 Health check disponível em http://localhost:${PORT}/health`);
});
