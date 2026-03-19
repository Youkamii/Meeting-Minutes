import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  sidebarCollapsed: boolean;
  meetingModeActive: boolean;
  toggleSidebar: () => void;
  toggleMeetingMode: () => void;
  setMeetingMode: (active: boolean) => void;
  // Search highlight: scroll to & red-border a specific card
  searchHighlightId: string | null;
  setSearchHighlightId: (id: string | null) => void;
  // Search filter: dim all cards not matching this text
  searchFilterText: string | null;
  setSearchFilterText: (text: string | null) => void;
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
      searchHighlightId: null,
      setSearchHighlightId: (id) => set({ searchHighlightId: id }),
      searchFilterText: null,
      setSearchFilterText: (text) => set({ searchFilterText: text }),
    }),
    {
      name: "meeting-minutes-ui",
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    },
  ),
);
