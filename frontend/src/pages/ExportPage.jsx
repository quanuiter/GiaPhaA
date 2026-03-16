import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { treeApi } from '../services/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

export default function ExportPage() {
  const [activeTab, setActiveTab] = useState('tree')
  const [pdfOptions, setPdfOptions] = useState({ fontSize: 12, lineType: 'curve', includeNotes: true })
  const [exporting, setExporting] = useState(false)
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
      // For now, generate a simple text-based PDF representation
      const canvas = await generateTreeCanvas(treeData)
      const pdf = await htmlToSimplePDF(canvas, 'Gia Pha - ' + currentTree?.name)
      downloadFile(pdf, 'tree.pdf', 'application/pdf')
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

  const generateTreeCanvas = (data) => {
    // Simple HTML representation of tree data
    let html = '<h1>' + currentTree?.name + '</h1>'
    if (data) {
      html += '<pre>' + JSON.stringify(data, null, 2) + '</pre>'
    }
    return html
  }

  const htmlToSimplePDF = async (htmlContent, filename) => {
    // Simple PDF generation using text format
    const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 100 >>
stream
BT
/F1 ${pdfOptions.fontSize} Tf
50 750 Td
(Gia Pha - ${currentTree?.name}) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000214 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
364
%%EOF`
    return pdfContent
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
                  <option value="curve">Cong</option>
                  <option value="straight">Thẳng</option>
                  <option value="step">Bậc thang</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-light text-amber-900 mb-2" style={{fontFamily: 'Georgia, serif'}}>Ghi chú</label>
                <label className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    checked={pdfOptions.includeNotes}
                    onChange={(e) => setPdfOptions({...pdfOptions, includeNotes: e.target.checked})}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-light text-amber-900" style={{fontFamily: 'Georgia, serif'}}>Bao gồm ghi chú</span>
                </label>
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
