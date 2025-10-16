import OpenAI from "openai";
import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/admin";
import { FieldValue } from "firebase-admin/firestore";
import { ratelimit } from "@/lib/rateLimit";

const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const WEEKLY_LIMIT = 5;
const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;

// Sanitize input to prevent injection
function sanitize(input: string): string {
  return input.replace(/[<>{}]/g, "").slice(0, 2000);
}

// Type for user profile data
interface Profile {
  skills: string;
  bio: string;
  experience: string;
}

export async function POST(req: Request): Promise<Response> {
  let uid: string | undefined;
  let isVisitor = false;
  let jobText: string;
  let profile: Profile;
  let tone: string;

  // --- AUTH & INPUT ---
  try {
    const body = await req.json();
    jobText = sanitize(body.jobText || "");
    profile = body.profile;
    tone = sanitize(body.tone || "");

    const authHeader = req.headers.get('authorization');

    if (authHeader && authHeader.startsWith("Bearer ")) {
      // Logged-in user
      const idToken = authHeader.split("Bearer ")[1];
      const decodedToken = await adminAuth.verifyIdToken(idToken, true);
      uid = decodedToken.uid;
    } else {
      // Visitor path
      isVisitor = true;
    }
  } catch (err) {
    console.error("❌ Auth parse error:", err);
    return NextResponse.json(
      { error: "Invalid request payload or missing auth token." },
      { status: 400 }
    );
  }

    // --- HANDLE VISITOR LIMIT ---
    if (isVisitor) {
      const forwardedFor = req.headers.get("x-forwarded-for");
      const realIp = forwardedFor?.split(",")[0]?.trim() ||
                     req.headers.get("x-real-ip") ||
                     "local-test-ip";
      const key = `visitor:${realIp}`;
      console.log("Rate limit key:", key);

      const { success, remaining, reset } = await ratelimit.limit(key);

      if (!success) {
        console.warn(`🚫 Visitor rate limit exceeded for ${realIp}`);
        return NextResponse.json(
          { error: "Free trial used up! Sign in with Google to continue." },
          { status: 429 }
        );
      }

      // Visitors skip Firestore and go straight to AI generation
      console.log(`✅ Visitor allowed (${remaining} remaining until reset at ${reset})`);
    } else {
      // --- WEEKLY QUOTA (Firestore) ---
      const userUsageRef = adminDb.doc(`users/${uid}/meta/usage`);
      try {
        await adminDb.runTransaction(async (t) => {
          const userSnap = await t.get(userUsageRef);
          const now = Date.now();

          if (!userSnap.exists) {
            t.set(userUsageRef, {
              weeklyCount: 1,
              lastReset: FieldValue.serverTimestamp(),
              plan: "free",
            });
            return;
          }

          const data = userSnap.data() as any;
          const plan = data.plan || "free";
          const lastResetMs = data.lastReset?.toMillis?.() || 0;
          const weeklyCount = data.weeklyCount ?? 0;

          if (now - lastResetMs > WEEK_IN_MS) {
            t.set(
              userUsageRef,
              { weeklyCount: 1, lastReset: FieldValue.serverTimestamp(), plan },
              { merge: true }
            );
            return;
          }

          if (plan !== "pro" && weeklyCount >= WEEKLY_LIMIT) {
            throw new Error("QuotaExceeded");
          }

          if (plan !== "pro") {
            t.update(userUsageRef, { weeklyCount: FieldValue.increment(1) });
          }
        });
      } catch (err: any) {
        if (err.message === "QuotaExceeded") {
          return NextResponse.json(
            { error: `Weekly quota of ${WEEKLY_LIMIT} generations exceeded. Please upgrade.` },
            { status: 403 }
          );
        }
        console.error("Firestore error:", err.message);
        return NextResponse.json({ error: "Database update failed." }, { status: 500 });
      }
    }

 

  // --- OPENAI GENERATION ---
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "Server misconfiguration: Missing OpenAI API key." },
      { status: 500 }
    );
  }

  try {
    const systemPrompt = `You are an expert freelance consultant who writes clear, client-winning proposals based on job descriptions and freelancer profiles. Keep tone consistent and professional with the user's selected tone.`;

    const cleanJobText = sanitize(jobText);
    const cleanProfile = sanitize(JSON.stringify(profile));
    const userPrompt = `Job Description:\n${cleanJobText}\n\nFreelancer Profile:\n${cleanProfile}\n\nTone: ${tone}`;

    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 400,
    });

    const proposal = completion.choices[0]?.message?.content || "No proposal generated.";

    return NextResponse.json(
      { proposal },
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (openaiError: any) {
    if (openaiError.status === 429) {
      console.warn(`⚠️ OpenAI rate limit reached for ${uid || "visitor"}`);
      return NextResponse.json(
        { error: "OpenAI rate limit reached. Please try again later." },
        { status: 429 }
      );
    }
    console.error("❌ OpenAI API Error:", openaiError);
    return NextResponse.json(
      { error: "The AI service failed to generate a proposal." },
      { status: 500 }
    );
  }
}
