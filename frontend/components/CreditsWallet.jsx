'use client'

import { useState, useEffect } from 'react';
import { billingAPI } from '../services/api';

const fmt = (c) => `$${((c || 0) / 100).toFixed(2)}`;

export default function CreditsWallet() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [notice, setNotice] = useState(null);

  const load = () => billingAPI.credits().then(r => setData(r.data)).catch(() => {});

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  const apply = async () => {
    setApplying(true);
    setNotice(null);
    try {
      const { data: res } = await billingAPI.applyCredit();
      setNotice({ type: 'success', text: `${fmt(res.appliedCents)} credit queued for your next payment.` });
      await load();
    } catch (e) {
      setNotice({ type: 'error', text: e.response?.data?.error || 'Could not apply credit.' });
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-10"><div className="w-6 h-6 border-4 border-gray-800 border-t-brand-pink rounded-full animate-spin" /></div>;
  }
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-1">Personify Credit</h2>
        <p className="text-sm text-gray-400">Earn credit through referrals and apply it to your subscription.</p>
      </div>

      {notice && (
        <div className={`p-3 rounded-lg border text-sm ${notice.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
          {notice.text}
        </div>
      )}

      {/* Balance + apply */}
      <div className="bg-dark-card border border-gray-800 rounded-2xl p-6">
        <p className="text-sm text-gray-400 mb-1">Available credit</p>
        <p className="text-4xl font-bold text-brand-pink mb-5">{fmt(data.availableCents)}</p>
        <button
          onClick={apply}
          disabled={applying || data.availableCents <= 0}
          className="w-full sm:w-auto px-6 py-3 bg-white text-black rounded-xl font-semibold hover:bg-gray-200 transition disabled:opacity-40"
        >
          {applying ? 'Applying…' : 'Apply to my next payment'}
        </button>
        <p className="text-xs text-gray-500 mt-3">Applied credit automatically reduces your next subscription charge.</p>
      </div>

      {/* Pending + queued */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-dark-card border border-gray-800 rounded-2xl p-5">
          <p className="text-xs text-gray-400 mb-1">Pending (14-day hold)</p>
          <p className="text-2xl font-bold text-gray-300">{fmt(data.pendingCents)}</p>
          <p className="text-xs text-gray-600 mt-1">Referral credit clears 14 days after each payment.</p>
        </div>
        <div className="bg-dark-card border border-gray-800 rounded-2xl p-5">
          <p className="text-xs text-gray-400 mb-1">Queued for next payment</p>
          <p className="text-2xl font-bold text-gray-300">{fmt(data.queuedCents)}</p>
          <p className="text-xs text-gray-600 mt-1">Credit already applied, waiting for your next invoice.</p>
        </div>
      </div>

      <p className="text-xs text-gray-600">Pay-per-image credit spending is coming soon.</p>
    </div>
  );
}
