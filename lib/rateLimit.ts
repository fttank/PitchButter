import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Create a single Upstash Redis client (no re-init on each call)
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Create a rate limiter allowing 5 requests per minute per user
export const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(1, "1m"), // 1 requests per month
  analytics: true,
  prefix: "ai-proposal",
});
