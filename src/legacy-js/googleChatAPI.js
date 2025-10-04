import { google } from "googleapis";
const auth = new google.auth.GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/chat.bot"]
});
export const chatAPI = () => google.chat({
    version: "v1",
    auth
});
