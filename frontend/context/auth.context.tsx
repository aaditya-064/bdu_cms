"use client";
import { createContext } from "react";
import type { User, LoginInput } from "@/types/auth.types";
export type AuthStatus = "loading" | "authenticated" | "anonymous" | "error";
export type AuthContextValue = {
  user: User | null;
  status: AuthStatus;
  error: string | null;
  refresh: () => Promise<void>;
  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
};
export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);
