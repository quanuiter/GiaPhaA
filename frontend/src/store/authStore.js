import { create } from 'zustand'

export const useAuthStore = create(set => ({
  user:        JSON.parse(localStorage.getItem('user')        || 'null'),
  token:       localStorage.getItem('token')                  || null,
  currentTree: JSON.parse(localStorage.getItem('currentTree') || 'null'),
  userRole:    localStorage.getItem('userRole')              || null,

  login: (user, token) => {
    localStorage.setItem('user',  JSON.stringify(user))
    localStorage.setItem('token', token)
    set({ user, token })
  },
  logout: () => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    localStorage.removeItem('currentTree')
    localStorage.removeItem('userRole')
    set({ user: null, token: null, currentTree: null, userRole: null })
  },
  setCurrentTree: (tree) => {
    localStorage.setItem('currentTree', JSON.stringify(tree))
    // Store the user's role for this tree
    if (tree?.myRole) {
      localStorage.setItem('userRole', tree.myRole)
    }
    set({ currentTree: tree, userRole: tree?.myRole || null })
  },
  setUserRole: (role) => {
    localStorage.setItem('userRole', role)
    set({ userRole: role })
  },
  clearTree: () => {
    localStorage.removeItem('currentTree')
    localStorage.removeItem('userRole')
    set({ currentTree: null, userRole: null })
  }
}))
