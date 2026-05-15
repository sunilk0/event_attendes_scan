"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const name = searchParams.get("name") ?? "Friend";
  const isNew = searchParams.get("isNew") === "1";
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <div className="text-7xl mb-6">🎉</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {isNew ? `Welcome, ${name}!` : `Good to see you, ${name}!`}
        </h1>
        <p className="text-gray-500 text-lg mb-1">You&apos;re checked in</p>
        <p className="text-gray-400 text-sm mb-10">{today}</p>

        {isNew && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-6 text-green-700 text-sm">
            Your profile has been created. Welcome to the fellowship!
          </div>
        )}

        <Link
          href="/"
          className="inline-block w-full bg-blue-600 text-white text-base font-semibold py-3 rounded-xl hover:bg-blue-700 transition-all"
        >
          Back to Check-in
        </Link>
      </div>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}>
      <SuccessContent />
    </Suspense>
  );
}
