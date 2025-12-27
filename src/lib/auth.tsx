
"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

// Mock User and Auth objects
type User = {
  email: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, pass:string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const normalize = (s?: string) => String(s || '').trim();

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Simulate checking auth state from sessionStorage
    const sessionUser = sessionStorage.getItem("woody-business-admin-user");
    if (sessionUser) {
      setUser(JSON.parse(sessionUser));
    }
    setLoading(false);
  }, []);

  const signIn = useCallback(async (email: string, pass: string) => {
    setLoading(true);
    const adminEmail = normalize(process.env.NEXT_PUBLIC_ADMIN_EMAIL);
    const adminPassword = normalize(process.env.NEXT_PUBLIC_ADMIN_PASSWORD);
    const inputEmail = normalize(email).toLowerCase();
    const inputPassword = normalize(pass);
    
    if (adminEmail && adminPassword && inputEmail === adminEmail.toLowerCase() && inputPassword === adminPassword) {
      const loggedUser = { email: adminEmail };
      sessionStorage.setItem("woody-business-admin-user", JSON.stringify(loggedUser));
      setUser(loggedUser);
      setLoading(false);
    } else {
      setLoading(false);
      throw new Error("Invalid credentials");
    }
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    sessionStorage.removeItem("woody-business-admin-user");
    setUser(null);
    setLoading(false);
    router.push("/wb-admin/login");
    toast({ title: "Logged Out", description: "You have been successfully signed out." });
  }, [router, toast]);

  const value = { user, loading, signIn, signOut };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
