"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CheckInPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!phone.trim()) {
      setError("Please enter your phone number.");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();

      if (data.status === "new") {
        router.push(`/checkin/new?phone=${encodeURIComponent(data.phone)}`);
      } else if (data.status === "checkedIn") {
        router.push(`/checkin/success?name=${encodeURIComponent(data.name)}`);
      } else if (data.status === "duplicate") {
        setError(`${data.name}, you're already checked in today!`);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">✝</div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome!</h1>
          <p className="text-gray-500 mt-2">Check in for today&apos;s service</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 555-123-4567"
              className="w-full text-xl px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-center tracking-widest"
              required
              autoFocus
            />
          </div>

          {error && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white text-lg font-semibold py-4 rounded-xl hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Checking in…" : "Check In"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-8">
          First time? We&apos;ll set up your profile in seconds.
        </p>
      </div>
    </main>
  );
}
