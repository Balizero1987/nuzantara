import type { Request, Response } from "express";
import { gclient, gmailImpersonatedClient } from "./google";

/** Risposta minimale per Google Chat */
function chatText(text: string) {
  return { text };
}

/** Parsing parametri stile key=value tra virgolette o senza */
function parseArgs(input: string) {
  const args: Record<string,string> = {};
  const re = /(\w+)=("(.*?)"|(\S+))/g;
  let m;
  while ((m = re.exec(input)) !== null) {
    const key = m[1];
    const val = m[3] ?? m[4] ?? "";
    args[key] = val;
  }
  return args;
}

export async function handleChatEvent(req: Request, res: Response) {
  try {
    const ev = req.body || {};
    const type = ev.type; // MESSAGE, ADDED_TO_SPACE, etc.
    const text: string = (ev.message?.argumentText ?? ev.message?.text ?? "").trim();

    if (type === "ADDED_TO_SPACE") {
      return res.json(chatText("Ciao, sono ZANTARA. Scrivi `help` per i comandi."));
    }
    if (type !== "MESSAGE") {
      return res.json({}); // ignora altri eventi
    }

    if (!text || text.toLowerCase() === "help") {
      return res.json(chatText(
        [
          "Comandi disponibili:",
          "• `help` — mostra questo aiuto",
          "• `/email to=utente@dominio subject=\"...\" text=\"...\"` — invia email",
          "• `/drive name=\"Nome Documento\"` — crea Google Doc nella cartella predefinita",
          "• `/meet summary=\"Titolo\" start=\"ISO\" end=\"ISO\"` — crea evento su Calendar",
          "",
          "E puoi anche scrivermi in italiano: proverò a capire."
        ].join("\n")
      ));
    }

    // /email
    if (text.startsWith("/email")) {
      const args = parseArgs(text);
      const to = args["to"];
      const subject = args["subject"] ?? "Messaggio da ZANTARA";
      const body = args["text"] ?? "Ciao.";
      if (!to) return res.json(chatText("Errore: manca `to=`"));

      const sender = process.env.GMAIL_SENDER!;
      const { google, auth } = gmailImpersonatedClient(
        sender, ["https://www.googleapis.com/auth/gmail.send"]
      );
      const gmail = google.gmail({ version: "v1", auth });

      const raw = Buffer.from(
        `From: ${sender}\r\nTo: ${to}\r\nSubject: ${subject}\r\n` +
        `Content-Type: text/plain; charset="UTF-8"\r\n\r\n${body}`
      ).toString("base64").replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");

      const { data } = await gmail.users.messages.send({ userId: "me", requestBody: { raw } });
      return res.json(chatText(`Email inviata a ${to}. id=${data.id}`));
    }

    // /drive
    if (text.startsWith("/drive")) {
      const args = parseArgs(text);
      const name = args["name"] ?? "Zantara Doc";
      const parent = process.env.DRIVE_FOLDER_ID;
      if (!parent) return res.json(chatText("Config mancante: DRIVE_FOLDER_ID"));

      const { google, auth } = await gclient([
        "https://www.googleapis.com/auth/drive.file",
        "https://www.googleapis.com/auth/drive"
      ]);
      const drive = google.drive({ version: "v3", auth });
      const { data } = await drive.files.create({
        requestBody: { name, mimeType: "application/vnd.google-apps.document", parents: [parent] },
        fields: "id,webViewLink",
        supportsAllDrives: true
      });
      return res.json(chatText(`Creato Doc: ${name}\n🔗 ${data.webViewLink}`));
    }

    // /meet
    if (text.startsWith("/meet")) {
      const args = parseArgs(text);
      const summary = args["summary"] ?? "Meeting ZANTARA";
      const startIso = args["start"] ?? new Date().toISOString();
      const endIso = args["end"] ?? new Date(Date.now() + 60*60*1000).toISOString();
      const calendarId = "primary";

      const { google, auth } = await gclient(["https://www.googleapis.com/auth/calendar"]);
      const calendar = google.calendar({ version: "v3", auth });
      const { data } = await calendar.events.insert({
        calendarId,
        requestBody: { summary, start: { dateTime: startIso }, end: { dateTime: endIso } }
      });
      return res.json(chatText(`Evento creato: ${summary}\n🔗 ${data.htmlLink}`));
    }

    // fallback: rispondi generico (qui puoi agganciare il cervello LLM in futuro)
    return res.json(chatText("Ok. Per ora capisco i comandi `help`, `/email`, `/drive`, `/meet`."));

  } catch (e: any) {
    return res.json(chatText(`Errore: ${e.message}`));
  }
}
