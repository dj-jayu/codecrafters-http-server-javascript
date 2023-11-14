const net = require("net");

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

function parseResponse(response) {
    // returns the headers and body content from the raw client response
    let [before_body, body] = response.split('\r\n\r\n');
    const [request_line, ...headers] = before_body.split('\r\n');
    const [method, path,protocol] = request_line.split(' ');
    let headers_dict = {}
    headers.forEach(e => {
        let [key, value] = e.split(':');
        key = key.trim().toLowerCase();
        value = value.trim();
        headers_dict[key] = value;
    });
    body = body.trim();
    headers_dict = {method, path, protocol, ...headers_dict}
    return [headers_dict, body];
}

function processResponse(response) {
    // deals with the logic of what the server should answer to the client
    const [headers, body] = parseResponse(response);
    if (headers['path'] === '/') {
        return 'HTTP/1.1 200 OK\r\n\r\n';
    } else {
        return 'HTTP/1.1 404 Not Found\r\n\r\n';
    }
}

// initiates server
const server = net.createServer(socket => {
    socket.on('close', () => {
        console.log('connection closed');
        socket.end();
        server.close();
    });
});

// defines what the server does when there's a connection
server.on('connection', (stream) => {
    console.log(`Client ${stream.remoteAddress} connected`);
    stream.on('data', buffer => {
        const response = buffer.toString();
        const data_for_client = processResponse(response)
        stream.write(data_for_client);
        stream.end();
    })
})

// ask the server to start listening for client connections
server.listen(4221, "localhost", () => {
    console.log('listening for new connections');
})
