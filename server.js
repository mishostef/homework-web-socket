const http = require('http');
const express = require('express');
const socketIO = require('socket.io');

const app = express();
app.use('/', express.static('static'));
const server = http.createServer(app);
const io = socketIO(server);


const rooms = {};
let pastMessages = [];//[{message,symbol,time,}]
let pastIds = [];

io.on('connect', socket => {
    ``
    console.log('player connected');

    socket.on('selectRoom', ({ roomId, prevId }) => {
        if (rooms[roomId] == undefined) {
            rooms[roomId] = new Map();
        }
        const players = rooms[roomId];

        if (players.size >= 2) {
            socket.emit('error', 'Room if full');
            socket.disconnect();
        } else {
            socket.join(roomId);
            initGame(roomId, players, socket);
            if (pastIds.includes(prevId)) {///return prev messages
                socket.emit('prevData', JSON.stringify(pastMessages));
            }
        }
    });
});

function initGame(roomId, players, socket) {
    socket.on('position', pos => {
        console.log('position', pos);
        socket.emit('position', pos);
        io.to(roomId).emit('position', pos);
    });

    socket.on('newGame', () => {
        console.log('new game started');
        io.to(roomId).emit('newGame');
    });

    socket.on('message', (data) => {
        console.log(JSON.stringify(data)); console.log('socketId=', socket.id)
        pastMessages.push({ message: data.message, symbol: data.symbol, time: new Date().toISOString(), });
        io.to(roomId).emit('message', data);

    });

    socket.on('disconnect', () => {
        console.log(`Player id = ${socket.id} left`);
        console.log(JSON.stringify(pastIds));
        console.log(players.size);
        console.log(JSON.stringify(pastMessages))
        players.delete(socket);

    });
    symbol = 'X';
    if (players.size > 0) {
        const otherSymbol = [...players.values()][0];
        if (otherSymbol == 'X') {
            symbol = 'O';
        }
    }
    players.set(socket, symbol);
    pastIds.push(socket.id);
    console.log('Assigning symbol', symbol);
    socket.emit('symbol', symbol);

}
server.listen(3000, () => console.log('server running on port 3000'));