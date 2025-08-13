'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AuthGate from '@/app/components/AuthGate';

// A simple toast component
const Toast = ({ message, type, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';

  return (
    <div className={`fixed bottom-5 right-5 px-4 py-2 rounded-md text-white ${bgColor}`}>
      {message}
    </div>
  );
};

const AdminDashboard = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const fetchShops = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/shops');
      if (!res.ok) throw new Error('Failed to fetch shops');
      const data = await res.json();
      setShops(data.items || []);
    } catch (error) {
      console.error(error);
      setToast({ message: 'Failed to load shops.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  const handleVerify = async (shopDomain) => {
    setToast(null);
    try {
      const res = await fetch(`/api/admin/shops/${encodeURIComponent(shopDomain)}/verify`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.ok) {
        setToast({ message: `Verify OK! Status: ${data.status}, Themes: ${data.count}`, type: 'success' });
      } else {
        throw new Error(data.error || 'Verification failed');
      }
    } catch (error) {
      setToast({ message: `Error: ${error.message}`, type: 'error' });
    }
  };

  const handleUnlink = async (shopDomain) => {
    if (!window.confirm(`Are you sure you want to unlink ${shopDomain}? This is irreversible.`)) {
      return;
    }
    setToast(null);
    try {
      // The user requested POST, but DELETE is more appropriate. I'll use DELETE as implemented in the API route.
      const res = await fetch(`/api/admin/shops/${encodeURIComponent(shopDomain)}/unlink`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.ok) {
        setToast({ message: `${shopDomain} has been unlinked.`, type: 'success' });
        fetchShops(); // Refresh the list
      } else {
        throw new Error(data.error || 'Unlink failed');
      }
    } catch (error) {
      setToast({ message: `Error: ${error.message}`, type: 'error' });
    }
  };

  return (
    <AuthGate>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Admin Dashboard - Shops</h1>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-800 text-white">
                <tr>
                  <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Shop Domain</th>
                  <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Has Token</th>
                  <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Actions</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {shops.map((shop) => (
                  <tr key={shop.id} className="border-b">
                    <td className="text-left py-3 px-4">{shop.shopDomain}</td>
                    <td className="text-left py-3 px-4">{shop.hasToken ? '✅' : '❌'}</td>
                    <td className="text-left py-3 px-4">
                      <button
                        onClick={() => handleVerify(shop.shopDomain)}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded text-xs mr-2"
                      >
                        Vérifier
                      </button>
                      <button
                        onClick={() => handleUnlink(shop.shopDomain)}
                        className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-xs"
                      >
                        Unlink
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
      </div>
    </AuthGate>
  );
};

export default AdminDashboard;
