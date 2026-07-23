import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

function ProtectedRoute() {
  const token = localStorage.getItem('adminToken');

  if (!token) {
    // FAKE 404: Jika tidak ada token, jangan arahkan ke login, tampilkan pesan error 404 agar seolah-olah halamannya tidak ada
    return (
      <div style={{ textAlign: 'center', padding: '50px', fontFamily: 'sans-serif' }}>
        <h1>404 Not Found</h1>
        <p>Halaman yang Anda cari tidak ditemukan.</p>
        <a href="/">Kembali ke Beranda</a>
      </div>
    );
  }

  // Jika ada token, render children (halaman admin)
  return <Outlet />;
}

export default ProtectedRoute;
