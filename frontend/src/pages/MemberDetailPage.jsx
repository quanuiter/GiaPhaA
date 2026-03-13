import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { treeApi } from '../services/api'
import toast from 'react-hot-toast'
import { useState } from 'react'

// ── Dữ liệu tĩnh ──────────────────────────────────────────────
const CAUSE_OPTIONS = [
  ['natural','Bệnh tự nhiên'], ['accident_traffic','Tai nạn giao thông'],
  ['accident_work','Tai nạn lao động'], ['critical_illness','Bệnh hiểm nghèo'],
  ['old_age','Tuổi già'], ['sudden_death','Đột tử'],
  ['natural_disaster','Thiên tai'], ['epidemic','Dịch bệnh'],
  ['surgery','Phẫu thuật'], ['war','Chiến tranh'],
  ['poisoning','Ngộ độc'], ['other','Khác'],
]
const BURIAL_OPTIONS = [
  ['cemetery','Nghĩa trang'], ['temple','Chùa / Nhà thờ'], ['home','Tại gia'],
]
const ACHIEVE_TYPES = [
  ['education','Học tập'], ['sport','Thể thao'], ['art','Nghệ thuật'],
  ['science','Khoa học'], ['business','Kinh doanh'], ['social','Cống hiến xã hội'],
  ['military','Quân sự'], ['medical','Y tế'], ['teaching','Giáo dục'], ['other','Khác'],
]
const ACHIEVE_LEVELS = [
  ['local','Cơ sở'], ['province','Tỉnh / Thành phố'], ['national','Quốc gia'],
]
const MARRIAGE_STATUS = [
  ['living','Đang sống chung'], ['divorced','Ly hôn'], ['widowed','Góa'],
]

const causeLabel  = Object.fromEntries(CAUSE_OPTIONS)
const burialLabel = Object.fromEntries(BURIAL_OPTIONS)
const typeLabel   = Object.fromEntries(ACHIEVE_TYPES)
const levelLabel  = Object.fromEntries(ACHIEVE_LEVELS)

export default function MemberDetailPage() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const qc         = useQueryClient()
  const { currentTree } = useAuthStore()
  const api        = treeApi(currentTree?.id)
  const myRole     = currentTree?.myRole
  const canEdit    = ['admin','editor'].includes(myRole)
  const isAdmin    = myRole === 'admin'

  const [activeTab, setActiveTab]         = useState('info')
  const [showDeathForm, setShowDeathForm] = useState(false)
  const [showMarriageForm, setShowMarriageForm] = useState(false)
  const [showAchieveForm,  setShowAchieveForm]  = useState(false)
  const [editingMarriage,  setEditingMarriage]  = useState(null)
  const [editingAchieve,   setEditingAchieve]   = useState(null)

  const [deathForm, setDeathForm] = useState({
    deathDate: '', cause: 'natural', burialPlace: 'cemetery', note: ''
  })
  const [marriageForm, setMarriageForm] = useState({
    spouseId: '', marriageDate: '', status: 'living', divorceDate: '', note: ''
  })
  const [achieveForm, setAchieveForm] = useState({
    type: 'education', level: 'local', year: new Date().getFullYear(), description: '', issuedBy: ''
  })

  // ── Queries ──────────────────────────────────────────────────
  const { data: m, isLoading } = useQuery({
    queryKey: ['member', currentTree?.id, id],
    queryFn:  () => api.member(id).then(r => r.data),
    enabled:  !!currentTree?.id,
  })
  const { data: achievements = [] } = useQuery({
    queryKey: ['achievements', currentTree?.id, id],
    queryFn:  () => api.achievements(id).then(r => r.data),
    enabled:  !!currentTree?.id && !!id,
  })
  const { data: allMembers = [] } = useQuery({
    queryKey: ['members', currentTree?.id],
    queryFn:  () => api.members().then(r => r.data),
    enabled:  !!currentTree?.id,
  })

  // ── Mutations ─────────────────────────────────────────────────
  const deathMutation = useMutation({
    mutationFn: data => api.recordDeath(id, data),
    onSuccess: () => {
      toast.success('Đã ghi nhận mất')
      qc.invalidateQueries(['member', currentTree?.id, id])
      qc.invalidateQueries(['members', currentTree?.id])
      setShowDeathForm(false)
    },
    onError: err => toast.error(err.response?.data?.message || 'Lỗi')
  })

  const createMarriageMutation = useMutation({
    mutationFn: data => api.createMarriage(data),
    onSuccess: () => {
      toast.success('Đã thêm hôn nhân')
      qc.invalidateQueries(['member', currentTree?.id, id])
      setShowMarriageForm(false)
      setMarriageForm({ spouseId: '', marriageDate: '', status: 'living', divorceDate: '', note: '' })
    },
    onError: err => toast.error(err.response?.data?.message || 'Lỗi')
  })

  const updateMarriageMutation = useMutation({
    mutationFn: ({ mid, data }) => api.updateMarriage(mid, data),
    onSuccess: () => {
      toast.success('Đã cập nhật hôn nhân')
      qc.invalidateQueries(['member', currentTree?.id, id])
      setEditingMarriage(null)
    },
    onError: err => toast.error(err.response?.data?.message || 'Lỗi')
  })

  const deleteMarriageMutation = useMutation({
    mutationFn: mid => api.deleteMarriage(mid),
    onSuccess: () => {
      toast.success('Đã xóa hôn nhân')
      qc.invalidateQueries(['member', currentTree?.id, id])
    },
    onError: err => toast.error(err.response?.data?.message || 'Lỗi')
  })

  const createAchieveMutation = useMutation({
    mutationFn: data => api.createAchievement(id, data),
    onSuccess: () => {
      toast.success('Đã thêm thành tích')
      qc.invalidateQueries(['achievements', currentTree?.id, id])
      setShowAchieveForm(false)
      setAchieveForm({ type: 'education', level: 'local', year: new Date().getFullYear(), description: '', issuedBy: '' })
    },
    onError: err => toast.error(err.response?.data?.message || 'Lỗi')
  })

  const updateAchieveMutation = useMutation({
    mutationFn: ({ aid, data }) => api.updateAchievement(id, aid, data),
    onSuccess: () => {
      toast.success('Đã cập nhật thành tích')
      qc.invalidateQueries(['achievements', currentTree?.id, id])
      setEditingAchieve(null)
    },
    onError: err => toast.error(err.response?.data?.message || 'Lỗi')
  })

  const deleteAchieveMutation = useMutation({
    mutationFn: aid => api.deleteAchievement(id, aid),
    onSuccess: () => {
      toast.success('Đã xóa thành tích')
      qc.invalidateQueries(['achievements', currentTree?.id, id])
    },
    onError: err => toast.error(err.response?.data?.message || 'Lỗi')
  })

  // ── Handlers ──────────────────────────────────────────────────
  const handleAddMarriage = () => {
    if (!marriageForm.spouseId) return toast.error('Vui lòng chọn vợ/chồng')
    const spouseMember = allMembers.find(x => String(x.id) === String(marriageForm.spouseId))
    const husbandId = m.gender === 'male'   ? m.id : +marriageForm.spouseId
    const wifeId    = m.gender === 'female' ? m.id : +marriageForm.spouseId
    createMarriageMutation.mutate({
      husbandId, wifeId,
      marriageDate: marriageForm.marriageDate || null,
      status: 'living', note: marriageForm.note
    })
  }

  // ── Guards ────────────────────────────────────────────────────
  if (!currentTree) return (
    <div className="flex items-center justify-center h-64 text-gray-400">Chưa chọn cây</div>
  )
  if (isLoading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"/>
    </div>
  )
  if (!m) return (
    <div className="text-center py-20 text-gray-400">Không tìm thấy thành viên</div>
  )

  const marriages = [
    ...(m.marriagesAsH || []).map(mar => ({ ...mar, spouse: mar.wife })),
    ...(m.marriagesAsW || []).map(mar => ({ ...mar, spouse: mar.husband })),
  ].sort((a, b) => new Date(a.marriageDate || 0) - new Date(b.marriageDate || 0))

  const potentialSpouses = m.gender === 'male'
    ? allMembers.filter(x => x.gender === 'female' && x.id !== m.id)
    : allMembers.filter(x => x.gender === 'male'   && x.id !== m.id)

  const TABS = [
    { key: 'info',     label: 'Thông tin' },
    { key: 'marriage', label: `Hôn nhân (${marriages.length})` },
    { key: 'achieve',  label: `Thành tích (${achievements.length})` },
    { key: 'children', label: `Con cái (${(m.childrenAsFather?.length||0)+(m.childrenAsMother?.length||0)})` },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)}
            className="p-2 text-amber-900 hover:bg-amber-200 transition-colors rounded-sm" style={{fontFamily: 'Georgia, serif'}}>
            ←
          </button>
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-light
              overflow-hidden flex-shrink-0
              ${m.gender==='male'?'bg-amber-300 text-amber-900':'bg-amber-200 text-amber-800'}`}>
              {m.avatarUrl
                ? <img src={`http://localhost:3001${m.avatarUrl}`} className="w-full h-full object-cover" alt=""/>
                : m.fullName.split(' ').pop()[0]
              }
            </div>
            <div>
              <h2 className="text-2xl font-light text-amber-950" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.05em'}}>{m.fullName}</h2>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className={`text-xs px-2 py-1 font-light
                  ${m.gender==='male'?'bg-amber-300 text-amber-900':'bg-amber-200 text-amber-800'}`}>
                  {m.gender==='male'?'Nam':'Nữ'}
                </span>
                <span className="text-xs bg-amber-300 text-amber-900 px-2 py-1 font-light">
                  Đời {m.generation}
                </span>
                <span className="text-xs text-amber-700 font-light">#{m.id}</span>
                {m.isDeceased
                  ? <span className="text-xs bg-amber-200 text-amber-900 px-2 py-1 font-light">✞ Đã mất</span>
                  : <span className="text-xs bg-amber-300 text-amber-900 px-2 py-1 font-light">• Còn sống</span>
                }
              </div>
            </div>
          </div>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Link to={`/members/${id}/edit`}
              className="px-4 py-2 border-2 border-amber-900 border-opacity-30 text-amber-900
                hover:bg-amber-200 text-sm transition-colors font-light rounded-sm" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.05em'}}>
              Sửa
            </Link>
            {!m.isDeceased && (
              <button onClick={() => setShowDeathForm(true)}
                className="px-4 py-2 bg-amber-900 text-amber-50
                  hover:bg-amber-950 text-sm transition-colors font-light rounded-sm" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.05em'}}>
                Ghi Nhận Mất
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-2 bg-amber-200 bg-opacity-30 rounded-sm p-2 border-2 border-amber-900 border-opacity-20">
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 px-3 text-sm font-light transition-all rounded-sm ${activeTab===tab.key?'bg-amber-900 text-amber-50 shadow-md':'text-amber-900 hover:bg-amber-200 hover:bg-opacity-50'}`}
            style={{fontFamily: 'Georgia, serif', letterSpacing: '0.05em'}}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Thông tin ── */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative bg-gradient-to-b from-amber-100 to-amber-50 rounded-sm border-2 border-amber-900 border-opacity-20 shadow-lg p-6" style={{boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.6)'}}>
            <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-amber-800 opacity-30"></div>
            <h3 className="font-light text-amber-950 pb-3 border-b-2 border-amber-900 border-opacity-20 mb-4" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.08em'}}>Thông Tin Cá Nhân</h3>
            <div className="space-y-3">
              {[
                ['Tên gọi khác', m.nickname],
                ['Ngày sinh',    m.birthDate ? new Date(m.birthDate).toLocaleDateString('vi-VN') : null],
                ['Nơi sinh',     m.birthPlace],
                ['Nghề nghiệp',  m.occupation],
                ['Quê quán',     m.hometown],
                ['Cha',          m.father?.fullName],
                ['Mẹ',           m.mother?.fullName],
              ].filter(([,v]) => v).map(([label, value]) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-amber-800 font-light" style={{fontFamily: 'Georgia, serif'}}>{label}</span>
                  <span className="font-light text-amber-950 text-right" style={{fontFamily: 'Georgia, serif'}}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {m.isDeceased && m.death && (
            <div className="relative bg-gradient-to-b from-amber-100 to-amber-50 rounded-sm border-2 border-amber-900 border-opacity-20 shadow-lg p-6" style={{boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.6)'}}>
              <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-amber-800 opacity-30"></div>
              <h3 className="font-light text-amber-950 pb-3 border-b-2 border-amber-900 border-opacity-20 mb-4" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.08em'}}>Qua Đời</h3>
              <div className="space-y-3">
                {[
                  ['Ngày mất',     new Date(m.death.deathDate).toLocaleDateString('vi-VN')],
                  ['Nguyên nhân',  causeLabel[m.death.cause] || m.death.cause],
                  ['Nơi mai táng', burialLabel[m.death.burialPlace] || m.death.burialPlace],
                  ['Tuổi thọ',     m.death.longevity ? `${m.death.longevity} tuổi` : null],
                  ['Ghi chú',      m.death.note],
                ].filter(([,v]) => v).map(([label, value]) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-amber-800 font-light" style={{fontFamily: 'Georgia, serif'}}>{label}</span>
                    <span className="font-light text-amber-950 text-right" style={{fontFamily: 'Georgia, serif'}}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Hôn nhân ── */}
      {activeTab === 'marriage' && (
        <div className="space-y-6">
          {canEdit && !m.isDeceased && (
            <button onClick={() => setShowMarriageForm(true)}
              className="px-4 py-2.5 bg-amber-900 text-amber-50
                rounded-sm text-sm hover:bg-amber-950 transition-colors font-light" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.05em'}}>
              + Thêm Hôn Nhân
            </button>
          )}

          {marriages.length === 0 && (
            <div className="relative bg-gradient-to-b from-amber-100 to-amber-50 rounded-sm border-2 border-amber-900 border-opacity-20 p-10 text-center shadow-lg" style={{boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.6)'}}>
              <p className="text-amber-700 font-light" style={{fontFamily: 'Georgia, serif'}}>Chưa có hôn nhân nào</p>
            </div>
          )}

          {marriages.map(mar => (
            <div key={mar.id} className="relative bg-gradient-to-b from-amber-100 to-amber-50 rounded-sm border-2 border-amber-900 border-opacity-20 shadow-lg p-6" style={{boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.6)'}}>
              <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-amber-800 opacity-30"></div>
              {editingMarriage?.id === mar.id ? (
                <div className="space-y-4">
                  <p className="font-light text-amber-950" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.08em'}}>Cập Nhật Hôn Nhân Với {mar.spouse?.fullName}</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-light text-amber-900 mb-2 block" style={{fontFamily: 'Georgia, serif'}}>Trạng Thái</label>
                      <select className="w-full border-2 border-amber-900 border-opacity-30 bg-white bg-opacity-70 px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-amber-800 text-amber-950" style={{fontFamily: 'Georgia, serif'}}
                        value={editingMarriage.status}
                        onChange={e => setEditingMarriage(p => ({ ...p, status: e.target.value }))}>
                        {MARRIAGE_STATUS.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                    {editingMarriage.status === 'divorced' && (
                      <div>
                        <label className="text-xs font-light text-amber-900 mb-2 block" style={{fontFamily: 'Georgia, serif'}}>Ngày Ly Hôn</label>
                        <input type="date" className="w-full border-2 border-amber-900 border-opacity-30 bg-white bg-opacity-70 px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-amber-800 text-amber-950" style={{fontFamily: 'Georgia, serif'}}
                          value={editingMarriage.divorceDate || ''}
                          onChange={e => setEditingMarriage(p => ({ ...p, divorceDate: e.target.value }))}/>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-light text-amber-900 mb-2 block" style={{fontFamily: 'Georgia, serif'}}>Ghi Chú</label>
                    <input className="w-full border-2 border-amber-900 border-opacity-30 bg-white bg-opacity-70 px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-amber-800 text-amber-950" style={{fontFamily: 'Georgia, serif'}}
                      value={editingMarriage.note || ''}
                      onChange={e => setEditingMarriage(p => ({ ...p, note: e.target.value }))}/>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => updateMarriageMutation.mutate({
                      mid: mar.id,
                      data: { status: editingMarriage.status, divorceDate: editingMarriage.divorceDate, note: editingMarriage.note }
                    })} className="flex-1 px-3 py-1.5 bg-amber-900 text-amber-50 rounded-sm text-sm hover:bg-amber-950 font-light" style={{fontFamily: 'Georgia, serif'}}>
                      Lưu
                    </button>
                    <button onClick={() => setEditingMarriage(null)}
                      className="flex-1 px-3 py-1.5 border-2 border-amber-900 border-opacity-30 text-amber-900 rounded-sm text-sm hover:bg-amber-200 font-light" style={{fontFamily: 'Georgia, serif'}}>
                      Hủy
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-light text-sm
                    ${mar.spouse?.gender==='male'?'bg-amber-300 text-amber-900':'bg-amber-200 text-amber-800'}`}>
                    {mar.spouse?.fullName?.split(' ').pop()[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link to={`/members/${mar.spouse?.id}`}
                      className="font-light text-amber-950 hover:text-amber-900 transition-colors" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.05em'}}>
                      {mar.spouse?.fullName}
                    </Link>
                    <div className="flex items-center gap-2 mt-1 text-sm text-amber-800 flex-wrap font-light">
                      <span>{MARRIAGE_STATUS.find(([v])=>v===mar.status)?.[1]}</span>
                      {mar.marriageDate && (
                        <span>• Kết hôn: {new Date(mar.marriageDate).toLocaleDateString('vi-VN')}</span>
                      )}
                      {mar.divorceDate && (
                        <span>• Ly hôn: {new Date(mar.divorceDate).toLocaleDateString('vi-VN')}</span>
                      )}
                    </div>
                    {mar.note && <p className="text-xs text-amber-700 mt-1 italic font-light">{mar.note}</p>}
                  </div>
                  {canEdit && (
                    <div className="flex gap-1">
                      <button onClick={() => setEditingMarriage({ id: mar.id, status: mar.status, divorceDate: mar.divorceDate?.slice(0,10)||'', note: mar.note||'' })}
                        className="p-1.5 text-amber-900 hover:bg-amber-200 rounded-sm transition-colors" title="Sửa">
                        S
                      </button>
                      {isAdmin && (
                        <button onClick={() => confirm(`Xóa hôn nhân với ${mar.spouse?.fullName}?`) && deleteMarriageMutation.mutate(mar.id)}
                          className="p-1.5 text-amber-900 hover:bg-amber-200 rounded-sm transition-colors" title="Xóa">
                          X
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Tab: Thành tích ── */}
      {activeTab === 'achieve' && (
        <div className="space-y-6">
          {canEdit && (
            <button onClick={() => setShowAchieveForm(true)}
              className="px-4 py-2.5 bg-amber-900 text-amber-50
                rounded-sm text-sm hover:bg-amber-950 transition-colors font-light" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.05em'}}>
              + Thêm Thành Tích
            </button>
          )}

          {achievements.length === 0 && (
            <div className="relative bg-gradient-to-b from-amber-100 to-amber-50 rounded-sm border-2 border-amber-900 border-opacity-20 p-10 text-center shadow-lg" style={{boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.6)'}}>
              <p className="text-amber-700 font-light" style={{fontFamily: 'Georgia, serif'}}>Chưa có thành tích nào</p>
            </div>
          )}

          {achievements.map(a => (
            <div key={a.id} className="relative bg-gradient-to-b from-amber-100 to-amber-50 rounded-sm border-2 border-amber-900 border-opacity-20 shadow-lg p-6" style={{boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.6)'}}>
              <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-amber-800 opacity-30"></div>
              {editingAchieve?.id === a.id ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-light text-amber-900 mb-2 block" style={{fontFamily: 'Georgia, serif'}}>Loại</label>
                      <select className="w-full border-2 border-amber-900 border-opacity-30 bg-white bg-opacity-70 px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-amber-800 text-amber-950" style={{fontFamily: 'Georgia, serif'}}
                        value={editingAchieve.type}
                        onChange={e => setEditingAchieve(p => ({ ...p, type: e.target.value }))}>
                        {ACHIEVE_TYPES.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-light text-amber-900 mb-2 block" style={{fontFamily: 'Georgia, serif'}}>Cấp Độ</label>
                      <select className="w-full border-2 border-amber-900 border-opacity-30 bg-white bg-opacity-70 px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-amber-800 text-amber-950" style={{fontFamily: 'Georgia, serif'}}
                        value={editingAchieve.level}
                        onChange={e => setEditingAchieve(p => ({ ...p, level: e.target.value }))}>
                        {ACHIEVE_LEVELS.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-light text-amber-900 mb-2 block" style={{fontFamily: 'Georgia, serif'}}>Năm</label>
                      <input type="number" className="w-full border-2 border-amber-900 border-opacity-30 bg-white bg-opacity-70 px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-amber-800 text-amber-950" style={{fontFamily: 'Georgia, serif'}}
                        value={editingAchieve.year}
                        onChange={e => setEditingAchieve(p => ({ ...p, year: e.target.value }))}/>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-light text-amber-900 mb-2 block" style={{fontFamily: 'Georgia, serif'}}>Mô Tả</label>
                    <input className="w-full border-2 border-amber-900 border-opacity-30 bg-white bg-opacity-70 px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-amber-800 text-amber-950" style={{fontFamily: 'Georgia, serif'}}
                      value={editingAchieve.description}
                      onChange={e => setEditingAchieve(p => ({ ...p, description: e.target.value }))}/>
                  </div>
                  <div>
                    <label className="text-xs font-light text-amber-900 mb-2 block" style={{fontFamily: 'Georgia, serif'}}>Đơn Vị Cấp</label>
                    <input className="w-full border-2 border-amber-900 border-opacity-30 bg-white bg-opacity-70 px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-amber-800 text-amber-950" style={{fontFamily: 'Georgia, serif'}}
                      value={editingAchieve.issuedBy || ''}
                      onChange={e => setEditingAchieve(p => ({ ...p, issuedBy: e.target.value }))}/>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => updateAchieveMutation.mutate({ aid: a.id, data: editingAchieve })}
                      className="flex-1 px-3 py-1.5 bg-amber-900 text-amber-50 rounded-sm text-sm hover:bg-amber-950 font-light" style={{fontFamily: 'Georgia, serif'}}>
                      Lưu
                    </button>
                    <button onClick={() => setEditingAchieve(null)}
                      className="flex-1 px-3 py-1.5 border-2 border-amber-900 border-opacity-30 text-amber-900 rounded-sm text-sm hover:bg-amber-200 font-light" style={{fontFamily: 'Georgia, serif'}}>
                      Hủy
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-amber-300 flex items-center justify-center text-lg flex-shrink-0 font-light">•</div>
                  <div className="flex-1">
                    <p className="font-light text-amber-950" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.05em'}}>{a.description}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-xs bg-amber-300 text-amber-900 px-2 py-0.5 font-light">
                        {typeLabel[a.type]}
                      </span>
                      <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 font-light">
                        {levelLabel[a.level]}
                      </span>
                      <span className="text-xs text-amber-800 font-light">Năm {a.year}</span>
                      {a.issuedBy && <span className="text-xs text-amber-800 font-light">• {a.issuedBy}</span>}
                    </div>
                  </div>
                  {canEdit && (
                    <div className="flex gap-1">
                      <button onClick={() => setEditingAchieve({ id: a.id, type: a.type, level: a.level, year: a.year, description: a.description, issuedBy: a.issuedBy || '' })}
                        className="p-1.5 text-amber-900 hover:bg-amber-200 rounded-sm transition-colors" title="Sửa">
                        S
                      </button>
                      {isAdmin && (
                        <button onClick={() => confirm('Xóa thành tích này?') && deleteAchieveMutation.mutate(a.id)}
                          className="p-1.5 text-amber-900 hover:bg-amber-200 rounded-sm transition-colors" title="Xóa">
                          X
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Tab: Con cái ── */}
      {activeTab === 'children' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...(m.childrenAsFather||[]), ...(m.childrenAsMother||[])].length === 0 ? (
            <div className="col-span-2 relative bg-gradient-to-b from-amber-100 to-amber-50 rounded-sm border-2 border-amber-900 border-opacity-20 p-10 text-center shadow-lg" style={{boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.6)'}}>
              <p className="text-amber-700 font-light" style={{fontFamily: 'Georgia, serif'}}>Chưa có con</p>
            </div>
          ) : (
            [...(m.childrenAsFather||[]), ...(m.childrenAsMother||[])].map(c => (
              <Link to={`/members/${c.id}`} key={c.id}
                className="relative flex items-center gap-3 p-4 bg-gradient-to-b from-amber-100 to-amber-50 rounded-sm border-2 border-amber-900 border-opacity-20 shadow-lg hover:border-opacity-40 transition-all">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-light text-sm flex-shrink-0
                  ${c.gender==='male'?'bg-amber-300 text-amber-900':'bg-amber-200 text-amber-800'}`}>
                  {c.fullName.split(' ').pop()[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-light text-amber-950" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.05em'}}>{c.fullName}</p>
                  <p className="text-xs text-amber-700 font-light">Đời {c.generation} • {c.gender==='male'?'Nam':'Nữ'}</p>
                </div>
                {c.isDeceased && <span className="text-xs text-amber-800 font-light">✞</span>}
              </Link>
            ))
          )}
        </div>
      )}

      {/* ═══ Modal: Ghi nhận mất ═══ */}
      {showDeathForm && (
        <Modal title="Ghi Nhận Qua Đời" onClose={() => setShowDeathForm(false)}>
          <div className="space-y-4">
            <Field2 label="Ngày giờ mất *">
              <input type="datetime-local" className="inp2"
                value={deathForm.deathDate}
                onChange={e => setDeathForm(f => ({ ...f, deathDate: e.target.value }))}/>
            </Field2>
            <div className="grid grid-cols-2 gap-3">
              <Field2 label="Nguyên nhân">
                <select className="inp2" value={deathForm.cause}
                  onChange={e => setDeathForm(f => ({ ...f, cause: e.target.value }))}>
                  {CAUSE_OPTIONS.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </Field2>
              <Field2 label="Nơi mai táng">
                <select className="inp2" value={deathForm.burialPlace}
                  onChange={e => setDeathForm(f => ({ ...f, burialPlace: e.target.value }))}>
                  {BURIAL_OPTIONS.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </Field2>
            </div>
            <Field2 label="Ghi chú">
              <textarea className="inp2 h-20 resize-none" value={deathForm.note}
                onChange={e => setDeathForm(f => ({ ...f, note: e.target.value }))}/>
            </Field2>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => setShowDeathForm(false)} className="flex-1 py-2.5 border-2 border-amber-900 border-opacity-30 text-amber-900 rounded-sm text-sm hover:bg-amber-200 font-light" style={{fontFamily: 'Georgia, serif'}}>Hủy</button>
            <button onClick={() => deathMutation.mutate(deathForm)}
              disabled={!deathForm.deathDate || deathMutation.isPending}
              className="flex-1 py-2.5 bg-amber-900 text-amber-50 rounded-sm text-sm hover:bg-amber-950 disabled:opacity-50 font-light" style={{fontFamily: 'Georgia, serif'}}>
              {deathMutation.isPending ? 'Đang lưu...' : 'Xác Nhận'}
            </button>
          </div>
        </Modal>
      )}

      {/* ═══ Modal: Thêm hôn nhân ═══ */}
      {showMarriageForm && (
        <Modal title="Thêm Hôn Nhân Mới" onClose={() => setShowMarriageForm(false)}>
          <div className="space-y-4">
            <Field2 label={m.gender==='male' ? 'Chọn vợ *' : 'Chọn chồng *'}>
              <select className="inp2" value={marriageForm.spouseId}
                onChange={e => setMarriageForm(f => ({ ...f, spouseId: e.target.value }))}>
                <option value="">— Chọn —</option>
                {potentialSpouses.map(x => (
                  <option key={x.id} value={x.id}>{x.fullName} (Đời {x.generation})</option>
                ))}
              </select>
            </Field2>
            <Field2 label="Ngày kết hôn">
              <input type="date" className="inp2"
                max={new Date().toISOString().slice(0,10)}
                value={marriageForm.marriageDate}
                onChange={e => setMarriageForm(f => ({ ...f, marriageDate: e.target.value }))}/>
            </Field2>
            <Field2 label="Ghi chú">
              <input className="inp2" value={marriageForm.note}
                onChange={e => setMarriageForm(f => ({ ...f, note: e.target.value }))}/>
            </Field2>
            <p className="text-xs text-gray-400 bg-blue-50 p-3 rounded-lg">
              Hệ thống sẽ tự động kiểm tra huyết thống trước khi tạo hôn nhân.
            </p>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => setShowMarriageForm(false)} className="flex-1 py-2.5 border-2 border-amber-900 border-opacity-30 text-amber-900 rounded-sm text-sm hover:bg-amber-200 font-light" style={{fontFamily: 'Georgia, serif'}}>Hủy</button>
            <button onClick={handleAddMarriage}
              disabled={!marriageForm.spouseId || createMarriageMutation.isPending}
              className="flex-1 py-2.5 bg-amber-900 text-amber-50 rounded-sm text-sm hover:bg-amber-950 disabled:opacity-50 font-light" style={{fontFamily: 'Georgia, serif'}}>
              {createMarriageMutation.isPending ? 'Đang tạo...' : 'Tạo Hôn Nhân'}
            </button>
          </div>
        </Modal>
      )}

      {/* ═══ Modal: Thêm thành tích ═══ */}
      {showAchieveForm && (
        <Modal title="Thêm Thành Tích" onClose={() => setShowAchieveForm(false)}>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <Field2 label="Loại *">
                <select className="inp2" value={achieveForm.type}
                  onChange={e => setAchieveForm(f => ({ ...f, type: e.target.value }))}>
                  {ACHIEVE_TYPES.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </Field2>
              <Field2 label="Cấp độ *">
                <select className="inp2" value={achieveForm.level}
                  onChange={e => setAchieveForm(f => ({ ...f, level: e.target.value }))}>
                  {ACHIEVE_LEVELS.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </Field2>
              <Field2 label="Năm *">
                <input type="number" className="inp2"
                  min={m.birthDate ? new Date(m.birthDate).getFullYear() : 1900}
                  max={new Date().getFullYear()}
                  value={achieveForm.year}
                  onChange={e => setAchieveForm(f => ({ ...f, year: e.target.value }))}/>
              </Field2>
            </div>
            <Field2 label="Mô tả *">
              <input className="inp2" placeholder="Giải nhất Toán cấp Quốc gia..."
                value={achieveForm.description}
                onChange={e => setAchieveForm(f => ({ ...f, description: e.target.value }))}/>
            </Field2>
            <Field2 label="Đơn vị cấp">
              <input className="inp2" placeholder="Bộ GD&ĐT, UBND tỉnh..."
                value={achieveForm.issuedBy}
                onChange={e => setAchieveForm(f => ({ ...f, issuedBy: e.target.value }))}/>
            </Field2>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => setShowAchieveForm(false)} className="flex-1 py-2.5 border-2 border-amber-900 border-opacity-30 text-amber-900 rounded-sm text-sm hover:bg-amber-200 font-light" style={{fontFamily: 'Georgia, serif'}}>Hủy</button>
            <button onClick={() => createAchieveMutation.mutate(achieveForm)}
              disabled={!achieveForm.description || createAchieveMutation.isPending}
              className="flex-1 py-2.5 bg-amber-900 text-amber-50 rounded-sm text-sm hover:bg-amber-950 disabled:opacity-50 font-light" style={{fontFamily: 'Georgia, serif'}}>
              {createAchieveMutation.isPending ? 'Đang lưu...' : 'Thêm Thành Tích'}
            </button>
          </div>
        </Modal>
      )}

      <style>{`
        .inp2{width:100%;border:2px solid rgba(139,90,43,0.3);border-radius:0;padding:0.625rem 1rem;font-size:0.875rem;outline:none;background-color:rgba(255,255,255,0.7);color:#3d2817}
        .inp2:focus{border-color:#8b5a2b;box-shadow:0 0 0 0}
        .inp2::placeholder{color:rgba(139,90,43,0.5)}
      `}</style>
    </div>
  )
}

function Field2({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-light text-amber-900 mb-2" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.05em'}}>{label}</label>
      {children}
    </div>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="relative bg-gradient-to-b from-amber-100 to-amber-50 rounded-sm shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto border-3 border-amber-900 border-opacity-20" style={{boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.6)'}}>
        <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-amber-800 opacity-30"></div>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-light text-amber-950" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.1em'}}>{title}</h3>
          <button onClick={onClose} className="p-1.5 text-amber-900 hover:bg-amber-200 transition-colors">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
