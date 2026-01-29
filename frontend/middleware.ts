import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token,
  },
});

export const config = {
  // Exclude root (/), api, auth, and static files
  matcher: ["/((?!$|api|auth|_next/static|_next/image|favicon.ico).*)"],
};
