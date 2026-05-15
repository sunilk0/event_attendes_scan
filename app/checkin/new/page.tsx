"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone") ?? "";

  const [name, setName] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [gender, setGender] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ageGroup || !gender) {
      setError("Please select your age group and gender.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/checkin/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, name, ageGroup, gender }),
      });
      const data = await res.json();

      if (data.status === "checkedIn" || data.status === "duplicate") {
        router.push(`/checkin/success?name=${encodeURIComponent(data.name)}&isNew=1`);
      } else {
        setError(data.error ?? "Something went wrong.");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">👋</div>
          <h1 className="text-2xl font-bold text-gray-900">Nice to meet you!</h1>
          <p className="text-gray-500 mt-1 text-sm">Just a few details to get you set up</p>
          <p className="text-gray-400 text-xs mt-1">{phone}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Age Group</label>
            <div className="grid grid-cols-2 gap-2">
              {(["CHILD", "YOUTH", "ADULT", "SENIOR"] as const).map((ag) => (
                <button
                  key={ag}
                  type="button"
                  onClick={() => setAgeGroup(ag)}
                  className={`py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                    ageGroup === ag
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {ag.charAt(0) + ag.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
            <div className="grid grid-cols-3 gap-2">
              {(["MALE", "FEMALE", "OTHER"] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  className={`py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                    gender === g
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {g.charAt(0) + g.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !name.trim() || !ageGroup || !gender}
            className="w-full bg-green-600 text-white text-lg font-semibold py-4 rounded-xl hover:bg-green-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Registering…" : "Complete Check-in"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function NewMemberPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}>
      <RegisterForm />
    </Suspense>
  );
}
