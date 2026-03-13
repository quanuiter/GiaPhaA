/**
 * AddChildModal — BM1: Thêm con mới cho thành viên
 *
 * Đường nối luôn từ người có fatherId/motherId = member.id (người mang huyết thống).
 */
import { useState, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { treeApi } from '../../../services/api'
import { useAuthStore } from '../../../store/authStore'
import {
  FloatModal, Section, Grid2, Field, Input, Select, Textarea, ModalButtons, InfoBanner,
} from '../FloatModal'

const TODAY = new Date().toISOString().slice(0, 10)

export default function AddChildModal({ member, onClose }) {
  const { currentTree } = useAuthStore()
  const api = treeApi(currentTree?.id)
  const qc  = useQueryClient()
  const fileRef = useRef()

  const childGen = (member?.generation ?? 1) + 1
  const isFather = member?.gender === 'male'

  const [form, setForm] = useState({
    fullName:   '', nickname:  '', gender: 'male',
    birthDate:  '', birthPlace:'', occupation: '',
    hometown:   '', address:   '', bio: '',
    generation: childGen,
    fatherId:   isFather ? member?.id : '',
    motherId:   !isFather ? member?.id : '',
  })
  const [avatarFile, setAvatarFile] = useState(null)
  const [preview, setPreview]       = useState(null)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleAvatar = (e) => {
    const file = e.target.files?.[0]; if (!file) return
    if (!['image/jpeg','image/png'].includes(file.type)) return toast.error('Chỉ JPG / PNG')
    if (file.size > 5*1024*1024) return toast.error('Tối đa 5 MB')
    setAvatarFile(file); setPreview(URL.createObjectURL(file))
  }

  const mutation = useMutation({
    mutationFn: () => {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => { if (v !== '') fd.append(k, String(v)) })
      if (avatarFile) fd.append('avatar', avatarFile)
      return api.createMember(fd)
    },
    onSuccess: () => {
      toast.success('Đã thêm con thành công')
      qc.invalidateQueries(['treeData', currentTree?.id])
      qc.invalidateQueries(['members',  currentTree?.id])
      onClose()
    },
    onError: err => toast.error(err.response?.data?.message || 'Lỗi thêm thành viên'),
  })

  const handleSave = () => {
    if (!form.fullName.trim())      return toast.error('Họ tên không được để trống')
    if (form.fullName.length > 100) return toast.error('Họ tên tối đa 100 ký tự')
    if (form.nickname.length > 100) return toast.error('Tên gọi khác tối đa 100 ký tự')
    if (form.birthDate && form.birthDate > TODAY)
      return toast.error('Ngày sinh không được vượt ngày hiện tại')
    mutation.mutate()
  }

  return (
    <FloatModal
      title="👶 Thêm con"
      subtitle={`Con của: ${member?.fullName}`}
      onClose={onClose} width={520}
    >
      <InfoBanner>
        {isFather ? '👨 Cha:' : '👩 Mẹ:'} <strong>{member?.fullName}</strong> (Đời {member?.generation})
        {' '}→ Con sẽ thuộc <strong>Đời {childGen}</strong>.
        Đường nối trên phả đồ xuất phát từ <strong>{isFather ? 'cha' : 'mẹ'}</strong>.
      </InfoBanner>

      {/* Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
        <div style={{
          width: 60, height: 60, borderRadius: '50%', background: '#f3f4f6',
          border: '2px dashed #d1d5db', overflow: 'hidden', flexShrink: 0,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => fileRef.current?.click()}>
          {preview
            ? <img src={preview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt=""/>
            : <span style={{ fontSize: 24 }}>📷</span>
          }
        </div>
        <div>
          <button onClick={() => fileRef.current?.click()} style={{
            padding: '5px 12px', border: '1px solid #d1d5db', borderRadius: 6,
            background: '#fff', cursor: 'pointer', fontSize: 12, color: '#374151',
          }}>Ảnh đại diện (JPG / PNG)</button>
          <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>Tối đa 5 MB</div>
        </div>
        <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png"
          style={{ display: 'none' }} onChange={handleAvatar}/>
      </div>

      <Section title="Thông tin cơ bản">
        <Grid2>
          <Field label="Họ và tên" required span={2}>
            <Input value={form.fullName} onChange={set('fullName')}
              placeholder="Nguyễn Văn Con..." maxLength={100}/>
          </Field>
          <Field label="Tên gọi khác">
            <Input value={form.nickname} onChange={set('nickname')}
              placeholder="Biệt danh..." maxLength={100}/>
          </Field>
          <Field label="Giới tính">
            <Select value={form.gender} onChange={set('gender')}>
              <option value="male">♂ Nam</option>
              <option value="female">♀ Nữ</option>
            </Select>
          </Field>
          <Field label="Ngày tháng năm sinh">
            <Input type="date" value={form.birthDate} onChange={set('birthDate')} max={TODAY}/>
          </Field>
          <Field label="Đời thứ">
            <Input type="number" value={form.generation} onChange={set('generation')} min={1} max={50}/>
          </Field>
        </Grid2>
      </Section>

      <Section title="Thông tin cư trú">
        <Grid2>
          <Field label="Quê quán">
            <Input value={form.hometown} onChange={set('hometown')} placeholder="Quê gốc..."/>
          </Field>
          <Field label="Nghề nghiệp">
            <Input value={form.occupation} onChange={set('occupation')} placeholder="Học sinh..."/>
          </Field>
          <Field label="Nơi sinh">
            <Input value={form.birthPlace} onChange={set('birthPlace')} placeholder="Hà Nội..."/>
          </Field>
          <Field label="Địa chỉ hiện tại">
            <Input value={form.address} onChange={set('address')} placeholder="Địa chỉ..."/>
          </Field>
        </Grid2>
      </Section>

      <Section title="Tiểu sử / Ghi chú">
        <Textarea value={form.bio} onChange={set('bio')} rows={2}
          placeholder="Ghi chú..."/>
      </Section>

      <ModalButtons onCancel={onClose} onOk={handleSave}
        loading={mutation.isPending} okLabel="➕ Thêm con" okColor="#10b981"/>
    </FloatModal>
  )
}