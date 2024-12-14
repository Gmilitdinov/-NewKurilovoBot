const tg = window.Telegram.WebApp;

class TelegramConfig {
    constructor(game) {
        this.game = game;
        this.init();
    }

    init() {
        tg.expand();
        
        const user = tg.initDataUnsafe?.user;
        if (user) {
            this.game.autoLogin(user.username);
        }
        
        tg.MainButton.text = "Найти игру";
        tg.MainButton.onClick(() => {
            this.game.findGame();
        });
    }

    showGameLink(gameId) {
        const gameLink = `https://t.me/your_bot?start=${gameId}`;
        fetch(`https://your-app-name.onrender.com/send-invite`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                chatId: tg.initDataUnsafe.user.id,
                gameId
            })
        });
    }
} 