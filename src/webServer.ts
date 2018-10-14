import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as http from 'http';
import { IncomingMessage, ServerResponse } from 'http';
import {
	connection as WebSocketConnection,
	request as WebSocketRequest,
	server as WebSocketServer,
} from 'websocket';

interface IMessage {
	type: string;
	payload: object;
}

const port = 8080;

export class WebServer extends EventEmitter {
	private baseDir = 'dist/web';
	private server: http.Server;
	private webSocketServer: WebSocketServer;
	private connections: WebSocketConnection[] = [];

	constructor() {
		super();
		this.server = http.createServer((req, res) => this.requestHandler(req, res));
		this.webSocketServer = new WebSocketServer({ httpServer:  this.server });
		this.webSocketServer.on('request', (req) => this.webSocketRequest(req));
	}

	public start() {
		this.server.listen(port);
	}

	public stop() {
		this.server.close();
	}

	public send(type: string, data: any) {
		const message = JSON.stringify({ type: type, payload: data });

		this.connections.forEach((connection) => {
			connection.sendUTF(message);
		});
	}

	private requestHandler(request: IncomingMessage, response: ServerResponse) {
		this.addCorsHeaders(response);

		if (request.method === 'GET') {
			const requestedFile = this.baseDir + request.url;
			if (fs.existsSync(requestedFile)) {
				fs.readFile(requestedFile, (err, buffer) => {
					response.writeHead(200);
					response.end(buffer);
				});

				return;
			}
		}

		response.statusCode = 404;
		response.end();
	}

	private addCorsHeaders(response: ServerResponse) {
		response.setHeader('Access-Control-Allow-Origin', '*');
	}

	private webSocketRequest(request: WebSocketRequest): any {
		const connection = request.accept(null, request.origin);
		this.connections.push(connection);

		connection.sendUTF(JSON.stringify({ type: 'connection', payload: { message: 'connected' } }));

		connection.on('message', (message) => {
			const parsedMessage: IMessage = JSON.parse(message.utf8Data);
			this.emit(parsedMessage.type, parsedMessage.payload);
		});

		connection.on('close', (reasonCode, description) => {
			const index = this.connections.indexOf(connection);
			this.connections.splice(index, 1);
		});
	}
}
