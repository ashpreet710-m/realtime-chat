const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

// Allow CORS for socket connections (adjust origin in production)
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET","POST"]
  }
});

const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
  res.send({ message: 'Real-time chat server is running' });
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // When a user provides a name
  socket.on('join', (name) => {
    socket.data.name = name || 'Anonymous';
    // Notify others
    socket.broadcast.emit('chat message', {
      name: 'System',
      time: new Date().toLocaleTimeString(),
      message: `${socket.data.name} joined the chat`
    });
  });

  // When a chat message is received from a client
  socket.on('chat message', (msg) => {
    const payload = {
      name: socket.data.name || 'Anonymous',
      time: new Date().toLocaleTimeString(),
      message: msg
    };
    // broadcast to all clients including sender
    io.emit('chat message', payload);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    if (socket.data.name) {
      socket.broadcast.emit('chat message', {
        name: 'System',
        time: new Date().toLocaleTimeString(),
        message: `${socket.data.name} left the chat`
      });
    }
  });
});

server.listen(PORT, () => {
  console.log(`✅ Socket.io server running on port ${PORT}`);
});
