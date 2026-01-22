import { User } from "next-auth";

export const studentLogin: (
  credentials: Partial<
    Record<"username" | "password" | "loginClient", unknown>
  >,
  user: any
) => Promise<User | null> = async (credentials, user) => {
  try {
    // Get user from database
    const targetUser = await fetch(
      "https://cbt-be-production.up.railway.app/api/v1/student/complete-login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: credentials.username,
          regNumber: credentials.username,
          passCode: credentials.password,
          authMethod: "password",
        }),
      }
    );

    // Check if user exist
    if (targetUser.status === 422 || targetUser.status === 400) {
      return user;
    }

    // Parse user response body
    const res = await targetUser.json();
    console.log({ ...res.data.student.profile, token: res.data.token });

    user = {
      ...res.data.student.profile,
      token: res.data.token,
    };

    console.log(user);
    if (!user) {
      return null;
    }

    return user;
  } catch (e) {
    console.log(e);
    throw new Error("Server error");
  }
};
