"use client";

import { useEffect } from "react";
import { authAPI } from "@/lib/api/auth";
import { socketClient } from "@/lib/api/socket";

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        // Connect only if user is logged in
        const user = authAPI.getUser();
        if (user) {
            socketClient.connect();
        }

        // Cleanup on unmount
        return () => {
            socketClient.disconnect();
        };
    }, []);

    return <>{children}</>;
}
