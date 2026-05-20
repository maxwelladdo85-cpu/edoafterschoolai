import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, Mail, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — EdoLearn" },
      { name: "description", content: "Terms of Service for EdoLearn, the digital learning platform by Edo State Universal Basic Education Board (SUBEB)." },
      { property: "og:title", content: "Terms of Service — EdoLearn" },
      { property: "og:description", content: "Terms of Service for EdoLearn, the digital learning platform by Edo State Universal Basic Education Board (SUBEB)." },
      { property: "og:url", content: "https://edodlah.com/terms" },
    ],
    links: [
      { rel: "canonical", href: "https://edodlah.com/terms" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
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
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Terms of Service</h1>
            <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>

        <div className="prose prose-neutral max-w-none text-foreground/90">
          <p className="text-muted-foreground">
            These Terms of Service ("Terms") govern your access to and use of the EdoLearn platform ("Platform"), operated by Edo State Universal Basic Education Board ("Edo SUBEB", "we", "us", or "our"). By creating an account or using the Platform, you agree to be bound by these Terms. If you do not agree, you must not use the Platform.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">1. Eligibility and Accounts</h2>
          <p className="text-muted-foreground">
            The Platform is intended for learners, teachers, and administrators within Edo State's basic education system. To use the Platform, you must:
          </p>
          <ul className="list-disc pl-5 text-muted-foreground space-y-1 mt-2">
            <li>Be enrolled in or employed by an accredited basic education institution under Edo SUBEB, or be an authorized administrator.</li>
            <li>Provide accurate, complete, and current information during registration.</li>
            <li>Maintain the security of your account credentials and promptly notify us of any unauthorized access.</li>
            <li>Be at least the minimum age required by Nigerian law to consent to these Terms, or have verifiable parental or guardian consent.</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">2. Platform Use</h2>
          <p className="text-muted-foreground">
            You are granted a limited, non-exclusive, non-transferable license to use the Platform for its intended educational purposes. You agree that you will not:
          </p>
          <ul className="list-disc pl-5 text-muted-foreground space-y-1 mt-2">
            <li>Use the Platform for any illegal, harmful, or unauthorized purpose.</li>
            <li>Upload, share, or distribute content that is offensive, discriminatory, infringing, or otherwise inappropriate for an educational environment.</li>
            <li>Attempt to gain unauthorized access to any part of the Platform, other users' accounts, or our backend systems.</li>
            <li>Interfere with or disrupt the integrity or performance of the Platform, including through automated scripts, bots, or denial-of-service attacks.</li>
            <li>Reverse engineer, decompile, or extract source code from the Platform or its associated mobile applications.</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">3. User-Generated Content</h2>
          <p className="text-muted-foreground">
            Teachers and administrators may create and upload courses, quizzes, assignments, announcements, and other educational materials ("Content"). By uploading Content, you represent that you have the right to do so and that it does not violate any third-party rights.
          </p>
          <p className="text-muted-foreground mt-2">
            You retain ownership of your Content, but you grant Edo SUBEB a non-exclusive, royalty-free license to use, reproduce, modify, and distribute such Content on the Platform for the purpose of delivering educational services. We reserve the right to remove any Content that violates these Terms or is otherwise objectionable.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">4. Intellectual Property</h2>
          <p className="text-muted-foreground">
            All software, designs, logos, trademarks, and other materials provided by Edo SUBEB on the Platform are the property of Edo SUBEB or its licensors and are protected by Nigerian and international intellectual property laws. You may not use our trademarks or branding without prior written consent.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">5. AI Tutoring and Automated Services</h2>
          <p className="text-muted-foreground">
            The Platform includes AI-powered tutoring and assessment features. While we strive for accuracy, AI-generated responses are provided for educational assistance only and should not be relied upon as definitive academic or professional advice. Edo SUBEB is not liable for errors, omissions, or misunderstandings arising from AI-generated content.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">6. Termination</h2>
          <p className="text-muted-foreground">
            We may suspend or terminate your account and access to the Platform at any time, with or without notice, for conduct that we believe violates these Terms or is harmful to other users, the Platform, or Edo SUBEB. You may also delete your account at any time through your profile settings.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">7. Disclaimers</h2>
          <p className="text-muted-foreground">
            The Platform is provided "as is" and "as available" without warranties of any kind, either express or implied. We do not warrant that the Platform will be uninterrupted, error-free, secure, or free from viruses or other harmful components. Your use of the Platform is at your own risk.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">8. Limitation of Liability</h2>
          <p className="text-muted-foreground">
            To the maximum extent permitted by law, Edo SUBEB and its officers, employees, agents, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or relating to your use of the Platform, even if advised of the possibility of such damages.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">9. Governing Law</h2>
          <p className="text-muted-foreground">
            These Terms shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts in Edo State, Nigeria.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">10. Changes to These Terms</h2>
          <p className="text-muted-foreground">
            We may update these Terms from time to time. We will notify you of material changes via email or through the Platform. Your continued use of the Platform after changes take effect constitutes your acceptance of the revised Terms.
          </p>

          <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">11. Contact Us</h2>
          <p className="text-muted-foreground">
            If you have any questions about these Terms of Service, please contact us:
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
