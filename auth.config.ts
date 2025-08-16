import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    session: {
        strategy: "jwt",
    },
    callbacks: {
        jwt({ token, trigger, session, account }) {
            if (trigger === "update") token.name = session.user.name
            return token
        },
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnCollection = nextUrl.pathname.startsWith('/collection');
            if (isOnCollection) {
                if (isLoggedIn) return true;
              return false; // Redirect unauthenticated users to login page
            } else if (isLoggedIn) {
                return Response.redirect(new URL('/login', nextUrl));
            }
            return true;
        },
    },
    pages: {
        signIn: '/login',
        newUser: '/register'
    },
    events: {
        async signIn(message) {
            console.log(JSON.stringify({
                message: "Successful sign-in",
                level: "info",
                context: {
                    timestamp: new Date().toISOString(),
                    user: message.user,
                    account: message.account,
                    isNewUser: message.isNewUser
                }
            }));
        },
        async signOut(message) { 
            console.log(JSON.stringify({
                message: "Successful sign-out",
                level: "info",
                context: {
                    timestamp: new Date().toISOString(),
                    token: message.token
                }
            }));
        },
        async createUser(message) {
            var logMessage = ""
            if (message.user.name) {
                logMessage = "Created new user: ".concat((message.user.name).toString())
            }
            else {
                logMessage = "Created new user but name was not stored."
            }
            console.log(JSON.stringify({
                message: logMessage,
                level: "info",
                context: {
                    timestamp: new Date().toISOString(),
                    user: message.user.name
                }
            }));
        }
    }
} satisfies NextAuthConfig;
