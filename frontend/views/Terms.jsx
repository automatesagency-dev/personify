import Link from 'next/link';

export default function Terms() {
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
        <h1 className="text-4xl font-bold mb-3">Terms of Service</h1>
        <p className="text-gray-500 mb-10 text-base leading-relaxed">
          Please read these terms carefully before using Personify. By creating an account, you agree to be bound by them.
        </p>

        <Section title="1. Acceptance of Terms">
          <p>By creating an account on Personify, you confirm that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree, you must not use this service.</p>
        </Section>

        <Section title="2. Eligibility">
          <p>You must be at least <strong>18 years of age</strong> to use Personify. By creating an account, you represent and warrant that you meet this requirement. We reserve the right to terminate accounts of users found to be under 18.</p>
        </Section>

        <Section title="3. What Personify Is">
          <p>Personify is an AI-assisted personal branding platform that enables you to generate images and written content, build a public Founder Page, and manage your personal brand identity using artificial intelligence tools.</p>
        </Section>

        <Section title="4. Your Account">
          <ul className="list-disc pl-5 space-y-2">
            <li>You are responsible for maintaining the security of your login credentials</li>
            <li>You must provide accurate and current information when signing up</li>
            <li>You may not create accounts on behalf of another person without their explicit consent</li>
            <li>One account per person — duplicate accounts may be removed without notice</li>
          </ul>
        </Section>

        <Section title="5. Acceptable Use">
          <p className="mb-3">You agree not to use Personify to:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Generate, upload, or publish content that is illegal, defamatory, harassing, hateful, or sexually explicit</li>
            <li>Impersonate any individual, business, or organisation</li>
            <li>Upload images or content you do not have the legal right to use</li>
            <li>Attempt to scrape, reverse-engineer, or otherwise abuse the platform or its API</li>
            <li>Circumvent any usage limits, access controls, or security measures</li>
          </ul>
          <p className="mt-3">We reserve the right to suspend or permanently terminate accounts that violate these rules, without notice.</p>
        </Section>

        <Section title="6. AI-Generated Content">
          <ul className="list-disc pl-5 space-y-2">
            <li>Content generated through Personify is produced by third-party AI models operated by Fal AI and OpenAI. We do not guarantee the accuracy, originality, quality, or fitness for purpose of any AI-generated output.</li>
            <li><strong>You are solely responsible</strong> for reviewing AI-generated content before publishing, distributing, or using it in any commercial context.</li>
            <li>AI-generated content may occasionally be inaccurate, biased, or produce unexpected results — this is an inherent limitation of current AI technology.</li>
            <li>Similar or identical outputs may be generated for other users. Personify makes no claim that generated content is unique to you.</li>
          </ul>
        </Section>

        <Section title="7. Intellectual Property">
          <ul className="list-disc pl-5 space-y-2">
            <li>You retain full ownership of content you upload to Personify (your photos, your written copy, your brand assets)</li>
            <li>By uploading content, you grant Automates Agency a limited, non-exclusive licence to store, display, and transmit that content solely for the purpose of providing the service to you</li>
            <li>The Personify platform, interface, branding, and underlying code are the intellectual property of Automates Agency and may not be copied or reproduced without permission</li>
          </ul>
        </Section>

        <Section title="8. Founder Pages">
          <ul className="list-disc pl-5 space-y-2">
            <li>If you publish your Founder Page, it becomes publicly accessible at your chosen URL</li>
            <li>You are solely responsible for the accuracy, legality, and appropriateness of all content on your published page</li>
            <li>We reserve the right to remove or unpublish pages that violate these Terms or applicable law, without prior notice</li>
          </ul>
        </Section>

        <Section title="9. Free Tier Limits">
          <p>The free tier currently includes a limited number of AI generations per month (10 image generations and 50 text generations). These limits are subject to change. We will provide reasonable notice of any significant reductions to free tier allowances.</p>
        </Section>

        <Section title="10. Billing, Subscriptions, Refunds and Referrals">
          <p>Personify offers paid subscription plans (Starter, Pro, and Studio), billed monthly or annually in Australian Dollars (AUD). Paid plans include a <strong>7-day free trial</strong> so you can evaluate the service before you are charged. If you cancel during the trial, you will not be charged.</p>
          <p className="mt-4">After the trial, subscriptions <strong>renew automatically</strong> at the end of each billing period until cancelled. You can cancel at any time from your billing settings; cancellation stops future charges, and your access continues until the end of your current paid period. If a renewal payment fails, paid features are paused until your payment method is updated. We will never charge you without your explicit consent, and we will give reasonable notice of any price changes.</p>
          <p className="mt-4">Because every paid plan includes a free trial to evaluate the service, we do <strong>not</strong> offer refunds for partial or unused subscription periods. We may issue refunds at our discretion.</p>
          <p className="mt-4"><strong>Referral rewards.</strong> If you refer a new customer using your referral link or code, you may earn rewards based on their payments: 30% of their first monthly payment and 15% of their next six monthly payments, or 20% of an annual payment (one-time). Rewards are issued as <strong>account credit only</strong> (no cash value or payout), become available 14 days after the referring payment, and stop if the referred customer cancels. Credit is applied automatically toward your own charges. Rewards may be withheld or reversed for cancelled, refunded, disputed, or fraudulent payments, and we may change or end the referral program at any time.</p>
          <p className="mt-4">Nothing in this section excludes or limits any rights you have under the <strong>Australian Consumer Law</strong>, including remedies for services that are faulty or not as described.</p>
        </Section>

        <Section title="11. Disclaimers">
          <p>Personify is provided on an <strong>"as is" and "as available"</strong> basis. We do not warrant uninterrupted availability, error-free operation, or that AI outputs will be accurate or suitable for your intended use. Nothing in these Terms limits any rights you may have under the <strong>Australian Consumer Law</strong>.</p>
        </Section>

        <Section title="12. Limitation of Liability">
          <p>To the maximum extent permitted by Australian law, Automates Agency's total liability to you for any claim arising out of or in connection with your use of Personify shall not exceed the total amount you have paid us in the 12 months preceding the claim, or <strong>AUD $50</strong>, whichever is greater.</p>
          <p className="mt-3">We are not liable for any indirect, incidental, consequential, or special damages, including loss of profit, loss of data, or loss of business opportunity.</p>
        </Section>

        <Section title="13. Termination">
          <p>We may suspend or terminate your access to Personify at any time if you breach these Terms. You may delete your account at any time from your Settings page. Upon termination, your data will be handled in accordance with our <Link href="/privacy" className="text-brand-pink hover:underline">Privacy Policy</Link>.</p>
        </Section>

        <Section title="14. Changes to These Terms">
          <p>We may update these Terms from time to time. We will give you reasonable advance notice of material changes via email or in-app notification. Continued use of Personify after updated Terms are posted constitutes your acceptance.</p>
        </Section>

        <Section title="15. Governing Law">
          <p>These Terms of Service are governed by and construed in accordance with the laws of <strong>New South Wales, Australia</strong>. Any disputes shall be subject to the exclusive jurisdiction of the courts of New South Wales.</p>
        </Section>

        <Section title="16. Contact">
          <p>For any questions about these Terms:</p>
          <p className="mt-2"><a href="mailto:hello@automatesagency.com" className="text-brand-pink hover:underline font-medium">hello@automatesagency.com</a></p>
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
