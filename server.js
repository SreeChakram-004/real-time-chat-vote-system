const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));
const corsOptions = {
    origin: '*',
    methods: ['GET', 'POST']
};
app.use(cors(corsOptions));

let pollData = {
    question: "Does idli make you fat?",
    options: ["Yes", "No", "It depends on how much you eat"],
    votes: [0, 0, 0]
};

let chatMessages = [];
let usersWhoVoted = {};

io.on('connection', (socket) => {
    console.log('a user connected');
    let currentUser = '';

    socket.on('login', (username) => {
        currentUser = username;
        console.log(`User logged in: ${username}`);
    });

    socket.emit('init', { pollData, chatMessages });

    socket.on('vote', (index) => {
        if (!usersWhoVoted[currentUser]) {
            pollData.votes[index]++;
            usersWhoVoted[currentUser] = true;
            io.emit('pollUpdate', pollData);
        }
    });

    socket.on('chatMessage', (msg) => {
        chatMessages.push(msg);
        io.emit('newChatMessage', msg);
    });

    socket.on('editMessage', (msgIndex, newText) => {
        if (chatMessages[msgIndex].user === currentUser) {
            chatMessages[msgIndex].text = newText;
            io.emit('updateChatMessages', chatMessages);
        }
    });

    socket.on('deleteMessage', (msgIndex) => {
        if (chatMessages[msgIndex].user === currentUser) {
            chatMessages.splice(msgIndex, 1);
            io.emit('updateChatMessages', chatMessages);
        }
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});
