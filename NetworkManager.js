class NetworkManager {
    constructor(game) {
        this.game = game;
        this.ws = null;
        this.gameId = null;
        this.connect();
    }

    connect() {
        this.ws = new WebSocket('wss://your-app-name.onrender.com');
        
        this.ws.onopen = () => {
            console.log('Connected to server');
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        this.ws.onclose = () => {
            console.log('Disconnected from server');
            setTimeout(() => this.connect(), 5000);
        };
        
        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
        };
    }

    async login(username) {
        this.ws.send(JSON.stringify({
            type: 'login',
            username
        }));
    }

    createGame() {
        this.ws.send(JSON.stringify({
            type: 'create_game'
        }));
    }

    joinGame(gameId) {
        this.ws.send(JSON.stringify({
            type: 'join_game',
            gameId
        }));
    }

    sendMove(move) {
        if (this.gameId) {
            this.ws.send(JSON.stringify({
                type: 'move',
                gameId: this.gameId,
                move
            }));
        }
    }

    handleMessage(data) {
        switch (data.type) {
            case 'login_success':
                this.game.onLoginSuccess(data.player);
                break;
            case 'game_created':
                this.gameId = data.gameId;
                this.game.onGameCreated(data.gameId);
                break;
            case 'game_started':
                this.game.onGameStarted(data.game);
                break;
            case 'move':
                this.game.onMoveReceived(data.move);
                break;
        }
    }
} 