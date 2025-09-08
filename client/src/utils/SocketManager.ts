import { io, Socket } from "socket.io-client";

export class SocketManager {
  private socket: Socket;
  private isConnected: boolean = false;

  constructor() {
    this.socket = io("http://localhost:3001", {
      transports: ["websocket", "polling"],
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.socket.on("connect", () => {
      console.log("Connected to server");
      this.isConnected = true;
      this.updateConnectionStatus("Connected");
    });

    this.socket.on("disconnect", () => {
      console.log("Disconnected from server");
      this.isConnected = false;
      this.updateConnectionStatus("Disconnected");
    });

    this.socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
      this.updateConnectionStatus("Connection Error");
    });
  }

  public connect(): void {
    if (!this.isConnected) {
      this.socket.connect();
    }
  }

  public disconnect(): void {
    if (this.isConnected) {
      this.socket.disconnect();
    }
  }

  public joinGame(keys: string[]): void {
    this.socket.emit("join-game", { keys });
  }

  public sendPlayerInput(key: string): void {
    if (this.isConnected) {
      this.socket.emit("player-input", {
        key,
        timestamp: Date.now(),
      });
    }
  }

  public sendPlayerDeath(): void {
    if (this.isConnected) {
      this.socket.emit("player-died");
    }
  }

  public restartGame(): void {
    if (this.isConnected) {
      this.socket.emit("restart-game");
    }
  }

  public on(event: string, callback: (...args: any[]) => void): void {
    this.socket.on(event, callback);
  }

  public off(event: string, callback?: (...args: any[]) => void): void {
    this.socket.off(event, callback);
  }

  private updateConnectionStatus(status: string): void {
    const statusElement = document.getElementById("connection-text");
    if (statusElement) {
      statusElement.textContent = status;
      statusElement.style.color =
        status === "Connected" ? "#4CAF50" : "#f44336";
    }
  }

  public getSocket(): Socket {
    return this.socket;
  }

  public isSocketConnected(): boolean {
    return this.isConnected;
  }
}
