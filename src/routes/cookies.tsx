import { createFileRoute, Link } from "@tanstack/react-router";
import { Cookie, Mail, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/cookies")({
  head: () => ({
    meta: [
      { title: "Cookie Policy — EdoLearn" },
      { name: "description", content: "Cookie Policy for EdoLearn, the digital learning platform by Edo State Universal Basic Education Board (SUBEB)." },
      { property: "og:title", content: "Cookie Policy — EdoLearn" },
      { property: "og:description", content: "Cookie Policy for EdoLearn, the digital learning platform by Edo State Universal Basic Education Board (SUBEB)." },
      { property: "og:url", content: "https://edodlah.com/cookies" },
    ],
    links: [
      { rel: "canonical", href: "https://edodlah.com/cookies" },
    ],
  }),
  component: CookiePage,
});

function CookiePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
          <span className="text-sm font-semibold text-primary">EdoLearn</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Cookie className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Cookie Policy</h1>
            <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>

        <div className="prose prose-neutral max-w-none text-foreground/90">
          <p className="text-muted-foreground">
            Edo State Universal Basic Education Board (&quot;Edo SUBEB&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) uses cookies and similar technologies on the EdoLearn platform (&quot;Platform&quot;) to provide, protect, and improve our services. This Cookie Policy explains what cookies are, how we use them, and the choices you have regarding their use.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">1. What Are Cookies?</h2>
          <p className="text-muted-foreground">
            Cookies are small text files that are stored on your device (computer, tablet, or mobile) when you visit a website or use an application. They allow the site to recognize your device and store certain information about your preferences or past actions. Similar technologies include local storage, session storage, web beacons, and tracking pixels.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">2. Types of Cookies We Use</h2>
          <p className="text-muted-foreground">
            We use the following categories of cookies on the Platform:
          </p>
          <ul className="list-disc pl-5 text-muted-foreground space-y-1 mt-2">
            <li><strong>Strictly Necessary Cookies:</strong> Essential for the Platform to function properly. They enable core features such as authentication, session management, and security. Without these cookies, services you have asked for cannot be provided.</li>
            <li><strong>Functionality Cookies:</strong> Allow the Platform to remember choices you make (such as your preferred language, display settings, or VARK learning preference) and provide enhanced, personalized features.</li>
            <li><strong>Performance / Analytics Cookies:</strong> Collect information about how visitors use the Platform, such as which pages are visited most often and whether users receive error messages. This data is aggregated and anonymized, and is used solely to improve the Platform&apos;s performance and user experience.</li>
            <li><strong>Security Cookies:</strong> Used to authenticate users, prevent fraudulent use of login credentials, and protect user data from unauthorized parties.</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">3. How We Use Cookies</h2>
          <p className="text-muted-foreground">
            We use cookies and similar technologies for the following purposes:
          </p>
          <ul className="list-disc pl-5 text-muted-foreground space-y-1 mt-2">
            <li>To keep you signed in and maintain your session across visits.</li>
            <li>To remember your preferences and settings for a personalized experience.</li>
            <li>To analyze traffic patterns and usage trends to improve Platform functionality.</li>
            <li>To detect and prevent security threats, fraud, and abuse.</li>
            <li>To support AI tutoring and learning path personalization based on your activity.</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">4. Third-Party Cookies</h2>
          <p className="text-muted-foreground">
            We may allow trusted third-party service providers to place cookies on your device for the purposes described above. These providers include:
          </p>
          <ul className="list-disc pl-5 text-muted-foreground space-y-1 mt-2">
            <li>Analytics providers (to help us understand how users engage with the Platform).</li>
            <li>AI and tutoring service providers (to deliver personalized educational content).</li>
            <li>Cloud infrastructure and authentication services (to ensure secure and reliable access).</li>
          </ul>
          <p className="text-muted-foreground mt-2">
            We do not permit third parties to use cookies for advertising or tracking outside the scope of delivering our educational services.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">5. Your Choices</h2>
          <p className="text-muted-foreground">
            Most web browsers and mobile devices allow you to control cookies through their settings. You can:
          </p>
          <ul className="list-disc pl-5 text-muted-foreground space-y-1 mt-2">
            <li>View cookies stored on your device and delete them individually or all at once.</li>
            <li>Block all cookies or only third-party cookies.</li>
            <li>Set your browser to warn you before a cookie is placed.</li>
          </ul>
          <p className="text-muted-foreground mt-2">
            Please note that disabling or deleting cookies may affect the functionality of the Platform. Strictly necessary cookies cannot be disabled without compromising core features such as login and session management.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">6. Mobile App Specifics</h2>
          <p className="text-muted-foreground">
            When you use the EdoLearn mobile application, in addition to browser-style cookies, we may use local storage and device identifiers to maintain your session, store offline content, and deliver push notifications. These technologies serve the same purposes as cookies and are subject to the same protections outlined in this policy.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">7. Changes to This Cookie Policy</h2>
          <p className="text-muted-foreground">
            We may update this Cookie Policy from time to time to reflect changes in technology, regulation, or our practices. We will notify you of significant changes via the Platform or by email. Continued use of the Platform after updates constitutes acceptance of the revised policy.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">8. Contact Us</h2>
          <p className="text-muted-foreground">
            If you have any questions about this Cookie Policy or how we use cookies and similar technologies, please contact us:
          </p>
          <div className="mt-3 rounded-lg border bg-card p-4">
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-4 w-4 text-primary" />
              <div>
                <p className="font-medium text-foreground">Edo State Universal Basic Education Board</p>
                <p className="text-sm text-muted-foreground">Email: info@edostate.gov.ng</p>
                <p className="text-sm text-muted-foreground">Address: New Secretariat Complex, Benin City, Edo State, Nigeria</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t bg-card">
        <div className="mx-auto max-w-4xl px-6 py-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Edo State Universal Basic Education Board (SUBEB). All rights reserved.
        </div>
      </footer>
    </div>
  );
}
