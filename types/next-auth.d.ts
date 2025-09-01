import type { DefaultSession, DefaultUser } from "next-auth";
import type { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
    interface Session {
        user: {
            role: string;
            theme: string;
        } & DefaultSession["user"];
    }
    interface User extends DefaultUser {
        role: string;
        theme: string;
    }
}

declare module "next-auth/jwt" {
    interface JWT extends DefaultJWT {
        role: string;
        theme: string;
    }
}
