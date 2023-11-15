const net = require("net");

const END_LINE = '\r\n';
const END_HEADERS = END_LINE + END_LINE
// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

function parseResponse(response) {
    // returns the headers and body content from the raw client response
    let [before_body, body] = response.split(END_HEADERS);
    const [request_line, ...headers] = before_body.split(END_LINE);
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

function createServerResponse(statusCode, statusMsg, headersDict={}, body='') {
    // creates a http response with the specified parameters
    const request_line = `HTTP/1.1 ${statusCode} ${statusMsg}`;
    let headers = '';
    if (Object.keys(headersDict).length !== 0) { 
        headers = Object.entries(headersDict).map(([key, value]) => {
            return `${key}: ${value}`;
        }).join(END_LINE);
    }
    return request_line + END_LINE + headers + END_HEADERS + body;
}

function processResponse(response) {
    // deals with the logic of what the server should answer to the client
    const [headers, body] = parseResponse(response);
    if (headers['path'] === '/') {
        return createServerResponse(200, 'OK');
    } else if (headers['path'].startsWith('/echo')) {
        serverResponseBody = headers['path'].slice(6);
        headersDict = {'Content-Type':'text/plain', 'Content-Length': serverResponseBody.length};
        return createServerResponse(200, 'OK', headersDict, serverResponseBody);
    } else if (headers['path'].startsWith('/user-agent')) {
        serverResponseBody = headers['user-agent'];
        headersDict = {'Content-Type':'text/plain', 'Content-Length': serverResponseBody.length};
        return createServerResponse(200, 'OK', headersDict, serverResponseBody);
    }
    else {
        return createServerResponse(404, 'Not Found');
    }
}

// initiates server
const server = net.createServer(socket => {
    socket.on('close', () => {
        console.log('connection closed');
        socket.end();
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
