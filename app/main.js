const net = require("net");

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

const server = net.createServer(socket => {
    socket.on('close', () => {
        console.log('connection closed');
        socket.end();
        server.close();
    });
});

server.on('connection', (stream) => {
    console.log('someone connected!');
    stream.on('data', buffer => {
        console.log(buffer.toString());
        stream.write('HTTP/1.1 200 OK\r\n\r\n');
        stream.end();
    })
})

server.listen(4221, "localhost", () => {
    console.log('listening for new connections');
})
