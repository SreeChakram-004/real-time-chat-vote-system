const socket = io();

const loginDiv = document.getElementById('login');
const appDiv = document.getElementById('app');
const usernameInput = document.getElementById('usernameInput');
const loginButton = document.getElementById('loginButton');
let username = '';
let hasVoted = false;

loginButton.onclick = () => {
    username = usernameInput.value;
    if (username) {
        loginDiv.style.display = 'none';
        appDiv.style.display = 'block';
        socket.emit('login', username);
    }
};

// Polling
const pollQuestion = document.getElementById('pollQuestion');
const optionsDiv = document.getElementById('options');
const resultsDiv = document.getElementById('results');

socket.on('init', (data) => {
    pollQuestion.innerText = data.pollData.question;
    updatePoll(data.pollData);
    updateChat(data.chatMessages);
});

socket.on('pollUpdate', (pollData) => {
    updatePoll(pollData);
});

function updatePoll(pollData) {
    optionsDiv.innerHTML = '';
    pollData.options.forEach((option, index) => {
        const optionButton = document.createElement('button');
        optionButton.innerText = option;
        optionButton.onclick = () => vote(index);
        optionButton.disabled = hasVoted;
        optionsDiv.appendChild(optionButton);
    });

    // Calculate percentages
    const totalVotes = pollData.votes.reduce((total, count) => total + count, 0);

    // Determine highest, middle, and lowest vote counts
    const votes = pollData.votes.slice();
    const sortedVotes = [...votes].sort((a, b) => b - a);
    const highestVote = sortedVotes[0];
    const lowestVote = sortedVotes[sortedVotes.length - 1];
    const middleVote = sortedVotes[1];

    resultsDiv.innerHTML = '';
    pollData.votes.forEach((voteCount, index) => {
        const percentage = totalVotes === 0 ? 0 : (voteCount / totalVotes * 100).toFixed(2);
        const resultElement = document.createElement('p');
        resultElement.innerText = `${pollData.options[index]}: ${percentage}% (${voteCount} votes)`;

        if (voteCount === highestVote) {
            resultElement.className = 'highest';
        } else if (voteCount === middleVote) {
            resultElement.className = 'middle';
        } else if (voteCount === lowestVote) {
            resultElement.className = 'lowest';
        }

        resultsDiv.appendChild(resultElement);
    });
}

function vote(index) {
    if (!hasVoted) {
        socket.emit('vote', index);
        hasVoted = true;
        const buttons = document.querySelectorAll('#options button');
        buttons.forEach(button => button.disabled = true);
    }
}

// Chat
const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');

socket.on('newChatMessage', (msg) => {
    addChatMessage(msg);
});

socket.on('updateChatMessages', (messages) => {
    messagesDiv.innerHTML = '';
    messages.forEach(msg => addChatMessage(msg));
});

sendButton.onclick = () => {
    const msg = { user: username, text: messageInput.value };
    socket.emit('chatMessage', msg);
    messageInput.value = '';
};

function addChatMessage(msg) {
    const index = messagesDiv.childNodes.length;
    const messageElement = document.createElement('div');
    messageElement.className = 'message';
    messageElement.classList.add(msg.user === username ? 'my-message' : 'other-message');
    messageElement.innerHTML = `
        <p>${msg.user}: ${msg.text}</p>
        ${msg.user === username ? `
        <div>
            <button onclick="editMessage(${index})">Edit</button>
            <button onclick="deleteMessage(${index})">Delete</button>
        </div>
        ` : ''}
    `;
    messagesDiv.appendChild(messageElement);
}

function editMessage(index) {
    const messageElement = messagesDiv.childNodes[index];
    const newText = prompt('Edit your message:', messageElement.querySelector('p').innerText.split(': ')[1]);
    if (newText) {
        socket.emit('editMessage', index, newText);
    }
}

function deleteMessage(index) {
    if (confirm('Are you sure you want to delete this message?')) {
        socket.emit('deleteMessage', index);
    }
}
