/**
 * EditMemberModal — BM1: Chỉnh sửa hồ sơ thành viên
 *
 * Fields theo BM1:
 *  - Họ và tên * (max 100)
 *  - Tên gọi khác (max 100)
 *  - Giới tính
 *  - Ngày tháng năm sinh
 *  - Quê quán
 *  - Nghề nghiệp
 *  - Địa chỉ hiện tại  ← cần thêm field `address` vào Prisma schema nếu chưa có
 *  - Tiểu sử / Ghi chú ← cần thêm field `bio` vào Prisma schema nếu chưa có
 *  - Ảnh đại diện (upload)
 */
import { useState, useEffect, useRef } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { treeApi } from '../../../services/api'
import { Solar } from 'lunar-javascript'
import { useAuthStore } from '../../../store/authStore'
import {
  FloatModal, Section, Grid2, Field, Input, Select, Textarea, ModalButtons,
} from '../FloatModal'

const TODAY = new Date().toISOString().slice(0, 10)

export default function EditMemberModal({ member, onClose }) {
  const { currentTree } = useAuthStore()
  const api = treeApi(currentTree?.id)
  const qc  = useQueryClient()
  const fileRef = useRef()

  const [form, setForm] = useState({
    fullName:   '', nickname:   '',
    gender:     'male', birthDate: '', birthDateLunar: '',
    birthPlace: '', occupation: '',
    hometown:   '', address: '', phone: '', email: '',
    bio:        '', generation: 1,
  })
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [customOccupation, setCustomOccupation] = useState('')
  const [customHometown,   setCustomHometown]   = useState('')
  const [customBirthPlace, setCustomBirthPlace] = useState('')

  // ── Danh mục hệ thống ──
  const { data: occupationCats = [], isLoading: loadingOccupation } = useQuery({
    queryKey: ['categories', currentTree?.id, 'occupation'],
    queryFn:  () => api.categories('?type=occupation').then(r => r.data ?? r),
    enabled:  !!currentTree?.id,
  })
  const { data: hometownCats = [], isLoading: loadingHometown } = useQuery({
    queryKey: ['categories', currentTree?.id, 'hometown'],
    queryFn:  () => api.categories('?type=hometown').then(r => r.data ?? r),
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
      birthPlace: bp,
      occupation: occ,
      hometown:   ht,
      address:    member.address    ?? '',
      bio:        member.bio        ?? '',
      generation: member.generation ?? 1,
      birthDateLunar: member.birthDateLunar ?? '',
      phone:          member.phone          ?? '',
      email:          member.email          ?? '',
    })
    setAvatarPreview(member.avatarUrl ? `http://localhost:3001${member.avatarUrl}` : null)
  }, [member])

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png'].includes(file.type))
      return toast.error('Chỉ chấp nhận JPG, PNG')
    if (file.size > 5 * 1024 * 1024)
      return toast.error('Ảnh tối đa 5 MB')
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const mutation = useMutation({
    mutationFn: (data) => {
      const fd = new FormData()
      Object.entries(data).forEach(([k, v]) => { if (v !== '') fd.append(k, v) })
      if (avatarFile) fd.append('avatar', avatarFile)
      return api.updateMember(member.id, fd)
    },
    onSuccess: () => {
      toast.success('Đã cập nhật hồ sơ thành viên')
      qc.invalidateQueries(['treeData', currentTree?.id])
      qc.invalidateQueries(['members',  currentTree?.id])
      onClose()
    },
    onError: err => toast.error(err.response?.data?.message || 'Lỗi cập nhật'),
  })

  const handleSave = () => {
    if (!form.fullName.trim())      return toast.error('Họ tên không được để trống')
    if (form.fullName.length > 100) return toast.error('Họ tên tối đa 100 ký tự')
    if (form.nickname.length > 100) return toast.error('Tên gọi khác tối đa 100 ký tự')
    if (form.birthDate && form.birthDate > TODAY)
      return toast.error('Ngày sinh không được vượt ngày hiện tại')
    if (form.phone && !/^0\d{9,10}$/.test(form.phone))
      return toast.error('Số điện thoại phải bắt đầu bằng 0 và có 10-11 chữ số')
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      return toast.error('Email không đúng định dạng')
    if (form.occupation === '__other__' && !customOccupation.trim())
      return toast.error('Vui lòng nhập nghề nghiệp')
    if (form.hometown === '__other__' && !customHometown.trim())
      return toast.error('Vui lòng nhập quê quán')
    if (form.birthPlace === '__other__' && !customBirthPlace.trim())
      return toast.error('Vui lòng nhập nơi sinh')

    const payload = { ...form }
    if (payload.occupation === '__other__') payload.occupation = customOccupation.trim()
    if (payload.hometown   === '__other__') payload.hometown   = customHometown.trim()
    if (payload.birthPlace  === '__other__') payload.birthPlace  = customBirthPlace.trim()
    mutation.mutate(payload)
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

  return (
    <FloatModal
      title="Chỉnh sửa hồ sơ"
      subtitle={`${member?.fullName}`}
      onClose={onClose} width={600}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
        <div style={{
          width: 70, height: 70, borderRadius: '50%',
          background: '#fef3c7', border: '2px dashed #d4c9b8',
          overflow: 'hidden', flexShrink: 0, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => fileRef.current?.click()}>
          {avatarPreview
            ? <img src={avatarPreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt=""/>
            : <span style={{ fontSize: 14, color: '#8b5a2b' }}>Ảnh</span>
          }
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#5a3a1f', marginBottom: 4 }}>Ảnh đại diện</div>
          <button onClick={() => fileRef.current?.click()} style={{
            padding: '5px 12px', border: '1px solid #d4c9b8', borderRadius: 6,
            background: '#fef3c7', cursor: 'pointer', fontSize: 12, color: '#8b5a2b',
          }}>Chọn ảnh (JPG / PNG)</button>
          <div style={{ fontSize: 11, color: '#a16207', marginTop: 3 }}>Tối đa 5 MB</div>
        </div>
        <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png"
          style={{ display: 'none' }} onChange={handleAvatarChange}/>
      </div>

      <Section title="Thông tin cơ bản">
        <Grid2>
          <Field label="Họ và tên" required span={2}>
            <Input value={form.fullName} onChange={set('fullName')}
              placeholder="Nguyễn Văn A" maxLength={100}/>
          </Field>
          <Field label="Tên gọi khác">
            <Input value={form.nickname} onChange={set('nickname')}
              placeholder="Biệt danh..." maxLength={100}/>
          </Field>
          <Field label="Giới tính">
            <Select value={form.gender} onChange={set('gender')}>
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
            </Select>
          </Field>
          <Field label="Ngày tháng năm sinh">
            <Input type="date" value={form.birthDate} onChange={handleBirthDateChange} max={TODAY}/>
          </Field>
          <Field label="Ngày sinh (Âm lịch)">
            <Input value={form.birthDateLunar} onChange={set('birthDateLunar')} placeholder="VD: 15/08/1990"/>
          </Field>
          <Field label="Đời thứ">
            <Input type="number" value={form.generation} onChange={set('generation')} min={1} max={50}/>
          </Field>
        </Grid2>
      </Section>

      <Section title="Thông tin cư trú & Liên hệ">
        <Grid2>
          <Field label="Quê quán">
            <Select value={activeHometowns.some(c => c.label === form.hometown) || form.hometown === '__other__' || !form.hometown ? form.hometown : '__other__'}
              onChange={e => { setForm(f => ({...f, hometown: e.target.value})); if (e.target.value !== '__other__') setCustomHometown('') }}>
              <option value="">— Chọn quê quán —</option>
              {activeHometowns.map(c => <option key={c.value} value={c.label}>{c.label}</option>)}
              {form.hometown && !activeHometowns.some(c => c.label === form.hometown) && form.hometown !== '__other__' && (
                <option value={form.hometown}>{form.hometown} (cũ)</option>
              )}
              <option value="__other__">Khác...</option>
            </Select>
            {form.hometown === '__other__' && (
              <Input value={customHometown} onChange={e => setCustomHometown(e.target.value)} placeholder="Nhập quê quán..." style={{marginTop:4}}/>
            )}
          </Field>
          <Field label="Nghề nghiệp">
            <Select value={activeOccupations.some(c => c.label === form.occupation) || form.occupation === '__other__' || !form.occupation ? form.occupation : '__other__'}
              onChange={e => { setForm(f => ({...f, occupation: e.target.value})); if (e.target.value !== '__other__') setCustomOccupation('') }}>
              <option value="">— Chọn nghề nghiệp —</option>
              {activeOccupations.map(c => <option key={c.value} value={c.label}>{c.label}</option>)}
              {form.occupation && !activeOccupations.some(c => c.label === form.occupation) && form.occupation !== '__other__' && (
                <option value={form.occupation}>{form.occupation} (cũ)</option>
              )}
              <option value="__other__">Khác...</option>
            </Select>
            {form.occupation === '__other__' && (
              <Input value={customOccupation} onChange={e => setCustomOccupation(e.target.value)} placeholder="Nhập nghề nghiệp..." style={{marginTop:4}}/>
            )}
          </Field>
          <Field label="Nơi sinh">
            <Select value={activeHometowns.some(c => c.label === form.birthPlace) || form.birthPlace === '__other__' || !form.birthPlace ? form.birthPlace : '__other__'}
              onChange={e => { setForm(f => ({...f, birthPlace: e.target.value})); if (e.target.value !== '__other__') setCustomBirthPlace('') }}>
              <option value="">— Chọn nơi sinh —</option>
              {activeHometowns.map(c => <option key={c.value} value={c.label}>{c.label}</option>)}
              {form.birthPlace && !activeHometowns.some(c => c.label === form.birthPlace) && form.birthPlace !== '__other__' && (
                <option value={form.birthPlace}>{form.birthPlace} (cũ)</option>
              )}
              <option value="__other__">Khác...</option>
            </Select>
            {form.birthPlace === '__other__' && (
              <Input value={customBirthPlace} onChange={e => setCustomBirthPlace(e.target.value)} placeholder="Nhập nơi sinh..." style={{marginTop:4}}/>
            )}
          </Field>
          <Field label="Địa chỉ hiện tại">
            <Input value={form.address} onChange={set('address')} placeholder="Số nhà, đường, quận..."/>
          </Field>
          <Field label="Số điện thoại">
            <Input value={form.phone} onChange={set('phone')} placeholder="09xxxx..."/>
          </Field>
          <Field label="Email liên hệ">
            <Input value={form.email} type="email" onChange={set('email')} placeholder="email@..."/>
          </Field>
        </Grid2>
      </Section>

      <Section title="Tiểu sử / Ghi chú">
        <Textarea value={form.bio} onChange={set('bio')}
          placeholder="Ghi chú về cuộc đời, đóng góp, kỷ niệm..." rows={3}/>
      </Section>

      <ModalButtons onCancel={onClose} onOk={handleSave}
        loading={mutation.isPending} okLabel="Cập nhật" okColor="#b45309"/>
    </FloatModal>
  )
}
