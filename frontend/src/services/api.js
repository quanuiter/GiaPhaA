import axios from 'axios'

const api = axios.create({ baseURL: 'http://localhost:3001/api' })

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('currentTree')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const treeApi = (treeId) => ({
  // Members
  members:       (path = '')    => api.get(`/trees/${treeId}/members${path}`),
  member:        (id)           => api.get(`/trees/${treeId}/members/${id}`),
  createMember:  (data)         => api.post(`/trees/${treeId}/members`, data),
  updateMember:  (id, data)     => api.put(`/trees/${treeId}/members/${id}`, data),
  deleteMember:  (id)           => api.delete(`/trees/${treeId}/members/${id}`),
  recordDeath:   (id, data)     => api.post(`/trees/${treeId}/members/${id}/death`, data),

  // Marriages
  marriages:        ()          => api.get(`/trees/${treeId}/marriages`),
  memberMarriages:  (memberId)  => api.get(`/trees/${treeId}/marriages?memberId=${memberId}`),
  createMarriage:   (data)      => api.post(`/trees/${treeId}/marriages`, data),
  updateMarriage:   (id, data)  => api.put(`/trees/${treeId}/marriages/${id}`, data),
  deleteMarriage:   (id)        => api.delete(`/trees/${treeId}/marriages/${id}`),

  // Achievements
  achievements:       (memberId)       => api.get(`/trees/${treeId}/members/${memberId}/achievements`),
  createAchievement:  (memberId, data) => api.post(`/trees/${treeId}/members/${memberId}/achievements`, data),
  updateAchievement:  (memberId, id, data) => api.put(`/trees/${treeId}/members/${memberId}/achievements/${id}`, data),
  deleteAchievement:  (memberId, id)   => api.delete(`/trees/${treeId}/members/${memberId}/achievements/${id}`),

  // Events & Tree view
  events:       (query = '')    => api.get(`/trees/${treeId}/events${query}`),
  createEvent:  (data)          => api.post(`/trees/${treeId}/events`, data),
  updateEvent:  (id, data)      => api.put(`/trees/${treeId}/events/${id}`, data),
  deleteEvent:  (id)            => api.delete(`/trees/${treeId}/events/${id}`),
  treeData:     ()              => api.get(`/trees/${treeId}/tree`),
})

export default api