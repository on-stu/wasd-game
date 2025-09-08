export class UIManager {
  private gameStartTime: number = 0;
  private gameTimer: number | null = null;

  constructor() {
    this.initialize();
  }

  public initialize(): void {
    this.setupEventListeners();
    this.startGameTimer();
  }

  private setupEventListeners(): void {
    // Set up any UI event listeners here
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        this.togglePause();
      }
    });
  }

  public showLobby(): void {
    const lobby = document.getElementById("lobby");
    const lobbyContent = document.getElementById("lobby-content");

    if (lobby && lobbyContent) {
      lobby.style.display = "block";
      lobbyContent.style.display = "block";
    }
  }

  public hideLobby(): void {
    const lobby = document.getElementById("lobby");

    if (lobby) {
      lobby.style.display = "none";
    }
  }

  public showGameOver(
    startTime: number,
    deaths: { [key: string]: number }
  ): void {
    const gameOver = document.getElementById("game-over");
    const finalTime = document.getElementById("final-time");
    const totalDeaths = document.getElementById("total-deaths");

    if (gameOver && finalTime && totalDeaths) {
      // Calculate final time
      const currentTime = Date.now();
      const gameDuration = currentTime - startTime;
      const minutes = Math.floor(gameDuration / 60000);
      const seconds = Math.floor((gameDuration % 60000) / 1000);

      finalTime.textContent = `${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;

      // Calculate total deaths
      const totalDeathCount = Object.values(deaths).reduce(
        (sum, count) => sum + count,
        0
      );
      totalDeaths.textContent = totalDeathCount.toString();

      gameOver.style.display = "block";
    }
  }

  public hideGameOver(): void {
    const gameOver = document.getElementById("game-over");

    if (gameOver) {
      gameOver.style.display = "none";
    }
  }

  public updatePlayerCount(count: number): void {
    const playerCount = document.getElementById("player-count");

    if (playerCount) {
      playerCount.textContent = `${count}/2`;
    }
  }

  public updatePlayerDeaths(playerId: string, deaths: number): void {
    const player1Deaths = document.getElementById("player1-deaths");
    const player2Deaths = document.getElementById("player2-deaths");

    // This is a simplified version - in a real game you'd track which player is which
    if (player1Deaths) {
      player1Deaths.textContent = deaths.toString();
    }
  }

  public updateGameTime(startTime: number): void {
    this.gameStartTime = startTime;
  }

  private startGameTimer(): void {
    this.gameTimer = window.setInterval(() => {
      if (this.gameStartTime > 0) {
        const currentTime = Date.now();
        const gameDuration = currentTime - this.gameStartTime;
        const minutes = Math.floor(gameDuration / 60000);
        const seconds = Math.floor((gameDuration % 60000) / 1000);

        const timeDisplay = document.getElementById("time-display");
        if (timeDisplay) {
          timeDisplay.textContent = `${minutes
            .toString()
            .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
        }
      }
    }, 1000);
  }

  private stopGameTimer(): void {
    if (this.gameTimer) {
      clearInterval(this.gameTimer);
      this.gameTimer = null;
    }
  }

  private togglePause(): void {
    // Implement pause functionality if needed
    console.log("Pause toggled");
  }

  public destroy(): void {
    this.stopGameTimer();
  }
}
