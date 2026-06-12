import Link from 'next/link';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 px-6 py-4">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <img src="/images/logo.png" alt="Personify" className="w-7 h-7" />
          <span className="text-xl font-semibold">Personify</span>
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <p className="text-sm text-gray-400 mb-2">Last updated: June 2026</p>
        <h1 className="text-4xl font-bold mb-3">Privacy Policy</h1>
        <p className="text-gray-500 mb-10 text-base leading-relaxed">
          We're committed to handling your personal information responsibly and in accordance with the Australian Privacy Act 1988 and the Australian Privacy Principles (APPs).
        </p>

        <Section title="1. Who We Are">
          <p>Personify is a personal branding and AI content generation platform operated by Automates Agency, based in Australia. For any privacy matters, contact us at <a href="mailto:hello@automatesagency.com" className="text-brand-pink hover:underline">hello@automatesagency.com</a>.</p>
        </Section>

        <Section title="2. What We Collect">
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Account data:</strong> your name, email address, and password (stored as a one-way hash — we never see it in plain text)</li>
            <li><strong>Profile & persona data:</strong> your industry, brand tone, target audience, and profile picture — used to personalise AI outputs for you</li>
            <li><strong>Generated content:</strong> the prompts you submit and the images/text we generate for you</li>
            <li><strong>Founder page content:</strong> everything you enter into the Founder Page builder, including photos and business details</li>
            <li><strong>Usage data:</strong> how often you generate content, which features you use, and when you joined</li>
          </ul>
          <p className="mt-4">We do <strong>not</strong> collect payment card details directly — this will be handled by a secure payment processor when billing is introduced.</p>
        </Section>

        <Section title="3. How We Use Your Data">
          <ul className="list-disc pl-5 space-y-2">
            <li>To operate and improve the Personify platform</li>
            <li>To generate AI content based on your persona and prompts</li>
            <li>To display your Founder Page publicly if you choose to publish it</li>
            <li>To send you product updates and tips if you opt in</li>
          </ul>
          <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="font-semibold">We will never sell your data to any third party. Ever.</p>
          </div>
        </Section>

        <Section title="4. Third-Party Services — Important">
          <p className="mb-4">To deliver Personify, we rely on the following third-party tools and infrastructure. By using Personify, your data (including prompts and uploaded images) may be processed by these services. <strong>We strongly encourage you to read their individual privacy policies</strong>, as once data passes to these platforms, we cannot control how they store or use it on their end.</p>

          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Service</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Purpose</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Privacy Policy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  { name: 'Fal AI', purpose: 'AI image generation', url: 'https://fal.ai/legal/privacy-policy', label: 'fal.ai/legal/privacy-policy' },
                  { name: 'OpenAI (ChatGPT)', purpose: 'AI text generation', url: 'https://openai.com/privacy', label: 'openai.com/privacy' },
                  { name: 'Google', purpose: 'Sign-in with Google (OAuth)', url: 'https://policies.google.com/privacy', label: 'policies.google.com/privacy' },
                  { name: 'Cloudflare R2', purpose: 'Image and file storage', url: 'https://www.cloudflare.com/privacypolicy/', label: 'cloudflare.com/privacypolicy' },
                  { name: 'Railway', purpose: 'Cloud hosting and database', url: 'https://railway.app/legal/privacy', label: 'railway.app/legal/privacy' },
                ].map(row => (
                  <tr key={row.name}>
                    <td className="px-4 py-3 font-medium">{row.name}</td>
                    <td className="px-4 py-3 text-gray-600">{row.purpose}</td>
                    <td className="px-4 py-3">
                      <a href={row.url} target="_blank" rel="noopener noreferrer" className="text-brand-pink hover:underline">{row.label}</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            <strong>Please note:</strong> Fal AI's platform may utilise underlying AI infrastructure from providers including Google. We recommend reviewing both Fal AI's and Google's privacy policies for a complete picture of how your generation requests may be handled.
          </div>

          <p className="mt-4 text-sm text-gray-600">When you submit a prompt or upload an image, that data passes through Fal AI and/or OpenAI. We do not share your name or email with these services — only the content of your request. However, these platforms operate under their own data retention and usage policies that are entirely outside our control.</p>
        </Section>

        <Section title="5. Data Storage & Security">
          <p>Your personal data is stored in a secured PostgreSQL database hosted on Railway. Uploaded images and files are stored on Cloudflare R2, a secure cloud storage service. Passwords are hashed and never stored in plain text. All data in transit is protected via HTTPS.</p>
        </Section>

        <Section title="6. Your Rights">
          <p className="mb-3">Under the Australian Privacy Act, you have the right to:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Access the personal information we hold about you</li>
            <li>Request corrections to inaccurate information</li>
            <li>Request deletion of your account and associated data</li>
            <li>Complain to the <strong>Office of the Australian Information Commissioner (OAIC)</strong> if you believe your privacy rights have been breached</li>
          </ul>
          <p className="mt-4">To exercise any of these rights, contact us at <a href="mailto:hello@automatesagency.com" className="text-brand-pink hover:underline">hello@automatesagency.com</a>.</p>
        </Section>

        <Section title="7. Data Retention">
          <p>We retain your data for as long as your account remains active. If you delete your account, we will remove your personal data within 30 days, except where we are required by law to retain certain records.</p>
        </Section>

        <Section title="8. Age Restriction">
          <p>Personify is intended for users aged <strong>18 and over</strong>. If we become aware that a user is under 18, we will immediately terminate their account and delete their data.</p>
        </Section>

        <Section title="9. Changes to This Policy">
          <p>We may update this Privacy Policy from time to time. For significant changes, we will notify you by email or via an in-app notice. Continued use of Personify after changes are posted constitutes your acceptance of the updated policy.</p>
        </Section>

        <Section title="10. Contact & Complaints">
          <p>For privacy-related questions, data access requests, or complaints:</p>
          <p className="mt-2"><a href="mailto:hello@automatesagency.com" className="text-brand-pink hover:underline font-medium">hello@automatesagency.com</a></p>
          <p className="mt-3 text-sm text-gray-500">If you are unsatisfied with our response, you may lodge a complaint with the Office of the Australian Information Commissioner at <a href="https://www.oaic.gov.au" target="_blank" rel="noopener noreferrer" className="text-brand-pink hover:underline">oaic.gov.au</a>.</p>
        </Section>
      </main>

      <footer className="border-t border-gray-200 px-6 py-6 text-center text-sm text-gray-400">
        <p>© {new Date().getFullYear()} Automates Agency. All rights reserved.</p>
        <div className="flex justify-center gap-4 mt-2">
          <Link href="/terms" className="hover:text-gray-600 transition">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-gray-600 transition">Privacy Policy</Link>
        </div>
      </footer>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold mb-4 pb-2 border-b border-gray-100">{title}</h2>
      <div className="text-gray-700 leading-relaxed space-y-3">{children}</div>
    </section>
  );
}
