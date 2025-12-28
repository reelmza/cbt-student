import NextAuth, { DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";

declare module "next-auth" {
  interface Session {
    // User to be stored on session
    user: {
      id: string;
      token: string;
      firstName: string;
      lastName: string;
      picture: string;
      account_type: string;
    } & DefaultSession["user"];
  }

  // User returned from database
  interface User {
    userId: string;
    token: string;
    name: string;
    profilePhoto: string;
    userType: string;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      // Define credentials
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },
      authorize: async (credentials) => {
        let user = null;

        try {
          // Get user from database
          const targetUser = await fetch(
            "http://wastebank-be.onrender.com/api/v1/Auth/login",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                email: credentials.email,
                password: credentials.password,
              }),
            }
          );

          // Check if user exist
          if (targetUser.status === 401 || targetUser.status === 400) {
            return user;
          }

          // Parse user response body
          const targetUserBody = await targetUser.json();
          console.log(targetUserBody);

          // Get user details from DB
          // const userProfile = await fetch(
          //   `https://sbareads.surprises.ng/api/user/profile`,
          //   {
          //     method: "GET",
          //     headers: {
          //       Authorization: `Bearer ${targetUserBody.data.token}`,
          //       "Content-Type": "application/json",
          //       "x-app-version": "0.0.1",
          //       "x-device-id": "9fb1a2b7-5ddf-429d-99a9-88ff47b419dd",
          //       "x-platform": "ios",
          //       "x-app-id": "com.sbareads",
          //     },
          //   }
          // );

          // Parse user details
          // const userProfileBody = await userProfile.json();
          // console.log(userProfileBody);

          // Save merged user and session to user object
          // user = { ...targetUserBody.data, ...userProfileBody.data };
          user = targetUserBody.data;
          if (!user) {
            return null;
          }

          return user;
        } catch (e) {
          console.log(e);
          throw new Error("Server error");
        }
      },
    }),
  ],

  callbacks: {
    jwt({ token, trigger, user, session }) {
      if (user) {
        // User is available during sign-in
        // Extract data from database user returned from login endpoint
        token.id = user.userId;
        token.token = user.token;
        token.name = user.name;
        token.email = user.email;
        token.profilePhoto = user.profilePhoto;
        token.userType = user.userType;
      }

      if (trigger === "update") {
        // Note, that `session` can be any arbitrary object, remember to validate it!
        // Property that never needs to be updated are not listed such as userId

        if (session?.token) token.token = session.token;
        if (session?.name) token.name = session.name;
        if (session?.profilePhoto) token.profilePhoto = session.profilePhoto;
      }
      return token;
    },

    session({ session, token }) {
      // Extract data from token to final session
      session.user.id = token.id as string;
      session.user.token = token.token as string;
      session.user.name = token.name as string;
      session.user.profilePhoto = token.profilePhoto as string;
      session.user.userType = token.userType as string;

      return session;
    },

    // Required to enable conditional auth in middleware.ts
    authorized: async ({ auth }) => {
      return !!auth;
    },
  },

  pages: {
    error: "/",
    signIn: "/",
  },
});
