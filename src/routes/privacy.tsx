import { createFileRoute, Link } from "@tanstack/react-router";
import { Shield, Mail, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — EdoLearn" },
      { name: "description", content: "Privacy Policy for EdoLearn, the digital learning platform by Edo State Universal Basic Education Board (SUBEB)." },
      { property: "og:title", content: "Privacy Policy — EdoLearn" },
      { property: "og:description", content: "Privacy Policy for EdoLearn, the digital learning platform by Edo State Universal Basic Education Board (SUBEB)." },
      { property: "og:url", content: "https://edodlah.com/privacy" },
    ],
    links: [
      { rel: "canonical", href: "https://edodlah.com/privacy" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
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
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Privacy Policy</h1>
            <p className="text-sm text-muted-foreground">Effective date: {new Date().toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>

        <div className="prose prose-neutral max-w-none text-foreground/90">
          <p className="text-muted-foreground">
            Edo State Universal Basic Education Board ("Edo SUBEB", "we", "us", or "our") operates the EdoLearn mobile application and website (collectively, the "Platform"). This Privacy Policy describes how we collect, use, store, and protect your personal information when you use our services.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">1. Information We Collect</h2>
          <p className="text-muted-foreground">
            We collect the following types of information to provide and improve our educational services:
          </p>
          <ul className="list-disc pl-5 text-muted-foreground space-y-1 mt-2">
            <li><strong>Account Information:</strong> Name, email address, phone number, role (learner, teacher, administrator), school, and local government area.</li>
            <li><strong>Profile Information:</strong> Avatar, learning preferences, VARK assessment results, and course progress.</li>
            <li><strong>Usage Data:</strong> Courses accessed, quiz results, time spent on content, assignments submitted, and forum interactions.</li>
            <li><strong>Device Information:</strong> Device type, operating system, IP address, and app version for diagnostics and security.</li>
            <li><strong>Communications:</strong> Messages sent through the platform, announcements, and support requests.</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">2. How We Use Your Information</h2>
          <p className="text-muted-foreground">
            We use the information we collect for the following purposes:
          </p>
          <ul className="list-disc pl-5 text-muted-foreground space-y-1 mt-2">
            <li>To provide, maintain, and improve the Platform and educational services.</li>
            <li>To personalize learning experiences based on your progress and preferences.</li>
            <li>To enable communication between learners, teachers, and administrators.</li>
            <li>To generate performance reports and analytics for educational assessment.</li>
            <li>To send important notifications, course updates, and platform announcements.</li>
            <li>To ensure platform security, prevent fraud, and comply with legal obligations.</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">3. Information Sharing</h2>
          <p className="text-muted-foreground">
            We do not sell, rent, or trade your personal information. We may share information in the following limited circumstances:
          </p>
          <ul className="list-disc pl-5 text-muted-foreground space-y-1 mt-2">
            <li><strong>With Educators:</strong> Teachers and school administrators can view learner progress and performance data relevant to their classes.</li>
            <li><strong>Service Providers:</strong> We may engage trusted third-party vendors to assist with hosting, analytics, and AI tutoring services, bound by confidentiality agreements.</li>
            <li><strong>Legal Requirements:</strong> We may disclose information if required by law, court order, or to protect our rights and safety.</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">4. Data Security</h2>
          <p className="text-muted-foreground">
            We implement industry-standard security measures to protect your data, including:
          </p>
          <ul className="list-disc pl-5 text-muted-foreground space-y-1 mt-2">
            <li>Encryption of data in transit (HTTPS/TLS) and at rest.</li>
            <li>Role-based access controls to limit data visibility to authorized users only.</li>
            <li>Regular security audits and vulnerability assessments.</li>
            <li>Secure authentication with password hashing and session management.</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">5. Data Retention</h2>
          <p className="text-muted-foreground">
            We retain your personal information for as long as your account is active or as needed to provide you with our services. Educational records may be retained longer as required by Nigerian education regulations. When you delete your account, we will remove or anonymize your personal data within a reasonable timeframe, except where retention is required by law.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">6. Your Rights</h2>
          <p className="text-muted-foreground">
            Depending on applicable law, you may have the right to:
          </p>
          <ul className="list-disc pl-5 text-muted-foreground space-y-1 mt-2">
            <li>Access, update, or correct your personal information.</li>
            <li>Request deletion of your account and associated data.</li>
            <li>Withdraw consent for optional data processing.</li>
            <li>File a complaint with a data protection authority.</li>
          </ul>
          <p className="text-muted-foreground mt-2">
            To exercise these rights, please contact us using the information below.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">7. Children's Privacy</h2>
          <p className="text-muted-foreground">
            The Platform is designed for basic education learners. We collect minimal personal information from learners and require parental or guardian consent where required by law. We do not knowingly collect data from children under the applicable minimum age without proper authorization.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">8. Third-Party Services</h2>
          <p className="text-muted-foreground">
            The Platform may integrate with third-party services (e.g., AI tutoring, video conferencing, analytics). These services have their own privacy policies, and we encourage you to review them. We are not responsible for the privacy practices of third-party providers.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">9. Changes to This Policy</h2>
          <p className="text-muted-foreground">
            We may update this Privacy Policy from time to time. We will notify you of significant changes via email or through the Platform. Continued use of the Platform after changes constitutes acceptance of the revised policy.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">10. Contact Us</h2>
          <p className="text-muted-foreground">
            If you have questions or concerns about this Privacy Policy or our data practices, please contact us:
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
