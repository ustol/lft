import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

interface UIStore {
  theme: "light" | "dark" | "system";
  sidebarCollapsed: boolean;
  personModalId: string | null;

  setTheme: (theme: "light" | "dark" | "system") => void;
  setSidebarCollapsed: (v: boolean) => void;
  openPersonModal: (id: string) => void;
  closePersonModal: () => void;
}

export const useUIStore = create<UIStore>()(
  devtools(
    persist(
      (set) => ({
        theme: "system",
        sidebarCollapsed: false,
        personModalId: null,

        setTheme: (theme) => set({ theme }),
        setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
        openPersonModal: (id) => set({ personModalId: id }),
        closePersonModal: () => set({ personModalId: null }),
      }),
      { name: "lft-ui", partialize: (s) => ({ theme: s.theme, sidebarCollapsed: s.sidebarCollapsed }) }
    ),
    { name: "lft-ui" }
  )
);
