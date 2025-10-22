// Simple Zantara Knowledge Handler
import { ok, err } from "../../utils/response.js";

export async function getZantaraKnowledge() {
  try {
    const knowledge = {
      project: {
        name: "ZANTARA Webapp & Backend",
        version: "5.2.0",
        description: "Intelligent AI Assistant and Business Automation Platform"
      },
      status: "operational",
      timestamp: new Date().toISOString()
    };
    return ok(knowledge);
  } catch (error) {
    console.error('Error getting Zantara knowledge:', error);
    return err('Failed to retrieve Zantara knowledge', 500);
  }
}

export async function getSystemHealth() {
  try {
    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        backendTS: { status: "healthy" },
        backendRAG: { status: "healthy" }
      }
    };
    return ok(health);
  } catch (error) {
    console.error('Error getting system health:', error);
    return err('Failed to retrieve system health', 500);
  }
}

export async function getZantaraSystemPrompt() {
  try {
    const systemPrompt = "You are ZANTARA, an advanced AI assistant for the NUZANTARA ecosystem.";
    return ok({ data: systemPrompt });
  } catch (error) {
    console.error('Error generating Zantara system prompt:', error);
    return err('Failed to generate Zantara system prompt', 500);
  }
}
