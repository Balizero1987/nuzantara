import { Router, Request, Response } from "express";
import { getMemory, saveMemory } from "./memory.js";

const mr = Router();

mr.post("/memory/save", async (req: Request, res: Response) => {
  try {
    const userId = (req.body?.userId || req.body?.user_id || "").trim();
    if (!userId) return res.status(400).json({ ok:false, error:"Missing userId" });
    const facts  = (req.body?.profile_facts || req.body?.facts || []) as string[];
    const summary = (req.body?.summary || "").trim();
    await saveMemory({ userId, profile_facts: facts, summary });
    return res.json({ ok:true });
  } catch (e:any) { return res.status(500).json({ ok:false, error:e.message }); }
});

mr.get("/memory/get", async (req: Request, res: Response) => {
  try {
    const userId = (req.query.userId as string || req.query.user_id as string || "").trim();
    if (!userId) return res.status(400).json({ ok:false, error:"Missing userId" });
    const m = await getMemory(userId);
    return res.json({ ok:true, ...m });
  } catch (e:any) { return res.status(500).json({ ok:false, error:e.message }); }
});

export default mr;
