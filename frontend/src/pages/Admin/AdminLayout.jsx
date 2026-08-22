import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/1974-SriBaduga');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="admin-container" style={{ display: 'flex', minHeight: '100vh' }}>

      {/* Sidebar - Tema AdminLTE (Dark) */}
      <aside style={{
        width: sidebarOpen ? '250px' : '0px',
        backgroundColor: '#1E1E1E',
        color: '#c2c7d0',
        transition: 'width 0.3s ease',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ padding: '15px 20px', borderBottom: '1px solid #4b545c', color: 'white', fontSize: '20px' }}>
          <b>Admin</b> Sri Baduga
        </div>

        <div style={{ padding: '20px' }}>
          <div style={{ color: '#4b545c', fontSize: '12px', fontWeight: 'bold', marginBottom: '10px', textTransform: 'uppercase' }}>
            Menu Utama
          </div>
          <nav>
            <Link to="/1974-SriBaduga/dashboard" style={{
              display: 'block', padding: '10px 15px', borderRadius: '4px', textDecoration: 'none',
              backgroundColor: isActive('/1974-SriBaduga/dashboard') ? '#C4A46C' : 'transparent',
              color: isActive('/1974-SriBaduga/dashboard') ? 'white' : '#c2c7d0',
              marginBottom: '5px'
            }}>
              Dashboard
            </Link>
            <Link to="/1974-SriBaduga/dashboard/datasets" style={{
              display: 'block', padding: '10px 15px', borderRadius: '4px', textDecoration: 'none',
              backgroundColor: isActive('/1974-SriBaduga/dashboard/datasets') ? '#C4A46C' : 'transparent',
              color: isActive('/1974-SriBaduga/dashboard/datasets') ? 'white' : '#c2c7d0',
              marginBottom: '5px'
            }}>
              Kelola Data koleksi
            </Link>
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#FAF6F0' }}>

        {/* Topbar */}
        <header style={{
          backgroundColor: 'white', padding: '10px 20px', borderBottom: '1px solid #dee2e6',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{
              background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#6c757d'
            }}>
              ☰
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Pencarian koleksi..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    navigate(`/1974-SriBaduga/dashboard/datasets?search=${encodeURIComponent(e.target.value)}`);
                  }
                }}
                style={{ padding: '6px 15px', paddingLeft: '35px', borderRadius: '20px', border: '1px solid #ced4da', width: '250px', outline: 'none', fontSize: '14px' }}
              />
              <span style={{ position: 'absolute', left: '12px', top: '7px', color: '#6c757d', fontSize: '14px' }}>🔍</span>
            </div>
            <button onClick={handleLogout} style={{
              backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '6px 12px',
              borderRadius: '4px', cursor: 'pointer', fontSize: '14px'
            }}>
              Logout
            </button>
          </div>
        </header>

        {/* Content */}
        <main style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
          <Outlet />
        </main>

        {/* Footer */}
        <footer style={{ backgroundColor: 'white', padding: '15px 20px', borderTop: '1px solid #dee2e6', fontSize: '14px', color: '#6c757d' }}>
          <strong>Copyright &copy; 2026 <a href="#" style={{ color: '#007bff', textDecoration: 'none' }}>Museum Sri Baduga</a>.</strong> All rights reserved.
        </footer>
      </div>
    </div>
  );
}

export default AdminLayout;
