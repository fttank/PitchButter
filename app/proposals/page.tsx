"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { collection, deleteDoc, doc, onSnapshot } from "firebase/firestore";
import { Proposal } from "@/lib/proposals"; // Import Proposal type from utility file

// Define the document structure with the necessary ID field
interface ProposalDoc extends Proposal {
    id: string;
}

export default function ProposalsPage() {
  const [user, setUser] = useState<any>(null);
  const [proposals, setProposals] = useState<ProposalDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProposal, setSelectedProposal] = useState<ProposalDoc | null>(
    null
  );

  // Track Login state and fetch proposals
  useEffect(() => {
    // Auth Listener
    const authUnsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setLoading(false);
        setProposals([]); // Clear proposals if user logs out
      }
    });

    // Firestore Listener (runs when user changes)
    let firestoreUnsubscribe: (() => void) | undefined;

    if (user) {
        setLoading(true);
        try {
            // Set up real-time listener for user"s proposals collection
            firestoreUnsubscribe = onSnapshot(
                collection(db, "users", user.uid, "proposals"),
                (snapshot) => {
                    // Map the snapshot data into our array format
                    const docs = snapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    })) as ProposalDoc[];
                    setProposals(docs);
                    setLoading(false);
                },
                (error) => {
                    console.error("Error setting up proposals listener:", error);
                    setLoading(false);
                }
            );
        } catch (error) {
             console.error("Error setting up proposals listener:", error);
             setLoading(false);
        }
    } else {
        setLoading(false);
    }
    
    // Cleanup function: unsubscribe from both listeners when component unmounts
    return () => {
        authUnsubscribe();
        if (firestoreUnsubscribe) firestoreUnsubscribe();
    };
  }, [user]); // Re-run effect when the user changes (login/logout)

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  // Delete a proposal
  const handleDelete = async (proposalId: string) => {
    if (!user) return;
    try {
      // Deleting the doc will automatically trigger the onSnapshot listener, 
      // which updates the `proposals` state.
      await deleteDoc(doc(db, "users", user.uid, "proposals", proposalId));
    } catch (error) {
      console.error("Error deleting proposal:", error);
    }
  };

  // Helper for viewing proposal (user clicks on a card)
  const handleViewProposal = (proposal: ProposalDoc) => {
    setSelectedProposal(proposal);
  };
  
  // Helper for copying text
  const handleCopyToClipboard = (text: string) => {
    const tempTextArea = document.createElement("textarea");
    tempTextArea.value = text;
    document.body.appendChild(tempTextArea);
    tempTextArea.select();
    try {
        document.execCommand("copy");
        console.log("Copied to clipboard!");
    } catch (err) {
        console.error("Failed to copy to clipboard:", err);
    }
    document.body.removeChild(tempTextArea);
  };

  if (!user && loading) {
     return (
        <main className="py-12 px-6 max-w-6xl mx-auto text-center">
            <p className="text-[var(--text-light)]">Authenticating user...</p>
        </main>
    );
  }

  return (
    <main className="mb-5 py-10 px-6">
      <div className="max-w-7xl mx-auto text-center">
        <h1 className="py-3 text-4xl md:text-5xl font-bold mb-8 bg-clip-text text-transparent drop-shadow-lg drop-shadow-black bg-gradient-to-r from-[#00FF85] via-[#D93267] to-[#6237C5]">
          My Proposals
        </h1>

        {loading ? (
          <p className="text-center text-[var(--text-light)]">Loading proposals...</p>
        ) : !user ? (
          <div className="mt-4 text-center text-[var(--text-light)] p-8 rounded-lg backdrop-blur-sm shadow-md shadow-black bg-[var(--color-bg-dark)]/80 border-1 border-[var(--color-accent)]">
            <p className=" text-lg font-bold">
              Please log in to view your saved proposals.
            </p>
            <button
              onClick={handleLogin}
              className="rounded-lg relative inline-flex m-5 bg-gradient-to-r from-[#00FF85] via-[#D93267] to-[#6237C5] animate-border-gradient transition-all text-[var(--text-light)] hover:text-[#D93267] hover:shadow-md hover:shadow-[#D34267] ${(!quota.remaining || loading)"
            >
              <span className="rounded-lg bg-[var(--color-bg-panel)] font-medium px-8 py-2">Sign up / Log In</span>
            </button>
          </div>
        ) : proposals.length === 0 ? (
          <div className="mt-4 text-center text-[var(--text-light)] p-10 rounded-lg backdrop-blur-sm shadow-md shadow-black bg-[var(--color-bg-dark)]/80 border-1 border-[var(--color-accent)]">
            <p className="mb-4">No proposals found. Generate your first one!</p>
            <a
              href="/generate"
              className="w-xs rounded-lg relative inline-flex bg-gradient-to-r from-[#00FF85] via-[#D93267] to-[#6237C5] animate-border-gradient transition-all text-[var(--text-light)] hover:text-[#D93267] hover:shadow-md hover:shadow-[#D34267]"
            >
              <span className="rounded-lg w-xs bg-[var(--color-bg-panel)] font-medium px-8 py-2">
                Generate Proposal
              </span>
            </a>
          </div>
        ) : ( 
          <div className="bg-[var(--color-bg-dark)]/80 rounded-lg p-10 grid md:grid-cols-2 gap-8 my-5 shadow-md border border-[var(--color-accent)] backdrop-blur-sm">
            {proposals.map((proposal) => (
              <div 
              onClick={() => handleViewProposal(proposal)}
              className="proposal-card transition-all flex-wrap"
                key={proposal.id}>
                <h3 className="bg-[var(--color-bg-glass)]/80 rounded-t-lg p-1 font-extrabold text-lg mb-3 backdrop-blur-sm shadow-md border-t-1 border-[var(--color-accent)]">
                  {proposal.jobText.length > 50 ? `${proposal.jobText.slice(0, 50)}...` : proposal.jobText}
                </h3>
                <p className="text-sm text-[var(--text-light)] line-clamp-4 px-4">
                  {proposal.proposal}
                </p>
                <div className="flex justify-between items-baseline mt-8 px-3">
                  <span className="px-3 py-1 text-xs font-medium bg-[var(--color-bg-glass)] rounded-lg shadow-md">
                    {proposal.tone}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleViewProposal(proposal)}
                      className="px-2 py-0.5 text-sm rounded-lg transition bg-[var(--color-bg-panel)] shadow-md hover:border-2 hover:bg-gradient-to-t from-[#6237C5] to-[#00FF85] hover:text-[var(--color-bg-dark)]"
                    >
                      View
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleCopyToClipboard(proposal.proposal); }}
                      className="px-2 py-0.5 text-sm rounded-lg transition bg-[var(--color-bg-panel)] shadow-md hover:border-2 hover:bg-gradient-to-t from-[#6237C5] to-[#00FF85] hover:text-[var(--color-bg-dark)]"
                      title="Copy"
                    >
                      Copy
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(proposal.id); }}
                      className="px-2 py-0.5 text-sm rounded-lg transition bg-[var(--color-bg-panel)] shadow-md hover:border-2 hover:bg-gradient-to-t from-[#6237C5] to-[#00FF85] hover:text-[var(--color-bg-dark)]"
                      title="Delete"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
        {/* Expand Modal */}
      {selectedProposal && (
        <div className="fixed inset-0 bg-[var(--color-bg-dark)]/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--color-bg-glass)] rounded-xl p-8 max-w-2xl w-full mx-auto relative shadow-lg">
            <button
              onClick={() => setSelectedProposal(null)}
              className="absolute top-3 right-3 text-[var(--text-light)] hover:text-[var(--color-accent)] text-2xl"
            >
              &times;
            </button>
            <h2 className="text-4xl font-bold mb-4 text-[var(--text-light)] underline decoration-[var(--color-accent-alt)] decoration-2 underline-offset-8">
              FULL PROPOSAL
            </h2>
            <p className="text-sm text-[var(--text-light)] mb-2">
              <span className="font-semibold">Tone:</span>{" "}
              {selectedProposal.tone}
            </p>
            <div className="whitespace-pre-line text-[var(--text-light)] border border-[var(--color-accent-alt)] p-5 rounded-lg max-h-[500px] overflow-y-auto bg-[var(--color-bg-dark)]">
              {selectedProposal.proposal}
            </div>
            <div className="flex justify-end mt-4 gap-3">
              <button
                onClick={() => handleCopyToClipboard(selectedProposal.proposal)}
                className="px-3 py-2 text-sm rounded-lg transition border border-[var(--color-accent)] bg-[var(--color-bg-panel)] hover:border-2 hover:bg-gradient-to-t from-[#6237C5] to-[#00FF85] hover:text-[var(--color-bg-dark)]"
              >
                Copy Full
              </button>
              <button
                onClick={() => setSelectedProposal(null)}
                className="px-3 py-2 text-sm rounded-lg transition border border-[var(--color-accent)] bg-[var(--color-bg-panel)] hover:border-2 hover:bg-gradient-to-t from-[#6237C5] to-[#00FF85] hover:text-[var(--color-bg-dark)]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
