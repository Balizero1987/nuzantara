import { getFirestore } from "firebase-admin/firestore";
import type { Credentials } from "google-auth-library";

const col = () => getFirestore().collection("oauth_tokens");

export const tokenStore = {
  async save(email: string, tokens: Credentials) {
    await col().doc(email).set({ ...tokens, updatedAt: Date.now() }, { merge: true });
  },
  async get(email: string) {
    const snap = await col().doc(email).get();
    return snap.exists ? (snap.data() as Credentials) : null;
  },
};