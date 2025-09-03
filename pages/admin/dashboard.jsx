// app/admin/dashboard/page.jsx
'use client';

import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export default function DashboardPage() {
  const router = useRouter();

  const handleLogout = () => {
    // Supprimer le cookie
    Cookies.remove('adminAuth');

    // Rediriger vers la page login
    router.push('/admin/login');
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Admin Dashboard</h1>
      <button 
        onClick={handleLogout} 
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#f00',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginTop: '1rem'
        }}
      >
        Déconnexion
      </button>
    </div>
  );
}
