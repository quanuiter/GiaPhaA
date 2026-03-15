import { useState, useRef, useMemo } from 'react'
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

  // Lấy dữ liệu spouses (vợ/chồng) từ cache của React Query
  const treeData = qc.getQueryData(['treeData', currentTree?.id])
  const members = treeData?.members || qc.getQueryData(['members', currentTree?.id]) || []
  const marriages = treeData?.marriages || []

  const spouses = useMemo(() => {
    return marriages
      .filter(m => isFather ? m.husbandId === member?.id : m.wifeId === member?.id)
      .map(m => isFather ? members.find(x => x.id === m.wifeId) : members.find(x => x.id === m.husbandId))
      .filter(Boolean)
  }, [marriages, members, member, isFather])

  const [form, setForm] = useState({
    fullName:   '', nickname:  '', gender: 'male',
    birthDate:  '', birthPlace:'', occupation: '',
    hometown:   '', address:   '', bio: '',
    generation: childGen,
    otherParentId: '', // ID của vợ/chồng được chọn
    isAdopted: false,  // Cờ nhận nuôi
  })
  const [avatarFile, setAvatarFile] = useState(null)
  const [preview, setPreview]       = useState(null)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target?.value ?? e }))

  const handleAvatar = (e) => {
    const file = e.target.files?.[0]; if (!file) return
    if (!['image/jpeg','image/png'].includes(file.type)) return toast.error('Chỉ JPG / PNG')
    if (file.size > 5*1024*1024) return toast.error('Tối đa 5 MB')
    setAvatarFile(file); setPreview(URL.createObjectURL(file))
  }

  const mutation = useMutation({
    mutationFn: () => {
      const fd = new FormData()
      
      // Tính toán lại fatherId và motherId dựa trên otherParentId và isAdopted
      let finalFatherId = isFather ? member?.id : (form.isAdopted ? null : form.otherParentId);
      let finalMotherId = !isFather ? member?.id : (form.isAdopted ? null : form.otherParentId);

      const payload = { ...form, fatherId: finalFatherId, motherId: finalMotherId }
      delete payload.otherParentId; // Không gửi field này lên server

      Object.entries(payload).forEach(([k, v]) => { 
        if (v !== '' && v !== null && v !== undefined) fd.append(k, String(v)) 
      })
      if (avatarFile) fd.append('avatar', avatarFile)
      
      return api.createMember(fd)
    },
    onSuccess: () => {
      toast.success('Đã thêm con thành công')
      qc.invalidateQueries({ queryKey: ['treeData', currentTree?.id] })
      qc.invalidateQueries({ queryKey: ['members',  currentTree?.id] })
      onClose()
    },
    onError: err => toast.error(err.response?.data?.message || 'Lỗi thêm thành viên'),
  })

  const handleSave = () => {
    if (!form.fullName.trim()) return toast.error('Họ tên không được để trống')
    if (!form.isAdopted && spouses.length > 0 && !form.otherParentId) {
       return toast.error('Vui lòng chọn người phối ngẫu (Bố/Mẹ còn lại) hoặc đánh dấu Nhận nuôi')
    }
    mutation.mutate()
  }

  return (
    <FloatModal
      title="Thêm con"
      subtitle={`Con của: ${member?.fullName}`}
      onClose={onClose} width={540}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
        <div style={{
          width: 60, height: 60, borderRadius: '50%', background: '#fef3c7',
          border: '2px dashed #d4c9b8', overflow: 'hidden', flexShrink: 0,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => fileRef.current?.click()}>
          {preview
            ? <img src={preview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt=""/>
            : <span style={{ fontSize: 14, color: '#8b5a2b' }}>Ảnh</span>
          }
        </div>
        <div>
          <button onClick={() => fileRef.current?.click()} style={{
            padding: '5px 12px', border: '1px solid #d4c9b8', borderRadius: 6,
            background: '#fef3c7', cursor: 'pointer', fontSize: 12, color: '#8b5a2b',
          }}>Ảnh đại diện (JPG/PNG)</button>
        </div>
        <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png"
          style={{ display: 'none' }} onChange={handleAvatar}/>
      </div>

      <Section title="Hệ thống gia đình">
        <Grid2>
          <Field label={isFather ? 'Mẹ (Vợ)' : 'Bố (Chồng)'} span={2}>
            <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
              <Select 
                value={form.otherParentId} 
                onChange={set('otherParentId')} 
                disabled={form.isAdopted}
                style={{ flex: 1 }}
              >
                <option value="">Chọn phối ngẫu</option>
                {spouses.map(sp => (
                  <option key={sp.id} value={sp.id}>{sp.fullName}</option>
                ))}
              </Select>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', cursor: 'pointer', color: '#8b5a2b' }}>
                <input 
                  type="checkbox" 
                  checked={form.isAdopted} 
                  onChange={(e) => setForm(f => ({ ...f, isAdopted: e.target.checked, otherParentId: '' }))} 
                  style={{ cursor: 'pointer' }}
                />
                Nhận nuôi / Không rõ
              </label>
            </div>
          </Field>
        </Grid2>
      </Section>

      <Section title="Thông tin cơ bản">
        <Grid2>
          <Field label="Họ và tên" required span={2}>
            <Input value={form.fullName} onChange={set('fullName')} placeholder="Nguyễn Văn Con..." maxLength={100}/>
          </Field>
          <Field label="Tên gọi khác">
            <Input value={form.nickname} onChange={set('nickname')} placeholder="Biệt danh..." maxLength={100}/>
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
            <Input type="number" value={form.generation} disabled />
          </Field>
        </Grid2>
      </Section>

      <ModalButtons onCancel={onClose} onOk={handleSave}
        loading={mutation.isPending} okLabel="Thêm con" okColor="#b45309"/>
    </FloatModal>
  )
}
