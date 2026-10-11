import { useState } from 'react';
import ClinicalSafetyModal from './ClinicalSafetyModal.jsx';
import { useLanguage } from '../lib/useLanguage.js';
import LanguageSelect from './LanguageSelect.jsx';

const navigation = {
  patient: [
    ['Overview', '◫'],
    ['My care', '♡'],
    ['Nearby facilities', '⌖'],
    ['Tests & medicines', '＋'],
    ['Medicine reminders', '◷'],
    ['Medical history', '◷'],
    ['My referrals', '↗'],
    ['Follow-ups & care', '✓'],
    ['Health profile', '♙'],
    ['Account settings', '⚙'],
  ],
  worker: [
    ['Overview', '◫'],
    ['Patients', '♧'],
    ['Referrals', '↗'],
    ['Follow-ups', '✓'],
    ['ASHA profile', '♙'],
  ],
  doctor: [
    ['Overview', '◫'],
    ['Patient queue', '☷'],
    ['Emergency cases', '!'],
    ['All assessments', '▤'],
    ['Patient records', '♙'],
    ['Referrals', '↗'],
    ['Care follow-ups', '✓'],
    ['Doctor credentials', '♙'],
  ],
};

const roleNames = {
  patient: 'Patient portal',
  worker: 'ASHA workspace',
  doctor: 'Doctor workspace',
};

export default function DashboardLayout({
  user,
  onSignOut,
  children,
  activeNav = 'Overview',
  onNavigate,
  onNewCase,
}) {
  const [showSafetyInfo, setShowSafetyInfo] = useState(false);
  const { t } = useLanguage();
  const items = navigation[user.role] ?? navigation.patient;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand sidebar-brand" href="#" aria-label={t('SevaMitra home')}>
          <span className="brand-mark"><span>+</span></span>
          <span className="scroll-reveal-text">SevaMitra</span>
        </a>
        <div className="workspace-switcher">
          <span className="workspace-icon">{user.role === 'doctor' ? '✚' : user.role === 'worker' ? '⌂' : '♡'}</span>
          <span><b>{t(roleNames[user.role])}</b><small>{t('Local browser workspace')}</small></span>
          <span className="switch-chevron">⌄</span>
        </div>
        <p className="nav-heading">{t('WORKSPACE')}</p>
        <nav className="side-nav" aria-label={t('Main navigation')}>
          {items.map(([label, icon]) => (
            <button
              aria-current={activeNav === label ? 'page' : undefined}
              className={activeNav === label ? 'nav-link current' : 'nav-link'}
              key={label}
              onClick={() => onNavigate?.(label)}
              type="button"
            >
              <span className="nav-icon">{icon}</span>{t(label)}
              {label === 'Patient queue' && user.role === 'doctor' && <span className="nav-count">•</span>}
            </button>
          ))}
        </nav>
        {user.role !== 'doctor' && (
          <button className="sidebar-new-case" onClick={onNewCase} type="button">
            <span>＋</span> {t(user.role === 'patient' ? 'New assessment' : 'Register patient')}
          </button>
        )}
        <div className="sidebar-bottom">
          <div className="privacy-card">
            <span>✳</span>
            <b>{t('Care with confidence')}</b>
            <small>{t('Your care suggestions are not a diagnosis. A clinician makes the final decision.')}</small>
          </div>
          <button className="nav-link help-link" onClick={() => setShowSafetyInfo(true)} type="button">
            <span className="nav-icon">?</span> {t('Clinical safety & AI')}
          </button>
          <button className="profile-button" onClick={onSignOut} type="button" title={t('Sign out')}>
            <span className="avatar">{user.name.charAt(0).toUpperCase()}</span>
            <span className="profile-copy"><b>{user.name}</b><small>{t(roleNames[user.role])}</small></span>
            <span className="profile-menu">⋯</span>
          </button>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <div className="breadcrumb"><span className="scroll-reveal-text">SevaMitra</span> <span>/</span> <b>{t(activeNav)}</b></div>
          <div className="topbar-actions">
            <LanguageSelect />
            <button
              aria-label={t('Clinical safety & AI')}
              className="icon-button safety-info-button"
              onClick={() => setShowSafetyInfo(true)}
              title={t('Clinical safety & AI')}
              type="button"
            >ⓘ</button>
            <span className="demo-indicator"><span /> {t('DEMO MODE')}</span>
            <button className="icon-button notification-button" aria-label={t('Notifications')} onClick={() => window.alert('You’re all caught up.')} type="button">♧<i /></button>
            <button className="topbar-avatar" onClick={onSignOut} title={t('Sign out')} type="button">{user.name.charAt(0).toUpperCase()}</button>
          </div>
        </header>
        <main className="dashboard-content">{children}</main>
      </div>
      {showSafetyInfo && <ClinicalSafetyModal onClose={() => setShowSafetyInfo(false)} />}
    </div>
  );
}
