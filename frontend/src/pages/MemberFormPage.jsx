import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { treeApi } from '../services/api'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, User, Users, Heart, Crown } from 'lucide-react'

const RELATION_TYPES = [
  { value: 'root',   label: 'Đời đầu (tổ)',  icon: Crown,  desc: 'Thành viên gốc, không có cha mẹ trong hệ thống' },
  { value: 'child',  label: 'Con',           icon: Users,  desc: 'Thêm như con của một thành viên đã có' },
  { value: 'spouse', label: 'Vợ / Chồng',   icon: Heart,  desc: 'Thêm và tự động tạo hôn nhân với một thành viên' },
]

export default function MemberFormPage() {
  const { id }     = useParams()
  const isEdit     = Boolean(id)
  const navigate   = useNavigate()
  const { currentTree } = useAuthStore()
  const api        = treeApi(currentTree?.id)

  const [loading,       setLoading]       = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [avatarFile,    setAvatarFile]    = useState(null)
  const [relationType,  setRelationType]  = useState('child')  // root | child | spouse
  const [form, setForm] = useState({
    fullName: '', nickname: '', gender: 'male', birthDate: '',
    birthPlace: '', occupation: '', hometown: '',
    generation: 1, fatherId: '', motherId: '',
    // Thêm mới: spouse
    spouseId: '', marriageDate: '',
  })

  const { data: member, isLoading: loadingMember } = useQuery({
    queryKey: ['member', currentTree?.id, id],
    queryFn:  () => api.member(id).then(r => r.data),
    enabled:  isEdit && !!currentTree?.id,
  })

  const { data: allMembers = [] } = useQuery({
    queryKey: ['members', currentTree?.id],
    queryFn:  () => api.members().then(r => r.data),
    enabled:  !!currentTree?.id,
  })

  useEffect(() => {
    if (!member) return
    setForm({
      fullName:   member.fullName   ?? '',
      nickname:   member.nickname   ?? '',
      gender:     member.gender     ?? 'male',
      birthDate:  member.birthDate  ? member.birthDate.slice(0, 10) : '',
      birthPlace: member.birthPlace ?? '',
      occupation: member.occupation ?? '',
      hometown:   member.hometown   ?? '',
      generation: member.generation ?? 1,
      fatherId:   member.fatherId   ?? '',
      motherId:   member.motherId   ?? '',
      spouseId: '', marriageDate: '',
    })
    if (member.avatarUrl)
      setAvatarPreview(`http://localhost:3001${member.avatarUrl}`)
  }, [member])

  // Khi chọn cha → tự động tính đời
  useEffect(() => {
    if (relationType !== 'child' || isEdit) return
    const fatherMember = allMembers.find(m => String(m.id) === String(form.fatherId))
    const motherMember = allMembers.find(m => String(m.id) === String(form.motherId))
    const parent = fatherMember || motherMember
    if (parent) setForm(f => ({ ...f, generation: parent.generation + 1 }))
  }, [form.fatherId, form.motherId, allMembers, relationType, isEdit])

  const males   = allMembers.filter(m => m.gender === 'male'   && String(m.id) !== id)
  const females = allMembers.filter(m => m.gender === 'female' && String(m.id) !== id)

  // Danh sách có thể chọn làm vợ/chồng (khác giới)
  const potentialSpouses = form.gender === 'male'
    ? allMembers.filter(m => m.gender === 'female')
    : allMembers.filter(m => m.gender === 'male')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleAvatarChange = e => {
    const file = e.target.files[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleRelationChange = (type) => {
    setRelationType(type)
    // Reset các field liên quan
    if (type === 'root') {
      setForm(f => ({ ...f, fatherId: '', motherId: '', generation: 1, spouseId: '', marriageDate: '' }))
    } else if (type === 'spouse') {
      setForm(f => ({ ...f, fatherId: '', motherId: '', spouseId: '', marriageDate: '' }))
    }
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.fullName.trim())      return toast.error('Họ tên không được để trống')
    if (form.fullName.length > 100) return toast.error('Họ tên tối đa 100 ký tự')
    if (form.birthDate && new Date(form.birthDate) > new Date())
      return toast.error('Ngày sinh không được vượt ngày hiện tại')

    if (!isEdit) {
      if (relationType === 'child' && !form.fatherId && !form.motherId)
        return toast.error('Vui lòng chọn ít nhất cha hoặc mẹ')
      if (relationType === 'spouse' && !form.spouseId)
        return toast.error('Vui lòng chọn vợ/chồng')
    }

    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('fullName',   form.fullName.trim())
      fd.append('gender',     form.gender)
      fd.append('generation', form.generation)
      if (form.nickname)   fd.append('nickname',   form.nickname)
      if (form.birthDate)  fd.append('birthDate',  form.birthDate)
      if (form.birthPlace) fd.append('birthPlace', form.birthPlace)
      if (form.occupation) fd.append('occupation', form.occupation)
      if (form.hometown)   fd.append('hometown',   form.hometown)
      if (relationType === 'child' || isEdit) {
        if (form.fatherId) fd.append('fatherId', form.fatherId)
        if (form.motherId) fd.append('motherId', form.motherId)
      }
      if (avatarFile) fd.append('avatar', avatarFile)

      let savedMember
      if (isEdit) {
        const res = await api.updateMember(id, fd)
        savedMember = res.data
      } else {
        const res = await api.createMember(fd)
        savedMember = res.data

        // Nếu là vợ/chồng → tự động tạo hôn nhân
        if (relationType === 'spouse' && form.spouseId) {
          const spouseMember = allMembers.find(m => String(m.id) === String(form.spouseId))
          const husbandId = savedMember.gender === 'male' ? savedMember.id : +form.spouseId
          const wifeId    = savedMember.gender === 'male' ? +form.spouseId : savedMember.id

          try {
            await api.createMarriage({
              husbandId, wifeId,
              marriageDate: form.marriageDate || null,
              status: 'living'
            })
            toast.success(`Đã tạo hôn nhân với ${spouseMember?.fullName}`)
          } catch (marriageErr) {
            toast.error(`Tạo thành viên OK nhưng lỗi hôn nhân: ${marriageErr.response?.data?.message}`)
          }
        }
      }

      toast.success(isEdit ? 'Đã cập nhật thành công' : 'Đã thêm thành viên mới')
      navigate(`/members/${savedMember.id}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  if (!currentTree) return (
    <div className="flex items-center justify-center h-64 text-gray-400">Chưa chọn cây gia phả</div>
  )
  if (isEdit && loadingMember) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"/>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)}
          className="p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">
          <ArrowLeft size={18}/>
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {isEdit ? 'Chỉnh sửa thành viên' : 'Thêm thành viên mới'}
          </h2>
          <p className="text-sm text-gray-400">
            {isEdit ? `Đang sửa: ${member?.fullName}` : currentTree?.name}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Loại quan hệ — chỉ hiện khi thêm mới */}
        {!isEdit && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-700 mb-3">Loại quan hệ khi thêm</h3>
            <div className="grid grid-cols-3 gap-3">
              {RELATION_TYPES.map(({ value, label, icon: Icon, desc }) => (
                <button key={value} type="button"
                  onClick={() => handleRelationChange(value)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center
                    ${relationType === value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}>
                  <Icon size={22} className={relationType === value ? 'text-blue-600' : 'text-gray-400'}/>
                  <span className="font-semibold text-sm">{label}</span>
                  <span className="text-xs leading-tight opacity-70">{desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Ảnh đại diện */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-gray-50 border-2 border-dashed border-gray-200
            flex items-center justify-center overflow-hidden flex-shrink-0">
            {avatarPreview
              ? <img src={avatarPreview} className="w-full h-full object-cover" alt="avatar"/>
              : <User size={28} className="text-gray-300"/>
            }
          </div>
          <div>
            <p className="font-medium text-gray-700 mb-1.5">Ảnh đại diện</p>
            <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5
              bg-blue-50 text-blue-700 text-sm rounded-lg hover:bg-blue-100 transition-colors border border-blue-200">
              Chọn ảnh
              <input type="file" accept=".jpg,.jpeg,.png" className="hidden" onChange={handleAvatarChange}/>
            </label>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG</p>
          </div>
        </div>

        {/* Thông tin cơ bản */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h3 className="font-semibold text-gray-700 pb-2 border-b border-gray-100">Thông tin cơ bản</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <Field label="Họ và tên *">
              <input className="inp" placeholder="Nguyễn Văn A" required maxLength={100}
                value={form.fullName} onChange={e => set('fullName', e.target.value)}/>
            </Field>

            <Field label="Tên gọi khác">
              <input className="inp" placeholder="Biệt danh..." maxLength={100}
                value={form.nickname} onChange={e => set('nickname', e.target.value)}/>
            </Field>

            <Field label="Giới tính *">
              <select className="inp" value={form.gender}
                onChange={e => set('gender', e.target.value)}>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
              </select>
            </Field>

            <Field label="Ngày sinh">
              <input className="inp" type="date"
                max={new Date().toISOString().slice(0, 10)}
                value={form.birthDate} onChange={e => set('birthDate', e.target.value)}/>
            </Field>

            <Field label="Đời thứ *">
              <input className="inp" type="number" min={1} max={50}
                value={form.generation}
                onChange={e => set('generation', +e.target.value)}/>
            </Field>

            <Field label="Nơi sinh">
              <input className="inp" placeholder="Hà Nội..."
                value={form.birthPlace} onChange={e => set('birthPlace', e.target.value)}/>
            </Field>

            <Field label="Nghề nghiệp">
              <input className="inp" placeholder="Giáo viên..."
                value={form.occupation} onChange={e => set('occupation', e.target.value)}/>
            </Field>

            <Field label="Quê quán">
              <input className="inp" placeholder="Quê gốc..."
                value={form.hometown} onChange={e => set('hometown', e.target.value)}/>
            </Field>
          </div>
        </div>

        {/* Quan hệ gia đình — theo loại quan hệ */}
        {(!isEdit && relationType === 'child') && (
          <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-5 space-y-4">
            <h3 className="font-semibold text-blue-700 pb-2 border-b border-blue-100">
              👪 Chọn cha / mẹ
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Cha">
                <select className="inp" value={form.fatherId}
                  onChange={e => set('fatherId', e.target.value)}>
                  <option value="">— Chọn cha —</option>
                  {males.map(m => (
                    <option key={m.id} value={m.id}>{m.fullName} (Đời {m.generation})</option>
                  ))}
                </select>
              </Field>
              <Field label="Mẹ">
                <select className="inp" value={form.motherId}
                  onChange={e => set('motherId', e.target.value)}>
                  <option value="">— Chọn mẹ —</option>
                  {females.map(m => (
                    <option key={m.id} value={m.id}>{m.fullName} (Đời {m.generation})</option>
                  ))}
                </select>
              </Field>
            </div>
            <p className="text-xs text-gray-400">Chọn ít nhất cha hoặc mẹ. Đời thứ sẽ tự động tính.</p>
          </div>
        )}

        {(!isEdit && relationType === 'spouse') && (
          <div className="bg-white rounded-xl border border-pink-100 shadow-sm p-5 space-y-4">
            <h3 className="font-semibold text-pink-700 pb-2 border-b border-pink-100">
              💍 Thông tin hôn nhân
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label={form.gender === 'male' ? 'Vợ *' : 'Chồng *'}>
                <select className="inp" value={form.spouseId}
                  onChange={e => set('spouseId', e.target.value)}>
                  <option value="">— Chọn {form.gender === 'male' ? 'vợ' : 'chồng'} —</option>
                  {potentialSpouses.map(m => (
                    <option key={m.id} value={m.id}>{m.fullName} (Đời {m.generation})</option>
                  ))}
                </select>
              </Field>
              <Field label="Ngày kết hôn">
                <input className="inp" type="date"
                  max={new Date().toISOString().slice(0, 10)}
                  value={form.marriageDate}
                  onChange={e => set('marriageDate', e.target.value)}/>
              </Field>
            </div>
            <p className="text-xs text-gray-400">
              Hệ thống sẽ tự động kiểm tra huyết thống và tạo hồ sơ hôn nhân.
            </p>
          </div>
        )}

        {(isEdit) && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h3 className="font-semibold text-gray-700 pb-2 border-b border-gray-100">Quan hệ gia đình</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Cha">
                <select className="inp" value={form.fatherId}
                  onChange={e => set('fatherId', e.target.value)}>
                  <option value="">— Chọn cha —</option>
                  {males.map(m => (
                    <option key={m.id} value={m.id}>{m.fullName} (Đời {m.generation})</option>
                  ))}
                </select>
              </Field>
              <Field label="Mẹ">
                <select className="inp" value={form.motherId}
                  onChange={e => set('motherId', e.target.value)}>
                  <option value="">— Chọn mẹ —</option>
                  {females.map(m => (
                    <option key={m.id} value={m.id}>{m.fullName} (Đời {m.generation})</option>
                  ))}
                </select>
              </Field>
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button type="button" onClick={() => navigate(-1)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-gray-600
              hover:bg-gray-50 font-medium transition-colors text-sm">Hủy</button>
          <button type="submit" disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white
              rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm">
            <Save size={15}/>
            {loading ? 'Đang lưu...' : (isEdit ? 'Cập nhật' : 'Thêm mới')}
          </button>
        </div>
      </form>

      <style>{`.inp{width:100%;border:1px solid #e5e7eb;border-radius:0.5rem;padding:0.5rem 0.75rem;font-size:0.875rem;outline:none;transition:all .2s}.inp:focus{border-color:#3b82f6;box-shadow:0 0 0 2px #bfdbfe}`}</style>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  )
}