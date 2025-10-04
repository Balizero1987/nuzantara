/**
 * NLU minimale per frasi tipo:
 *  "brunch con Gianluca oggi alle 11 @Kempinski (90m)"
 *  "domani 10 kickoff con Riri"
 *  "martedì 9:30 riunione budget @HQ 60m"
 *
 * Ritorna {summary, startISO, endISO, location} oppure null.
 */
const DAY_MAP_IT: Record<string, number> = {
  "lun": 1, "lunedì":1, "lunedi":1,
  "mar": 2, "martedì":2, "martedi":2,
  "mer": 3, "mercoledì":3, "mercoledi":3,
  "gio": 4, "giovedì":4, "giovedi":4,
  "ven": 5, "venerdì":5, "venerdi":5,
  "sab": 6, "sabato":6,
  "dom": 0, "domenica":0
};

function pad(n:number){ return n<10? "0"+n : ""+n; }

function addMinutes(date: Date, minutes: number){
  return new Date(date.getTime() + minutes*60000);
}

function toISOWithTZ(d: Date){
  // Forziamo offset +08:00 (Asia/Makassar)
  const yyyy = d.getFullYear();
  const MM = pad(d.getMonth()+1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  return `${yyyy}-${MM}-${dd}T${hh}:${mm}:${ss}+08:00`;
}

function nextWeekday(from: Date, targetDow: number){
  const d = new Date(from.getTime());
  const cur = d.getDay();
  let delta = targetDow - cur;
  if (delta <= 0) delta += 7;
  d.setDate(d.getDate() + delta);
  return d;
}

export function parseMeet(textRaw: string){
  if(!textRaw) return null;
  const text = textRaw.toLowerCase().trim();

  // location dopo @
  let location: string | undefined;
  const atIdx = text.indexOf("@");
  if (atIdx >= 0){
    location = textRaw.slice(atIdx+1).trim();
  }

  // durata: es. "90m", "60m", "1h30m"
  let durationMin = 60; // default
  const durH = text.match(/(\d+)\s*h(\d+)?\s*m?/);
  const durM = text.match(/(\d+)\s*m(?![a-z])/);
  if (durH){
    const h = parseInt(durH[1] || "0",10);
    const m = parseInt(durH[2] || "0",10);
    durationMin = h*60 + m;
  } else if (durM){
    durationMin = parseInt(durM[1],10);
  }

  // oggi / domani / giorno settimana
  const now = new Date(); // user locale, ma normalizziamo +08:00 in ISO
  // Adapt to Asia/Makassar by shifting if needed? Qui assumiamo già orario locale come riferimento umano.
  let dayRef = new Date(now.getTime());
  const isOggi = /\boggi\b/.test(text);
  const isDomani = /\bdomani\b/.test(text);
  if (isDomani){ dayRef.setDate(dayRef.getDate()+1); }
  else if (!isOggi){
    // prova giorni settimana
    for (const k of Object.keys(DAY_MAP_IT)){
      if (text.includes(k)){
        dayRef = nextWeekday(now, DAY_MAP_IT[k]);
        break;
      }
    }
  }

  // orario HH(:mm)? (accetta "alle 11", "11", "11:30")
  let hour = 9, minute = 0; // default
  const h1 = text.match(/alle?\s+(\d{1,2})(?::(\d{2}))?/);
  const h2 = h1 ? null : text.match(/\b(\d{1,2}):(\d{2})\b/);
  const h3 = (!h1 && !h2) ? text.match(/\b(\d{1,2})\b/) : null;

  if (h1){
    hour = parseInt(h1[1],10);
    minute = h1[2] ? parseInt(h1[2],10) : 0;
  } else if (h2){
    hour = parseInt(h2[1],10);
    minute = parseInt(h2[2],10);
  } else if (h3){
    const val = parseInt(h3[1],10);
    if (val>=0 && val<=23){ hour = val; minute = 0; }
  } else {
    // se manca orario esplicito, restituiamo null per evitare sorprese
    return null;
  }

  // costruisci start/end
  const start = new Date(dayRef.getFullYear(), dayRef.getMonth(), dayRef.getDate(), hour, minute, 0);
  const end = addMinutes(start, durationMin);
  const startISO = toISOWithTZ(start);
  const endISO = toISOWithTZ(end);

  // summary: testo senza @location e senza durata
  let summary = textRaw;
  if (atIdx>=0) summary = summary.slice(0, atIdx).trim();
  summary = summary.replace(/\(\s*\d+h?\d*m?\s*\)/gi,"").trim(); // rimuovi (90m) etc.

  return { summary, startISO, endISO, location };
}
