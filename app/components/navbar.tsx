"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import Image from "next/image";
import logo from "@/public/assets/logo.svg";
import type { User } from "firebase/auth"

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const login = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const logout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <nav className=" bg-[var(--color-bg-panel)]/30 py-2 px-3 fixed w-full rounded-b-lg z-10 backdrop-blur-xs shadow-sm shadow-[#000000]">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-baseline justify-items-center">
          <Image
            src={logo}
            alt="PitchButter logo"
            width={40}
            height={30}
            className="animate-pulse drop-shadow-lg"
            priority
          />
          <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-[#FFD86F] via-[#FF6FB1] to-[#6237C5]">
            PitchButter
          </span>
        </Link>

        {/* Links */}
        <div className="items-center space-x-4 flex">
          <Link href="/" className="font-medium text-[var(--text-light)] border-b border-[var(--color-accent)] hover:bg-[var(--color-accent)] rounded p-1">Home</Link>
          <Link href="/generate" className="font-medium text-[var(--text-light)] border-b border-[var(--color-accent)] hover:bg-[var(--color-accent)] rounded p-1">Generate</Link>
          <Link href="/proposals" className="font-medium text-[var(--text-light)] border-b border-[var(--color-accent)] hover:bg-[var(--color-accent)] rounded p-1">My Proposals</Link>
        </div>

        {/* Auth */}
        <button
          onClick={user ? logout : login}
          className="relative flex items-center shadow-sm shadow-[rgb(0,0,0)] justify-center gap-2 px-2 py-2.5 rounded-lg text-sm font-medium text-[var(--color-text-contrast)] animate-border-gradient overflow-hidden group transition-all duration-300 hover:shadow-md hover:shadow-[rgb(217,50,103)] hover:text-[rgb(217,50,103)]"
        >
          <div className="flex items-center justify-center w-5 h-5">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20" height="20">
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.72 1.22 9.22 3.6l6.85-6.85C35.64 2.88 30.27 0.5 24 0.5 14.84 0.5 6.77 5.9 2.9 13.6l7.98 6.2C12.43 13.08 17.73 9.5 24 9.5z"
              />
              <path
                fill="#34A853"
                d="M46.1 24.5c0-1.7-.15-3.33-.42-4.9H24v9.3h12.5c-.54 2.8-2.17 5.15-4.6 6.75l7.1 5.5c4.15-3.83 6.6-9.48 6.6-16.65z"
              />
              <path
                fill="#FBBC05"
                d="M10.88 28.3a14.54 14.54 0 0 1 0-8.6l-7.98-6.2C1.3 17.76 0 20.74 0 24s1.3 6.24 2.9 8.5l7.98-6.2z"
              />
              <path
                fill="#4285F4"
                d="M24 47.5c6.27 0 11.53-2.07 15.38-5.65l-7.1-5.5c-2.03 1.36-4.63 2.15-8.28 2.15-6.27 0-11.57-4.18-13.52-9.98l-7.98 6.2C6.77 42.1 14.84 47.5 24 47.5z"
              />
            </svg>
          </div>
          <span aria-label="tracking-wide">{user ? 'Logout' : 'Join with Google'}</span>
        </button>
        
      </div>
    </nav>
  );
}
