'use strict';

document.getElementById('init-form').addEventListener('submit', onSubmit);

function onSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const roomId = formData.get('room');
    init(roomId);
}

function init(roomId) {
    socket = io();
    socket.on('connect', () => {
        socket.emit('selectRoom', roomId);
    });

    socket.on('symbol', newSymbol => {
        symbol = newSymbol;
        socket.on('position', place);
        socket.on('newGame', newGame);
        startGame();
    });

    socket.on('message', ({ message, symbol: sym }) => {
        const output = document.getElementById('chat-output');
        const author = document.createElement('p');
        author.classList.add('author');
        const lastMessage = document.createElement('p');
        lastMessage.classList.add('message-text');
        lastMessage.textContent = message;
        if (sym === symbol) {
            author.textContent = `${new Date().getHours()} : ${new Date().getMinutes()}  You said:`;
            author.classList.add('right');
            lastMessage.classList.add('right');
        } else {
            author.textContent = `${new Date().getHours()} : ${new Date().getMinutes()}  ${sym} said:`;
        }
        output.appendChild(author);
        output.appendChild(lastMessage);
    })

    socket.on('error', error => alert(error));
}

let symbol = '';
let socket = null;

const combinations = [
    ['00', '01', '02'],
    ['10', '11', '12'],
    ['20', '21', '22'],
    ['00', '10', '20'],
    ['01', '11', '21'],
    ['02', '12', '22'],
    ['00', '11', '22'],
    ['02', '11', '20']
];
function startGame() {
    document.getElementById('init').style.display = 'none';
    const board = document.getElementById('board');
    board.style.display = 'block';
    board.addEventListener('click', onClick);
    newGame();
    newChat();
}
function newGame() {
    [...document.querySelectorAll('.cell')].forEach(el => el.textContent = '');
}

function newChat() {
    document.getElementById('chat').style.display = 'block';
    const messageForm = document.getElementById('message-form');
    messageForm.addEventListener('submit', handleMessage);
}

function handleMessage(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const message = formData.get('text');
    socket.emit('message', {
        message,
        symbol
    });
    form.reset();

}

function onClick(event) {
    if (event.target.classList.contains('cell')) {
        if (event.target.textContent == '') {
            const id = event.target.id;
            console.log(id);
            //place(id)
            socket.emit('position', {
                id,
                symbol
            });
        }
    }
}


function place(data) {
    document.getElementById(data.id).textContent = data.symbol;
    setTimeout(hasCombination, 0);
}

function hasCombination() {
    for (let combination of combinations) {
        const result = combination.map(pos => document.getElementById(pos).textContent).join('');
        if (result == 'XXX') {
            return endGame('X');
        } else if (result == 'OOO') {
            return endGame('O');
        }
    }
}

function endGame(winner) {
    const choice = confirm(`Player ${winner} wins!\nDo you want a rematch?`);
    if (choice) {
        // newGame();
        socket.emit('newGame');
    }
}