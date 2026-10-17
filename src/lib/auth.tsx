import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export interface StaffSession {
  staffId: string;
  name: string;
  role: string;
  office: string;
  signedInAt: string;
}

const STORAGE_KEY = "govverify.session";

/** Prototype credentials — no real directory service is contacted. */
export const DEMO_CREDENTIALS = { staffId: "GV-1042", password: "verify@2026" };

const STAFF_DIRECTORY: Record<string, Omit<StaffSession, "signedInAt" | "staffId">> = {
  "GV-1042": {
    name: "R. Sharma",
    role: "Verification Officer",
    office: "District Identity Verification Office",
  },
};

interface AuthContextValue {
  session: StaffSession | null;
  ready: boolean;
  signIn: (staffId: string, password: string) => { ok: boolean; error?: string };
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<StaffSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setSession(JSON.parse(raw) as StaffSession);
    } catch {
      /* ignore malformed session */
    }
    setReady(true);
  }, []);

  const signIn = useCallback((staffId: string, password: string) => {
    const id = staffId.trim().toUpperCase();
    if (!id || !password) return { ok: false, error: "Staff ID and password are required." };
    if (id !== DEMO_CREDENTIALS.staffId || password !== DEMO_CREDENTIALS.password) {
      return { ok: false, error: "Invalid staff credentials for this prototype environment." };
    }
    const profile = STAFF_DIRECTORY[id]!;
    const next: StaffSession = { staffId: id, signedInAt: new Date().toISOString(), ...profile };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSession(next);
    return { ok: true };
  }, []);

  const signOut = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({ session, ready, signIn, signOut }),
    [session, ready, signIn, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

const FALLBACK_AUTH_CONTEXT: AuthContextValue = {
  session: null,
  ready: false,
  signIn: () => ({ ok: false, error: "Authentication system is initializing." }),
  signOut: () => {},
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  return ctx ?? FALLBACK_AUTH_CONTEXT;
}
