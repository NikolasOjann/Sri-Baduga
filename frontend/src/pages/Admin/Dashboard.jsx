import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Registrasi komponen ChartJS
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function Dashboard() {
  const [stats, setStats] = useState({});
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetch('http://localhost:3001/api/collections/stats/counts')
      .then(res => res.json())
      .then(countsData => {
        // 10 Klasifikasi Standar Museum
        const standardCategories = [
          'Geologika', 'Biologika', 'Etnografika', 'Arkeologika', 'Historika',
          'Numismatika', 'Filologika', 'Keramologika', 'Seni Rupa', 'Teknologika'
        ];

        const finalCounts = {};
        let totalArtifacts = 0;

        // Inisialisasi 10 kategori dengan nilai 0
        standardCategories.forEach(cat => {
          finalCounts[cat] = 0;
        });

        // Masukkan data dari backend, cocokkan dengan kategori standar
        Object.keys(countsData).forEach(key => {
          totalArtifacts += countsData[key];
          
          let matchedCategory = standardCategories.find(c => c.toLowerCase() === key.toLowerCase());
          
          if (matchedCategory) {
            finalCounts[matchedCategory] += countsData[key];
          } else {
            // Jika ada klasifikasi di luar 10 standar, masukkan ke 'Lainnya'
            finalCounts['Lainnya'] = (finalCounts['Lainnya'] || 0) + countsData[key];
          }
        });

        setStats(finalCounts);
        setTotal(totalArtifacts);
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
        text: 'Statistik Klasifikasi Artefak Museum',
        font: { size: 16 }
      },
    },
  };

  return (
    <div>
      <h1 style={{ margin: '0 0 20px 0', fontSize: '24px', fontWeight: 'normal' }}>Dashboard</h1>
      
      {/* Kartu Statistik */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
        <div style={{ 
          flex: 1, backgroundColor: '#17a2b8', color: 'white', borderRadius: '4px', padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)'
        }}>
          <h3 style={{ fontSize: '38px', margin: '0 0 10px 0', fontWeight: 'bold' }}>{total}</h3>
          <p style={{ margin: 0, fontSize: '16px' }}>Total Dataset Diekstrak</p>
        </div>
        <div style={{ 
          flex: 1, backgroundColor: '#28a745', color: 'white', borderRadius: '4px', padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)'
        }}>
          <h3 style={{ fontSize: '38px', margin: '0 0 10px 0', fontWeight: 'bold' }}>{Object.keys(stats).length}</h3>
          <p style={{ margin: 0, fontSize: '16px' }}>Kategori Klasifikasi</p>
        </div>
      </div>

      {/* Area Grafik */}
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
