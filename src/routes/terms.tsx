import { createFileRoute } from "@tanstack/react-router";
import { FileText, Mail, ArrowLeft, HelpCircle, ChevronDown, GraduationCap, Users, ShieldCheck, PenSquare } from "lucide-react";

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
          <button
            type="button"
            onClick={() => { if (window.history.length > 1) window.history.back(); else window.location.href = "/"; }}
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
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

        <FAQSection />
      </main>

      <footer className="border-t bg-card">
        <div className="mx-auto max-w-4xl px-6 py-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Edo State Universal Basic Education Board (SUBEB). All rights reserved.
        </div>
      </footer>
    </div>
  );
}

type FAQ = { q: string; a: string };
type FAQGroup = { title: string; icon: React.ComponentType<{ className?: string }>; items: FAQ[] };

const FAQ_GROUPS: FAQGroup[] = [
  {
    title: "Getting Started (All Users)",
    icon: HelpCircle,
    items: [
      { q: "How do I sign in to EdoLearn?", a: "Go to the login page and enter the email and password issued to you by your school or administrator. Learners can also use their Oracle ID where provided. If you forget your password, use 'Forgot password' on the login screen to receive a reset link." },
      { q: "I didn't receive my password reset email. What should I do?", a: "Check your spam or promotions folder first. If it still isn't there after 5 minutes, ask your teacher or school administrator to trigger a new reset from the admin dashboard." },
      { q: "Which devices does EdoLearn support?", a: "EdoLearn works on any modern browser (Chrome, Safari, Edge, Firefox) on desktop, tablet, or phone. Native Android and iOS apps are also available from the Google Play Store and Apple App Store." },
      { q: "Can I use EdoLearn offline?", a: "Some content (previously viewed lessons and notifications) is cached for offline access, but new courses, quizzes, virtual classes, and messages require an internet connection." },
      { q: "How do I update my profile or change my password?", a: "Open the sidebar and go to Settings. From there you can update your name, phone number, LGA, profile photo, and password." },
      { q: "How do I log out?", a: "Open the sidebar (menu icon on mobile) and tap your profile at the bottom, then choose Log out. You are also signed out automatically after a period of inactivity for your security." },
    ],
  },
  {
    title: "For Learners",
    icon: GraduationCap,
    items: [
      { q: "How do I enrol in a course?", a: "Go to Courses in the sidebar, browse the available courses for your class level, and click 'Enrol'. The course will then appear under My Courses on your dashboard." },
      { q: "How do I take a quiz or assessment?", a: "Open the course, scroll to the Quizzes section, and click 'Take Quiz'. You'll see your score and feedback immediately after submission, and your progress is saved automatically." },
      { q: "What is the AI Tutor and how do I use it?", a: "The AI Tutor is a chat assistant that helps you understand any topic. Open the AI Tutor from the sidebar or the floating widget, type your question, and get step-by-step explanations. Answers are for learning support, not official academic advice." },
      { q: "What is the VARK quiz?", a: "VARK identifies your learning style (Visual, Auditory, Reading/Writing, Kinesthetic). Take it once from your dashboard so the platform can recommend materials that suit how you learn best." },
      { q: "How do I join a virtual class?", a: "Go to Virtual Classes in the sidebar. Scheduled classes appear with a 'Join' button that becomes active a few minutes before the start time. Clicking Join opens the class link (usually Zoom)." },
      { q: "How do I earn a certificate?", a: "Complete all required lessons and pass the final quiz of a course. Certificates then appear under the Certificates page and can be downloaded as PDF." },
      { q: "How do I message my teacher?", a: "Open Messages in the sidebar, tap 'New message', and select your teacher from the list." },
    ],
  },
  {
    title: "For Teachers",
    icon: Users,
    items: [
      { q: "How do I create a new course?", a: "Go to Courses → Course Builder → 'Create course'. Add a title, description, class level, and cover image, then add lessons, materials, and quizzes. Publish when ready and learners in the target class can enrol." },
      { q: "How do I upload learning materials?", a: "Inside the course builder, use the Material Uploader to add PDFs, images, videos, or documents. Files are attached to the specific lesson and are visible to enrolled learners." },
      { q: "How do I create a quiz?", a: "From the course page, open Quizzes → 'New quiz'. Add questions (multiple choice, true/false, short answer), set the passing score, and publish. You can also let the AI Teaching Assistant generate a draft quiz from a topic or uploaded material." },
      { q: "How do I schedule a virtual class?", a: "Open Virtual Classes → 'Schedule class'. Provide the date, time, class level, and the meeting link (Zoom or similar). Enrolled learners will see it on their dashboard." },
      { q: "How do I track my learners' progress?", a: "The Teacher Summary and Reports panels on your dashboard show enrolment, quiz scores, activity, and completion per learner. You can filter by class and export the data." },
      { q: "How do I message learners or send announcements?", a: "Use Messages for direct one-to-one chats and Announcements for broadcasts to all learners in a class or course." },
      { q: "Can I award stickers or badges?", a: "Yes. Open Teacher Stickers on your dashboard, choose the learner and the sticker/badge, and it will appear on their profile and dashboard." },
    ],
  },
  {
    title: "For Sub Admin — Scripter",
    icon: PenSquare,
    items: [
      { q: "What can a Sub Admin – Scripter do?", a: "Scripters help build platform content — they can create and edit courses, quizzes, lessons, and learning materials, and review teacher-submitted content. They do not have full admin rights over user management or system settings." },
      { q: "Where do I create or edit content?", a: "Use Courses → Course Builder to create or edit courses, lessons, and quizzes exactly like a teacher would. Any content you publish is available to the appropriate class levels." },
      { q: "Is my activity tracked?", a: "Yes. Every action (course created, quiz edited, material uploaded, login) is logged. Admins can view your activity on the Admin Analytics and Performance pages." },
      { q: "Can I message teachers or learners?", a: "Yes. Open Messages to reach individual teachers, learners, or other scripters, and use Announcements for broadcasts you're authorized to send." },
      { q: "Who do I contact if I need more permissions?", a: "Reach out to a full Admin via Messages or email info@edostate.gov.ng. They can adjust your role or grant additional access." },
    ],
  },
  {
    title: "For Admins",
    icon: ShieldCheck,
    items: [
      { q: "How do I onboard many teachers or learners at once?", a: "From the Admin Dashboard, open Bulk Upload. Download the CSV template for teachers or learners, fill in the required columns, and upload. The platform processes up to 1000 rows per batch and reports any errors row-by-row." },
      { q: "What columns are required for the bulk upload?", a: "Teachers: full_name, phone_number, email, lga, school_type, class_taught, oracle_id, school_name, date_of_birth, password. Learners: email, full_name, class_level, lga, password, school_name, phone_number, and optional NIN." },
      { q: "How do I assign or change a user's role?", a: "Open Admin → Users, find the user, and update their role (Learner, Teacher, Sub Admin – Scripter, Admin). Roles are stored securely and take effect on the user's next login." },
      { q: "Where do I see platform analytics?", a: "Admin Analytics shows enrolments, quiz performance, activity trends, and content usage. Every chart and bar graph now shows data labels directly, so you don't need to click a bar to see the number." },
      { q: "How do I filter activity by date range for today only?", a: "On Admin → Performance → Activity by date range, set both the 'from' and 'to' dates to today's date (e.g. 07/07/2026 to 07/07/2026) to see today's activity." },
      { q: "How do I send a message to a group of users?", a: "Open Messages and start a new message. Admins can send to Teachers, Learners, or Sub Admins – Scripters individually or as a group, and use Announcements for platform-wide notices." },
      { q: "How do I track Sub Admin – Scripter activity?", a: "Their actions appear alongside teachers and admins in Admin Analytics and Admin Performance, with filters for role and date range." },
      { q: "How do I reset a user's password?", a: "From Admin → Users, select the user and click 'Send password reset'. They will receive an email with a reset link." },
    ],
  },
  {
    title: "Privacy, Safety & Support",
    icon: ShieldCheck,
    items: [
      { q: "Is my data safe on EdoLearn?", a: "Yes. All data is stored on secured servers with role-based access controls. Only authorized teachers, scripters, and admins tied to your school can see your learning records. See our Privacy Policy for full details." },
      { q: "How do I report inappropriate content or a user?", a: "Open the course, message, or profile and use the 'Report' option. Learners and parents can also report a teacher from the learner dashboard. All reports are reviewed by Edo SUBEB admins." },
      { q: "I found a bug or the site isn't working. Who do I tell?", a: "Email info@edostate.gov.ng with a short description of what you were doing and (if possible) a screenshot. Include the device and browser you were using." },
      { q: "How do I delete my account?", a: "Go to Settings → Account and choose 'Delete account'. Some records (such as issued certificates and audit logs) may be retained as required by law." },
    ],
  },
];

function FAQSection() {
  return (
    <section className="mt-12" aria-labelledby="faq-heading">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <HelpCircle className="h-5 w-5" />
        </div>
        <div>
          <h2 id="faq-heading" className="text-2xl font-bold tracking-tight text-foreground">Help & FAQs</h2>
          <p className="text-sm text-muted-foreground">Quick answers for learners, teachers, scripters, and admins.</p>
        </div>
      </div>

      <div className="space-y-8">
        {FAQ_GROUPS.map((group) => {
          const Icon = group.icon;
          return (
            <div key={group.title}>
              <div className="flex items-center gap-2 mb-3">
                <Icon className="h-4 w-4 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">{group.title}</h3>
              </div>
              <div className="rounded-lg border bg-card divide-y">
                {group.items.map((item) => (
                  <details key={item.q} className="group">
                    <summary className="flex cursor-pointer items-start justify-between gap-3 p-4 text-sm font-medium text-foreground list-none [&::-webkit-details-marker]:hidden hover:bg-accent/50 transition-colors">
                      <span>{item.q}</span>
                      <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">
                      {item.a}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg border bg-primary/5 p-4 text-sm text-muted-foreground">
        Still need help? Email <a href="mailto:info@edostate.gov.ng" className="font-medium text-primary hover:underline">info@edostate.gov.ng</a> or message an admin from within the platform.
      </div>
    </section>
  );
}
