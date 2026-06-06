import { create } from 'zustand'

interface ModalState {
  isOpen: boolean
  type: string | null
  data?: unknown
}

interface UIState {
  globalLoading: boolean
  modal: ModalState
  notifications: number
  setGlobalLoading: (loading: boolean) => void
  openModal: (type: string, data?: unknown) => void
  closeModal: () => void
  setNotifications: (count: number) => void
  incrementNotifications: () => void
}

export const useUIStore = create<UIState>((set) => ({
  globalLoading: false,
  modal: { isOpen: false, type: null },
  notifications: 0,

  setGlobalLoading: (loading) => set({ globalLoading: loading }),

  openModal: (type, data) =>
    set({ modal: { isOpen: true, type, data } }),

  closeModal: () =>
    set({ modal: { isOpen: false, type: null, data: undefined } }),

  setNotifications: (count) => set({ notifications: count }),

  incrementNotifications: () =>
    set((state) => ({ notifications: state.notifications + 1 })),
}))
