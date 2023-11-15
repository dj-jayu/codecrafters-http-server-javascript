const net = require("net");
const fs = require('fs');
const path = require('path');
const END_LINE = '\r\n';
const END_HEADERS = END_LINE + END_LINE
const DIRECTORY = getDirectoryFromArgs();

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

function getDirectoryFromArgs() {
    for (let i = 0; i < process.argv.length; i++) {
        if (process.argv[i] === '--directory' && i < process.argv.length - 1) {
            return process.argv[i+1];
        }
    }
    return '';
}

async function getFileContent(file_name) {
    const full_path = path.join(DIRECTORY, file_name);
    const data = await fs.promises.readFile(full_path);
    // to test the non blocking behavior of Node uncomment the line below
    // and try other requests while awaiting for the file
    // const delay = await new Promise(resolve => setTimeout(resolve, 10000));
    return data;
}

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

async function processGetRequest(headers, body) {
    if (headers['path'] === '/') {
        return createServerResponse(200, 'OK');
    } else if (headers['path'].startsWith('/echo')) {
        serverResponseBody = headers['path'].slice(6).replace(/^\/+/, '');
        headersDict = {'Content-Type':'text/plain', 'Content-Length': serverResponseBody.length};
        return createServerResponse(200, 'OK', headersDict, serverResponseBody);
    } else if (headers['path'].startsWith('/user-agent')) {
        serverResponseBody = headers['user-agent'];
        headersDict = {'Content-Type':'text/plain', 'Content-Length': serverResponseBody.length};
        return createServerResponse(200, 'OK', headersDict, serverResponseBody);
    } else if (headers['path'].startsWith('/file')) {
        const file_name = headers['path'].slice(6).replace(/^\/+/, '');
        try {
            const content = await getFileContent(file_name);
            return createServerResponse(200, 'OK', {'Content-Type': 'application/octet-stream', 'Content-Length': content.length}, content);
        } catch {
            return createServerResponse(404, 'Not Found');
        }
    } else {
        return createServerResponse(404, 'Not Found');
    }
}

async function processPostRequest(headers, body) {
    if (headers['path'].startsWith('/files')){
        const file_name = headers['path'].slice(6).replace(/^\/+/, '');
        try {
            await createFile(file_name, body);
            return createServerResponse(201, 'Created');
        } catch {
            return createServerResponse(500, ' Internal Server Error');
        }
    } else {
        return createServerResponse(404, 'Not Found');
    }
}

async function createFile(file_name, data) {
    const full_path = path.join(DIRECTORY, file_name);
    await fs.promises.writeFile(full_path, data);
}

async function processResponse(response) {
    // deals with the logic of what the server should answer to the client
    const [headers, body] = parseResponse(response);
    if (headers['method'] === 'GET') {
        return await processGetRequest(headers, body);
    } else {
        return processPostRequest(headers, body);
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
    stream.on('data', async buffer => {
        const response = buffer.toString();
        const data_for_client = await processResponse(response);
        stream.write(data_for_client);
        stream.end();
    })
})

// ask the server to start listening for client connections
server.listen(4221, "localhost", () => {
    console.log('listening for new connections');
})
