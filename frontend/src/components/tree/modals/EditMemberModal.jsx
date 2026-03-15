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
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { treeApi } from '../../../services/api'
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
    gender:     'male', birthDate: '',
    birthPlace: '', occupation: '',
    hometown:   '', address: '',
    bio:        '', generation: 1,
  })
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)

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
      address:    member.address    ?? '',
      bio:        member.bio        ?? '',
      generation: member.generation ?? 1,
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
    mutationFn: () => {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => { if (v !== '') fd.append(k, v) })
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
    mutation.mutate()
  }

  return (
    <FloatModal
      title="Chỉnh sửa hồ sơ"
      subtitle={`${member?.fullName}`}
      onClose={onClose} width={540}
    >
      {/* ── Ảnh đại diện ───────────────────────────────── */}
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
            <Input value={form.occupation} onChange={set('occupation')} placeholder="Giáo viên..."/>
          </Field>
          <Field label="Nơi sinh">
            <Input value={form.birthPlace} onChange={set('birthPlace')} placeholder="Hà Nội..."/>
          </Field>
          <Field label="Địa chỉ hiện tại">
            <Input value={form.address} onChange={set('address')} placeholder="Số nhà, đường, quận..."/>
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
