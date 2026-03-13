import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { treeApi } from '../../../services/api'
import { useAuthStore } from '../../../store/authStore'
import { FloatModal, ModalButtons } from '../FloatModal'

export default function DeleteMemberModal({ member, onClose }) {
  const { currentTree } = useAuthStore()
  const api = treeApi(currentTree?.id)
  const qc  = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => api.deleteMember(member.id),
    onSuccess: () => {
      toast.success('Đã xóa thành viên')
      qc.invalidateQueries(['treeData', currentTree?.id])
      qc.invalidateQueries(['members',  currentTree?.id])
      onClose()
    },
    onError: err => toast.error(err.response?.data?.message || 'Không thể xóa thành viên này'),
  })

  return (
    <FloatModal title="🗑 Xác nhận xóa thành viên" onClose={onClose} width={380}>
      <p style={{ color: '#374151', fontSize: 14, lineHeight: 1.7, marginBottom: 14 }}>
        Bạn có chắc muốn xóa <strong style={{ color: '#111827' }}>"{member?.fullName}"</strong>?
      </p>
      <div style={{
        background: '#fef2f2', border: '1px solid #fecaca',
        borderRadius: 8, padding: '10px 14px',
        fontSize: 12, color: '#991b1b', lineHeight: 1.8,
      }}>
        ⚠️ <strong>Điều kiện xóa (theo QĐ1):</strong>
        <ul style={{ margin: '4px 0 0 16px', paddingLeft: 0 }}>
          <li>Không có hậu duệ trong hệ thống</li>
          <li>Chưa được ghi nhận kết thúc (mất)</li>
        </ul>
        <div style={{ marginTop: 6, color: '#dc2626' }}>
          ⚠️ Thao tác này <strong>không thể hoàn tác</strong>.
        </div>
      </div>
      <ModalButtons
        onCancel={onClose} onOk={() => mutation.mutate()}
        loading={mutation.isPending} okLabel="Xóa vĩnh viễn" danger/>
    </FloatModal>
  )
}