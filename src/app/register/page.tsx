"use client";

import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await register(username, email, password, inviteCode || undefined);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-[400px]">
        <div className="bg-white border border-[#ccc] rounded-lg p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-[#1a1a1b]">Sign Up</h1>
            <p className="text-sm text-[#878a8c] mt-1">
              By continuing, you agree to our User Agreement and acknowledge our Privacy Policy.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-md p-3">
                {error}
              </div>
            )}

            <div>
              <input
                type="text"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field"
                required
                minLength={3}
                maxLength={20}
              />
              <p className="text-xs text-[#878a8c] mt-1">3-20 characters. Letters, numbers, underscores only.</p>
            </div>

            <div>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                required
              />
            </div>

            <div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                required
                minLength={6}
              />
              <p className="text-xs text-[#878a8c] mt-1">At least 6 characters.</p>
            </div>

            <div>
              <input
                type="text"
                placeholder="Invite Code (required)"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="input-field"
                required
              />
              <p className="text-xs text-[#878a8c] mt-1">Enter the invite code you received from an existing member.</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-2.5 text-sm disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Sign Up"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <span className="text-sm text-[#878a8c]">
              Already a Saiditor?{" "}
              <Link href="/login" className="text-[#0079d3] hover:underline">
                Log In
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
