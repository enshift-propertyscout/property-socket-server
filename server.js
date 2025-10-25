const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors({
  origin: process.env.SOCKETIO_ORIGIN || '*',
  methods: ['GET', 'POST']
}));

// Health check endpoint for Railway
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

const server = http.createServer(app);

let ioOptions = {
  cors: {
    origin: process.env.SOCKETIO_ORIGIN || '*',
    methods: ['GET', 'POST']
  }
};

// Optional Redis adapter for scaling
if (process.env.USE_REDIS_ADAPTER === 'true' && process.env.REDIS_URL) {
  const { createAdapter } = require('@socket.io/redis-adapter');
  const { createClient } = require('redis');
  const pubClient = createClient({ url: process.env.REDIS_URL });
  const subClient = pubClient.duplicate();
  ioOptions.adapter = createAdapter(pubClient, subClient);
  pubClient.connect();
  subClient.connect();
}

const io = new Server(server, ioOptions);

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.emit('hello', 'world'); // Send a test event to the client

  socket.on('join', (room) => {
    socket.join(room);
    console.log(`Client ${socket.id} joined room: ${room}`);
  });

  socket.on('test', (msg) => {
    console.log('Received test from client:', msg);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});