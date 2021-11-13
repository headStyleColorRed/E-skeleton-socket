// IOS WEBSOCKET
var WebSocketServer = require('websocket').server;
var http = require('http');
const port = 2000

// Array of Objects
var currentRooms = new Array()

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
    var client = request.accept(null, request.origin);
    console.log('A user connected');
    console.log(request);

    client.on("message", (msg) => {
      console.log(msg);
    })

    client.on('close', (client) => {
        console.log('user closed connection');
    });
});