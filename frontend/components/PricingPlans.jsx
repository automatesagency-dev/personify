'use client'

import { useState, useEffect } from 'react';
import { billingAPI } from '../services/api';

const PLANS = [
  { key: 'free',    name: 'Free',    monthly: 0,  yearly: 0,   images: 10,  texts: 50,   blurb: 'Try it out',            features: ['10 images / month', '50 text generations / month', 'Freestyle + Brand Persona'] },
  { key: 'starter', name: 'Starter', monthly: 19, yearly: 190, images: 50,  texts: 150,  blurb: 'For getting started',   features: ['50 images / month', '150 text generations / month', 'Everything in Free'] },
  { key: 'pro',     name: 'Pro',     monthly: 49, yearly: 490, images: 200, texts: 500,  blurb: 'For regular creators',  popular: true, features: ['200 images / month', '500 text generations / month', 'Priority generation'] },
  { key: 'studio',  name: 'Studio',  monthly: 99, yearly: 990, images: 500, texts: 5000, blurb: 'For power users',       features: ['500 images / month', '5,000 text generations / month', 'Everything in Pro'] },
];

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

export default function PricingPlans() {
  const [interval, setBillingInterval] = useState('monthly');
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionKey, setActionKey] = useState(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [notice, setNotice] = useState(null);

  const loadSub = () => billingAPI.getSubscription().then((r) => setSub(r.data)).catch(() => {});

  useEffect(() => {
    loadSub().finally(() => setLoading(false));
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('checkout');
      if (p === 'success') setNotice({ type: 'success', text: 'Subscription updated — thank you! It may take a moment to reflect.' });
      if (p === 'cancelled') setNotice({ type: 'info', text: 'Checkout cancelled. No changes were made.' });
    }
  }, []);

  const currentPlan = sub?.plan || 'free';
  const hasSubscription = !!sub && ['active', 'trialing', 'past_due'].includes(sub.status);

  const subscribe = async (planKey) => {
    setActionKey(planKey);
    setNotice(null);
    try {
      const { data } = await billingAPI.checkout(planKey, interval);
      window.location.href = data.url;
    } catch (e) {
      setNotice({ type: 'error', text: e.response?.data?.error || 'Could not start checkout.' });
      setActionKey(null);
    }
  };

  const manageBilling = async () => {
    setPortalLoading(true);
    setNotice(null);
    try {
      const { data } = await billingAPI.portal();
      window.location.href = data.url;
    } catch (e) {
      setNotice({ type: 'error', text: e.response?.data?.error || 'Could not open billing portal.' });
      setPortalLoading(false);
    }
  };

  const statusLabel = () => {
    if (!sub) return '';
    if (sub.cancelAtPeriodEnd && sub.currentPeriodEnd) return `Cancels on ${fmtDate(sub.currentPeriodEnd)}`;
    if (sub.status === 'trialing' && sub.trialEndsAt) return `Free trial — ends ${fmtDate(sub.trialEndsAt)}`;
    if (sub.status === 'active' && sub.currentPeriodEnd) return `Renews on ${fmtDate(sub.currentPeriodEnd)}`;
    if (sub.status === 'past_due') return 'Payment due — please update your card';
    return '';
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-7 h-7 border-4 border-gray-800 border-t-brand-pink rounded-full animate-spin" />
      </div>
    );
  }

  const bar = (used, limit) => (
    <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
      <div className="bg-brand-pink h-full transition-all" style={{ width: `${Math.min((used / limit) * 100, 100)}%` }} />
    </div>
  );

  return (
    <div>
      {notice && (
        <div className={`mb-6 p-3 rounded-lg border text-sm ${
          notice.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400'
          : notice.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400'
          : 'bg-blue-500/10 border-blue-500/20 text-blue-300'
        }`}>{notice.text}</div>
      )}

      {/* Current plan + usage */}
      {sub && (
        <div className="bg-dark-card border border-gray-800 rounded-2xl p-5 md:p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-white font-semibold text-lg">{sub.planName} plan</h3>
                {sub.status && (
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    sub.status === 'active' ? 'bg-green-500/15 text-green-400'
                    : sub.status === 'trialing' ? 'bg-blue-500/15 text-blue-400'
                    : sub.status === 'past_due' ? 'bg-yellow-500/15 text-yellow-400'
                    : 'bg-gray-600/20 text-gray-400'
                  }`}>{sub.status === 'trialing' ? 'Trial' : sub.status}</span>
                )}
              </div>
              {statusLabel() && <p className="text-sm text-gray-400 mt-1">{statusLabel()}</p>}
            </div>
            {hasSubscription && (
              <button onClick={manageBilling} disabled={portalLoading}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50 whitespace-nowrap">
                {portalLoading ? 'Opening…' : 'Manage billing'}
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                <span>Images this period</span><span>{sub.usage.image} / {sub.limits.image}</span>
              </div>
              {bar(sub.usage.image, sub.limits.image)}
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                <span>Text this period</span><span>{sub.usage.text} / {sub.limits.text}</span>
              </div>
              {bar(sub.usage.text, sub.limits.text)}
            </div>
          </div>
        </div>
      )}

      {/* Header + interval toggle */}
      <div className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-semibold text-white mb-2">Choose your plan</h2>
        <p className="text-gray-400 mb-5">Prices in AUD. Cancel anytime.</p>
        <div className="inline-flex bg-black/40 border border-gray-800 rounded-xl p-1">
          <button onClick={() => setBillingInterval('monthly')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition ${interval === 'monthly' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}>Monthly</button>
          <button onClick={() => setBillingInterval('yearly')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition ${interval === 'yearly' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}>
            Yearly <span className="text-brand-pink">· 2 months free</span>
          </button>
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5">
        {PLANS.map((plan) => {
          const isCurrent = plan.key === currentPlan;
          const price = interval === 'monthly' ? plan.monthly : plan.yearly;
          const paid = plan.key !== 'free';

          let cta;
          if (isCurrent) {
            cta = <button disabled className="w-full py-3 bg-white/10 text-gray-300 rounded-lg font-semibold cursor-default">Current plan</button>;
          } else if (!paid) {
            cta = <button disabled className="w-full py-3 text-gray-500 rounded-lg font-medium cursor-default text-sm">Cancel to downgrade</button>;
          } else if (hasSubscription) {
            cta = <button onClick={manageBilling} disabled={portalLoading} className="w-full py-3 bg-white/10 hover:bg-white/15 text-white rounded-lg font-semibold transition disabled:opacity-50">Change in billing</button>;
          } else {
            cta = <button onClick={() => subscribe(plan.key)} disabled={actionKey === plan.key}
              className="w-full py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition disabled:opacity-50">
              {actionKey === plan.key ? 'Redirecting…' : 'Start 7-day trial'}</button>;
          }

          return (
            <div key={plan.key} className={`relative bg-dark-card rounded-2xl p-6 border ${plan.popular ? 'border-brand-pink' : 'border-gray-800'} flex flex-col`}>
              {plan.popular && <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-brand-pink text-white text-xs font-bold rounded-full">Most popular</span>}
              <h3 className="text-xl font-semibold text-white">{plan.name}</h3>
              <p className="text-xs text-gray-500 mb-4">{plan.blurb}</p>
              <div className="mb-1">
                <span className="text-4xl font-bold text-white">${price}</span>
                {paid && <span className="text-gray-400 text-sm"> /{interval === 'monthly' ? 'mo' : 'yr'}</span>}
              </div>
              <p className="text-xs text-gray-500 mb-5 h-4">
                {paid && interval === 'yearly' ? `$${(plan.yearly / 12).toFixed(0)}/mo billed annually` : paid ? 'billed monthly' : 'forever'}
              </p>
              <ul className="space-y-2.5 mb-6 flex-1">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-brand-pink mt-0.5 flex-shrink-0">✓</span> {f}
                  </li>
                ))}
              </ul>
              {cta}
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-gray-600 mt-6">
        Paid plans include a 7-day free trial. You can cancel anytime from Manage billing.
      </p>
    </div>
  );
}
