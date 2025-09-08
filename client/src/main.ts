import Phaser from "phaser";
import { GameScene } from "./game/GameScene";
import { SocketManager } from "./utils/SocketManager";
import { UIManager } from "./ui/UIManager";

// Game configuration
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: "game-container",
  backgroundColor: "#2c3e50",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scene: [GameScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

// Initialize game
class Game {
  private game: Phaser.Game;
  private socketManager: SocketManager;
  private uiManager: UIManager;

  constructor() {
    this.socketManager = new SocketManager();
    this.uiManager = new UIManager();

    // Pass managers to the game config
    (config as any).socketManager = this.socketManager;
    (config as any).uiManager = this.uiManager;

    this.game = new Phaser.Game(config);

    this.initializeGame();
  }

  private initializeGame(): void {
    // Set up socket connection
    this.socketManager.connect();

    // Set up UI
    this.uiManager.initialize();

    // Set up global game functions
    (window as any).restartGame = () => this.restartGame();

    // Join game with assigned keys (this will be determined by player position)
    this.socketManager.joinGame(["w", "a"]); // Default to player 1 keys

    console.log("🎮 WASD Game initialized");
  }

  private restartGame(): void {
    this.socketManager.restartGame();
    this.uiManager.hideGameOver();
  }
}

// Start the game when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new Game();
});
