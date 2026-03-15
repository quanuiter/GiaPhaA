/**
 * AddSpouseModal — BM2: Thêm hôn nhân mới
 *
 * Theo QĐ2:
 *  - Chỉ thêm mới khi hôn nhân hiện tại đã là Ly hôn hoặc Góa (hoặc chưa có hôn nhân).
 *  - Có thể tạo vợ/chồng mới hoặc chọn thành viên có sẵn.
 *  - Fields: chồng/cha, vợ/mẹ, ngày kết hôn, địa điểm tổ chức, trạng thái, ngày kết thúc, ghi chú.
 */
import { useState } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { treeApi } from '../../../services/api'
import { useAuthStore } from '../../../store/authStore'
import {
  FloatModal, Section, Grid2, Field, Input, Select, Textarea,
  ModalButtons, InfoBanner,
} from '../FloatModal'

const TODAY = new Date().toISOString().slice(0, 10)

export default function AddSpouseModal({ member, onClose }) {
  const { currentTree } = useAuthStore()
  const api = treeApi(currentTree?.id)
  const qc  = useQueryClient()

  const isHusband   = member?.gender === 'male'
  const spouseLabel = isHusband ? 'vợ' : 'chồng'

  const [isNew, setIsNew] = useState(true)
  const [spouseForm, setSpouseForm] = useState({
    // Thông tin vợ/chồng mới (BM1)
    fullName: '', nickname: '', gender: isHusband ? 'female' : 'male',
    birthDate: '', birthPlace: '', occupation: '', hometown: '',
    address: '', bio: '',
    // Thông tin hôn nhân (BM2)
    marriageDate: '', venue: '', divorceDate: '', note: '',
    status: 'living',
    spouseId: '',   // khi chọn có sẵn
  })

  const set = k => e => setSpouseForm(f => ({ ...f, [k]: e.target.value }))

  // Danh sách thành viên có thể làm vợ/chồng
  const { data: allMembers = [] } = useQuery({
    queryKey: ['members', currentTree?.id],
    queryFn:  () => api.members().then(r => r.data),
    enabled:  !!currentTree?.id && !isNew,
  })
  const targetGender  = isHusband ? 'female' : 'male'
  const potentials    = allMembers.filter(m =>
    m.gender === targetGender && m.id !== member?.id
  )

  const createMember  = useMutation({ mutationFn: fd  => api.createMember(fd)   })
  const createMarriage = useMutation({
    mutationFn: data => api.createMarriage(data),
    onSuccess: () => {
      toast.success('Đã tạo hôn nhân thành công')
      qc.invalidateQueries(['treeData', currentTree?.id])
      qc.invalidateQueries(['members',  currentTree?.id])
      onClose()
    },
    onError: err => toast.error(err.response?.data?.message || 'Lỗi tạo hôn nhân'),
  })

  const handleSave = async () => {
    if (!member) return

    // Validate ngày
    if (spouseForm.marriageDate) {
      if (member.birthDate && spouseForm.marriageDate <= member.birthDate.slice(0,10))
        return toast.error('Ngày kết hôn phải sau ngày sinh')
      if (spouseForm.marriageDate > TODAY)
        return toast.error('Ngày kết hôn không được vượt ngày hiện tại')
    }

    let spouseId
    if (isNew) {
      if (!spouseForm.fullName.trim()) return toast.error(`Họ tên ${spouseLabel} không được để trống`)
      const fd = new FormData()
      const spouseData = {
        fullName: spouseForm.fullName.trim(), nickname: spouseForm.nickname,
        gender: spouseForm.gender, birthDate: spouseForm.birthDate,
        birthPlace: spouseForm.birthPlace, occupation: spouseForm.occupation,
        hometown: spouseForm.hometown, address: spouseForm.address,
        bio: spouseForm.bio, generation: member.generation,
      }
      Object.entries(spouseData).forEach(([k, v]) => { if (v) fd.append(k, String(v)) })
      try {
        const res = await createMember.mutateAsync(fd)
        spouseId = res.data.id
      } catch (err) {
        return toast.error(err.response?.data?.message || 'Lỗi tạo thành viên')
      }
    } else {
      if (!spouseForm.spouseId) return toast.error('Vui lòng chọn thành viên')
      spouseId = +spouseForm.spouseId
    }

    const husbandId = isHusband ? member.id : spouseId
    const wifeId    = isHusband ? spouseId   : member.id
    createMarriage.mutate({
      husbandId, wifeId,
      marriageDate: spouseForm.marriageDate || null,
      venue:        spouseForm.venue        || null,
      status:       spouseForm.status,
      divorceDate:  spouseForm.divorceDate  || null,
      note:         spouseForm.note         || null,
    })
  }

  const loading = createMember.isPending || createMarriage.isPending

  return (
    <FloatModal
      title={`Thêm hôn thê — ${member?.fullName}`}
      subtitle="Hệ thống sẽ kiểm tra huyết thống trước khi tạo"
      onClose={onClose} width={540}
    >
      {/* Toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[
          { v: true,  l: 'Tạo thành viên mới'   },
          { v: false, l: 'Chọn thành viên có sẵn' },
        ].map(({ v, l }) => (
          <button key={String(v)} onClick={() => setIsNew(v)} style={{
            flex: 1, padding: '8px', borderRadius: 8, cursor: 'pointer',
            border: `2px solid ${isNew === v ? '#d97706' : '#d4c9b8'}`,
            background: isNew === v ? '#fef3c7' : '#fff',
            color: isNew === v ? '#b45309' : '#8b5a2b',
            fontWeight: isNew === v ? 700 : 400, fontSize: 12,
            transition: 'all .15s',
          }}>{l}</button>
        ))}
      </div>

      {/* ── Thông tin vợ/chồng ─────────────────────────── */}
      {isNew ? (
        <>
          <Section title={`Thông tin ${spouseLabel}`}>
            <Grid2>
              <Field label={`Họ và tên ${spouseLabel}`} required span={2}>
                <Input value={spouseForm.fullName} onChange={set('fullName')}
                  placeholder="Họ và tên..." maxLength={100}/>
              </Field>
              <Field label="Tên gọi khác">
                <Input value={spouseForm.nickname} onChange={set('nickname')}
                  placeholder="Biệt danh..." maxLength={100}/>
              </Field>
              <Field label="Giới tính">
                <Select value={spouseForm.gender} onChange={set('gender')}>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                </Select>
              </Field>
              <Field label="Ngày sinh">
                <Input type="date" value={spouseForm.birthDate}
                  onChange={set('birthDate')} max={TODAY}/>
              </Field>
              <Field label="Nghề nghiệp">
                <Input value={spouseForm.occupation} onChange={set('occupation')}
                  placeholder="Nghề nghiệp..."/>
              </Field>
              <Field label="Quê quán">
                <Input value={spouseForm.hometown} onChange={set('hometown')}
                  placeholder="Quê gốc..."/>
              </Field>
              <Field label="Nơi sinh">
                <Input value={spouseForm.birthPlace} onChange={set('birthPlace')}
                  placeholder="Nơi sinh..."/>
              </Field>
              <Field label="Địa chỉ hiện tại" span={2}>
                <Input value={spouseForm.address} onChange={set('address')}
                  placeholder="Địa chỉ hiện tại..."/>
              </Field>
            </Grid2>
          </Section>
        </>
      ) : (
        <Section title={`Chọn ${spouseLabel}`}>
          <Field label={`Thành viên (${spouseLabel})`} required>
            <Select value={spouseForm.spouseId} onChange={set('spouseId')}>
              <option value="">— Chọn thành viên —</option>
              {potentials.map(x => (
                <option key={x.id} value={x.id}>
                  {x.fullName} (Đời {x.generation}{x.birthDate
                    ? ` · ${new Date(x.birthDate).getFullYear()}` : ''})
                </option>
              ))}
            </Select>
          </Field>
        </Section>
      )}

      {/* ── Thông tin hôn nhân (BM2) ────────────────────── */}
      <Section title="Thông tin hôn nhân (BM2)">
        <Grid2>
          <Field label="Ngày kết hôn">
            <Input type="date" value={spouseForm.marriageDate}
              onChange={set('marriageDate')} max={TODAY}/>
          </Field>
          <Field label="Địa điểm tổ chức">
            <Input value={spouseForm.venue} onChange={set('venue')}
              placeholder="Tên địa điểm..."/>
          </Field>
          <Field label="Trạng thái hôn nhân">
            <Select value={spouseForm.status} onChange={set('status')}>
              <option value="living">Đang sống chung</option>
              <option value="divorced">Ly hôn</option>
              <option value="widowed">Góa</option>
            </Select>
          </Field>
          <Field label="Ngày kết thúc (nếu có)">
            <Input type="date" value={spouseForm.divorceDate}
              onChange={set('divorceDate')} max={TODAY}
              disabled={spouseForm.status === 'living'}/>
          </Field>
          <Field label="Ghi chú" span={2}>
            <Textarea value={spouseForm.note} onChange={set('note')}
              placeholder="Ghi chú về hôn nhân..." rows={2}/>
          </Field>
        </Grid2>
      </Section>

      <InfoBanner color="#b45309" bg="#fef3c7">
        Hệ thống sẽ kiểm tra huyết thống trực hệ (mặc định 3 đời) trước khi tạo hôn nhân.
        Đường nối trên phả đồ sẽ hiển thị theo trạng thái:
        <strong> nâu = sống chung · cam nét đứt = ly hôn · be nét đứt = góa.</strong>
      </InfoBanner>

      <ModalButtons onCancel={onClose} onOk={handleSave}
        loading={loading} okLabel="Xác nhận" okColor="#b45309"/>
    </FloatModal>
  )
}
