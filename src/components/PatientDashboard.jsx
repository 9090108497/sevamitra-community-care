import { useState } from 'react';
import CaseCard from './CaseCard.jsx';
import DashboardLayout from './DashboardLayout.jsx';
import {
  AccountSettings,
  FollowUpsPanel,
  PatientMedicalHistory,
  PatientProfile,
  PatientReferrals,
} from './InternalPages.jsx';
import PatientOrders from './PatientOrders.jsx';
import MedicationReminders from './MedicationReminders.jsx';
import TriageForm from './TriageForm.jsx';
import { useLanguage } from '../lib/useLanguage.js';

export default function PatientDashboard({ user, cases, followUps, onAddCase, onSignOut }) {
  const { t } = useLanguage();
  const [showForm, setShowForm] = useState(false);
  const [activeNav, setActiveNav] = useState('Overview');
  const plansCount = cases.filter((encounter) => encounter.clinicalPlan).length;
  const pendingCount = cases.filter((encounter) => encounter.reviewStatus !== 'Reviewed').length;
  const pageDescription = {
    Overview: 'A clear, calm place to take your next step.',
    'My care': 'Your complete personal assessment history.',
    'Tests & medicines': 'Tests and medicines entered by your doctor.',
    'Medicine reminders': 'Daily reminders for medicines prescribed by your doctor.',
    'Medical history': 'A timeline of your assessments and doctor-entered care.',
    'My referrals': 'Referral details created from your assessments.',
    'Follow-ups & care': 'Reminders for planned check-ins with your care team.',
    'Health profile': 'Your account and health information available in this demo.',
    'Account settings': 'Manage this demo account and review how its data is stored.',
  };

  function submitCase(details) {
    onAddCase(details);
    setShowForm(false);
    setActiveNav('My care');
  }

  return (
    <DashboardLayout
      activeNav={activeNav}
      onNewCase={() => setShowForm(true)}
      onNavigate={setActiveNav}
      onSignOut={onSignOut}
      user={user}
    >
      <div className="page-heading">
        <div><p className="eyebrow">{t('YOUR HEALTH, YOUR PACE')}</p><h1>{activeNav === 'Overview' ? `${t('Hello')}, ${user.name.split(' ')[0]}` : t(activeNav)}</h1><p className="page-subtitle">{t(pageDescription[activeNav])}</p></div>
        {['Overview', 'My care', 'Tests & medicines'].includes(activeNav) && <button className="button button-primary dashboard-primary-action" onClick={() => setShowForm(true)} type="button"><span>＋</span> {t('New assessment')}</button>}
      </div>
      {activeNav === 'Overview' && (
        <>
          <div className="patient-welcome-card">
            <div className="welcome-icon">✳</div>
            <div><p className="eyebrow">{t('A LITTLE SUPPORT, WHEN YOU NEED IT')}</p><h2>{t('How are you feeling today?')}</h2><p>{t('Tell us what’s going on and we’ll suggest the right kind of care to explore.')}</p><button className="text-button" onClick={() => setShowForm(true)} type="button">{t('Start a symptom check')} <span>→</span></button></div>
            <div className="welcome-card-art" aria-hidden="true"><span>+</span><i>♡</i></div>
          </div>
          <section aria-label={t('Care at a glance')} className="stats-grid patient-stats">
            <button className="stat-card stat-card-link" onClick={() => setActiveNav('My care')} type="button"><span className="stat-icon stat-icon-blue">♡</span><span className="stat-label">{t('Assessments')}</span><strong>{cases.length}</strong><small>{t('View your care history')}</small></button>
            <button className="stat-card stat-card-link" onClick={() => setActiveNav('Tests & medicines')} type="button"><span className="stat-icon stat-icon-green">＋</span><span className="stat-label">{t('Care plans')}</span><strong>{plansCount}</strong><small>{t('Doctor-entered orders')}</small></button>
            <article className="stat-card"><span className="stat-icon stat-icon-orange">◷</span><span className="stat-label">{t('Awaiting review')}</span><strong>{pendingCount}</strong><small>{t('Waiting for doctor review')}</small></article>
          </section>
          <button className="follow-up-shortcut" onClick={() => setActiveNav('Follow-ups & care')} type="button">
            <span className="follow-up-shortcut-icon">✓</span>
            <span><b>{t('Follow-ups & care')}</b><small>{followUps.filter((item) => item.status === 'Pending').length} {t('pending follow-up reminder(s)')}</small></span>
            <span className="shortcut-arrow">→</span>
          </button>
          <button className="follow-up-shortcut medicine-reminder-shortcut" onClick={() => setActiveNav('Medicine reminders')} type="button">
            <span className="follow-up-shortcut-icon">◷</span>
            <span><b>{t('Medicine reminders')}</b><small>{t('Set a daily reminder for your prescribed medicines.')}</small></span>
            <span className="shortcut-arrow">→</span>
          </button>
          <section className="section-block">
            <div className="section-heading"><div><h2>{t('Your recent care')}</h2><p>{t('Only you can see your personal care history in this demo.')}</p></div>{cases.length > 0 && <button className="text-button" onClick={() => setActiveNav('My care')} type="button">{t('View all')} <span>→</span></button>}</div>
            {cases.length === 0 ? (
              <div className="empty-state"><span className="empty-state-icon">♡</span><h3>{t('Your care journey starts here')}</h3><p>{t('When you share your symptoms, your suggestions will show up here.')}</p><button className="button button-outline" onClick={() => setShowForm(true)} type="button">{t('Start your first symptom check')}</button></div>
            ) : <div className="case-list">{cases.slice(0, 3).map((encounter) => <CaseCard encounter={encounter} key={encounter.id} />)}</div>}
          </section>
          <PatientOrders cases={cases} compact />
          <div className="patient-disclaimer"><span>ⓘ</span><p><b>{t('A gentle reminder')}</b> {t('Care suggestions are informational only and don’t replace a qualified clinician’s advice. If you feel seriously unwell, seek urgent medical help.')}</p></div>
        </>
      )}
      {activeNav === 'My care' && (
        <>
          <section className="section-block patient-history">
            <div className="section-heading"><div><h2>{t('Your symptom checks')}</h2><p>{t('Only you can see your personal care history in this demo.')}</p></div><span className="subtle-count">{cases.length} {cases.length === 1 ? t('check') : t('checks')}</span></div>
            {cases.length === 0 ? (
              <div className="empty-state"><span className="empty-state-icon">♡</span><h3>{t('Your care journey starts here')}</h3><p>{t('When you share your symptoms, your suggestions will show up here.')}</p><button className="button button-outline" onClick={() => setShowForm(true)} type="button">{t('Start your first symptom check')}</button></div>
            ) : <div className="case-list">{cases.map((encounter) => <CaseCard encounter={encounter} key={encounter.id} />)}</div>}
          </section>
          <div className="patient-disclaimer"><span>ⓘ</span><p><b>{t('A gentle reminder')}</b> {t('Care suggestions are informational only and don’t replace a qualified clinician’s advice. If you feel seriously unwell, seek urgent medical help.')}</p></div>
        </>
      )}
      {activeNav === 'Tests & medicines' && <PatientOrders cases={cases} />}
      {activeNav === 'Medicine reminders' && <MedicationReminders cases={cases} patientId={user.id} />}
      {activeNav === 'Medical history' && <PatientMedicalHistory cases={cases} />}
      {activeNav === 'My referrals' && <PatientReferrals cases={cases} />}
      {activeNav === 'Follow-ups & care' && <FollowUpsPanel followUps={followUps} />}
      {activeNav === 'Health profile' && <PatientProfile cases={cases} user={user} />}
      {activeNav === 'Account settings' && <AccountSettings onSignOut={onSignOut} user={user} />}
      {showForm && <TriageForm onClose={() => setShowForm(false)} onSubmit={submitCase} user={user} />}
    </DashboardLayout>
  );
}
