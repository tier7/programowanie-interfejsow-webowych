"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, isFirebaseConfigured } from "@/lib/firebase";

const AuthContext = createContext({
  user: null,
  loading: true
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(function () {
    if (!isFirebaseConfigured() || !auth) {
      setUser(null);
      setLoading(false);
      return undefined;
    }

    let resolved = false;

    const timeoutId = setTimeout(function () {
      if (!resolved) {
        console.error("Auth timeout");
        setUser(null);
        setLoading(false);
      }
    }, 5000);

    const unsubscribe = onAuthStateChanged(
      auth,
      function (nextUser) {
        resolved = true;
        clearTimeout(timeoutId);
        setUser(nextUser);
        setLoading(false);
      },
      function (error) {
        resolved = true;
        clearTimeout(timeoutId);
        console.error("Auth error:", error);
        setUser(null);
        setLoading(false);
      }
    );

    return function () {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  const value = useMemo(
    function () {
      return {
        user,
        loading
      };
    },
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}