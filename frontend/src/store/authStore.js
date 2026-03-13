import { create } from 'zustand'

export const useAuthStore = create(set => ({
  user:        JSON.parse(localStorage.getItem('user')        || 'null'),
  token:       localStorage.getItem('token')                  || null,
  currentTree: JSON.parse(localStorage.getItem('currentTree') || 'null'),

  login: (user, token) => {
    localStorage.setItem('user',  JSON.stringify(user))
    localStorage.setItem('token', token)
    set({ user, token })
  },
  logout: () => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    localStorage.removeItem('currentTree')
    set({ user: null, token: null, currentTree: null })
  },
  setCurrentTree: (tree) => {
    localStorage.setItem('currentTree', JSON.stringify(tree))
    set({ currentTree: tree })
  },
  clearTree: () => {
    localStorage.removeItem('currentTree')
    set({ currentTree: null })
  }
}))