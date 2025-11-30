"use client";

import { useEffect } from "react";
import { socketClient } from "@/src/lib/api/socket";
import { authAPI } from "@/src/lib/api/auth";

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
