import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../../dist/client")));

// Game state management
interface GameState {
  players: Map<string, Player>;
  gameActive: boolean;
  startTime: number;
}

interface Player {
  id: string;
  keys: string[];
  deaths: number;
  connected: boolean;
}

const gameState: GameState = {
  players: new Map(),
  gameActive: false,
  startTime: 0,
};

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Handle player joining
  socket.on("join-game", (playerData: { keys: string[] }) => {
    const player: Player = {
      id: socket.id,
      keys: playerData.keys,
      deaths: 0,
      connected: true,
    };

    gameState.players.set(socket.id, player);

    // Notify all players about the new player
    io.emit("player-joined", {
      playerId: socket.id,
      totalPlayers: gameState.players.size,
    });

    // If we have 2 players, start the game
    if (gameState.players.size === 2 && !gameState.gameActive) {
      gameState.gameActive = true;
      gameState.startTime = Date.now();
      io.emit("game-start", {
        startTime: gameState.startTime,
      });
    }
  });

  // Handle player input
  socket.on("player-input", (input: { key: string; timestamp: number }) => {
    if (gameState.gameActive) {
      // Broadcast input to all players
      io.emit("player-input", {
        playerId: socket.id,
        key: input.key,
        timestamp: input.timestamp,
      });
    }
  });

  // Handle game state updates
  socket.on("game-state-update", (state: any) => {
    io.emit("game-state-update", state);
  });

  // Handle player death
  socket.on("player-died", () => {
    const player = gameState.players.get(socket.id);
    if (player) {
      player.deaths++;
      io.emit("player-died", {
        playerId: socket.id,
        deaths: player.deaths,
      });
    }
  });

  // Handle game restart
  socket.on("restart-game", () => {
    gameState.gameActive = false;
    gameState.startTime = 0;
    io.emit("game-restart");
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`Player disconnected: ${socket.id}`);

    const player = gameState.players.get(socket.id);
    if (player) {
      player.connected = false;
    }

    // If game was active and we lost a player, pause the game
    if (gameState.gameActive) {
      gameState.gameActive = false;
      io.emit("game-paused", { reason: "player-disconnected" });
    }

    // Remove player after a delay
    setTimeout(() => {
      gameState.players.delete(socket.id);
      io.emit("player-left", {
        playerId: socket.id,
        totalPlayers: gameState.players.size,
      });
    }, 5000);
  });
});

// API Routes
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    players: gameState.players.size,
    gameActive: gameState.gameActive,
  });
});

app.get("/api/game-state", (req, res) => {
  res.json({
    players: Array.from(gameState.players.values()),
    gameActive: gameState.gameActive,
    startTime: gameState.startTime,
  });
});

// Serve the client app
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../../dist/client/index.html"));
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🎮 Game server ready for connections`);
});
