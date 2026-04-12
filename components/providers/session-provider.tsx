"use client";

import { createContext, useContext } from "react";
import type { JwtPayload } from "@/lib/auth/jwt";

const SessionContext = createContext<JwtPayload | null>(null);

export function SessionProvider({
  session,
  children,
}: {
  session: JwtPayload;
  children: React.ReactNode;
}) {
  return (
    <SessionContext.Provider value={session}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): JwtPayload {
  const session = useContext(SessionContext);
  if (!session) throw new Error("useSession must be used within SessionProvider");
  return session;
}
