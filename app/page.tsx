"use client";

export default function LandingPage() {
  return (
    <main className="min-h-full">
      
      {/* Hero Section */}
      <section className="py-10 px-6 text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold mb-6 drop-shadow-lg">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#00FF85] via-[#D93267] to-[#6237C5]">
            Fast, Smart, Client-Winning Proposals
          </span>
        </h1>
        <p className="text-center mt-10 text-4xl mx-auto mb-6 max-w-4xl drop-shadow-lg">
          Generate persuasive proposals in seconds!
        </p>
        <p className="text-center text-xl mx-auto mb-16 max-w-4xl drop-shadow-lg">
            Land more clients on Upwork, Fiverr, and beyond!
        </p>
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
          <div className="p-6 rounded-lg shadow-sm shadow-[#D93267]/60 bg-[var(--color-bg-glass)]/80 border-t-4 border-[#00FF85]">
            <h3 className="text-xl font-bold mb-2">Lightning Fast</h3>
            <p className="text-[#F3F4F6]">
              Generate professional proposals in under 10 seconds.
            </p>
          </div>
          <div className="p-6 rounded-lg shadow-sm shadow-[#D93267]/60 bg-[var(--color-bg-glass)]/80 border-t-4 border-[#D93267]">
            <h3 className="text-xl font-bold mb-2">Higher Win Rates</h3>
            <p className="text-[#F3F4F6]">
              AI-crafted proposals that speak directly to what clients want.
            </p>
          </div>
          <div className="p-6 rounded-lg shadow-sm shadow-[#D93267]/60 bg-[var(--color-bg-glass)]/80 border-t-4 border-[#6237C5]">
            <h3 className="text-xl font-bold mb-2">Customizable</h3>
            <p className="text-[#F3F4F6]">
              Tweak tone and style to match your personal brand.
            </p>
          </div>
        </div>
      </section>
      
      {/* Call to Action */}
      <section className="rounded-lg border-[var(--color-accent)] border-1 bg-[var(--color-bg-dark)]/30 p-3 mx-auto max-w-3xl text-center mb-10 shadow-md shadow-[#D93267]/60 backdrop-blur-sm">
        <h2 className="text-4xl font-bold mb-3">Ready to Land More Clients?</h2>
        <p className="text-xl mb-5">Get your first proposal for free today!</p>
        <a
          href="/generate"
          className="rounded-lg relative inline-flex mb-5 bg-gradient-to-r w-xs from-[#00FF85] via-[#D93267] to-[#6237C5] animate-border-gradient hover:text-[#D93267] hover:shadow-md hover:shadow-[#D34267] transition-all"
        >
          <span className="rounded-lg bg-[var(--color-bg-panel)] font-medium px-10 py-2 w-xs">
            Generate for Free
          </span>
        </a>
      </section>
    </main>
  );
}