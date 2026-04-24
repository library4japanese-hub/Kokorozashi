import React from 'react';
import { motion } from 'motion/react';
import { Shield, Lock, Eye, FileText, ChevronLeft, X } from 'lucide-react';

interface ComplianceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ComplianceModal({ isOpen, onClose }: ComplianceModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-[40px] shadow-2xl border border-[#f0f0e8] overflow-hidden flex flex-col"
      >
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-[#f0f0e8] px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#5A5A40]/10 flex items-center justify-center text-[#5A5A40]">
              <Shield size={20} />
            </div>
            <h2 className="font-serif text-xl text-[#2c2c2c]">Legal & Compliance</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-[#f5f5f0] rounded-full transition-colors text-[#8e8e8e] hover:text-[#5A5A40]"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar">
          <div className="space-y-16">
            <section>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-[#5A5A40]/10 flex items-center justify-center text-[#5A5A40]">
                  <Shield size={28} />
                </div>
                <div>
                  <h1 className="font-serif text-3xl text-[#2c2c2c]">Privacy Policy</h1>
                  <p className="text-xs text-[#8e8e8e] uppercase tracking-widest font-bold mt-1">Effective Date: April 10, 2026</p>
                </div>
              </div>
              
              <div className="prose prose-stone max-w-none text-[#5A5A40]/80 leading-relaxed space-y-6">
                <p className="text-lg italic">Kokorozashi ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Japanese language learning platform.</p>
                
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-[#2c2c2c] border-b border-[#f0f0e8] pb-2">1. Information We Collect</h3>
                  <p><strong>Personal Data:</strong> We collect information that you voluntarily provide, such as your name, email address, and profile details during registration.</p>
                  <p><strong>Usage Data:</strong> We automatically collect information about your interactions with the platform, including study progress, quiz results, and AI tutor interactions.</p>
                  <p><strong>Voice Data:</strong> If you use our voice-to-text features, audio data is processed to provide transcription services but is not permanently stored on our servers.</p>
                  <p><strong>Cookies:</strong> We use cookies and similar tracking technologies to track activity on our Service and hold certain information to improve your experience.</p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-[#2c2c2c] border-b border-[#f0f0e8] pb-2">2. How We Use Your Information</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>To provide and maintain our Service, including tracking your learning progress.</li>
                    <li>To personalize your experience with our AI-driven tutor and content recommendations.</li>
                    <li>To communicate with you about updates, security alerts, and support.</li>
                    <li>To analyze usage patterns to improve our educational content and platform performance.</li>
                    <li>To prevent fraudulent activity and ensure the security of our users.</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-[#2c2c2c] border-b border-[#f0f0e8] pb-2">3. Data Sharing and Disclosure</h3>
                  <p>We do not sell your personal data. We may share information with third-party service providers (like Supabase for database services or Google for AI processing) only as necessary to provide the Service. These providers are obligated not to disclose or use the information for any other purpose.</p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-[#2c2c2c] border-b border-[#f0f0e8] pb-2">4. Data Retention</h3>
                  <p>We will retain your personal data only for as long as is necessary for the purposes set out in this Privacy Policy. You may request deletion of your data at any time through the account settings.</p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-[#2c2c2c] border-b border-[#f0f0e8] pb-2">5. Your Rights (GDPR & Global Standards)</h3>
                  <p>Depending on your location, you may have the following rights regarding your personal data:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>The right to access, update, or delete the information we have on you.</li>
                    <li>The right of rectification.</li>
                    <li>The right to object.</li>
                    <li>The right of restriction.</li>
                    <li>The right to data portability.</li>
                    <li>The right to withdraw consent.</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="pt-16 border-t border-[#f0f0e8]">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-[#5A5A40]/10 flex items-center justify-center text-[#5A5A40]">
                  <FileText size={28} />
                </div>
                <div>
                  <h1 className="font-serif text-3xl text-[#2c2c2c]">Terms of Service</h1>
                  <p className="text-xs text-[#8e8e8e] uppercase tracking-widest font-bold mt-1">Last Updated: April 10, 2026</p>
                </div>
              </div>
              
              <div className="prose prose-stone max-w-none text-[#5A5A40]/80 leading-relaxed space-y-6">
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-[#2c2c2c] border-b border-[#f0f0e8] pb-2">1. Acceptance of Terms</h3>
                  <p>By accessing or using Kokorozashi, you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.</p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-[#2c2c2c] border-b border-[#f0f0e8] pb-2">2. Educational Use</h3>
                  <p>Kokorozashi is an educational platform. While we strive for accuracy, AI-generated content (explanations, translations) should be verified with official learning materials.</p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-[#2c2c2c] border-b border-[#f0f0e8] pb-2">3. User Accounts</h3>
                  <p>You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account.</p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-[#2c2c2c] border-b border-[#f0f0e8] pb-2">4. Prohibited Conduct</h3>
                  <p>Users may not use the Service for any illegal purpose, to harass others, or to attempt to circumvent our security measures or AI usage limits. Specifically, you agree not to:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Use the Service in any way that violates any applicable local or international law.</li>
                    <li>Engage in any conduct that restricts or inhibits anyone's use or enjoyment of the Service.</li>
                    <li>Attempt to gain unauthorized access to, interfere with, damage, or disrupt any parts of the Service or the server on which the Service is stored.</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-[#2c2c2c] border-b border-[#f0f0e8] pb-2">5. Termination</h3>
                  <p>We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.</p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-[#2c2c2c] border-b border-[#f0f0e8] pb-2">6. Limitation of Liability</h3>
                  <p>In no event shall Kokorozashi, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.</p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-[#2c2c2c] border-b border-[#f0f0e8] pb-2">7. Changes to Terms</h3>
                  <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.</p>
                </div>
              </div>
            </section>

            <section className="pt-16 border-t border-[#f0f0e8]">
              <div className="bg-[#f5f5f0] rounded-[32px] p-10 border border-[#e8e4d9]">
                <div className="flex items-center gap-3 mb-4 text-[#5A5A40]">
                  <Lock size={24} />
                  <h3 className="font-serif text-xl">Security Commitment</h3>
                </div>
                <p className="text-sm text-[#5A5A40]/70 leading-relaxed">
                  We employ advanced security measures, including Row Level Security (RLS) and encrypted data transmission, to ensure your learning journey remains private and secure. For any compliance-related inquiries, please contact us at <span className="font-bold">library4japanese@gmail.com</span>.
                </p>
              </div>
            </section>
          </div>
        </div>
        
        <div className="p-6 border-t border-[#f0f0e8] bg-[#fdfcf9] flex justify-center">
          <button 
            onClick={onClose}
            className="px-10 py-3 bg-[#5A5A40] text-white rounded-2xl text-sm font-bold uppercase tracking-widest hover:bg-[#4a4a34] transition-all shadow-lg shadow-[#5A5A40]/20"
          >
            I Understand
          </button>
        </div>
      </motion.div>
    </div>
  );
}
