"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowRightIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/hooks/auth.hook";
import { register as registerAccount } from "@/api/auth.api";
import { BrandMark } from "@/components/layout/brand";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { errorMessage } from "@/utils/api-error";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const { login, status } = useAuth();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const registering = mode === "register";
  useEffect(() => {
    if (status === "authenticated") router.replace("/dashboard");
  }, [status, router]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    setError(null);
    setPending(true);
    try {
      if (registering) {
        const full_name = String(data.get("full_name") ?? "").trim();
        if (full_name.length < 3)
          throw new Error("Please enter a name of at least 3 characters.");
        if (password !== data.get("confirm_password"))
          throw new Error("The passwords do not match.");
        await registerAccount({
          full_name,
          email,
          password,
          phone: String(data.get("phone") ?? "").trim(),
        });
        setCreated(true);
      } else {
        await login({ email, password });
        router.replace("/dashboard");
      }
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setPending(false);
    }
  }
  return (
    <main className="grid min-h-dvh lg:grid-cols-[0.9fr_1.1fr]">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-navy px-14 py-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <BrandMark />
          <span className="text-sm font-semibold">Buddha Dana Udhyog</span>
        </div>
        <div className="relative z-10 max-w-md">
          <p className="text-xs tracking-[0.2em] text-[#a9d8bc] uppercase">
            Company management
          </p>
          <h1 className="mt-5 text-4xl leading-tight font-medium tracking-tight">
            An organised workspace.
            <br />A clearer working day.
          </h1>
          <p className="mt-6 max-w-sm text-sm leading-7 text-navy-muted">
            Your team, company documents and essential information in one place.
          </p>
        </div>
        <p className="text-xs text-navy-muted">
          Buddha Dana Udhyog · Management workspace
        </p>
        <div
          aria-hidden="true"
          className="absolute -right-48 bottom-16 size-[480px] rounded-full border border-white/5"
        />
      </section>
      <section className="flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <BrandMark />
            <span className="text-sm font-semibold">Buddha Dana Udhyog</span>
          </div>
          <p className="text-[10px] font-semibold tracking-widest text-primary uppercase">
            Welcome{registering ? " to the workspace" : " back"}
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">
            {registering ? "Create your account" : "Sign in to your workspace"}
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            {registering
              ? "Enter your details to create an account."
              : "Use your company account to continue."}
          </p>
          {created ? (
            <div className="mt-7 space-y-5">
              <Notice success>
                Your account has been created. You can now sign in.
              </Notice>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary"
              >
                Go to sign in
                <ArrowRightIcon className="size-4" />
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} aria-busy={pending} className="mt-8">
              <fieldset disabled={pending} className="space-y-5">
                {error && <Notice>{error}</Notice>}
                {registering && (
                  <Input
                    id="full_name"
                    name="full_name"
                    label="Full name"
                    autoComplete="name"
                    required
                    minLength={3}
                    maxLength={120}
                  />
                )}
                <Input
                  id="email"
                  name="email"
                  label="Email address"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                />
                {registering && (
                  <Input
                    id="phone"
                    name="phone"
                    label="Phone number"
                    type="tel"
                    autoComplete="tel"
                    required
                    pattern="[0-9]{10}"
                    maxLength={10}
                    hint="Enter your 10-digit phone number."
                  />
                )}
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={
                      registering ? "new-password" : "current-password"
                    }
                    required
                    minLength={registering ? 8 : undefined}
                    className="pr-12"
                  />
                  <button
                    type="button"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-9 right-3 rounded text-muted"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="size-5" />
                    ) : (
                      <EyeIcon className="size-5" />
                    )}
                  </button>
                </div>
                {registering && (
                  <Input
                    id="confirm_password"
                    name="confirm_password"
                    label="Confirm password"
                    type="password"
                    autoComplete="new-password"
                    required
                  />
                )}
                <Button type="submit" pending={pending} className="w-full">
                  {registering ? "Create account" : "Sign in"}
                  <ArrowRightIcon className="size-4" />
                </Button>
                {/* <p className="text-center text-xs leading-6 text-muted">
                  {registering
                    ? "Already have an account?"
                    : "Need an account?"}{" "}
                  <Link
                    href={registering ? "/login" : "/registerrr"}
                    className="font-semibold text-primary hover:underline"
                  >
                    {registering ? "Sign in" : "Create account"}
                  </Link>
                </p> */}
              </fieldset>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
