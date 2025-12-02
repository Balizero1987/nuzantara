import { apiClient } from "@/lib/api/client";

type EventHandler = (data: unknown) => void;

class WebSocketClient {
    private socket: WebSocket | null = null;
    private url: string;
    private reconnectInterval: number = 3000;
    private maxReconnectAttempts: number = 3;
    private reconnectAttempts: number = 0;
    private eventHandlers: Map<string, EventHandler[]> = new Map();
    private isExplicitlyDisconnected: boolean = false;
    private isDisabled: boolean = false;

    constructor(url: string) {
        this.url = url;

        // Disable WebSocket for production fly.dev backend (no WS support)
        // or if URL is not configured
        if (!url || url.includes('fly.dev') || url.includes('vercel')) {
            this.isDisabled = true;
            console.log("🔌 WebSocket: Disabled for production environment");
        }
    }

    public connect() {
        // Skip if disabled or already connected
        if (this.isDisabled) {
            return;
        }

        const token = apiClient.getToken();
        if (!token) {
            console.warn("⚠️ WebSocket: No token found, skipping connection");
            return;
        }

        if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
            return;
        }

        // Check max reconnect attempts
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.warn(`⚠️ WebSocket: Max reconnect attempts (${this.maxReconnectAttempts}) reached, stopping`);
            this.isDisabled = true;
            return;
        }

        this.isExplicitlyDisconnected = false;
        const wsUrl = `${this.url}?token=${token}`;

        console.log(`🔌 WebSocket: Connecting to ${this.url}... (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);

        try {
            this.socket = new WebSocket(wsUrl);
        } catch (error) {
            console.error("❌ WebSocket: Failed to create connection", error);
            this.reconnectAttempts++;
            return;
        }

        this.socket.onopen = () => {
            console.log("✅ WebSocket: Connected");
            this.reconnectAttempts = 0; // Reset on successful connection
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

            if (!this.isExplicitlyDisconnected && !this.isDisabled) {
                this.reconnectAttempts++;
                if (this.reconnectAttempts < this.maxReconnectAttempts) {
                    console.log(`🔄 WebSocket: Reconnecting in ${this.reconnectInterval}ms...`);
                    setTimeout(() => this.connect(), this.reconnectInterval);
                } else {
                    console.warn(`⚠️ WebSocket: Max reconnect attempts reached, stopping`);
                }
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

    public isConnected(): boolean {
        return this.socket?.readyState === WebSocket.OPEN;
    }

    public isEnabled(): boolean {
        return !this.isDisabled;
    }

    private handleMessage(message: { type: string; data: unknown }) {
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
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || '';
export const socketClient = new WebSocketClient(WS_URL);
