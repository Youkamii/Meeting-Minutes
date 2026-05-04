import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface VersionUnlockState {
  unlocked: boolean;
  setUnlocked: (v: boolean) => void;
}

export const useVersionUnlockStore = create<VersionUnlockState>()(
  persist(
    (set) => ({
      unlocked: false,
      setUnlocked: (v) => set({ unlocked: v }),
    }),
    {
      name: "version-unlock",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
