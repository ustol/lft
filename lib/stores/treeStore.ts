import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface TreeStore {
  selectedPersonId: string | null;
  isAddingPerson: boolean;
  pendingRelationshipFrom: string | null;
  highlightedIds: Set<string>;
  layoutDirection: "TB" | "LR";

  setSelectedPerson: (id: string | null) => void;
  setIsAddingPerson: (v: boolean) => void;
  setPendingRelationshipFrom: (id: string | null) => void;
  highlightPath: (ids: string[]) => void;
  clearHighlight: () => void;
  toggleLayoutDirection: () => void;
}

export const useTreeStore = create<TreeStore>()(
  devtools(
    (set) => ({
      selectedPersonId: null,
      isAddingPerson: false,
      pendingRelationshipFrom: null,
      highlightedIds: new Set(),
      layoutDirection: "TB",

      setSelectedPerson: (id) => set({ selectedPersonId: id }),
      setIsAddingPerson: (v) => set({ isAddingPerson: v }),
      setPendingRelationshipFrom: (id) =>
        set({ pendingRelationshipFrom: id }),
      highlightPath: (ids) => set({ highlightedIds: new Set(ids) }),
      clearHighlight: () => set({ highlightedIds: new Set() }),
      toggleLayoutDirection: () =>
        set((s) => ({
          layoutDirection: s.layoutDirection === "TB" ? "LR" : "TB",
        })),
    }),
    { name: "lft-tree" }
  )
);
