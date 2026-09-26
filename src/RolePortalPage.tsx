import React, { useState } from 'react';
import { ShieldCheck, UserCheck, Sparkles, ArrowRight, Lock, KeyRound, CheckCircle2, ChevronRight, BarChart3, Users, Receipt } from 'lucide-react';
import './RolePortalPage.css';
import { SecureVaultLock, SecureReportGateModal } from './SecureVaultLock';

interface RolePortalPageProps {
  onSelectEmployee: () => void;
  onSelectOwner: () => void;
  customerCount: number;
}

export function RolePortalPage({
  onSelectEmployee,
  onSelectOwner,
  customerCount,
}: RolePortalPageProps) {
  const [showOwnerVaultModal, setShowOwnerVaultModal] = useState(false);

  return (
    <div className="role-portal-container">
      {/* Ambient background glow orbs */}
      <div className="portal-glow-orb orb-1" />
      <div className="portal-glow-orb orb-2" />

      <header className="portal-header">
        <div className="portal-brand">
          <div className="portal-brand-mark">
            <Sparkles size={24} />
          </div>
          <div>
            <h1>Al Uzer</h1>
            <span>COMMON SERVICES • CRM SUITE</span>
          </div>
        </div>
        <p className="portal-tagline">
          Select your role to access the workspace. Owner data is protected with 6-digit cryptographic security.
        </p>
      </header>

      <div className="portal-cards-grid">
        {/* EMPLOYEE PORTAL CARD */}
        <div className="portal-card employee-card">
          <div className="card-badge employee-badge">
            <UserCheck size={14} />
            <span>OPERATIONAL DESK</span>
          </div>

          <div className="card-icon-wrapper employee-icon">
            <UserCheck size={32} />
          </div>

          <h2>Employee Portal</h2>
          <p className="card-desc">
            Quick counter operations. Add new customer jobs, generate bills, and log daily counter collections.
          </p>

          <ul className="card-features-list">
            <li>
              <CheckCircle2 size={16} className="feature-icon check" />
              <span><strong>Add Customer Records</strong> & work types</span>
            </li>
            <li>
              <CheckCircle2 size={16} className="feature-icon check" />
              <span><strong>Log Kirkol & Spendings</strong> in real-time</span>
            </li>
            <li>
              <CheckCircle2 size={16} className="feature-icon check" />
              <span><strong>Total Billed & Balance</strong> calculation view</span>
            </li>
            <li className="restricted-feature">
              <Lock size={15} className="feature-icon lock" />
              <span>Financial reports, profits & editing locked</span>
            </li>
          </ul>

          <button
            className="portal-action-btn employee-btn"
            onClick={onSelectEmployee}
          >
            <span>Enter as Employee</span>
            <ArrowRight size={18} />
          </button>
        </div>

        {/* OWNER PORTAL CARD */}
        <div className="portal-card owner-card">
          <div className="card-badge owner-badge">
            <ShieldCheck size={14} />
            <span>EXECUTIVE ACCESS</span>
          </div>

          <div className="card-icon-wrapper owner-icon">
            <ShieldCheck size={32} />
          </div>

          <h2>Owner & Admin Vault</h2>
          <p className="card-desc">
            Full administrative authority. View real profit margins, delete/edit records, analytics, and PIN controls.
          </p>

          <ul className="card-features-list">
            <li>
              <CheckCircle2 size={16} className="feature-icon emerald" />
              <span><strong>Complete Unrestricted Access</strong> to all pages</span>
            </li>
            <li>
              <CheckCircle2 size={16} className="feature-icon emerald" />
              <span><strong>Financial Profit Margins</strong> & Monthly PDF Reports</span>
            </li>
            <li>
              <CheckCircle2 size={16} className="feature-icon emerald" />
              <span><strong>Edit & Delete Records</strong> with 1-click controls</span>
            </li>
            <li>
              <CheckCircle2 size={16} className="feature-icon emerald" />
              <span><strong>Change Security PIN</strong> (Default: <code>163692</code>)</span>
            </li>
          </ul>

          <button
            className="portal-action-btn owner-btn"
            onClick={() => setShowOwnerVaultModal(true)}
          >
            <KeyRound size={18} />
            <span>Unlock Owner Portal</span>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <footer className="portal-footer">
        <div className="footer-stats">
          <span>💼 Active Records: <strong>{customerCount} Customers</strong></span>
          <span>•</span>
          <span>🛡️ 256-bit Vault Security</span>
          <span>•</span>
          <span>🔒 Default PIN: <code>163692</code></span>
        </div>
      </footer>

      {/* Owner PIN Unlock Modal with Neon Emerald Lock & Eruption */}
      {showOwnerVaultModal && (
        <SecureReportGateModal
          isOpen={showOwnerVaultModal}
          onClose={() => setShowOwnerVaultModal(false)}
          onSuccess={() => {
            setShowOwnerVaultModal(false);
            onSelectOwner();
          }}
        />
      )}
    </div>
  );
}
