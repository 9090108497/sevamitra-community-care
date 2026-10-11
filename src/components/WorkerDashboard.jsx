import { useEffect, useMemo, useState } from 'react';
import CaseCard from './CaseCard.jsx';
import DashboardLayout from './DashboardLayout.jsx';
import { FollowUpsPanel, StaffProfile, WorkerPatientDirectory } from './InternalPages.jsx';
import TriageForm from './TriageForm.jsx';
import { useLanguage } from '../lib/useLanguage.js';

export default function WorkerDashboard({ user, cases, followUps, onAddCase, onCompleteFollowUp, onSignOut }) {
  const { t } = useLanguage();
  const [showForm, setShowForm] = useState(false);
  const [activeNav, setActiveNav] = useState('Overview');
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const patients = useMemo(() => {
    const records = new Map();
    cases.forEach((encounter) => {
      if (!records.has(encounter.patientId)) records.set(encounter.patientId, encounter);
    });
    return [...records.values()];
  }, [cases]);
  useEffect(() => {
    const updateConnection = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateConnection);
    window.addEventListener('offline', updateConnection);
    return () => {
      window.removeEventListener('online', updateConnection);
      window.removeEventListener('offline', updateConnection);
    };
  }, []);
  const counts = {
    urgent: cases.filter((item) => item.urgency === 'red').length,
    priority: cases.filter((item) => item.urgency === 'orange').length,
    total: patients.length,
  };
  const visibleCases = activeNav === 'Referrals'
    ? cases.filter((encounter) => encounter.referralId)
    : cases.slice(0, 4);

  function submitCase(details) {
    onAddCase(details);
    setShowForm(false);
    setActiveNav('Patients');
  }

  return (
    <DashboardLayout activeNav={activeNav} onNewCase={() => setShowForm(true)} onNavigate={setActiveNav} onSignOut={onSignOut} user={user}>
      <div className="page-heading">
        <div><p className="eyebrow">{t(activeNav === 'Referrals' ? 'REFERRAL FOLLOW-UP' : 'COMMUNITY HEALTH WORKER')}</p><h1>{activeNav === 'Overview' ? `${t('Good day')}, ${user.name.split(' ')[0]}` : t(activeNav)}</h1><p className="page-subtitle">{t(activeNav === 'Overview' ? 'Your community care overview for today.' : activeNav === 'Patients' ? 'Review the patients you have registered and their suggested next steps.' : activeNav === 'Referrals' ? 'Follow up on doctor-created referrals for your patients.' : activeNav === 'Follow-ups' ? 'Review and record the outcome of planned patient check-ins.' : 'Your ASHA account details.')}</p></div>
        {activeNav !== 'ASHA profile' && <button className="button button-primary dashboard-primary-action" onClick={() => setShowForm(true)} type="button"><span>＋</span> {t('Register patient')}</button>}
      </div>
      {activeNav === 'Overview' && <div className="facility-banner"><span className="facility-icon">⌂</span><span><b>{t('Local demo workspace')}</b><small>{t('Records stay in this browser on this device.')}</small></span><span className={isOnline ? 'online-pill' : 'online-pill offline-pill'}><i /> {t(isOnline ? 'Browser online' : 'Browser offline')}</span></div>}
      {activeNav === 'Overview' && <section className="stats-grid">
        <article className="stat-card"><span className="stat-icon stat-icon-blue">♧</span><span className="stat-label">{t('Patients registered')}</span><strong>{counts.total}</strong><small>{t('By you in this browser')}</small></article>
        <article className="stat-card"><span className="stat-icon stat-icon-red">!</span><span className="stat-label">{t('Urgent attention')}</span><strong>{counts.urgent}</strong><small>{t('Flagged for immediate care')}</small></article>
        <article className="stat-card"><span className="stat-icon stat-icon-orange">↗</span><span className="stat-label">{t('Priority review')}</span><strong>{counts.priority}</strong><small>{t('Prompt clinical review suggested')}</small></article>
      </section>}
      {activeNav === 'Overview' && followUps.some((item) => item.status === 'Pending') && (
        <button className="follow-up-shortcut" onClick={() => setActiveNav('Follow-ups')} type="button">
          <span className="follow-up-shortcut-icon">✓</span>
          <span><b>{t('Follow-ups due')}</b><small>{followUps.filter((item) => item.status === 'Pending').length} {t('pending follow-up reminder(s)')}</small></span>
          <span className="shortcut-arrow">→</span>
        </button>
      )}
      {activeNav === 'Patients' && <WorkerPatientDirectory cases={cases} />}
      {activeNav === 'Follow-ups' && <FollowUpsPanel canComplete followUps={followUps} onComplete={onCompleteFollowUp} />}
      {activeNav === 'ASHA profile' && <StaffProfile user={user} />}
      {(activeNav === 'Overview' || activeNav === 'Referrals') && <section className="section-block">
        <div className="section-heading"><div><h2>{t(activeNav === 'Referrals' ? 'Referral watch' : 'Recent patient checks')}</h2><p>{t(activeNav === 'Referrals' ? 'Doctor-created referral slips will appear here for follow-up.' : 'Suggested routing is preliminary and must be confirmed by a doctor.')}</p></div>{activeNav === 'Overview' && cases.length > 4 && <button className="text-button" onClick={() => setActiveNav('Patients')} type="button">{t('View all')} <span>→</span></button>}</div>
        {visibleCases.length === 0 ? (
          <div className="empty-state"><span className="empty-state-icon">♧</span><h3>{t(activeNav === 'Referrals' ? 'No referrals to track yet' : 'No patient checks yet')}</h3><p>{t(activeNav === 'Referrals' ? 'Doctor-created referral slips will appear here for follow-up.' : 'Register a patient to record symptoms and get a care-team suggestion.')}</p><button className="button button-outline" onClick={() => setShowForm(true)} type="button">{t('Register a patient')}</button></div>
        ) : <div className="case-list">{visibleCases.map((encounter) => <CaseCard encounter={encounter} key={encounter.id} showPatientName />)}</div>}
      </section>}
      {(activeNav === 'Overview' || activeNav === 'Patients') && <div className="patient-disclaimer"><span>ⓘ</span><p><b>{t('Human review matters.')}</b> {t('The triage suggestion is a basic rules-based aid, not a diagnosis. A medical professional must make all clinical decisions.')}</p></div>}
      {showForm && <TriageForm onClose={() => setShowForm(false)} onSubmit={submitCase} patients={patients} user={user} />}
    </DashboardLayout>
  );
}
