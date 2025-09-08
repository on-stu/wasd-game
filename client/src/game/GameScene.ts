import Phaser from "phaser";
import { SocketManager } from "../utils/SocketManager";
import { UIManager } from "../ui/UIManager";

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private enemies!: Phaser.Physics.Arcade.Group;
  private socketManager!: SocketManager;
  private uiManager!: UIManager;
  private currentDirection: string = "";
  private isMoving: boolean = false;
  private gameStartTime: number = 0;
  private playerDeaths: { [key: string]: number } = {};

  constructor() {
    super({ key: "GameScene" });
  }

  preload(): void {
    // Create simple colored rectangles as placeholders
    this.load.image(
      "player",
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
    );
    this.load.image(
      "wall",
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
    );
    this.load.image(
      "enemy",
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
    );
  }

  create(): void {
    // Get managers from the main game
    this.socketManager = (this.game as any).socketManager;
    this.uiManager = (this.game as any).uiManager;

    // Create game world
    this.createWalls();
    this.createEnemies();
    this.createPlayer();
    this.setupCollisions();
    this.setupInput();
    this.setupSocketEvents();

    // Start the game loop
    this.time.addEvent({
      delay: 16, // ~60 FPS
      callback: this.updateGameState,
      callbackScope: this,
      loop: true,
    });
  }

  private createWalls(): void {
    this.walls = this.physics.add.staticGroup();

    // Create border walls
    const wallThickness = 20;
    const gameWidth = this.cameras.main.width;
    const gameHeight = this.cameras.main.height;

    // Top wall
    this.walls
      .create(gameWidth / 2, wallThickness / 2, "wall")
      .setDisplaySize(gameWidth, wallThickness);
    // Bottom wall
    this.walls
      .create(gameWidth / 2, gameHeight - wallThickness / 2, "wall")
      .setDisplaySize(gameWidth, wallThickness);
    // Left wall
    this.walls
      .create(wallThickness / 2, gameHeight / 2, "wall")
      .setDisplaySize(wallThickness, gameHeight);
    // Right wall
    this.walls
      .create(gameWidth - wallThickness / 2, gameHeight / 2, "wall")
      .setDisplaySize(wallThickness, gameHeight);

    // Add some internal obstacles
    this.walls.create(200, 200, "wall").setDisplaySize(40, 40);
    this.walls.create(600, 400, "wall").setDisplaySize(40, 40);
    this.walls.create(400, 300, "wall").setDisplaySize(60, 20);
  }

  private createEnemies(): void {
    this.enemies = this.physics.add.group();

    // Add some moving enemies
    const enemy1 = this.enemies
      .create(300, 150, "enemy")
      .setDisplaySize(30, 30);
    const enemy2 = this.enemies
      .create(500, 450, "enemy")
      .setDisplaySize(30, 30);

    // Make enemies move in patterns
    this.tweens.add({
      targets: enemy1,
      x: 500,
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.tweens.add({
      targets: enemy2,
      y: 200,
      duration: 4000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  private createPlayer(): void {
    this.player = this.physics.add.sprite(400, 300, "player");
    this.player.setDisplaySize(32, 32);
    this.player.setTint(0x4caf50); // Green color
    this.player.setCollideWorldBounds(true);
  }

  private setupCollisions(): void {
    // Player collision with walls
    this.physics.add.collider(this.player, this.walls, () => {
      this.handlePlayerDeath("wall");
    });

    // Player collision with enemies
    this.physics.add.collider(this.player, this.enemies, () => {
      this.handlePlayerDeath("enemy");
    });
  }

  private setupInput(): void {
    // Keyboard input
    this.input.keyboard?.on("keydown", (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      // Only handle WASD keys
      if (["w", "a", "s", "d"].includes(key)) {
        this.handlePlayerInput(key);
      }
    });
  }

  private setupSocketEvents(): void {
    if (!this.socketManager) return;

    this.socketManager.on("game-start", (data: any) => {
      this.gameStartTime = data.startTime;
      this.uiManager.hideLobby();
    });

    this.socketManager.on("player-input", (data: any) => {
      this.handlePlayerInput(data.key);
    });

    this.socketManager.on("game-restart", () => {
      this.restartGame();
    });
  }

  private handlePlayerInput(key: string): void {
    this.currentDirection = key;
    this.isMoving = true;

    // Send input to server
    if (this.socketManager) {
      this.socketManager.sendPlayerInput(key);
    }
  }

  private updateGameState(): void {
    if (!this.isMoving || !this.currentDirection) return;

    const speed = 200;
    let velocityX = 0;
    let velocityY = 0;

    switch (this.currentDirection) {
      case "w":
        velocityY = -speed;
        break;
      case "s":
        velocityY = speed;
        break;
      case "a":
        velocityX = -speed;
        break;
      case "d":
        velocityX = speed;
        break;
    }

    this.player.setVelocity(velocityX, velocityY);
  }

  private handlePlayerDeath(cause: string): void {
    console.log(`Player died: ${cause}`);

    // Stop player movement
    this.player.setVelocity(0, 0);
    this.isMoving = false;
    this.currentDirection = "";

    // Send death event to server
    if (this.socketManager) {
      this.socketManager.sendPlayerDeath();
    }

    // Show game over screen
    this.uiManager.showGameOver(this.gameStartTime, this.playerDeaths);
  }

  private restartGame(): void {
    // Reset player position
    this.player.setPosition(400, 300);
    this.player.setVelocity(0, 0);

    // Reset game state
    this.isMoving = false;
    this.currentDirection = "";
    this.gameStartTime = 0;
    this.playerDeaths = {};

    // Hide game over screen
    this.uiManager.hideGameOver();
  }
}
