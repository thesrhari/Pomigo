import { updateSession } from "@/lib/supabase/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { ipAddress } from "@vercel/edge";
import { Ratelimit } from "@upstash/ratelimit";
import { kv } from "@vercel/kv";

// Define rate limits for different API endpoints
const rateLimitConfigs = {
  "/api/cancel-subscription": {
    limiter: Ratelimit.slidingWindow(3, "1 m"),
    message: "Too many requests. Please try again later.",
  },
  "/api/checkout": {
    limiter: Ratelimit.slidingWindow(10, "1 m"),
    message: "Too many requests. Please try again later.",
  },
  "/api/delete-account": {
    limiter: Ratelimit.slidingWindow(1, "1 m"),
    message: "Too many requests. Please try again later.",
  },
  "/api/invoice/": {
    limiter: Ratelimit.slidingWindow(10, "1 m"),
    message: "Too many requests. Please try again later.",
  },
  "/api/invoices": {
    limiter: Ratelimit.slidingWindow(20, "1 m"),
    message: "Too many requests. Please try again later.",
  },
  "/api/reactivate-subscription": {
    limiter: Ratelimit.slidingWindow(3, "1 m"),
    message: "Too many requests. Please try again later.",
  },
};

// Create rate limiter instances
const rateLimiters = Object.entries(rateLimitConfigs).reduce(
  (acc, [path, config]) => {
    acc[path] = new Ratelimit({
      redis: kv,
      limiter: config.limiter,
    });
    return acc;
  },
  {} as Record<string, Ratelimit>
);

function getRateLimiterForPath(
  pathname: string
): { limiter: Ratelimit; message: string } | null {
  // Check for exact matches first (more specific routes)
  for (const [path, config] of Object.entries(rateLimitConfigs)) {
    if (path !== "/api" && pathname.startsWith(path)) {
      return {
        limiter: rateLimiters[path],
        message: config.message,
      };
    }
  }

  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Apply rate limiting only to API routes
  if (pathname.startsWith("/api")) {
    const rateLimiterConfig = getRateLimiterForPath(pathname);

    if (rateLimiterConfig) {
      // Get the client's IP address
      const ip = ipAddress(request) || "127.0.0.1";

      // Create a unique identifier for the rate limit
      // You can also use user ID if available: `${ip}:${userId}`
      const identifier = `${ip}:${pathname}`;

      try {
        const { success, limit, reset, remaining } =
          await rateLimiterConfig.limiter.limit(identifier);

        if (!success) {
          return new NextResponse(
            JSON.stringify({
              error: "Rate limit exceeded",
              message: rateLimiterConfig.message,
              retryAfter: Math.round((reset - Date.now()) / 1000),
            }),
            {
              status: 429,
              headers: {
                "Content-Type": "application/json",
                "X-RateLimit-Limit": limit.toString(),
                "X-RateLimit-Remaining": remaining.toString(),
                "X-RateLimit-Reset": reset.toString(),
                "Retry-After": Math.round(
                  (reset - Date.now()) / 1000
                ).toString(),
              },
            }
          );
        }

        // Add rate limit headers to successful requests
        const response = await updateSession(request);
        if (response) {
          response.headers.set("X-RateLimit-Limit", limit.toString());
          response.headers.set("X-RateLimit-Remaining", remaining.toString());
          response.headers.set("X-RateLimit-Reset", reset.toString());
          return response;
        }
      } catch (error) {
        console.error("Rate limiting error:", error);
        // Continue without rate limiting if there's an error
      }
    }
  }

  // Continue with your existing Supabase session update
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
