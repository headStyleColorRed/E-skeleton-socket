// IOS WEBSOCKET
var WebSocketServer = require('websocket').server;
var http = require('http');
const port = 9006
const Members = require("./Members.js")

// Array of Objects
var members = new Members()

var iOSServer = http.createServer();

iOSServer.listen(port, () => {
    console.log('iOS socket server started on port ' + port);
});

// create the server
wsServer = new WebSocketServer({
    httpServer: iOSServer
});

// WebSocket server
wsServer.on('request', async (request) => {
    var socket = request.accept(null, request.origin);

    console.log('Received new connection');

    let userId = request.resourceURL.query.userId
    let roomId = request.resourceURL.pathname.substring(1);
    members.register(userId, socket, roomId)

    socket.on("message", (message) => {
        members.broadcast(message)
    })

    socket.on('close', (socket) => {
        console.log('user closed connection');
    });
}); 