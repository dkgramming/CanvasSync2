var http = require('http');
var fs = require('fs');
var socketio = require('socket.io');
var socket = require('./socket.js');

var port = process.env.PORT || process.env.NODE_PORT || 3000;

var fileNames = [
    // Pages
    '/index.html',
    
    // Libraries
    '/lib/preloadjs-0.6.1.min.js',
    '/lib/jquery-2.2.1.min.js',
    
    // Scripts
    '/main.js',
    '/loader.js',
    '/assets.js',
    '/gameobjects.js',
    '/boundaries.js',
    '/quadtree.js',
    '/keyboard.js',
    '/screen.js',
    '/world.js',
    '/net-world.js',
    '/parallax.js',
    '/player.js',
    '/animation.js',
    '/vec2.js',
    '/network.js',
    
    // Styles
    '/styles.css',
    
    // Media
    '/media/BG-tile1.png',
    '/media/BlockFull.png',
    '/media/Ship.png',
    '/media/OtherShip.png',
    
    // Font
    '/font/Ubuntu-Regular.ttf'
];

var cachedFiles = {};

for (var i = 0; i < fileNames.length; i++) {
    var currentName = fileNames[i];
    
    cachedFiles[currentName] =
        fs.readFileSync(__dirname + "/../client" + currentName);
}

var onRequest = function (req, res) {
    if (fileNames.indexOf(req.url) > -1) {
        res.writeHead(200);
        res.end(cachedFiles[req.url]);
    } else {
        res.writeHead(200);
        res.end(cachedFiles['/index.html']);
    }
};

var server = http.createServer(onRequest).listen(port);

var io = socketio.listen(server);
socket.configureSockets(io);

console.log("Listening on port " + port);