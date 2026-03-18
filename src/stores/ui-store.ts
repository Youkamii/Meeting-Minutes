import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  sidebarCollapsed: boolean;
  meetingModeActive: boolean;
  toggleSidebar: () => void;
  toggleMeetingMode: () => void;
  setMeetingMode: (active: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      meetingModeActive: false,
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      toggleMeetingMode: () =>
        set((state) => ({ meetingModeActive: !state.meetingModeActive })),
      setMeetingMode: (active) => set({ meetingModeActive: active }),
    }),
    {
      name: "meeting-minutes-ui",
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    },
  ),
);
