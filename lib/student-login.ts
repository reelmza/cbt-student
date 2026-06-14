import { CredentialsSignin, User } from "next-auth";
import { getAxios } from "./axios";

// Auth.js only surfaces two things to the client: a thrown CredentialsSignin
// becomes res.error === "CredentialsSignin", and any other throw becomes
// "Configuration". We lean on that split — rejected credentials vs. an
// unreachable/erroring server — and tag a `code` for a more specific message
// when the runtime forwards it.
class InvalidCredentials extends CredentialsSignin {
  code = "invalid_credentials";
}

export const studentLogin: (
  credentials: Partial<
    Record<"username" | "password" | "loginClient", unknown>
  >,
  user: any,
) => Promise<User | null> = async (credentials) => {
  const api = await getAxios();

  let res;
  try {
    res = await api.post(
      `${process.env.SERVER_API_URL}/student/complete-login`,
      {
        email: credentials.username,
        regNumber: credentials.username,
        passCode: credentials.password,
        authMethod: "password",
      },
    );
  } catch (e: any) {
    // axios throws on non-2xx: a 4xx is the server rejecting the credentials,
    // anything else (5xx, network, no response) is infrastructure.
    const status = e?.response?.status;
    if (status >= 400 && status < 500) throw new InvalidCredentials();
    throw new Error("server_unavailable");
  }

  const profile = res.data?.data?.student?.profile;
  const token = res.data?.data?.token;
  if (!profile || !token) throw new InvalidCredentials();

  return { ...profile, token };
};
