"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { User } from "@/types";
import { cognito } from "@/lib/auth/cognito";
import {
  clearSession,
  readSession,
  writeSession,
} from "@/lib/auth/session";

interface AuthContextValue {
  user: User | null;
  status: "loading" | "authenticated" | "unauthenticated";
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] =
    useState<AuthContextValue["status"]>("loading");

  useEffect(() => {
    const session = readSession();
    if (session) {
      setUser({
        id: session.userId,
        displayName: session.displayName,
        isSelf: true,
      });
      setStatus("authenticated");
    } else {
      setStatus("unauthenticated");
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await cognito.signIn(email, password);
    writeSession(result);
    setUser({
      id: result.userId,
      displayName: result.displayName,
      isSelf: true,
    });
    setStatus("authenticated");
  }, []);

  const signOut = useCallback(async () => {
    await cognito.signOut();
    clearSession();
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const value = useMemo(
    () => ({ user, status, signIn, signOut }),
    [user, status, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
