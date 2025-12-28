import { User } from "next-auth";

export const schooLogin: (
  credentials: Partial<Record<"email" | "password" | "loginClient", unknown>>,
  user: any
) => Promise<User | null> = async (credentials, user) => {
  try {
    // Get user from database
    const targetUser = await fetch(
      "https://cbt-server-q5fr.onrender.com/api/v1/school/login",
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
    const res = await targetUser.json();
    user = { ...res.data.school, token: res.data.token };
    console.log(res);

    if (!user) {
      return null;
    }

    return user;
  } catch (e) {
    console.log(e);
    throw new Error("Server error");
  }
};
