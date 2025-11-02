/**
 * ZANTARA Vector Adapter — Qdrant (standby)
 */
import { QdrantClient } from "@qdrant/js-client-rest";
import { getLogger } from "../logger";

export default function qdrantStore() {
  const logger = getLogger("vector:qdrant");
  const url = process.env.QDRANT_URL ?? "http://localhost:6333";
  const client = new QdrantClient({ url });

  logger.warn("⚠️ Qdrant backend in standby mode — no active operations");

  return {
    name: "qdrant",
    client,
    async ping() {
      try {
        await client.getCollections();
        logger.info("✅ Qdrant reachable");
        return true;
      } catch (err) {
        logger.error("❌ Qdrant connection failed", err);
        return false;
      }
    },
  };
}
