"use client";

import { useQuotaCheck } from "@/lib/useQuotaCheck";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { saveProposal } from "@/lib/proposals";
import { Proposal } from "@/lib/proposals";

// Define the shape of the Freelancer Profile data being sent to the API
interface FreelancerProfile {
  skills: string;
  bio: string;
  experience: string;
}

export default function GenerateProposalPage() {
  const [jobDescription, setJobDescription] = useState("");
  const [tone, setTone] = useState<"professional" | "friendly" | "persuasive">(
    "professional"
  );
  const [proposal, setProposal] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Utility to show temp notifications
  const showNotification = (message: string, type: "success" | "error" | "info") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // track auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        await currentUser.getIdToken(true);
        setUser(currentUser);
        setShowAuthModal(false);
        await quota.refetch();
      } else {
        setUser(null)
      }
    });
    return () => unsubscribe();
  }, []);

  // Quota hook (visitor has 1 free generation, logged-in users have 5 per week)
  const quota = useQuotaCheck(user);

  // Google login
  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setShowAuthModal(false); // close modal on success
      await quota.refetch(); // refresh quota after login
      showNotification("Logged in successfully!", "success");
    } catch (error) {
      console.error("Google login error:", error);
      showNotification("Login failed. Please try again.", "error");
    }
  };

  // Generate proposal
  const generateProposal = async () => {
    // Client-side validation
    if (!jobDescription.trim()) {
      showNotification("Please enter a job description first!", "info");
      return;
    }

    //wait for quota to load
    if (quota.loading) return;

    //Block based on quota
    if (quota.remaining === 0) {
      if (!user) {
        // visitor has used their one free trial
        setShowAuthModal(true);
        showNotification("Free trial used up! Please sign up to continue.", "info");
      } else {
        // logged in user has reached their weekly limit
        showNotification("Weekly limit reached. Please upgrade your plan.", "info");
      }
      return;
    }

    if (user) {
      const idToken = await user.getIdToken(true); // force fresh token
      if (!idToken) {
        showNotification("Authentication error. Please try logging in again.", "error");
        setLoading(false);
        return;
      }
    }

    // proceed with generation
    setLoading(true);
    setProposal("");
    setNotification(null);

    try {
      // 3. Get Auth Token for Server-Side Verification
      const idToken = user ? await user.getIdToken() : undefined;
      
      // If user is logged in, but token retrieval failed, stop.
      if (user && !idToken) {
          showNotification("Authentication failed. Please log out and log back in.", "error");
          setLoading(false);
          return;
      }

      const profileData: FreelancerProfile = {
        skills: "React, Node.js",
        bio: "Frontend dev",
        experience: "3 years coding",
      };

      console.log("Sending generate request...");
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(idToken && { "Authorization": `Bearer ${idToken}` }), 
        },
        body: JSON.stringify({ jobText: jobDescription, profile: profileData, tone }),
      });

      const data = await response.json();
      console.log("Response from server:", data);

      if (response.ok) {
        // SUCCESS: Server has already checked quota and performed the atomic increment.
        setProposal(data.proposal);
        showNotification("Proposal generated successfully!", "success");
      } else // Handle quota / trial limit messages
        if (response.status === 429 && data.error?.includes("Free trial used")) {
          setShowAuthModal(true);
          showNotification("Your free trial is used up. Sign in to continue!", "info");
        } else if (response.status === 403) {
          showNotification("Weekly limit reached. Please upgrade your plan.", "info");
        } else {
          showNotification(data.error || "An unknown API error occurred.", "error");
        }
      
      // 4. Always refetch quota to reflect the new server-side state (used or not)
      await quota.refetch();

    } catch (err) {
      console.error("Generation network error:", err);
      showNotification("A network error occurred while generating the proposal.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mb-5 py-10 px-6">
      <div className="max-w-7xl mx-auto text-center">
        <h1 className="py-3 text-4xl md:text-5xl font-bold mb-8 bg-clip-text text-transparent drop-shadow-lg drop-shadow-black bg-gradient-to-r from-[#00FF85] via-[#D93267] to-[#6237C5]">
          Generate Your Proposal!
        </h1>

        <div className="grid md:grid-cols-2 gap-10 drop-shadow-lg drop-shadow-black">
          {/* Left column: input form */}
          <div>
            <label className="border-[var(--color-accent)] border-1 bg-[var(--color-bg-glass)]/60 backdrop-blur-xs rounded-lg block text-lg font-medium text-[var(--text-light)] mb-2">
              Paste the Job Description:
            </label>
            <textarea
              rows={15}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-lg items-center justify-center text-center whitespace-pre-line border-1 border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-alt)] bg-[var(--color-bg-glass)]/60 backdrop-blur-xs text-[var(--text-light)]"
              placeholder="Example: Looking for a web designer to create a modern e-commerce site..."
            />

            <div className="mt-6">
              <label className="block text-lg font-medium text-[var(--text-light)] mb-2">
                Select tone:
              </label>
              <div className="grid grid-cols-3 gap-3 text-[var(--text-light)]">
                {["professional", "friendly", "persuasive"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTone(t as any)}
                    className={`px-4 py-2 rounded-lg border font-medium bg-[var(--color-bg-panel)] ${
                      tone === t
                        ? "bg-gradient-to-t from-[#6237C5] to-[#00FF85] text-[var(--color-bg-dark)]"
                        : "border-[var(--color-accent)] border-1 hover:border-2 hover:text-[var(--color-accent)] hover:bg-[var(--color-bg-dark)]"
                    }`}
                  > 
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={generateProposal}
              disabled={loading || quota.loading}
              className={`bg-[var(--color-bg-panel)]/40 rounded-lg relative w-full inline-flex m-5 ml-0.5 p-0.5 font-medium bg-gradient-to-r from-[#00FF85] via-[#D93267] to-[#6237C5] animate-border-gradient transition-all text-[var(--text-light)] hover:shadow-md hover:shadow-[#D34267] ${(!quota.remaining || loading) && "opacity-50 cursor-not-allowed"}`}
            >
              <span className="rounded-lg w-full bg-[var(--color-bg-panel)]/90 px-4 py-2 hover:bg-[var(--color-bg-dark)]">
                  {loading ? "✨ Generating..." : "⚡ Generate Proposal!"}
              </span>
            </button>

              {!quota.loading && (
                <p className="mb-8 text-sm text-[var(--text-light)] underline decoration-double decoration-[var(--color-accent-alt)] underline-offset-6">
                  {quota.plan == "visitor" &&
                    (quota.remaining === 1
                      ? "You have 1 free try.\nSign in to get 5 proposals per week."
                      : "Free try used.\nSign in with Google to continue generating!")}
                  {quota.plan === "free" && (quota.remaining != null && `${quota.remaining} / 5 proposals left this week`)}
                  {quota.plan === "pro" && "⭐ Pro plan: unlimited proposals!"}
                </p>
              )}
        </div>

        {/* Right column: proposal output */}
        <div className="drop-shadow-lg drop-shadow-black">
          <label className="border border-[var(--color-accent)] bg-[var(--color-bg-panel)]/80 backdrop-blur-xs rounded-lg block text-lg font-medium text-[var(--text-light)] mb-2">
            Your Generated Proposal
          </label>

          <div
            className="w-full flex flex-col items-center justify-center 
                      shadow-sm border border-[var(--color-accent)]
                      rounded-lg p-6 min-h-[385px]
                      bg-[var(--color-bg-glass)]/60 
                      backdrop-blur-xs text-center whitespace-pre-line 
                      transition-all duration-500 ease-in-out 
                      [@supports(backdrop-filter:blur(4px))]:backdrop-blur-sm animate"
          >
            {proposal ? (
              <p className="text-[var(--text-light)] text-lg animate animate-fade-in">
                {proposal}
              </p>
            ) : loading ? (
              <p className="text-[var(--text-light)] text-lg animate animate-pulse rounded-lg transition-all p-0.5">
                🧈 Proposal Bot is writing your butter-smooth pitch...
              </p>
            ) : (
              <p className="text-[var(--text-light)] text-lg rounded-lg p-2">
                Your buttery proposal will appear here 🫠
              </p>
            )}
          </div>

          {proposal && (
            <div className="rounded-b-lg w-full p-2 bg-[var(--color-bg-d)] flex-10 space-x-3 mt-2 animate-fade-in">
              <button
                onClick={async () => {
                  if (!proposal) {
                    showNotification("Nothing to copy. Generate a proposal first!", "info");
                    return;
                  }
                  try {
                    await navigator.clipboard.writeText(proposal);
                    showNotification("Proposal copied to clipboard!", "success");
                  } catch {
                    showNotification("Failed to copy proposal.", "error");
                  }
                }}
                className="px-6 py-2 rounded-lg border font-medium text-[var(--text-light)] 
                          border-[var(--color-accent)] bg-[var(--color-bg-panel)] 
                          hover:border-2 hover:bg-gradient-to-t from-[#6237C5] to-[#00FF85] 
                          hover:text-[var(--color-bg-dark)] transition-all duration-300"
              >
                Copy
              </button>

              <button
                onClick={async () => {
                  if (user) {
                    const proposalToSave: Omit<Proposal, "createdAt"> = {
                      jobText: jobDescription,
                      proposal: proposal,
                      tone: tone,
                    };
                    const success = await saveProposal(user.uid, proposalToSave);
                    success
                      ? showNotification("Proposal saved successfully!", "success")
                      : showNotification("Failed to save proposal.", "error");
                  } else {
                    setShowAuthModal(true);
                  }
                }}
                className="px-6 py-2 rounded-lg border font-medium text-[var(--text-light)] 
                          border-[var(--color-accent)] bg-[var(--color-bg-panel)] 
                          hover:bg-gradient-to-t from-[#6237C5] to-[#00FF85] 
                          hover:text-[var(--color-bg-dark)] transition-all duration-300"
              >
                Save
              </button>

              <button
                onClick={generateProposal}
                className="px-6 py-2 rounded-lg border font-medium text-[var(--text-light)] 
                          border-[var(--color-accent)] bg-[var(--color-bg-panel)] 
                          hover:border-2 hover:bg-gradient-to-t from-[#6237C5] to-[#00FF85] 
                          hover:text-[var(--color-bg-dark)] transition-all duration-300"
              >
                Regenerate
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
     
      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-[var(--color-bg-dark)]/70 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[var(--color-bg-dark)] shadow-[#D93267] shadow-sm rounded-lg p-8 max-w-md w-full mx-4">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-2 right-2"
            >
              &times;
            </button>
            <h3 className="font-bold text-center text-4xl mb-3 bg-clip-text text-transparent bg-gradient-to-r from-[#00FF85] via-[#D93267] to-[#6237C5]">
              Save Your Proposal!
            </h3>
            <p className="text-center">
              Sign up for free to save unlimited proposals and access them anytime!
            </p>
            <div className="flex justify-center mt-5">
              <button
                onClick={handleGoogleLogin}
                className="relative flex items-center shadow-sm shadow-[#00000040] justify-center gap-2 px-8 py-2 rounded-lg text-sm font-medium text-[var(--color-text-contrast)] animate-border-gradient overflow-hidden group transition-all duration-300 hover:shadow-md hover:shadow-[#D93267] hover:text-[#D93267]"> Continue with Google
              </button>
            </div>
            <div className="flex justify-center">
              <button
                onClick={() => setShowAuthModal(false)}
                className="px-6 py-1 mt-2 text-sm rounded-lg border text-[var(--text-light)] border-[var(--color-accent)] bg-[var(--color-bg-panel)] hover:bg-gradient-to-t from-[#6237C5] to-[#00FF85] hover:text-[var(--color-bg-dark)]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    {/* Notification Toast */}
    {notification && (
      <div
        className={`fixed top-15 right-10 z-80 px-4 py-3 rounded-lg shadow-lg backdrop-blur-xs border animate animate-bounce
          ${
            notification.type === "success"
              ? "bg-[#00FF85]/40 border-[#00FF85]"
              : notification.type === "error"
              ? "bg-[#D93267]/40 border-[#D93267]"
              : "bg-[#6237C5]/40 border-[#6237C5]"
          }
          text-[var(--text-light)] transition-all duration-500 animate-fade-in`}
      >
        <p className="text-sm font-medium">{notification.message}</p>
      </div>
    )}  
    </main>
  );
}