import { apiClient } from "@/src/lib/api/client";

type EventHandler = (data: any) => void;

class WebSocketClient {
    private socket: WebSocket | null = null;
    private url: string;
    private reconnectInterval: number = 3000;
    private eventHandlers: Map<string, EventHandler[]> = new Map();
    private isExplicitlyDisconnected: boolean = false;

    constructor(url: string) {
        this.url = url;
    }

    public connect() {
        const token = apiClient.getToken();
        if (!token) {
            console.warn("⚠️ WebSocket: No token found, skipping connection");
            return;
        }

        if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
            return;
        }

        this.isExplicitlyDisconnected = false;
        const wsUrl = `${this.url}?token=${token}`;

        console.log(`🔌 WebSocket: Connecting to ${this.url}...`);
        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
            console.log("✅ WebSocket: Connected");
        };

        this.socket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                this.handleMessage(message);
            } catch (e) {
                console.error("❌ WebSocket: Failed to parse message", e);
            }
        };

        this.socket.onclose = (event) => {
            console.log(`🔌 WebSocket: Disconnected (Code: ${event.code})`);
            this.socket = null;

            if (!this.isExplicitlyDisconnected) {
                console.log(`🔄 WebSocket: Reconnecting in ${this.reconnectInterval}ms...`);
                setTimeout(() => this.connect(), this.reconnectInterval);
            }
        };

        this.socket.onerror = (error) => {
            console.error("❌ WebSocket: Error", error);
        };
    }

    public disconnect() {
        this.isExplicitlyDisconnected = true;
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
    }

    public on(event: string, handler: EventHandler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, []);
        }
        this.eventHandlers.get(event)?.push(handler);
    }

    public off(event: string, handler: EventHandler) {
        if (!this.eventHandlers.has(event)) return;

        const handlers = this.eventHandlers.get(event) || [];
        this.eventHandlers.set(event, handlers.filter(h => h !== handler));
    }

    private handleMessage(message: { type: string; data: any }) {
        const handlers = this.eventHandlers.get(message.type);
        if (handlers) {
            handlers.forEach(handler => handler(message.data));
        } else {
            // Also trigger generic 'message' event
            const genericHandlers = this.eventHandlers.get('message');
            if (genericHandlers) {
                genericHandlers.forEach(handler => handler(message));
            }
        }
    }
}

// Singleton instance
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws';
export const socketClient = new WebSocketClient(WS_URL);
