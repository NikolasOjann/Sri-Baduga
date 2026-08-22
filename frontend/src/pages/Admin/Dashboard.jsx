import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { Library, Image as ImageIcon, Wrench, Hammer, Box, Eye, EyeOff } from 'lucide-react';

// Registrasi komponen ChartJS
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

function Dashboard() {
  const [stats, setStats] = useState({});
  const [total, setTotal] = useState(0);
  const [publicCount, setPublicCount] = useState(0);
  const [privateCount, setPrivateCount] = useState(0);
  const [otherStats, setOtherStats] = useState({
    dokumentasi: 0,
    konservasi: 0,
    restorasi: 0,
    penyimpanan: 0
  });

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    fetch(('http://' + window.location.hostname + ':3001/api/admin/stats'), {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setStats(data.klasifikasi || {});
        setTotal(data.total || 0);
        setPublicCount(data.publicCount || 0);
        setPrivateCount(data.privateCount || 0);
        setOtherStats({
          dokumentasi: data.dokumentasiCount || 0,
          konservasi: data.konservasiCount || 0,
          restorasi: data.restorasiCount || 0,
          penyimpanan: data.penyimpananCount || 0
        });
      })
      .catch(err => console.error("Gagal mengambil data statistik:", err));
  }, []);

  const chartData = {
    labels: Object.keys(stats),
    datasets: [
      {
        label: 'Jumlah Artefak per Klasifikasi',
        data: Object.values(stats),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Statistik Klasifikasi Artefak Museum (Bar)',
        font: { size: 16 }
      },
    },
  };

  const pieColors = [
    '#2196F3', // blue
    '#FF4081', // pink
    '#FF9800', // orange
    '#FFC107', // amber
    '#00BCD4', // cyan
    '#9C27B0', // purple
    '#BDBDBD', // grey
    '#03A9F4', // light blue
    '#E91E63', // deeper pink
    '#FF5722', // deep orange
    '#4CAF50'  // green for Lainnya
  ];

  // Pie chart 1
  const pieData1 = {
    labels: Object.keys(stats),
    datasets: [
      {
        data: Object.values(stats),
        backgroundColor: pieColors,
        borderWidth: 1,
        borderColor: '#ffffff',
      },
    ],
  };

  const pieOptions1 = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { boxWidth: 20, padding: 15 }
      },
      title: {
        display: true,
        text: 'Total Koleksi Berdasarkan Klasifikasi',
        font: { size: 16 },
        padding: { top: 10, bottom: 20 }
      },
    },
  };

  // Pie chart 2 (Mockup data untuk Konservasi Tahun 2026)
  const pieData2 = {
    labels: ['Etnografika'],
    datasets: [
      {
        data: [49],
        backgroundColor: ['#2196F3'],
        borderWidth: 1,
        borderColor: '#ffffff',
      },
    ],
  };

  const pieOptions2 = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { boxWidth: 20, padding: 15 }
      },
      title: {
        display: true,
        text: 'Total Koleksi Konservasi Tahun 2026',
        font: { size: 16 },
        padding: { top: 10, bottom: 20 }
      },
    },
  };

  return (
    <div>
      <h1 style={{ margin: '0 0 20px 0', fontSize: '24px', fontWeight: 'bold', color: '#1E1E1E' }}>Dashboard Ringkasan</h1>
      
      {/* Level 1 - Ringkasan Utama */}
      <h2 style={{ fontSize: '18px', color: '#666', marginBottom: '15px' }}>Ringkasan Utama</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        {[
          { label: 'Koleksi', value: total, icon: <Library size={30} color="#C4A46C" /> },
          { label: 'Dokumentasi', value: otherStats.dokumentasi, icon: <ImageIcon size={30} color="#007bff" /> },
          { label: 'Konservasi', value: otherStats.konservasi, icon: <Wrench size={30} color="#28a745" /> },
          { label: 'Restorasi', value: otherStats.restorasi, icon: <Hammer size={30} color="#dc3545" /> },
          { label: 'Penyimpanan', value: otherStats.penyimpanan, icon: <Box size={30} color="#6c757d" /> }
        ].map(item => (
          <div key={item.label} style={{ 
            backgroundColor: '#FFFFFF', borderRadius: '8px', padding: '20px',
            display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ marginBottom: '15px' }}>{item.icon}</div>
            <h3 style={{ fontSize: '36px', margin: '0 0 5px 0', fontWeight: 'bold', color: '#1E1E1E' }}>{item.value}</h3>
            <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>{item.label}</p>
          </div>
        ))}
      </div>

      {/* Level 2 - Klasifikasi Koleksi */}
      <h2 style={{ fontSize: '18px', color: '#666', marginBottom: '15px' }}>Klasifikasi Koleksi</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' }}>
        {Object.keys(stats).filter(k => k !== 'Lainnya').map(klasifikasi => {
          const val = stats[klasifikasi];
          const isEmpty = val === 0;
          const isDominant = klasifikasi === 'Etnografika'; // As requested
          
          return (
            <div key={klasifikasi} style={{ 
              backgroundColor: '#FFFFFF', borderRadius: '6px', padding: '15px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              opacity: isEmpty ? 0.5 : 1,
              border: isDominant ? '2px solid #C4A46C' : '1px solid #eee'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <p style={{ margin: '0', fontSize: '14px', fontWeight: isDominant ? 'bold' : 'normal', color: isDominant ? '#C4A46C' : '#333' }}>
                  {klasifikasi}
                </p>
                <h4 style={{ margin: '0', fontSize: '18px', fontWeight: 'bold', color: '#1E1E1E' }}>
                  {isEmpty ? '-' : val}
                </h4>
              </div>
              
              {/* Progress bar tipis */}
              <div style={{ height: '4px', backgroundColor: '#eee', borderRadius: '2px', overflow: 'hidden', marginBottom: '8px' }}>
                <div style={{ 
                  height: '100%', 
                  width: total > 0 ? `${(val / total) * 100}%` : '0%', 
                  backgroundColor: isDominant ? '#C4A46C' : '#007bff' 
                }}></div>
              </div>

              {isEmpty && (
                <p style={{ margin: '0', fontSize: '12px', color: '#999', fontStyle: 'italic' }}>Belum ada data</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Level 3 - Akses */}
      <h2 style={{ fontSize: '18px', color: '#666', marginBottom: '15px' }}>Status Akses</h2>
      <div style={{ display: 'flex', gap: '20px', marginBottom: '40px' }}>
        <div style={{ 
          flex: '1', backgroundColor: '#e8f5e9', border: '1px solid #c8e6c9', borderRadius: '8px', padding: '20px',
          display: 'flex', alignItems: 'center', gap: '15px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
        }}>
          <Eye size={36} color="#2e7d32" />
          <div>
            <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#2e7d32', fontWeight: 'bold' }}>Public</p>
            <h3 style={{ fontSize: '28px', margin: '0', fontWeight: 'bold', color: '#1b5e20' }}>{publicCount}</h3>
          </div>
        </div>
        <div style={{ 
          flex: '1', backgroundColor: '#ffebee', border: '1px solid #ffcdd2', borderRadius: '8px', padding: '20px',
          display: 'flex', alignItems: 'center', gap: '15px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
        }}>
          <EyeOff size={36} color="#c62828" />
          <div>
            <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#c62828', fontWeight: 'bold' }}>Private</p>
            <h3 style={{ fontSize: '28px', margin: '0', fontWeight: 'bold', color: '#b71c1c' }}>{privateCount}</h3>
          </div>
        </div>
      </div>

      {/* Area Grafik Pie */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
        <div style={{ 
          flex: '1 1 45%', backgroundColor: 'white', padding: '20px', borderRadius: '4px', 
          boxShadow: '0 0 1px rgba(0,0,0,.125), 0 1px 3px rgba(0,0,0,.2)' 
        }}>
          <div style={{ height: '400px' }}>
            <Pie data={pieData1} options={pieOptions1} />
          </div>
        </div>
        
        <div style={{ 
          flex: '1 1 45%', backgroundColor: 'white', padding: '20px', borderRadius: '4px', 
          boxShadow: '0 0 1px rgba(0,0,0,.125), 0 1px 3px rgba(0,0,0,.2)' 
        }}>
          <div style={{ height: '400px' }}>
            <Pie data={pieData2} options={pieOptions2} />
          </div>
        </div>
      </div>

      {/* Area Grafik Bar (Yang lama tetap dipertahankan di bawah) */}
      <div style={{ 
        backgroundColor: 'white', padding: '20px', borderRadius: '4px', 
        borderTop: '3px solid #007bff', boxShadow: '0 0 1px rgba(0,0,0,.125), 0 1px 3px rgba(0,0,0,.2)' 
      }}>
        <div style={{ height: '400px' }}>
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
