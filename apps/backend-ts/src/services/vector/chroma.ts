/**
 * ZANTARA Vector Adapter — ChromaDB (official)
 */
import { Client } from "chromadb";
import { getLogger } from "../logger";

export default function chromaStore() {
  const logger = getLogger("vector:chroma");
  const client = new Client({ path: process.env.CHROMA_URL ?? "http://localhost:8000" });

  logger.info(`Connected to ChromaDB at ${client.config.path}`);

  return {
    name: "chroma",
    async ping() {
      try {
        await client.heartbeat();
        logger.info("✅ ChromaDB heartbeat OK");
        return true;
      } catch (err) {
        logger.error("❌ ChromaDB heartbeat failed", err);
        return false;
      }
    },
    client,
  };
}
