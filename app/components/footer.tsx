"use client";
import Image from "next/image";
import logo from "@/public/assets/logo.svg";
import Link from "next/link";
import { useEffect } from "react";

export default function Footer() {
  return (
    <footer className="bg-[var(--color-bg-panel)]/30 py-8 px-6 mt-12 rounded-t-lg backdrop-blur-xs shadow-lg shadow-black border-[#000000]">
      <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8">
        <div>
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
          <p className="text-[var(--text-light)]">
            Helping freelancers win more clients with persuasive proposals.
          </p>
        </div>
        <div>
          <h3 className="font-bold text-lg mb-4 underline">Product</h3>
          <ul className="space-y-2">
            <li><a href="/generate" className="transition-transform hover:scale-110 hover:text-[var(--color-accent-alt)]">Generate</a></li>
            <li><a href="/proposals" className="transition-transform hover:scale-110 hover:text-[var(--color-accent-alt)]">My Proposals</a></li>
          </ul>
        </div>
        <div>
          <h3 className="font-bold text-lg mb-4 underline">Resources</h3>
          <ul className="space-y-2">
            <li><a href="#" className="transition-transform hover:scale-110 hover:text-[var(--color-accent-alt)]">Blog</a></li>
            <li><a href="#" className="transition-transform hover:scale-110 hover:text-[var(--color-accent-alt)]">Guides</a></li>
          </ul>
        </div>
        <div>
          <h3 className="font-bold text-lg mb-4 underline">Company</h3>
          <ul className="space-y-2">
            <li><a href="#" className="transition-transform hover:scale-110 hover:text-[var(--color-accent-alt)]">About</a></li>
            <li><a href="#" className="transition-transform hover:scale-110 hover:text-[var(--color-accent-alt)]">Contact</a></li>
          </ul>
        </div>
      </div>
      <div className="max-w-6xl mx-auto border-t border-[var(--color-accent)] mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
        <p className="text-[var(--text-light)] mb-4 md:mb-0">
          © {new Date().getFullYear()} Pitch Butter. All rights reserved.
        </p>
        <div className="flex space-x-6">
          <a href="X" className="transition-transform hover:scale-110 hover:text-[var(--color-accent-alt)]"><i data-feather="twitter"></i></a>
          <a href="#" className="transition-transform hover:scale-110 hover:text-[var(--color-accent-alt)]"><i data-feather="instagram"></i></a>
          <a href="#" className="transition-transform hover:scale-110 hover:text-[var(--color-accent-alt)]"><i data-feather="linkedin"></i></a>
        </div>
      </div>
    </footer>
  );
}
