import { create } from "zustand";
import type { User } from "@supabase/supabase-js";
import type { UserRow } from "@/types/database";

interface AuthStore {
  user: User | null;
  profile: UserRow | null;
  setUser: (user: User | null) => void;
  setProfile: (profile: UserRow | null) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  profile: null,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  clear: () => set({ user: null, profile: null }),
}));
