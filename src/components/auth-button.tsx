"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { LogIn, LogOut, User } from "lucide-react";
import Image from "next/image";

export function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="h-10 w-24 animate-pulse rounded-lg bg-gray-200"></div>
    );
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {session.user.image ? (
            <Image
              src={session.user.image}
              alt={session.user.name || "User"}
              width={32}
              height={32}
              className="h-8 w-8 rounded-full"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100/80 backdrop-blur-sm">
              <User className="h-4 w-4 text-emerald-700" />
            </div>
          )}
          <span className="hidden text-sm font-medium text-gray-900 sm:block">
            {session.user.name || session.user.email}
          </span>
        </div>
        <button
          onClick={() => signOut()}
          className="flex items-center gap-2 rounded-full border border-white/40 bg-white/60 px-3 py-2 text-sm font-medium text-gray-700 shadow-md backdrop-blur-xl transition-all hover:bg-white/80 hover:shadow-lg"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn()}
      className="flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-600/30"
    >
      <LogIn className="h-4 w-4" />
      Sign In
    </button>
  );
}
