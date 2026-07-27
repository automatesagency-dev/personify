'use client'

import { useState, useEffect } from 'react';
import { referralAPI } from '../services/api';

const fmt = (cents) => `$${((cents || 0) / 100).toFixed(2)}`;

export default function ReferralEarnings() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('month'); // month | lifetime

  useEffect(() => {
    referralAPI.earnings().then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-gray-800 border-t-brand-pink rounded-full animate-spin" /></div>;
  }
  if (!data) return null;

  const earned = range === 'month' ? data.earnings.thisMonthCents : data.earnings.lifetimeCents;

  return (
    <div className="space-y-6">
      {/* Earnings + credit */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-dark-card border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">Earnings</span>
            <div className="inline-flex bg-black/40 border border-gray-800 rounded-lg p-0.5 text-[11px]">
              <button onClick={() => setRange('month')} className={`px-2 py-0.5 rounded ${range === 'month' ? 'bg-white text-black' : 'text-gray-400'}`}>This month</button>
              <button onClick={() => setRange('lifetime')} className={`px-2 py-0.5 rounded ${range === 'lifetime' ? 'bg-white text-black' : 'text-gray-400'}`}>Lifetime</button>
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{fmt(earned)}</p>
        </div>
        <div className="bg-dark-card border border-gray-800 rounded-2xl p-5">
          <p className="text-xs text-gray-400 mb-2">Available credit</p>
          <p className="text-2xl font-bold text-brand-pink">{fmt(data.credit.availableCents)}</p>
        </div>
        <div className="bg-dark-card border border-gray-800 rounded-2xl p-5">
          <p className="text-xs text-gray-400 mb-2">Pending (14-day hold)</p>
          <p className="text-2xl font-bold text-gray-300">{fmt(data.credit.pendingCents)}</p>
        </div>
      </div>

      {/* Referred users */}
      <div className="bg-dark-card border border-gray-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">People you referred</h3>
          <span className="text-xs text-gray-400">{data.activeCount} active / {data.referredCount} total</span>
        </div>
        {data.referredUsers.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">No referrals yet. Share your code to start earning.</p>
        ) : (
          <div className="space-y-1">
            {data.referredUsers.map((u, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 border-b border-gray-800 last:border-0">
                <div className="min-w-0">
                  <p className="text-sm text-white truncate">{u.name || u.email}</p>
                  <p className="text-xs text-gray-500">Joined {new Date(u.joinedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${u.active ? 'bg-green-500/15 text-green-400' : 'bg-gray-600/20 text-gray-400'}`}>
                  {u.active ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-600 leading-relaxed">
        You earn <strong className="text-gray-400">30%</strong> of a referral's first month, <strong className="text-gray-400">15%</strong> for the next 6 months
        (or <strong className="text-gray-400">20%</strong> one-time on annual plans), as account credit — available 14 days after each payment.
        Credit auto-applies to your subscription.
      </p>
    </div>
  );
}
