class Database {
    constructor() {
        this.dbName = 'CheckersDB';
        this.dbVersion = 1;
        this.db = null;
        this.init();
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = (event) => {
                console.error('Database error:', event.target.error);
                reject(event.target.error);
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('Database opened successfully');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                if (!db.objectStoreNames.contains('players')) {
                    const store = db.createObjectStore('players', { keyPath: 'username' });
                    store.createIndex('rating', 'rating', { unique: false });
                    store.createIndex('wins', 'wins', { unique: false });
                    store.createIndex('losses', 'losses', { unique: false });
                    store.createIndex('gamesPlayed', 'gamesPlayed', { unique: false });
                }
            };
        });
    }

    async addPlayer(username) {
        const player = {
            username,
            rating: 1000,
            gamesPlayed: 0,
            wins: 0,
            losses: 0,
            lastPlayed: new Date()
        };

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['players'], 'readwrite');
            const store = transaction.objectStore('players');
            const request = store.add(player);

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

    async updatePlayerStats(username, isWinner) {
        const player = await this.getPlayer(username);
        if (!player) return null;

        const ratingChange = isWinner ? 25 : -15;
        
        const updatedPlayer = {
            ...player,
            rating: Math.max(0, player.rating + ratingChange),
            gamesPlayed: player.gamesPlayed + 1,
            wins: player.wins + (isWinner ? 1 : 0),
            losses: player.losses + (isWinner ? 0 : 1),
            lastPlayed: new Date()
        };

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['players'], 'readwrite');
            const store = transaction.objectStore('players');
            const request = store.put(updatedPlayer);

            request.onsuccess = () => resolve(updatedPlayer);
            request.onerror = () => reject(request.error);
        });
    }

    async getLeaderboard() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['players'], 'readonly');
            const store = transaction.objectStore('players');
            const request = store.openCursor();
            const players = [];

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    players.push(cursor.value);
                    cursor.continue();
                } else {
                    // Сортируем по рейтингу и победам
                    players.sort((a, b) => {
                        if (b.rating !== a.rating) {
                            return b.rating - a.rating;
                        }
                        return b.wins - a.wins;
                    });
                    resolve(players);
                }
            };

            request.onerror = () => reject(request.error);
        });
    }

    async clearDatabase() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['players'], 'readwrite');
            const store = transaction.objectStore('players');
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
} 