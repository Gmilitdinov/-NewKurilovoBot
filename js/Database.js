class Database {
    constructor() {
        this.dbName = 'CheckersDB';
        this.dbVersion = 1;
        this.db = null;
        this.init();
    }

    init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.error("Database error:", request.error);
                reject(request.error);
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log("Database opened successfully");
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('players')) {
                    const store = db.createObjectStore('players', { keyPath: 'username' });
                    store.createIndex('gamesPlayed', 'gamesPlayed', { unique: false });
                    store.createIndex('wins', 'wins', { unique: false });
                }
            };
        });
    }

    async addPlayer(username) {
        const player = {
            username,
            gamesPlayed: 0,
            wins: 0,
            lastPlayed: new Date(),
            created: new Date()
        };

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['players'], 'readwrite');
            const store = transaction.objectStore('players');
            const request = store.put(player);

            request.onsuccess = () => resolve(player);
            request.onerror = () => reject(request.error);
        });
    }

    async getPlayer(username) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['players'], 'readonly');
            const store = transaction.objectStore('players');
            const request = store.get(username);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async updatePlayerStats(username, won) {
        const player = await this.getPlayer(username);
        if (player) {
            player.gamesPlayed++;
            if (won) player.wins++;
            player.lastPlayed = new Date();

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(['players'], 'readwrite');
                const store = transaction.objectStore('players');
                const request = store.put(player);

                request.onsuccess = () => resolve(player);
                request.onerror = () => reject(request.error);
            });
        }
    }

    async getLeaderboard() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['players'], 'readonly');
            const store = transaction.objectStore('players');
            const request = store.getAll();

            request.onsuccess = () => {
                const players = request.result;
                players.sort((a, b) => b.wins - a.wins);
                resolve(players);
            };
            request.onerror = () => reject(request.error);
        });
    }
} 