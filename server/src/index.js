/**
 * Companion Mode WebSocket Server
 * Enables real-time code sync between web IDE and mobile companion app
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const SessionManager = require('./sessionManager');

const app = express();
const server = http.createServer(app);

// Configure CORS for both Express and Socket.IO
app.use(cors());

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

const sessionManager = new SessionManager();
const PORT = process.env.PORT || 3001;

// Health check endpoint
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        service: 'Companion Mode Server',
        version: '1.0.0'
    });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Web IDE creates a new session
    socket.on('create-session', (callback) => {
        const session = sessionManager.createSession(socket.id);
        socket.join(session.code);

        if (typeof callback === 'function') {
            callback({ success: true, code: session.code });
        }

        console.log(`[Socket] Session created: ${session.code}`);
    });

    // Mobile app joins an existing session
    socket.on('join-session', (data, callback) => {
        const { code } = data;
        const result = sessionManager.joinSession(code, socket.id);

        if (result.success) {
            socket.join(code.toUpperCase());

            // Notify the web IDE that a companion has connected
            const session = result.session;
            io.to(session.webSocketId).emit('companion-connected', {
                sessionCode: session.code
            });

            // Send the current code to the newly connected mobile
            if (session.lastCode) {
                socket.emit('code-update', { code: session.lastCode });
            }

            if (typeof callback === 'function') {
                callback({ success: true, message: 'Connected to session' });
            }
        } else {
            if (typeof callback === 'function') {
                callback({ success: false, error: result.error });
            }
        }
    });

    // Web IDE sends code changes
    socket.on('code-change', (data) => {
        const session = sessionManager.getSessionByWebId(socket.id);
        if (session) {
            sessionManager.updateCode(session.code, data.code);

            // Broadcast to mobile companion
            if (session.mobileSocketId) {
                io.to(session.mobileSocketId).emit('code-update', {
                    code: data.code,
                    timestamp: Date.now()
                });
                console.log(`[Socket] Code sent to mobile: ${data.code.substring(0, 50)}...`);
            }
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log(`[Socket] Client disconnected: ${socket.id}`);

        const result = sessionManager.handleDisconnect(socket.id);
        if (result) {
            if (result.type === 'web' && result.session.mobileSocketId) {
                // Notify mobile that the session ended
                io.to(result.session.mobileSocketId).emit('session-ended', {
                    reason: 'Web IDE disconnected'
                });
            } else if (result.type === 'mobile') {
                // Notify web IDE that companion disconnected
                io.to(result.session.webSocketId).emit('companion-disconnected');
            }
        }
    });
});

// Start server
server.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║           🚀 Companion Mode Server Started 🚀             ║
╠═══════════════════════════════════════════════════════════╣
║  HTTP Server:  http://localhost:${PORT}                      ║
║  WebSocket:    ws://localhost:${PORT}                        ║
╚═══════════════════════════════════════════════════════════╝
  `);
});
