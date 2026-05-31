import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { treeApi } from '../services/api'
import toast from 'react-hot-toast'
import { Solar } from 'lunar-javascript'

const RELATION_TYPES = [
  { value: 'root',   label: 'Đời đầu (tổ)',  desc: 'Thành viên gốc, không có cha mẹ trong hệ thống' },
  { value: 'child',  label: 'Con',           desc: 'Thêm như con của một thành viên đã có' },
  { value: 'spouse', label: 'Vợ / Chồng',   desc: 'Thêm và tự động tạo hôn nhân với một thành viên' },
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
  const [relationType,  setRelationType]  = useState('child')
  const [customOccupation, setCustomOccupation] = useState('')
  const [customHometown,   setCustomHometown]   = useState('')
  const [customBirthPlace, setCustomBirthPlace] = useState('')
  const [form, setForm] = useState({
    fullName: '', nickname: '', gender: 'male', birthDate: '', birthDateLunar: '',
    birthPlace: '', occupation: '', hometown: '', address: '',
    phone: '', email: '', bio: '',
    generation: 1, fatherId: '', motherId: '',
    spouseId: '', marriageDate: '', isAdopted: false,
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

  // ── Danh mục hệ thống ──
  const { data: occupationCats = [] } = useQuery({
    queryKey: ['categories', currentTree?.id, 'occupation'],
    queryFn:  () => api.categories('?type=occupation').then(r => r.data),
    enabled:  !!currentTree?.id,
  })
  const { data: hometownCats = [] } = useQuery({
    queryKey: ['categories', currentTree?.id, 'hometown'],
    queryFn:  () => api.categories('?type=hometown').then(r => r.data),
    enabled:  !!currentTree?.id,
  })
  const activeOccupations = occupationCats.filter(c => c.isActive !== false)
  const activeHometowns   = hometownCats.filter(c => c.isActive !== false)

  useEffect(() => {
    if (!member) return
    const occ = member.occupation ?? ''
    const ht  = member.hometown   ?? ''
    const bp  = member.birthPlace ?? ''
    setForm({
      fullName:   member.fullName   ?? '',
      nickname:   member.nickname   ?? '',
      gender:     member.gender     ?? 'male',
      birthDate:  member.birthDate  ? member.birthDate.slice(0, 10) : '',
      birthDateLunar: member.birthDateLunar ?? '',
      birthPlace: bp,
      occupation: occ,
      hometown:   ht,
      address:    member.address    ?? '',
      phone:      member.phone      ?? '',
      email:      member.email      ?? '',
      bio:        member.bio        ?? '',
      generation: member.generation ?? 1,
      fatherId:   member.fatherId   ?? '',
      motherId:   member.motherId   ?? '',
      spouseId:   '', marriageDate: '',
      isAdopted:  member.isAdopted  ?? false,
    })
    // If existing value doesn't match any category label, pre-set as custom "Khác"
    if (occ && activeOccupations.length && !activeOccupations.some(c => c.label === occ)) {
      setCustomOccupation(occ)
      setForm(f => ({ ...f, occupation: '__other__' }))
    }
    if (ht && activeHometowns.length && !activeHometowns.some(c => c.label === ht)) {
      setCustomHometown(ht)
      setForm(f => ({ ...f, hometown: '__other__' }))
    }
    if (bp && activeHometowns.length && !activeHometowns.some(c => c.label === bp)) {
      setCustomBirthPlace(bp)
      setForm(f => ({ ...f, birthPlace: '__other__' }))
    }
    if (member.avatarUrl)
      setAvatarPreview(`http://localhost:3001${member.avatarUrl}`)
  }, [member, activeOccupations.length, activeHometowns.length])

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
      setForm(f => ({ ...f, fatherId: '', motherId: '', generation: 1, spouseId: '', marriageDate: '', isAdopted: false }))
    } else if (type === 'spouse') {
      setForm(f => ({ ...f, fatherId: '', motherId: '', spouseId: '', marriageDate: '', isAdopted: false }))
    }
  }

  const handleBirthDateChange = (e) => {
    const val = e.target.value;
    setForm(f => ({ ...f, birthDate: val }));
    
    if (val) {
      try {
        const [year, month, day] = val.split('-');
        const solar = Solar.fromYmd(parseInt(year, 10), parseInt(month, 10), parseInt(day, 10));
        const lunar = solar.getLunar();
        const lDay = lunar.getDay().toString().padStart(2, '0');
        const lMonth = lunar.getMonth().toString().padStart(2, '0');
        setForm(f => ({ ...f, birthDateLunar: `${lDay}/${lMonth}/${lunar.getYear()}` }));
      } catch (err) {}
    } else {
      setForm(f => ({ ...f, birthDateLunar: '' }));
    }
  }


  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.fullName.trim())      return toast.error('Họ tên không được để trống')
    if (form.fullName.length > 100) return toast.error('Họ tên tối đa 100 ký tự')
    if (form.birthDate && new Date(form.birthDate) > new Date())
      return toast.error('Ngày sinh không được vượt ngày hiện tại')

    if (form.phone && !/^0\d{9,10}$/.test(form.phone.trim()))
      return toast.error('Số điện thoại phải gồm 10-11 chữ số, bắt đầu bằng 0')
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      return toast.error('Email không đúng định dạng')

    if (!isEdit) {
      if (relationType === 'child' && !form.fatherId && !form.motherId)
        return toast.error('Vui lòng chọn ít nhất cha hoặc mẹ')
      if (relationType === 'spouse' && !form.spouseId)
        return toast.error('Vui lòng chọn vợ/chồng')
    }

    if (form.occupation === '__other__' && !customOccupation.trim()) return toast.error('Vui lòng nhập nghề nghiệp')
    if (form.hometown === '__other__' && !customHometown.trim()) return toast.error('Vui lòng nhập quê quán')
    if (form.birthPlace === '__other__' && !customBirthPlace.trim()) return toast.error('Vui lòng nhập nơi sinh')

    const resolvedBirthPlace = form.birthPlace === '__other__' ? customBirthPlace.trim() : form.birthPlace
    const resolvedOccupation = form.occupation === '__other__' ? customOccupation.trim() : form.occupation
    const resolvedHometown   = form.hometown === '__other__'   ? customHometown.trim()   : form.hometown

    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('fullName',   form.fullName.trim())
      fd.append('gender',     form.gender)
      fd.append('generation', form.generation)
      if (form.nickname)   fd.append('nickname',   form.nickname)
      if (form.birthDate)  fd.append('birthDate',  form.birthDate)
      if (form.birthDateLunar) fd.append('birthDateLunar', form.birthDateLunar)
      if (resolvedBirthPlace) fd.append('birthPlace', resolvedBirthPlace)
      if (resolvedOccupation) fd.append('occupation', resolvedOccupation)
      if (resolvedHometown)   fd.append('hometown',   resolvedHometown)
      if (form.address)       fd.append('address',    form.address)
      if (form.phone)         fd.append('phone',      form.phone)
      if (form.email)         fd.append('email',      form.email)
      if (form.bio)           fd.append('bio',        form.bio)
      if (relationType === 'child' || isEdit) {
        if (form.fatherId) fd.append('fatherId', form.fatherId)
        if (form.motherId) fd.append('motherId', form.motherId)
        fd.append('isAdopted', form.isAdopted)
      }
      if (avatarFile) fd.append('avatar', avatarFile)

      let savedMember
      if (isEdit) {
        const res = await api.updateMember(id, fd)
        savedMember = res.data
      } else {
        const res = await api.createMember(fd)
        savedMember = res.data
        if (relationType === 'spouse' && form.spouseId) {
          const spouseMember = allMembers.find(m => String(m.id) === String(form.spouseId))
          const husbandId = savedMember.gender === 'male' ? savedMember.id : +form.spouseId
          const wifeId    = savedMember.gender === 'male' ? +form.spouseId : savedMember.id
          try {
            await api.createMarriage({ husbandId, wifeId, marriageDate: form.marriageDate || null, status: 'living' })
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

  if (!currentTree) return <div className="flex items-center justify-center h-64 text-gray-400">Chưa chọn cây gia phả</div>
  if (isEdit && loadingMember) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"/></div>

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 text-amber-900 hover:bg-amber-200 transition-colors" style={{fontFamily: 'Georgia, serif'}}>←</button>
        <div>
          <h2 className="text-2xl font-light text-amber-950" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.1em'}}>{isEdit ? 'Chỉnh Sửa Thành Viên' : 'Thêm Thành Viên Mới'}</h2>
          <p className="text-sm text-amber-700 font-light mt-1" style={{fontFamily: 'Georgia, serif'}}>{isEdit ? `Đang sửa: ${member?.fullName}` : currentTree?.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {!isEdit && (
          <div className="relative bg-gradient-to-b from-amber-100 to-amber-50 rounded-sm border-2 border-amber-900 border-opacity-20 shadow-lg p-6" style={{boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.6)'}}>
            <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-amber-800 opacity-30"></div>
            <h3 className="font-light text-amber-950 mb-4" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.08em'}}>Loại Quan Hệ Khi Thêm</h3>
            <div className="grid grid-cols-3 gap-4">
              {RELATION_TYPES.map(({ value, label, desc }) => (
                <button key={value} type="button" onClick={() => handleRelationChange(value)} className={`flex flex-col items-center gap-2 p-4 rounded-sm border-2 transition-all text-center ${relationType === value ? 'border-amber-900 bg-amber-200 bg-opacity-40 text-amber-950' : 'border-amber-900 border-opacity-30 hover:border-opacity-50 text-amber-900'}`} style={{fontFamily: 'Georgia, serif'}}>
                  <span className="font-light text-sm">{label}</span>
                  <span className="text-xs leading-tight opacity-70 font-light">{desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="relative bg-gradient-to-b from-amber-100 to-amber-50 rounded-sm border-2 border-amber-900 border-opacity-20 shadow-lg p-6 flex items-center gap-6" style={{boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.6)'}}>
          <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-amber-800 opacity-30"></div>
          <div className="w-20 h-20 rounded-full bg-amber-200 bg-opacity-40 border-2 border-amber-900 border-opacity-30 flex items-center justify-center overflow-hidden flex-shrink-0">
            {avatarPreview ? <img src={avatarPreview} className="w-full h-full object-cover" alt="avatar"/> : <span className="text-amber-900 text-lg" style={{fontFamily: 'Georgia, serif'}}>•</span>}
          </div>
          <div>
            <p className="font-light text-amber-950 mb-2" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.05em'}}>Ảnh Đại Diện</p>
            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-amber-900 text-amber-50 text-sm transition-colors hover:bg-amber-950 font-light" style={{fontFamily: 'Georgia, serif'}}>
              Chọn ảnh
              <input type="file" accept=".jpg,.jpeg,.png" className="hidden" onChange={handleAvatarChange}/>
            </label>
            <p className="text-xs text-amber-700 mt-1 font-light" style={{fontFamily: 'Georgia, serif'}}>JPG, PNG</p>
          </div>
        </div>

        <div className="relative bg-gradient-to-b from-amber-100 to-amber-50 rounded-sm border-2 border-amber-900 border-opacity-20 shadow-lg p-6 space-y-4" style={{boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.6)'}}>
          <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-amber-800 opacity-30"></div>
          <h3 className="font-light text-amber-950 pb-3 border-b-2 border-amber-900 border-opacity-20" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.08em'}}>Thông Tin Cơ Bản</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Họ và tên *">
              <input className="inp" placeholder="Nguyễn Văn A" required maxLength={100} value={form.fullName} onChange={e => set('fullName', e.target.value)}/>
            </Field>
            <Field label="Tên gọi khác">
              <input className="inp" placeholder="Biệt danh..." maxLength={100} value={form.nickname} onChange={e => set('nickname', e.target.value)}/>
            </Field>
            <Field label="Giới tính *">
              <select className="inp" value={form.gender} onChange={e => set('gender', e.target.value)}>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
              </select>
            </Field>
            <Field label="Ngày sinh">
              <input className="inp" type="date"
                max={new Date().toISOString().slice(0, 10)}
                value={form.birthDate} onChange={handleBirthDateChange}/>
            </Field>

            <Field label="Ngày sinh (Âm lịch)">
              <input className="inp" placeholder="VD: 15/08/1990"
                value={form.birthDateLunar} onChange={e => set('birthDateLunar', e.target.value)}/>
            </Field>

            <Field label="Đời thứ *">
              <input className="inp" type="number" min={1} max={50}
                value={form.generation}
                onChange={e => set('generation', +e.target.value)}/>
            </Field>

            <Field label="Nơi sinh">
              <select className="inp" value={activeHometowns.some(c => c.label === form.birthPlace) || form.birthPlace === '__other__' || form.birthPlace === '' ? form.birthPlace : '__other__'}
                onChange={e => { set('birthPlace', e.target.value); if (e.target.value !== '__other__') setCustomBirthPlace('') }}>
                <option value="">— Chọn nơi sinh —</option>
                {activeHometowns.map(c => (
                  <option key={c.value} value={c.label}>{c.label}</option>
                ))}
                {form.birthPlace && !activeHometowns.some(c => c.label === form.birthPlace) && form.birthPlace !== '__other__' && form.birthPlace !== '' && (
                  <option value={form.birthPlace}>{form.birthPlace} (cũ)</option>
                )}
                <option value="__other__">Khác...</option>
              </select>
              {form.birthPlace === '__other__' && (
                <input className="inp" style={{marginTop: '0.5rem'}} placeholder="Nhập nơi sinh..."
                  value={customBirthPlace} onChange={e => setCustomBirthPlace(e.target.value)}/>
              )}
            </Field>

            <Field label="Nghề nghiệp">
              <select className="inp" value={activeOccupations.some(c => c.label === form.occupation) || form.occupation === '__other__' || form.occupation === '' ? form.occupation : '__other__'}
                onChange={e => { set('occupation', e.target.value); if (e.target.value !== '__other__') setCustomOccupation('') }}>
                <option value="">— Chọn nghề nghiệp —</option>
                {activeOccupations.map(c => (
                  <option key={c.value} value={c.label}>{c.label}</option>
                ))}
                {form.occupation && !activeOccupations.some(c => c.label === form.occupation) && form.occupation !== '__other__' && form.occupation !== '' && (
                  <option value={form.occupation}>{form.occupation} (cũ)</option>
                )}
                <option value="__other__">Khác...</option>
              </select>
              {form.occupation === '__other__' && (
                <input className="inp" style={{marginTop: '0.5rem'}} placeholder="Nhập nghề nghiệp..."
                  value={customOccupation} onChange={e => setCustomOccupation(e.target.value)}/>
              )}
            </Field>

            <Field label="Quê quán">
              <select className="inp" value={activeHometowns.some(c => c.label === form.hometown) || form.hometown === '__other__' || form.hometown === '' ? form.hometown : '__other__'}
                onChange={e => { set('hometown', e.target.value); if (e.target.value !== '__other__') setCustomHometown('') }}>
                <option value="">— Chọn quê quán —</option>
                {activeHometowns.map(c => (
                  <option key={c.value} value={c.label}>{c.label}</option>
                ))}
                {form.hometown && !activeHometowns.some(c => c.label === form.hometown) && form.hometown !== '__other__' && form.hometown !== '' && (
                  <option value={form.hometown}>{form.hometown} (cũ)</option>
                )}
                <option value="__other__">Khác...</option>
              </select>
              {form.hometown === '__other__' && (
                <input className="inp" style={{marginTop: '0.5rem'}} placeholder="Nhập quê quán..."
                  value={customHometown} onChange={e => setCustomHometown(e.target.value)}/>
              )}
            </Field>
          </div>
        </div>

        {/* Liên hệ và Khác */}
        <div className="relative bg-gradient-to-b from-amber-100 to-amber-50 rounded-sm border-2 border-amber-900 border-opacity-20 shadow-lg p-6 space-y-4" style={{boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.6)'}}>
          <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-amber-800 opacity-30"></div>
          <h3 className="font-light text-amber-950 pb-3 border-b-2 border-amber-900 border-opacity-20" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.08em'}}>Liên Hệ & Thông Tin Khác</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Số điện thoại">
              <input className="inp" placeholder="09xxxx..."
                value={form.phone} onChange={e => set('phone', e.target.value)}/>
            </Field>
            
            <Field label="Email">
              <input className="inp" type="email" placeholder="email@..."
                value={form.email} onChange={e => set('email', e.target.value)}/>
            </Field>

            <div className="md:col-span-2">
              <Field label="Địa chỉ hiện tại">
                <input className="inp" placeholder="Số nhà, đường, quận..." value={form.address} onChange={e => set('address', e.target.value)}/>
              </Field>
            </div>
            
            <div className="md:col-span-2">
              <Field label="Tiểu sử / Ghi chú">
                <textarea className="inp" rows="3" placeholder="Ghi chú về cuộc đời, sự nghiệp..." value={form.bio} onChange={e => set('bio', e.target.value)}></textarea>
              </Field>
            </div>
          </div>
        </div>

        {/* Quan hệ gia đình — chọn cha mẹ thông minh */}
        {(!isEdit && relationType === 'child') && (() => {
          const selectedFather = allMembers.find(m => String(m.id) === String(form.fatherId))
          const selectedMother = allMembers.find(m => String(m.id) === String(form.motherId))

          // Danh sách gợi ý
          const suggestedMothers = selectedFather
            ? (selectedFather.marriagesAsH?.map(mar => mar.wife) || [])
            : females
          
          const suggestedFathers = selectedMother
            ? (selectedMother.marriagesAsW?.map(mar => mar.husband) || [])
            : males

          return (
          <div className="relative bg-gradient-to-b from-amber-100 to-amber-50 rounded-sm border-2 border-amber-900 border-opacity-20 shadow-lg p-6 space-y-5" style={{boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.6)'}}>
            <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-amber-800 opacity-30"></div>
            <div className="flex items-center justify-between pb-3 border-b-2 border-amber-900 border-opacity-20">
              <h3 className="font-light text-amber-950" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.08em'}}>
                Chọn Cha / Mẹ
              </h3>
              <label className="flex items-center gap-2 text-sm font-light text-amber-900 cursor-pointer">
                <input type="checkbox" checked={form.isAdopted} 
                  onChange={e => {
                    const checked = e.target.checked
                    set('isAdopted', checked)
                    if (checked) {
                      if (form.fatherId && form.motherId) set('motherId', '')
                    }
                  }} />
                Chỉ có cha/mẹ hoặc nhận nuôi
              </label>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Chọn Cha */}
              <div className="space-y-2">
                <label className="block text-sm font-light text-amber-900" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.05em'}}>
                 Cha
                </label>
                <select className="inp disabled:opacity-50" value={form.fatherId}
                  disabled={form.isAdopted && !!form.motherId}
                  onChange={e => {
                    set('fatherId', e.target.value)
                    // Tự động gán mẹ nếu cha chỉ có 1 vợ và chưa bật mồ côi
                    if (e.target.value && !form.isAdopted && !form.motherId) {
                      const f = allMembers.find(m => String(m.id) === e.target.value)
                      if (f && f.marriagesAsH?.length === 1) set('motherId', f.marriagesAsH[0].wifeId)
                    }
                    if (!e.target.value && !form.motherId) set('generation', 1)
                  }}>
                  <option value="">— Không chọn —</option>
                  {(() => {
                    const grouped = {}
                    suggestedFathers.forEach(m => {
                      if(!m) return
                      const gen = m.generation || 1
                      if (!grouped[gen]) grouped[gen] = []
                      grouped[gen].push(m)
                    })
                    return Object.entries(grouped)
                      .sort(([a], [b]) => +a - +b)
                      .map(([gen, members]) => (
                        <optgroup key={gen} label={`── Đời ${gen} ──`}>
                          {members.map(m => (
                            <option key={m.id} value={m.id}>
                              {m.fullName}{m.birthDate ? ` (${new Date(m.birthDate).getFullYear()})` : ''}
                            </option>
                          ))}
                        </optgroup>
                      ))
                  })()}
                </select>
                {/* Card thông tin cha */}
                {selectedFather && (
                  <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-sm">
                    <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-xs flex-shrink-0">
                      {selectedFather.avatarUrl
                        ? <img src={`http://localhost:3001${selectedFather.avatarUrl}`} className="w-full h-full rounded-full object-cover" alt=""/>
                        : ''}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-blue-900 truncate">{selectedFather.fullName}</p>
                      <p className="text-[10px] text-blue-600">Đời {selectedFather.generation}{selectedFather.birthDate ? ` · ${new Date(selectedFather.birthDate).getFullYear()}` : ''}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Chọn Mẹ */}
              <div className="space-y-2">
                <label className="block text-sm font-light text-amber-900" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.05em'}}>
                  Mẹ
                </label>
                <select className="inp disabled:opacity-50" value={form.motherId}
                  disabled={form.isAdopted && !!form.fatherId}
                  onChange={e => {
                    set('motherId', e.target.value)
                    // Tự động gán cha nếu mẹ chỉ có 1 chồng
                    if (e.target.value && !form.isAdopted && !form.fatherId) {
                      const m = allMembers.find(m => String(m.id) === e.target.value)
                      if (m && m.marriagesAsW?.length === 1) set('fatherId', m.marriagesAsW[0].husbandId)
                    }
                    if (!e.target.value && !form.fatherId) set('generation', 1)
                  }}>
                  <option value="">— Không chọn —</option>
                  {(() => {
                    const grouped = {}
                    suggestedMothers.forEach(m => {
                      if(!m) return
                      const gen = m.generation || 1
                      if (!grouped[gen]) grouped[gen] = []
                      grouped[gen].push(m)
                    })
                    return Object.entries(grouped)
                      .sort(([a], [b]) => +a - +b)
                      .map(([gen, members]) => (
                        <optgroup key={gen} label={`── Đời ${gen} ──`}>
                          {members.map(m => (
                            <option key={m.id} value={m.id}>
                              {m.fullName}{m.birthDate ? ` (${new Date(m.birthDate).getFullYear()})` : ''}
                            </option>
                          ))}
                        </optgroup>
                      ))
                  })()}
                </select>
                {/* Card thông tin mẹ */}
                {selectedMother && (
                  <div className="flex items-center gap-2 p-2 bg-pink-50 border border-pink-200 rounded-sm">
                    <div className="w-8 h-8 rounded-full bg-pink-200 flex items-center justify-center text-xs flex-shrink-0">
                      {selectedMother.avatarUrl
                        ? <img src={`http://localhost:3001${selectedMother.avatarUrl}`} className="w-full h-full rounded-full object-cover" alt=""/>
                        : ''}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-pink-900 truncate">{selectedMother.fullName}</p>
                      <p className="text-[10px] text-pink-600">Đời {selectedMother.generation}{selectedMother.birthDate ? ` · ${new Date(selectedMother.birthDate).getFullYear()}` : ''}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Cảnh báo nếu cha mẹ khác đời */}
            {selectedFather && selectedMother && selectedFather.generation !== selectedMother.generation && (
              <div className="bg-orange-50 border border-orange-300 rounded-sm p-3">
                <p className="text-xs text-orange-800 font-light" style={{fontFamily: 'Georgia, serif'}}>
                  ⚠️ Cha (đời {selectedFather.generation}) và mẹ (đời {selectedMother.generation}) không cùng đời. Vui lòng kiểm tra lại.
                </p>
              </div>
            )}

            {/* Tóm tắt đời */}
            {(selectedFather || selectedMother) && (
              <div className="flex items-center gap-2 pt-2 border-t border-amber-200">
                <span className="text-xs text-amber-700 font-light" style={{fontFamily: 'Georgia, serif'}}>
                  📌 Con sẽ thuộc <strong>đời {form.generation}</strong>
                  {selectedFather && selectedMother
                    ? ` (con của ${selectedFather.fullName} và ${selectedMother.fullName})`
                    : selectedFather
                      ? ` (con của ${selectedFather.fullName})`
                      : ` (con của ${selectedMother.fullName})`
                  }
                </span>
              </div>
            )}

            {/* Lỗi: chưa chọn ai */}
            {!form.fatherId && !form.motherId && (
              <p className="text-xs text-red-500 font-light" style={{fontFamily: 'Georgia, serif'}}>
                Vui lòng chọn ít nhất cha hoặc mẹ.
              </p>
            )}
          </div>
          )
        })()}

        {(!isEdit && relationType === 'spouse') && (
          <div className="relative bg-gradient-to-b from-amber-100 to-amber-50 rounded-sm border-2 border-amber-900 border-opacity-20 shadow-lg p-6 space-y-4" style={{boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.6)'}}>
            <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-amber-800 opacity-30"></div>
            <h3 className="font-light text-amber-950 pb-3 border-b-2 border-amber-900 border-opacity-20" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.08em'}}>
              Thông Tin Hôn Nhân
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
          <div className="relative bg-gradient-to-b from-amber-100 to-amber-50 rounded-sm border-2 border-amber-900 border-opacity-20 shadow-lg p-6 space-y-4" style={{boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.6)'}}>
            <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-amber-800 opacity-30"></div>
            <h3 className="font-light text-amber-950 pb-3 border-b-2 border-amber-900 border-opacity-20" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.08em'}}>Quan Hệ Gia Đình</h3>
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

        <div className="flex gap-3 justify-end pt-4">
          <button type="button" onClick={() => navigate(-1)}
            className="px-6 py-2.5 border-2 border-amber-900 border-opacity-30 text-amber-900
              hover:bg-amber-200 font-light transition-colors text-sm" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.05em'}}>
            Hủy
          </button>
          <button type="submit" disabled={loading}
            className="px-6 py-2.5 bg-amber-900 text-amber-50
              hover:bg-amber-950 disabled:opacity-50 transition-colors text-sm font-light" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.05em'}}>
            {loading ? 'Đang lưu...' : (isEdit ? 'Cập nhật' : 'Thêm mới')}
          </button>
        </div>
      </form>

      <style>{`.inp{width:100%;border:2px solid rgba(139,90,43,0.3);border-radius:0;padding:0.625rem 1rem;font-size:0.875rem;outline:none;transition:all .2s;background-color:rgba(255,255,255,0.7);color:#3d2817}.inp:focus{border-color:#8b5a2b;box-shadow:0 0 0 0 transparent}.inp::placeholder{color:rgba(139,90,43,0.5)}`}</style>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-light text-amber-900 mb-2" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.05em'}}>{label}</label>
      {children}
    </div>
  )
}
