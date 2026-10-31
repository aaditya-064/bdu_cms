"use client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AuthContext, type AuthStatus } from "@/context/auth.context";
import * as authApi from "@/api/auth.api";
import type { User, LoginInput } from "@/types/auth.types";
import { errorMessage, isSessionError, ApiError } from "@/utils/api-error";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  // A response from an earlier session must never restore an account after logout.
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    const ticket = ++generation.current;
    try {
      const profile = await authApi.getProfile();
      if (ticket !== generation.current) return;
      setUser(profile);
      setStatus("authenticated");
      setError(null);
    } catch (failure) {
      if (ticket !== generation.current) return;
      setUser(null);
      if (isSessionError(failure)) {
        setStatus("anonymous");
        setError(null);
      } else {
        setStatus("error");
        setError(errorMessage(failure));
      }
    }
  }, []);
  useEffect(() => {
    let active = true;
    const ticket = ++generation.current;
    authApi
      .getProfile()
      .then((profile) => {
        if (active && ticket === generation.current) {
          setUser(profile);
          setStatus("authenticated");
          setError(null);
        }
      })
      .catch((failure: unknown) => {
        if (active && ticket === generation.current) {
          setStatus(isSessionError(failure) ? "anonymous" : "error");
          setError(isSessionError(failure) ? null : errorMessage(failure));
        }
      });
    const expire = () => {
      generation.current++;
      setUser(null);
      setStatus("anonymous");
      setError(null);
    };
    window.addEventListener("session-expired", expire);
    return () => {
      active = false;
      window.removeEventListener("session-expired", expire);
    };
  }, []);
  useEffect(() => {
    if (status !== "authenticated") return;
    const revalidate = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    window.addEventListener("focus", revalidate);
    return () => window.removeEventListener("focus", revalidate);
  }, [status, refresh]);
  async function login(input: LoginInput) {
    const ticket = ++generation.current;
    try {
      const profile = await authApi.login(input);
      if (ticket !== generation.current) return;
      setUser(profile);
      setStatus("authenticated");
      setError(null);
    } catch (failure) {
      if (isSessionError(failure))
        throw new ApiError(
          "Sign-in could not establish a session. Please allow cookies and try again.",
        );
      throw failure;
    }
  }
  async function logout() {
    generation.current++;
    await authApi.logout();
    generation.current++;
    setUser(null);
    setStatus("anonymous");
    setError(null);
  }
  return (
    <AuthContext.Provider
      value={{ user, status, error, refresh, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
