import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { treeApi } from '../services/api'
import toast from 'react-hot-toast'
import { ArrowLeft, Pencil, Skull, Plus, Trash2, X, Check } from 'lucide-react'
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
  ['living','💑 Đang sống chung'], ['divorced','💔 Ly hôn'], ['widowed','🕊️ Góa'],
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
    <div className="max-w-4xl mx-auto space-y-5">
      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft size={18}/>
          </button>
          <div className="flex items-center gap-3">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold
              overflow-hidden flex-shrink-0
              ${m.gender==='male'?'bg-blue-100 text-blue-700':'bg-pink-100 text-pink-700'}`}>
              {m.avatarUrl
                ? <img src={`http://localhost:3001${m.avatarUrl}`} className="w-full h-full object-cover" alt=""/>
                : m.fullName.split(' ').pop()[0]
              }
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">{m.fullName}</h2>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full
                  ${m.gender==='male'?'bg-blue-100 text-blue-700':'bg-pink-100 text-pink-700'}`}>
                  {m.gender==='male'?'Nam':'Nữ'}
                </span>
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                  Đời {m.generation}
                </span>
                <span className="text-xs text-gray-400">#{m.id}</span>
                {m.isDeceased
                  ? <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">✞ Đã mất</span>
                  : <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">● Còn sống</span>
                }
              </div>
            </div>
          </div>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Link to={`/members/${id}/edit`}
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl
                text-gray-600 hover:bg-gray-50 text-sm transition-colors">
              <Pencil size={14}/> Sửa
            </Link>
            {!m.isDeceased && (
              <button onClick={() => setShowDeathForm(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-500 text-white
                  rounded-xl text-sm hover:bg-red-600 transition-colors">
                <Skull size={14}/> Ghi nhận mất
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all
              ${activeTab===tab.key?'bg-white text-blue-700 shadow-sm':'text-gray-500 hover:text-gray-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Thông tin ── */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-700 pb-3 border-b border-gray-100 mb-3">Thông tin cá nhân</h3>
            <div className="space-y-2.5">
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
                  <span className="text-gray-400">{label}</span>
                  <span className="font-medium text-gray-700 text-right">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {m.isDeceased && m.death && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="font-semibold text-gray-500 pb-3 border-b border-gray-100 mb-3">✞ Qua đời</h3>
              <div className="space-y-2.5">
                {[
                  ['Ngày mất',     new Date(m.death.deathDate).toLocaleDateString('vi-VN')],
                  ['Nguyên nhân',  causeLabel[m.death.cause] || m.death.cause],
                  ['Nơi mai táng', burialLabel[m.death.burialPlace] || m.death.burialPlace],
                  ['Tuổi thọ',     m.death.longevity ? `${m.death.longevity} tuổi` : null],
                  ['Ghi chú',      m.death.note],
                ].filter(([,v]) => v).map(([label, value]) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-gray-400">{label}</span>
                    <span className="font-medium text-gray-600 text-right">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Hôn nhân ── */}
      {activeTab === 'marriage' && (
        <div className="space-y-4">
          {canEdit && !m.isDeceased && (
            <button onClick={() => setShowMarriageForm(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-pink-500 text-white
                rounded-xl text-sm hover:bg-pink-600 transition-colors font-medium">
              <Plus size={15}/> Thêm hôn nhân
            </button>
          )}

          {marriages.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-400">
              <div className="text-4xl mb-2">💍</div>
              <p>Chưa có hôn nhân nào</p>
            </div>
          )}

          {marriages.map(mar => (
            <div key={mar.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              {editingMarriage?.id === mar.id ? (
                // Form sửa trạng thái
                <div className="space-y-3">
                  <p className="font-semibold text-gray-700">Cập nhật hôn nhân với {mar.spouse?.fullName}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">Trạng thái</label>
                      <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                        value={editingMarriage.status}
                        onChange={e => setEditingMarriage(p => ({ ...p, status: e.target.value }))}>
                        {MARRIAGE_STATUS.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                    {editingMarriage.status === 'divorced' && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 mb-1 block">Ngày ly hôn</label>
                        <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                          value={editingMarriage.divorceDate || ''}
                          onChange={e => setEditingMarriage(p => ({ ...p, divorceDate: e.target.value }))}/>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Ghi chú</label>
                    <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      value={editingMarriage.note || ''}
                      onChange={e => setEditingMarriage(p => ({ ...p, note: e.target.value }))}/>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => updateMarriageMutation.mutate({
                      mid: mar.id,
                      data: { status: editingMarriage.status, divorceDate: editingMarriage.divorceDate, note: editingMarriage.note }
                    })} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                      <Check size={13}/> Lưu
                    </button>
                    <button onClick={() => setEditingMarriage(null)}
                      className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
                      <X size={13}/> Hủy
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold
                    ${mar.spouse?.gender==='male'?'bg-blue-100 text-blue-700':'bg-pink-100 text-pink-700'}`}>
                    {mar.spouse?.fullName?.split(' ').pop()[0]}
                  </div>
                  <div className="flex-1">
                    <Link to={`/members/${mar.spouse?.id}`}
                      className="font-semibold text-gray-800 hover:text-blue-600 transition-colors">
                      {mar.spouse?.fullName}
                    </Link>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 flex-wrap">
                      <span>{MARRIAGE_STATUS.find(([v])=>v===mar.status)?.[1]}</span>
                      {mar.marriageDate && (
                        <span>Kết hôn: {new Date(mar.marriageDate).toLocaleDateString('vi-VN')}</span>
                      )}
                      {mar.divorceDate && (
                        <span>Ly hôn: {new Date(mar.divorceDate).toLocaleDateString('vi-VN')}</span>
                      )}
                    </div>
                    {mar.note && <p className="text-xs text-gray-400 mt-1 italic">{mar.note}</p>}
                  </div>
                  {canEdit && (
                    <div className="flex gap-1">
                      <button onClick={() => setEditingMarriage({ id: mar.id, status: mar.status, divorceDate: mar.divorceDate?.slice(0,10)||'', note: mar.note||'' })}
                        className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors">
                        <Pencil size={14}/>
                      </button>
                      {isAdmin && (
                        <button onClick={() => confirm(`Xóa hôn nhân với ${mar.spouse?.fullName}?`) && deleteMarriageMutation.mutate(mar.id)}
                          className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={14}/>
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
        <div className="space-y-4">
          {canEdit && (
            <button onClick={() => setShowAchieveForm(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-yellow-500 text-white
                rounded-xl text-sm hover:bg-yellow-600 transition-colors font-medium">
              <Plus size={15}/> Thêm thành tích
            </button>
          )}

          {achievements.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-400">
              <div className="text-4xl mb-2">🏆</div>
              <p>Chưa có thành tích nào</p>
            </div>
          )}

          {achievements.map(a => (
            <div key={a.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              {editingAchieve?.id === a.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">Loại</label>
                      <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                        value={editingAchieve.type}
                        onChange={e => setEditingAchieve(p => ({ ...p, type: e.target.value }))}>
                        {ACHIEVE_TYPES.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">Cấp độ</label>
                      <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                        value={editingAchieve.level}
                        onChange={e => setEditingAchieve(p => ({ ...p, level: e.target.value }))}>
                        {ACHIEVE_LEVELS.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">Năm</label>
                      <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                        value={editingAchieve.year}
                        onChange={e => setEditingAchieve(p => ({ ...p, year: e.target.value }))}/>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Mô tả *</label>
                    <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      value={editingAchieve.description}
                      onChange={e => setEditingAchieve(p => ({ ...p, description: e.target.value }))}/>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Đơn vị cấp</label>
                    <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      value={editingAchieve.issuedBy || ''}
                      onChange={e => setEditingAchieve(p => ({ ...p, issuedBy: e.target.value }))}/>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => updateAchieveMutation.mutate({ aid: a.id, data: editingAchieve })}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                      <Check size={13}/> Lưu
                    </button>
                    <button onClick={() => setEditingAchieve(null)}
                      className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
                      <X size={13}/> Hủy
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center text-lg flex-shrink-0">🏆</div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{a.description}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        {typeLabel[a.type]}
                      </span>
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                        {levelLabel[a.level]}
                      </span>
                      <span className="text-xs text-gray-400">Năm {a.year}</span>
                      {a.issuedBy && <span className="text-xs text-gray-400">· {a.issuedBy}</span>}
                    </div>
                  </div>
                  {canEdit && (
                    <div className="flex gap-1">
                      <button onClick={() => setEditingAchieve({ id: a.id, type: a.type, level: a.level, year: a.year, description: a.description, issuedBy: a.issuedBy || '' })}
                        className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors">
                        <Pencil size={14}/>
                      </button>
                      {isAdmin && (
                        <button onClick={() => confirm('Xóa thành tích này?') && deleteAchieveMutation.mutate(a.id)}
                          className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={14}/>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[...(m.childrenAsFather||[]), ...(m.childrenAsMother||[])].length === 0 ? (
            <div className="col-span-2 bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-400">
              <div className="text-4xl mb-2">👶</div>
              <p>Chưa có con</p>
            </div>
          ) : (
            [...(m.childrenAsFather||[]), ...(m.childrenAsMother||[])].map(c => (
              <Link to={`/members/${c.id}`} key={c.id}
                className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100
                  shadow-sm hover:border-blue-200 hover:bg-blue-50 transition-all">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                  ${c.gender==='male'?'bg-blue-100 text-blue-700':'bg-pink-100 text-pink-700'}`}>
                  {c.fullName.split(' ').pop()[0]}
                </div>
                <div>
                  <p className="font-medium text-gray-800">{c.fullName}</p>
                  <p className="text-xs text-gray-400">Đời {c.generation} · {c.gender==='male'?'Nam':'Nữ'}</p>
                </div>
                {c.isDeceased && <span className="ml-auto text-xs text-gray-400">✞</span>}
              </Link>
            ))
          )}
        </div>
      )}

      {/* ═══ Modal: Ghi nhận mất ═══ */}
      {showDeathForm && (
        <Modal title="✞ Ghi nhận qua đời" onClose={() => setShowDeathForm(false)}>
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
          <div className="flex gap-3 mt-5">
            <button onClick={() => setShowDeathForm(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 text-sm">Hủy</button>
            <button onClick={() => deathMutation.mutate(deathForm)}
              disabled={!deathForm.deathDate || deathMutation.isPending}
              className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm hover:bg-red-600 disabled:opacity-50 font-medium">
              {deathMutation.isPending ? 'Đang lưu...' : 'Xác nhận'}
            </button>
          </div>
        </Modal>
      )}

      {/* ═══ Modal: Thêm hôn nhân ═══ */}
      {showMarriageForm && (
        <Modal title="💍 Thêm hôn nhân mới" onClose={() => setShowMarriageForm(false)}>
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
          <div className="flex gap-3 mt-5">
            <button onClick={() => setShowMarriageForm(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 text-sm">Hủy</button>
            <button onClick={handleAddMarriage}
              disabled={!marriageForm.spouseId || createMarriageMutation.isPending}
              className="flex-1 py-2.5 bg-pink-500 text-white rounded-xl text-sm hover:bg-pink-600 disabled:opacity-50 font-medium">
              {createMarriageMutation.isPending ? 'Đang tạo...' : 'Tạo hôn nhân'}
            </button>
          </div>
        </Modal>
      )}

      {/* ═══ Modal: Thêm thành tích ═══ */}
      {showAchieveForm && (
        <Modal title="🏆 Thêm thành tích" onClose={() => setShowAchieveForm(false)}>
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
          <div className="flex gap-3 mt-5">
            <button onClick={() => setShowAchieveForm(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 text-sm">Hủy</button>
            <button onClick={() => createAchieveMutation.mutate(achieveForm)}
              disabled={!achieveForm.description || createAchieveMutation.isPending}
              className="flex-1 py-2.5 bg-yellow-500 text-white rounded-xl text-sm hover:bg-yellow-600 disabled:opacity-50 font-medium">
              {createAchieveMutation.isPending ? 'Đang lưu...' : 'Thêm thành tích'}
            </button>
          </div>
        </Modal>
      )}

      <style>{`
        .inp2{width:100%;border:1px solid #e5e7eb;border-radius:0.5rem;padding:0.5rem 0.75rem;font-size:0.875rem;outline:none}
        .inp2:focus{border-color:#3b82f6;box-shadow:0 0 0 2px #bfdbfe}
      `}</style>
    </div>
  )
}

function Field2({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={18} className="text-gray-500"/>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}