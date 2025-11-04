import { z } from "zod";
import { getFirestore } from "firebase-admin/firestore";
import { ok } from "../../utils/response.js";
import { getCachedIdentity, setCachedIdentity } from "../../services/cacheProxy.js";
import { logSlowQuery } from "../../middleware/monitoring.js";

const ResolveSchema = z.object({
  identity_hint: z.string().optional(), // email or collaboratorId
});

export async function identityResolve(params: any) {
  const p = ResolveSchema.parse(params);

  // Check cache first
  if (p.identity_hint) {
    const cached = getCachedIdentity(p.identity_hint);
    if (cached) {
      return ok(cached);
    }
  }

  const startTime = Date.now();

  try {
    const db = getFirestore();
    const col = db.collection("collaborators");

  if (p.identity_hint) {
    // Try to find by email first
    const byEmail = await col.where("email", "==", p.identity_hint).limit(1).get();
    if (!byEmail.empty) {
      const data = byEmail.docs[0].data();
      const result = {
        ...data,
        system: "v5.2.0-production-firebase"
      };

      // Cache successful result
      setCachedIdentity(p.identity_hint, result);
      logSlowQuery(`identity.resolve(${p.identity_hint})`, Date.now() - startTime);

      return ok(result);
    }

    // Try to find by collaboratorId
    const byId = await col.doc(p.identity_hint).get();
    if (byId.exists) {
      const data = byId.data();
      const result = {
        ...data,
        system: "v5.2.0-production-firebase"
      };

      // Cache successful result
      setCachedIdentity(p.identity_hint, result);
      logSlowQuery(`identity.resolve(${p.identity_hint})`, Date.now() - startTime);

      return ok(result);
    }

    // Not found - return default for zero@balizero.com
    if (p.identity_hint === "zero@balizero.com") {
      return ok({
        collaboratorId: "zero",
        email: "zero@balizero.com",
        ambaradam_name: "Zero Master",
        role: "ceo",
        language: "it",
        timezone: "Asia/Makassar",
        system: "v5.2.0-default-zero"
      });
    }
  }

    // Fallback: return list of collaborators (max 25)
    const snap = await col.limit(25).get();
    return ok({
      candidates: snap.docs.map((d) => ({
        collaboratorId: d.id,
        ...d.data(),
        system: "v5.2.0-production-firebase"
      }))
    });

  } catch (error: any) {
    // Firebase not available, fallback to defaults
    console.log('🔄 Firebase unavailable, using fallback:', error?.message);

    if (p.identity_hint === "zero@balizero.com") {
      return ok({
        collaboratorId: "zero",
        email: "zero@balizero.com",
        ambaradam_name: "Zero Master",
        role: "ceo",
        language: "it",
        timezone: "Asia/Makassar",
        system: "v5.2.0-fallback-default"
      });
    }

    return ok({
      candidates: [
        { collaboratorId: "zero", email: "zero@balizero.com", role: "ceo", system: "v5.2.0-fallback-default" },
        { collaboratorId: "zainal", email: "zainal@balizero.id", role: "ceo_real", system: "v5.2.0-fallback-default" }
      ]
    });
  }
}

const OnboardSchema = z.object({
  email: z.string().email(),
  ambaradam_name: z.string().min(1),
  language: z.string().default("id"),
  timezone: z.string().default("Asia/Makassar"),
  role: z.string().default("ops"),
  collaboratorId: z.string().optional(),
});

export async function onboardingStart(params: any) {
  const p = OnboardSchema.parse(params);
  const id = p.collaboratorId || p.email.split("@")[0];

  const collaboratorData = {
    id,
    email: p.email,
    ambaradam_name: p.ambaradam_name,
    language: p.language,
    timezone: p.timezone,
    role: p.role,
    updatedAt: Date.now(),
    system: "v5.2.0-production-firebase"
  };

  try {
    const db = getFirestore();
    const doc = db.collection("collaborators").doc(id);
    await doc.set(collaboratorData, { merge: true });

    // Return the saved data
    const savedDoc = await doc.get();
    return ok(savedDoc.data() || collaboratorData);
  } catch (error: any) {
    // Firebase not available, return mock data
    console.log('🔄 Firebase unavailable for onboarding, using fallback:', error?.message);
    return ok({
      ...collaboratorData,
      system: "v5.2.0-fallback-onboarding"
    });
  }
}