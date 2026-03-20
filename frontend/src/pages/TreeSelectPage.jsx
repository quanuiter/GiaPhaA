import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

export default function TreeSelectPage() {
  const navigate = useNavigate();
  const { setCurrentTree, logout, user } = useAuthStore();
  
  const [myTrees, setMyTrees] = useState([]);
  const [allTrees, setAllTrees] = useState([]); 
  const [isLoading, setIsLoading] = useState(true);
  
  const [joinTreeId, setJoinTreeId] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTreeName, setNewTreeName] = useState('');
  const [newTreeDesc, setNewTreeDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const myTreesRes = await api.get('/trees');
      setMyTrees(myTreesRes.data);
      
      const allTreesRes = await api.get('/trees/all');
      setAllTrees(allTreesRes.data);
    } catch (error) {
      toast.error('Lỗi tải dữ liệu hệ thống');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTree = (tree) => {
    // Nếu đang chờ duyệt thì không cho vào cây
    if (tree.myRole === 'pending') {
      toast('Gia phả này đang chờ quản trị viên duyệt!', { icon: '⏳' });
      return;
    }
    
    // Thay setTree(tree) thành:
    setCurrentTree(tree); 
    
    navigate('/');
  };

  const handleRequestJoin = async (e) => {
    e.preventDefault();
    if (!joinTreeId) return toast.error('Vui lòng chọn một cây gia phả');
    
    setIsJoining(true);
    try {
      await api.post(`/trees/${joinTreeId}/request-join`);
      toast.success('Đã gửi yêu cầu! Đang chờ Quản trị viên phê duyệt.');
      setJoinTreeId('');
      fetchData(); // Load lại để hiển thị cây đang pending
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi gửi yêu cầu');
    } finally {
      setIsJoining(false);
    }
  };

  const handleCreateTree = async (e) => {
    e.preventDefault();
    if (!newTreeName.trim()) return toast.error('Vui lòng nhập tên cây');
    
    setIsCreating(true);
    try {
      const res = await api.post('/trees', { 
        name: newTreeName.trim(), 
        description: newTreeDesc 
      });
      toast.success('Tạo cây gia phả thành công!');
      setShowCreateForm(false);
      setNewTreeName('');
      setNewTreeDesc('');
      fetchData(); 
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi tạo cây');
    } finally {
      setIsCreating(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-900 opacity-60"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfbf7] flex flex-col items-center pt-16 pb-10 px-4">
      <div className="absolute top-4 right-6 flex items-center gap-4">
        <span className="text-amber-900 font-medium" style={{ fontFamily: 'Georgia, serif' }}>
          Xin chào, {user?.username}
        </span>
        <button 
          onClick={handleLogout}
          className="text-sm border border-amber-900 text-amber-900 px-3 py-1 hover:bg-amber-900 hover:text-white transition-colors"
        >
          Đăng xuất
        </button>
      </div>

      <div className="w-full max-w-3xl space-y-10">
        <div className="text-center">
          <h1 className="text-4xl font-light text-amber-950 mb-3" style={{ fontFamily: 'Georgia, serif', letterSpacing: '0.05em' }}>
            Hệ Thống Gia Phả
          </h1>
          <p className="text-amber-800 font-light">Lựa chọn gia phả của bạn hoặc tạo mới để bắt đầu</p>
        </div>

        <div>
          <h2 className="text-xl text-amber-900 border-b border-amber-200 pb-2 mb-4 font-medium" style={{ fontFamily: 'Georgia, serif' }}>
            Gia phả của tôi
          </h2>
          
          {myTrees.length === 0 ? (
            <div className="bg-amber-50 border border-amber-200 p-8 text-center rounded text-amber-800 font-light">
              Bạn chưa tham gia cây gia phả nào. Vui lòng xin gia nhập hoặc tạo cây mới bên dưới.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myTrees.map(tree => {
                const isPending = tree.myRole === 'pending';
                return (
                  <div 
                    key={tree.id}
                    onClick={() => handleSelectTree(tree)}
                    className={`bg-white border-2 p-5 rounded transition-all group 
                      ${isPending ? 'border-gray-200 cursor-not-allowed opacity-80' : 'border-amber-100 cursor-pointer hover:border-amber-400 hover:shadow-md'}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className={`text-lg font-bold ${isPending ? 'text-gray-700' : 'text-amber-950 group-hover:text-amber-700'}`} style={{ fontFamily: 'Georgia, serif' }}>
                        {tree.name}
                      </h3>
                      <span className={`text-xs px-2 py-1 rounded 
                        ${isPending ? 'bg-gray-200 text-gray-700' : 'bg-amber-100 text-amber-800'}`}>
                        {tree.myRole === 'admin' ? 'Quản trị' : tree.myRole === 'editor' ? 'Biên tập' : tree.myRole === 'pending' ? 'Đang chờ duyệt' : 'Khách'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                      {tree.description || 'Không có mô tả'}
                    </p>
                    <div className="text-xs text-amber-700 flex items-center gap-2">
                      <i className="fa-solid fa-users"></i> {tree.memberCount} thành viên
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-amber-200">
          <div className="bg-white border border-amber-200 p-6 rounded shadow-sm">
            <h3 className="text-lg font-medium text-amber-950 mb-2" style={{ fontFamily: 'Georgia, serif' }}>Tham gia gia phả có sẵn</h3>
            <p className="text-sm text-amber-700 font-light mb-4">Gửi yêu cầu tham gia đến Quản trị viên của một họ tộc.</p>
            
            <form onSubmit={handleRequestJoin} className="flex flex-col gap-3">
              <select
                value={joinTreeId}
                onChange={(e) => setJoinTreeId(e.target.value)}
                className="w-full border border-amber-300 px-3 py-2 outline-none focus:border-amber-700 bg-amber-50"
              >
                <option value="">-- Chọn cây gia phả --</option>
                {allTrees.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              
              <button 
                type="submit" 
                disabled={isJoining || !joinTreeId} 
                className="bg-amber-900 text-white px-4 py-2 hover:bg-amber-800 disabled:opacity-50 transition-colors"
              >
                {isJoining ? 'Đang gửi...' : 'Gửi yêu cầu tham gia'}
              </button>
            </form>
          </div>

          <div className="bg-white border border-amber-200 p-6 rounded shadow-sm">
            <h3 className="text-lg font-medium text-amber-950 mb-2" style={{ fontFamily: 'Georgia, serif' }}>Tạo gia phả mới</h3>
            <p className="text-sm text-amber-700 font-light mb-4">Trở thành Quản trị viên và bắt đầu xây dựng cây gia phả của bạn.</p>
            
            {!showCreateForm ? (
              <button 
                onClick={() => setShowCreateForm(true)}
                className="w-full border-2 border-dashed border-amber-400 text-amber-700 px-4 py-2 hover:bg-amber-50 hover:border-amber-600 transition-colors"
              >
                + Khởi tạo gia phả mới
              </button>
            ) : (
              <form onSubmit={handleCreateTree} className="flex flex-col gap-3">
                <input 
                  type="text" 
                  placeholder="Tên họ tộc (VD: Gia phả họ Nguyễn)..." 
                  required
                  value={newTreeName}
                  onChange={(e) => setNewTreeName(e.target.value)}
                  className="border border-amber-300 px-3 py-2 outline-none focus:border-amber-700 bg-amber-50"
                />
                <textarea 
                  placeholder="Mô tả ngắn gọn (tùy chọn)..." 
                  rows="2"
                  value={newTreeDesc}
                  onChange={(e) => setNewTreeDesc(e.target.value)}
                  className="border border-amber-300 px-3 py-2 outline-none focus:border-amber-700 bg-amber-50 resize-none"
                />
                <div className="flex gap-2 mt-1">
                  <button type="submit" disabled={isCreating} className="flex-1 bg-amber-900 text-white py-2 hover:bg-amber-800 transition-colors">
                    {isCreating ? 'Đang tạo...' : 'Xác nhận tạo'}
                  </button>
                  <button type="button" onClick={() => setShowCreateForm(false)} className="px-4 py-2 border border-amber-300 text-amber-800 hover:bg-amber-50">
                    Hủy
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}