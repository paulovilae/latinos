---
description: Latinos API Architecture Rules
---

# Latinos Project API Rules

## CRITICAL: Do NOT modify `next.config.js` rewrites for `/api/*`

The Latinos project uses **App Router API routes** to handle all `/api/*` requests. These routes use `proxyToBackend()` from `lib/apiProxy.ts` which adds:

- Cloudflare Access headers (`CF-Access-Client-Id`, `CF-Access-Client-Secret`)
- Authorization Bearer token from NextAuth session

**NEVER** add a blanket rewrite like:

```javascript
{ source: '/api/:path*', destination: 'http://.../:path*' }
```

This bypasses the API routes and breaks authentication.

## When adding new API endpoints

1. Create the route handler in `frontend/app/api/[resource]/route.ts`
2. Use `proxyToBackend(request, "/api/[resource]/")` with the correct backend path
3. The backend path MUST include `/api/` prefix (e.g., `/api/bots/123`)

Example:

```typescript
import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/apiProxy";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  return proxyToBackend(request, `/api/bots/${params.id}`);
}
```

## Do NOT disable auth

Never use `{ requireAuth: false }` unless the endpoint is genuinely public.
This will break Vercel deployment where real authentication is required.

## Debugging API issues

1. Check backend logs: `docker logs --tail 50 latinos-backend`
2. If path is wrong (missing `/api/`): Check `next.config.js` for bad rewrites
3. If `401 Unauthorized`: Check `apiProxy.ts` and session/token flow
4. If `404 Not Found` on correct path: Backend route is missing

## Server Setup

- **Frontend**: `npm run dev` on port 3306 (or Vercel: https://latinos-liard.vercel.app)
- **Backend**: Docker container `latinos-backend` on port 8000
