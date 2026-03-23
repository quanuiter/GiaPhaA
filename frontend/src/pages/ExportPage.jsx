import { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { treeApi } from '../services/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { ReactFlowProvider } from '@xyflow/react'
import { FamilyFlow } from './TreePage'

export default function ExportPage() {
  const [activeTab, setActiveTab] = useState('tree')
  const [pdfOptions, setPdfOptions] = useState({ fontSize: 12, lineType: 'smoothstep', includeNotes: true, hideSpouses: false })
  const [exporting, setExporting] = useState(false)
  const treeRef = useRef(null)
  const currentTree = useAuthStore(s => s.currentTree)
  const userRole = useAuthStore(s => s.userRole)
  const treeId = currentTree?.id

  // Check if user has editor+ permission
  const canExport = ['admin', 'editor'].includes(userRole)

  const { data: allMembers = [], isLoading: membersLoading } = useQuery({
    queryKey: ['treeMembers', treeId],
    queryFn: () => treeApi(treeId).members().then(r => r.data),
    enabled: !!treeId
  })

  const { data: treeData = null, isLoading: treeDataLoading } = useQuery({
    queryKey: ['treeData', treeId],
    queryFn: () => treeApi(treeId).treeData().then(r => r.data),
    enabled: !!treeId && activeTab === 'tree'
  })

  const handleExportTreePDF = async () => {
    if (!canExport) {
      toast.error('Bạn không có quyền xuất file')
      return
    }

    setExporting(true)
    try {
      if (!treeRef.current) throw new Error('Không tìm thấy giao diện phả đồ để xuất')

      // 1. Tạm ẩn các nút điều khiển (Controls, MiniMap) để bản in PDF sạch sẽ
      const controls = treeRef.current.querySelector('.react-flow__controls')
      const minimap = treeRef.current.querySelector('.react-flow__minimap')
      if (controls) controls.style.display = 'none'
      if (minimap) minimap.style.display = 'none'

      // 2. TÍNH TOÁN BÙ TRỪ TỶ LỆ ZOOM (ZOOM COMPENSATION) ĐỂ HIỂN THỊ RÕ ĐƯỜNG NỐI
      // Khi cây gia phả quá lớn, React Flow tự động thu nhỏ (zoom out). VD: zoom = 0.1
      // Đường nối 2px sẽ bị thu nhỏ thành 0.2px trên màn hình, khiến html2canvas (vẽ pixel) bỏ qua.
      // => Giải pháp: Lấy tỷ lệ zoom hiện tại, ép độ dày đường nối tăng tỷ lệ nghịch với nó.
      const viewport = treeRef.current.querySelector('.react-flow__viewport')
      let currentZoom = 1
      if (viewport && viewport.style.transform) {
        const match = viewport.style.transform.match(/scale\(([^)]+)\)/)
        if (match && match[1]) currentZoom = parseFloat(match[1]) || 1
      }
      
      // Hệ số nhân bù trừ (VD: zoom 0.1 -> nhân 10 lần). Giới hạn max 40 để tránh lỗi vỡ nét.
      const strokeMultiplier = Math.min(Math.max(1 / currentZoom, 1), 40)

      const edges = treeRef.current.querySelectorAll('.react-flow__edges path')
      const originalStyles = []
      edges.forEach(edge => {
        // Lưu lại toàn bộ CSS gốc để khôi phục sau khi chụp
        originalStyles.push({ element: edge, cssText: edge.style.cssText })
        
        const currentWidth = parseFloat(edge.style.strokeWidth) || parseFloat(edge.getAttribute('stroke-width')) || 2
        edge.style.setProperty('stroke-width', `${currentWidth * strokeMultiplier}px`, 'important')
        
        // Bù trừ luôn cho khoảng cách nét đứt (đường ly hôn / mẹ con)
        const dashArray = edge.style.strokeDasharray || edge.getAttribute('stroke-dasharray')
        if (dashArray && dashArray !== 'none') {
          const newDash = dashArray.split(/[\s,]+/).filter(Boolean).map(n => parseFloat(n) * strokeMultiplier).join(' ')
          edge.style.setProperty('stroke-dasharray', newDash, 'important')
        }
        
        edge.style.setProperty('opacity', '1', 'important')
      })

      // 3. Xử lý lỗi MỜ ẢNH: Tăng scale lên 4 để chụp ảnh độ phân giải siêu nét (High DPI)
      const canvas = await html2canvas(treeRef.current, { 
        scale: 4, 
        useCORS: true,
        backgroundColor: '#faf6f0',
        logging: false
      })
      const imgData = canvas.toDataURL('image/jpeg', 1.0)
      
      // 4. Khôi phục lại giao diện hiển thị ban đầu
      originalStyles.forEach(({ element, cssText }) => { element.style.cssText = cssText })
      if (controls) controls.style.display = ''
      if (minimap) minimap.style.display = ''

      // 5. Tạo PDF giữ nguyên kích thước bố cục nhưng nén chất lượng ảnh 4x vào bên trong
      const pdfWidth = treeRef.current.offsetWidth
      const pdfHeight = treeRef.current.offsetHeight
      const pdf = new jsPDF({ orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait', unit: 'px', format: [pdfWidth, pdfHeight] })
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`Gia_Pha_${currentTree?.name || 'Tree'}.pdf`)

      toast.success('Xuất phả đồ thành công!')
    } catch (err) {
      toast.error('Lỗi xuất file: ' + err.message)
    } finally {
      setExporting(false)
    }
  }

  const handleExportExcel = async () => {
    if (!canExport) {
      toast.error('Bạn không có quyền xuất file')
      return
    }

    try {
      const csv = generateExcelCSV(allMembers)
      downloadFile(csv, 'danh-sach-thanh-vien.csv', 'text/csv;charset=utf-8;')
      toast.success('Xuất danh sách thành viên thành công!')
    } catch (err) {
      toast.error('Lỗi xuất file: ' + err.message)
    }
  }

  const generateExcelCSV = (members) => {
    const headers = ['STT', 'Họ và tên', 'Ngày sinh', 'Giới tính', 'Địa chỉ', 'Ghi chú']
    const rows = members.map((m, idx) => [
      idx + 1,
      m.fullName || '',
      m.birthDate ? new Date(m.birthDate).toLocaleDateString('vi-VN') : '',
      m.gender === 'M' ? 'Nam' : m.gender === 'F' ? 'Nữ' : '',
      m.address || '',
      m.notes || ''
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    return '\uFEFF' + csvContent // Add BOM for proper UTF-8 encoding
  }

  const downloadFile = (content, filename, mimeType) => {
    const element = document.createElement('a')
    element.setAttribute('href', 'data:' + mimeType + ';charset=utf-8,' + encodeURIComponent(content))
    element.setAttribute('download', filename)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  if (!canExport) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-light text-amber-950" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.1em'}}>Xuất Dữ Liệu</h2>
          <p className="text-amber-700 text-sm font-light mt-1" style={{fontFamily: 'Georgia, serif'}}>Xuất phả đồ hoặc danh sách thành viên</p>
        </div>

        <div className="flex justify-center items-center gap-3">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-amber-900 opacity-30"></div>
          <div className="text-amber-800 opacity-40" style={{fontSize: '0.8rem'}}>※</div>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-amber-900 opacity-30"></div>
        </div>

        <div className="bg-red-50 border-2 border-red-200 p-6 rounded-sm text-center">
          <p className="text-red-900 font-light" style={{fontFamily: 'Georgia, serif'}}>
            Bạn không có quyền xuất dữ liệu. Chỉ những người có quyền <span className="font-medium">Biên tập viên</span> trở lên mới có thể xuất file.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-light text-amber-950" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.1em'}}>Xuất Dữ Liệu</h2>
        <p className="text-amber-700 text-sm font-light mt-1" style={{fontFamily: 'Georgia, serif'}}>Xuất phả đồ hoặc danh sách thành viên</p>
      </div>

      <div className="flex justify-center items-center gap-3">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent to-amber-900 opacity-30"></div>
        <div className="text-amber-800 opacity-40" style={{fontSize: '0.8rem'}}>※</div>
        <div className="flex-1 h-px bg-gradient-to-l from-transparent to-amber-900 opacity-30"></div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-amber-200">
        <button
          onClick={() => setActiveTab('tree')}
          className={`px-4 py-3 font-light text-sm border-b-2 transition-colors ${
            activeTab === 'tree'
              ? 'border-amber-900 text-amber-950'
              : 'border-transparent text-amber-700 hover:text-amber-900'
          }`}
          style={{fontFamily: 'Georgia, serif'}}
        >
          Xuất Phả Đồ (PDF)
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`px-4 py-3 font-light text-sm border-b-2 transition-colors ${
            activeTab === 'members'
              ? 'border-amber-900 text-amber-950'
              : 'border-transparent text-amber-700 hover:text-amber-900'
          }`}
          style={{fontFamily: 'Georgia, serif'}}
        >
          Xuất Danh Sách (Excel)
        </button>
      </div>

      {/* Tree Export Tab */}
      {activeTab === 'tree' && (
        <div className="space-y-6">
          <div className="bg-amber-50 border-2 border-amber-200 p-6 rounded-sm space-y-4">
            <h3 className="text-lg font-light text-amber-950" style={{fontFamily: 'Georgia, serif'}}>Tùy chọn xuất phả đồ</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-light text-amber-900 mb-2" style={{fontFamily: 'Georgia, serif'}}>Kích cỡ chữ</label>
                <select
                  value={pdfOptions.fontSize}
                  onChange={(e) => setPdfOptions({...pdfOptions, fontSize: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-amber-200 rounded-sm text-sm focus:outline-none focus:border-amber-900 bg-white"
                  style={{fontFamily: 'Georgia, serif'}}
                >
                  <option value="10">Nhỏ (10pt)</option>
                  <option value="12">Vừa (12pt)</option>
                  <option value="14">Lớn (14pt)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-light text-amber-900 mb-2" style={{fontFamily: 'Georgia, serif'}}>Loại đường nối</label>
                <select
                  value={pdfOptions.lineType}
                  onChange={(e) => setPdfOptions({...pdfOptions, lineType: e.target.value})}
                  className="w-full px-3 py-2 border border-amber-200 rounded-sm text-sm focus:outline-none focus:border-amber-900 bg-white"
                  style={{fontFamily: 'Georgia, serif'}}
                >
                  <option value="smoothstep">Cong (Smoothstep)</option>
                  <option value="default">Cong (Bezier)</option>
                  <option value="straight">Thẳng</option>
                  <option value="step">Gấp khúc</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-light text-amber-900 mb-2" style={{fontFamily: 'Georgia, serif'}}>Tùy chọn khác</label>
                <div className="flex flex-col gap-2 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pdfOptions.includeNotes}
                      onChange={(e) => setPdfOptions({...pdfOptions, includeNotes: e.target.checked})}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-light text-amber-900" style={{fontFamily: 'Georgia, serif'}}>Bao gồm ghi chú</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pdfOptions.hideSpouses}
                      onChange={(e) => setPdfOptions({...pdfOptions, hideSpouses: e.target.checked})}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-light text-amber-900" style={{fontFamily: 'Georgia, serif'}}>Ẩn hôn phối</span>
                  </label>
                </div>
              </div>
            </div>

            {/* KHU VỰC RENDER PHẢ ĐỒ ĐỂ CHỤP PDF */}
            <div className="mt-8 bg-white border border-amber-200 rounded-sm overflow-hidden">
              <div className="p-4 border-b border-amber-200 bg-amber-50">
                <h4 className="text-sm font-medium text-amber-900" style={{fontFamily: 'Georgia, serif'}}>Bản xem trước khi xuất file:</h4>
              </div>
              {/* Cố định chiều cao lớn hơn (800px) để giảm bớt tỷ lệ bị thu nhỏ của cây */}
              <div ref={treeRef} className="w-full bg-[#faf6f0] h-[800px] relative">
                {treeDataLoading ? (
                  <div className="flex justify-center items-center h-full text-amber-900 font-light">Đang tải phả đồ...</div>
                ) : treeData ? (
                  <ReactFlowProvider>
                    <FamilyFlow data={treeData} edgeType={pdfOptions.lineType} hideSpouses={pdfOptions.hideSpouses} />
                  </ReactFlowProvider>
                ) : null}
              </div>
            </div>

            <button
              onClick={handleExportTreePDF}
              disabled={exporting || treeDataLoading}
              className="w-full py-3 bg-amber-900 text-white font-light hover:bg-amber-950 disabled:opacity-50 transition-colors rounded-sm mt-6"
              style={{fontFamily: 'Georgia, serif'}}
            >
              {exporting ? 'Đang xuất...' : 'Xuất Phả Đồ PDF'}
            </button>
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-sm">
            <p className="text-sm font-light text-blue-900" style={{fontFamily: 'Georgia, serif'}}>
              <span className="font-medium">Lưu ý:</span> File PDF sẽ chứa toàn bộ cấu trúc phả đồ với các tùy chọn bạn đã chọn.
            </p>
          </div>
        </div>
      )}

      {/* Members Export Tab */}
      {activeTab === 'members' && (
        <div className="space-y-6">
          <div className="bg-amber-50 border-2 border-amber-200 p-6 rounded-sm space-y-4">
            <h3 className="text-lg font-light text-amber-950" style={{fontFamily: 'Georgia, serif'}}>Xuất danh sách thành viên</h3>
            
            <p className="text-sm text-amber-800 font-light" style={{fontFamily: 'Georgia, serif'}}>
              File Excel sẽ chứa thông tin của tất cả <span className="font-medium">{allMembers.length}</span> thành viên trong cây gia phả:
              <br/>• Tên đầy đủ
              <br/>• Ngày sinh
              <br/>• Giới tính
              <br/>• Địa chỉ
              <br/>• Ghi chú
            </p>

            <button
              onClick={handleExportExcel}
              disabled={exporting || membersLoading}
              className="w-full py-3 bg-green-700 text-white font-light hover:bg-green-800 disabled:opacity-50 transition-colors rounded-sm mt-6"
              style={{fontFamily: 'Georgia, serif'}}
            >
              {exporting ? 'Đang xuất...' : 'Xuất Danh Sách Excel'}
            </button>
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-sm">
            <p className="text-sm font-light text-blue-900" style={{fontFamily: 'Georgia, serif'}}>
              <span className="font-medium">Lưu ý:</span> File sẽ được tải xuống dưới dạng CSV (hỗ trợ Excel, Google Sheets, v.v.)
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
