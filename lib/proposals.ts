import { db } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export interface Proposal {
  jobText: string,
  proposal: string,
  tone: string
  createdAt: null;
}

export async function saveProposal(
  userId: string,
  proposalData: Omit<Proposal, "createdAt">
): Promise<boolean> {
  try {
    await addDoc(collection(db, "users", userId, "proposals"), {
      ...proposalData,
    createdAt: serverTimestamp(),
  });

    return true;

  } catch (error) {
    console.error("Error saving proposal:", error);
    return false;
  }
}
