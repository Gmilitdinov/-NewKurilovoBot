const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { MongoClient } = require('mongodb');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// MongoDB Atlas connection
const mongoUrl = 'mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/checkersDB?retryWrites=true&w=majority';
const dbName = 'checkersDB';
let db;

MongoClient.connect(mongoUrl, { useUnifiedTopology: true })
    .then(client => {
        db = client.db(dbName);
        console.log('Connected to MongoDB Atlas');
    })
    .catch(err => {
        console.error('Error connecting to MongoDB:', err);
    });

// Добавим проверку здоровья сервера
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Хранение активных игр и подключений
const games = new Map();
const connections = new Map();

wss.on('connection', (ws) => {
    ws.on('message', async (message) => {
        const data = JSON.parse(message);
        
        switch (data.type) {
            case 'login':
                handleLogin(ws, data);
                break;
            case 'create_game':
                handleCreateGame(ws, data);
                break;
            case 'join_game':
                handleJoinGame(ws, data);
                break;
            case 'move':
                handleMove(ws, data);
                break;
        }
    });
});

async function handleLogin(ws, data) {
    const { username } = data;
    let player = await db.collection('players').findOne({ username });
    
    if (!player) {
        player = {
            username,
            rating: 1000,
            gamesPlayed: 0,
            wins: 0,
            losses: 0,
            created: new Date(),
            lastPlayed: new Date()
        };
        await db.collection('players').insertOne(player);
    } else {
        await db.collection('players').updateOne(
            { username },
            { $set: { lastPlayed: new Date() }}
        );
    }
    
    connections.set(ws, { username, player });
    ws.send(JSON.stringify({
        type: 'login_success',
        player
    }));
}

function handleCreateGame(ws, data) {
    const gameId = generateGameId();
    const player = connections.get(ws);
    
    games.set(gameId, {
        id: gameId,
        white: player,
        black: null,
        moves: [],
        status: 'waiting'
    });
    
    ws.send(JSON.stringify({
        type: 'game_created',
        gameId
    }));
}

function handleJoinGame(ws, data) {
    const { gameId } = data;
    const game = games.get(gameId);
    const player = connections.get(ws);
    
    if (game && game.status === 'waiting') {
        game.black = player;
        game.status = 'playing';
        
        // Уведомляем обоих игроков
        const whiteWs = [...connections].find(([ws, p]) => 
            p.username === game.white.username)[0];
        const blackWs = ws;
        
        [whiteWs, blackWs].forEach(playerWs => {
            playerWs.send(JSON.stringify({
                type: 'game_started',
                game: {
                    id: game.id,
                    white: game.white.username,
                    black: game.black.username
                }
            }));
        });
    }
}

function handleMove(ws, data) {
    const { gameId, move } = data;
    const game = games.get(gameId);
    
    if (game && game.status === 'playing') {
        game.moves.push(move);
        
        // Отправляем ход обоим игрокам
        const whiteWs = [...connections].find(([ws, p]) => 
            p.username === game.white.username)[0];
        const blackWs = [...connections].find(([ws, p]) => 
            p.username === game.black.username)[0];
        
        [whiteWs, blackWs].forEach(playerWs => {
            playerWs.send(JSON.stringify({
                type: 'move',
                move
            }));
        });
    }
}

function generateGameId() {
    return Math.random().toString(36).substring(2, 15);
}

async function handleGameEnd(winner, loser) {
    const K = 32; // Коэффициент изменения рейтинга
    
    const winnerPlayer = await db.collection('players').findOne({ username: winner.username });
    const loserPlayer = await db.collection('players').findOne({ username: loser.username });
    
    // Вычисляем ожидаемый результат
    const expectedScore = 1 / (1 + Math.pow(10, (loserPlayer.rating - winnerPlayer.rating) / 400));
    
    // Вычисляем новые рейтинги
    const winnerNewRating = Math.round(winnerPlayer.rating + K * (1 - expectedScore));
    const loserNewRating = Math.round(loserPlayer.rating + K * (0 - expectedScore));
    
    // Обновляем статистику победителя
    await db.collection('players').updateOne(
        { username: winner.username },
        {
            $inc: { 
                gamesPlayed: 1,
                wins: 1
            },
            $set: { 
                rating: winnerNewRating,
                lastPlayed: new Date()
            }
        }
    );
    
    // Обновляем статистику проигравшего
    await db.collection('players').updateOne(
        { username: loser.username },
        {
            $inc: { 
                gamesPlayed: 1,
                losses: 1
            },
            $set: { 
                rating: loserNewRating,
                lastPlayed: new Date()
            }
        }
    );
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 