import { Platform } from "react-native";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ApiRequestError, api, setAuthToken } from "./api";

type AuthContextValue = {
  token: string | null;
  user: { id: string; name: string; email: string; role: string } | null;
  loading: boolean;
  authenticate: (token: string, user: { id: string; name: string; email: string; role: string }) => Promise<void>;
  updateUser: (user: { id: string; name: string; email: string; role: string }) => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const TOKEN_KEY = "student-events-session";

async function readToken() {
  if (Platform.OS === "web") return globalThis.localStorage.getItem(TOKEN_KEY);
  const SecureStore = await import("expo-secure-store");
  return SecureStore.getItemAsync(TOKEN_KEY);
}

async function writeToken(token: string) {
  if (Platform.OS === "web") { globalThis.localStorage.setItem(TOKEN_KEY, token); return; }
  const SecureStore = await import("expo-secure-store");
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

async function removeToken() {
  if (Platform.OS === "web") { globalThis.localStorage.removeItem(TOKEN_KEY); return; }
  const SecureStore = await import("expo-secure-store");
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthContextValue["user"]>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void (async () => {
      let savedToken: string | null = null;
      try {
        savedToken = await readToken();
        if (!savedToken) return;
        setAuthToken(savedToken);
        const currentUser = await api.me();
        if (active) { setToken(savedToken); setUser(currentUser); }
      } catch (error) {
        if (error instanceof ApiRequestError && (error.code === "SESSION_EXPIRED" || error.code === "AUTH_REQUIRED")) {
          setAuthToken(null);
          await removeToken().catch(() => undefined);
        } else if (active) {
          // Keep a valid-looking local session during temporary network outages.
          setToken(savedToken);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    token,
    user,
    loading,
    async authenticate(nextToken, nextUser) {
      await writeToken(nextToken);
      setAuthToken(nextToken);
      setToken(nextToken);
      setUser(nextUser);
    },
    updateUser(nextUser) { setUser(nextUser); },
    async signOut() {
      try { await api.logout(); } catch { /* Clear local credentials even if offline. */ }
      try { await removeToken(); } finally {
        setAuthToken(null);
        setToken(null);
        setUser(null);
      }
    },
  }), [token, user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
