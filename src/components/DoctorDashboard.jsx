import { useState } from 'react';
import CaseCard from './CaseCard.jsx';
import DashboardLayout from './DashboardLayout.jsx';
import FollowUpForm from './FollowUpForm.jsx';
import { DoctorPatientRecords, FollowUpsPanel, StaffProfile } from './InternalPages.jsx';
import DoctorOrdersForm from './DoctorOrdersForm.jsx';
import { useLanguage } from '../lib/useLanguage.js';

const urgencyOrder = { red: 0, orange: 1, yellow: 2, green: 3 };

export default function DoctorDashboard({ user, cases, followUps, onAddFollowUp, onCompleteFollowUp, onUpdateCase, onSignOut }) {
  const { t } = useLanguage();
  const [activeNav, setActiveNav] = useState('Overview');
  const [filter, setFilter] = useState('All cases');
  const [editingCase, setEditingCase] = useState(null);
  const [followUpCase, setFollowUpCase] = useState(null);
  const sortedCases = [...cases].sort((a, b) =>
    urgencyOrder[a.urgency] - urgencyOrder[b.urgency]
    || new Date(b.createdAt) - new Date(a.createdAt),
  );
  const listedCases = activeNav === 'Referrals'
    ? sortedCases.filter((encounter) => encounter.referralId)
    : activeNav === 'Emergency cases'
      ? sortedCases.filter((encounter) => encounter.urgency === 'red')
      : activeNav === 'Patient queue'
        ? sortedCases.filter((encounter) => encounter.reviewStatus !== 'Reviewed')
        : activeNav === 'Overview' ? sortedCases.slice(0, 4) : sortedCases;
  const visibleCases = listedCases.filter((encounter) =>
    filter === 'All cases' || encounter.urgencyLabel === filter,
  );
  const urgentCount = cases.filter((encounter) => encounter.urgency === 'red').length;
  const awaitingCount = cases.filter((encounter) => encounter.reviewStatus !== 'Reviewed').length;
  const isCaseListPage = ['Overview', 'Patient queue', 'Emergency cases', 'All assessments', 'Referrals'].includes(activeNav);

  return (
    <DashboardLayout activeNav={activeNav} onNavigate={setActiveNav} onSignOut={onSignOut} user={user}>
      <div className="page-heading">
        <div><p className="eyebrow">{t(activeNav === 'Referrals' ? 'REFERRAL MANAGEMENT' : 'CLINICAL WORKSPACE')}</p><h1>{activeNav === 'Overview' ? `${t('Good day')}, Dr. ${user.name.split(' ')[0]}` : t(activeNav)}</h1><p className="page-subtitle">{t(activeNav === 'Overview' ? 'Review the most urgent cases and keep patient care moving.' : activeNav === 'Patient queue' ? 'Cases awaiting a doctor review. Mark them reviewed after documenting your decision.' : activeNav === 'Emergency cases' ? 'Cases flagged urgent by the rules-based triage aid. Review promptly; this is not a diagnosis.' : activeNav === 'All assessments' ? 'All assessments submitted in this browser workspace.' : activeNav === 'Referrals' ? 'View referral IDs created from reviewed assessments.' : activeNav === 'Patient records' ? 'Review patients and their linked assessment history.' : activeNav === 'Care follow-ups' ? 'Manage planned patient check-ins saved in this browser.' : 'Doctor account details available in this demo.')}</p></div>
        <span className="doctor-status"><i /> {t('Local demo')}</span>
      </div>
      {activeNav === 'Overview' && <div className="doctor-alert"><span className="alert-icon">✚</span><span><b>{t('Clinical decision support')}</b><small>{t('Suggestions prioritize review only. You retain final clinical authority.')}</small></span><button className="text-button" onClick={() => setActiveNav('Patient queue')} type="button">{t('Open queue')} <span>→</span></button></div>}
      {activeNav === 'Overview' && <section className="stats-grid doctor-stats">
        <article className="stat-card"><span className="stat-icon stat-icon-blue">☷</span><span className="stat-label">{t('Cases in queue')}</span><strong>{cases.length}</strong><small>{t('Submitted by patients and ASHA workers')}</small></article>
        <article className="stat-card"><span className="stat-icon stat-icon-red">!</span><span className="stat-label">{t('Urgent attention')}</span><strong>{urgentCount}</strong><small>{t('Review immediately')}</small></article>
        <article className="stat-card"><span className="stat-icon stat-icon-orange">◷</span><span className="stat-label">{t('Awaiting review')}</span><strong>{awaitingCount}</strong><small>{t('Pending your clinical decision')}</small></article>
      </section>}
      {activeNav === 'Patient records' && <DoctorPatientRecords cases={cases} />}
      {activeNav === 'Care follow-ups' && <FollowUpsPanel canComplete followUps={followUps} onComplete={onCompleteFollowUp} />}
      {activeNav === 'Doctor credentials' && <StaffProfile user={user} />}
      {isCaseListPage && <section className="section-block doctor-queue">
        <div className="section-heading"><div><h2>{t(activeNav === 'Referrals' ? 'Digital referrals' : activeNav === 'Overview' ? 'Priority cases' : activeNav === 'Emergency cases' ? 'Urgent cases' : activeNav === 'All assessments' ? 'All assessments' : activeNav === 'Patient queue' ? 'Awaiting doctor review' : 'Patient review queue')}</h2><p>{t(activeNav === 'Referrals' ? 'Referral IDs are recorded locally; live facility tracking is not connected.' : activeNav === 'Overview' ? 'Start with these cases, ordered by suggested urgency.' : activeNav === 'Emergency cases' ? 'Seek appropriate in-person care based on your clinical assessment.' : activeNav === 'Patient queue' ? 'Review pending cases and record the next step.' : 'Cases are ordered by suggested urgency. This is not a diagnosis.')}</p></div>
          <label className="filter-select"><span className="sr-only">{t('Filter cases by urgency')}</span><select onChange={(event) => setFilter(event.target.value)} value={filter}><option value="All cases">{t('All cases')}</option><option value="Urgent attention">{t('Urgent attention')}</option><option value="Priority review">{t('Priority review')}</option><option value="Review recommended">{t('Review recommended')}</option><option value="Routine review">{t('Routine review')}</option></select></label>
        </div>
        {visibleCases.length === 0 ? (
          <div className="empty-state"><span className="empty-state-icon">☷</span><h3>{t(activeNav === 'Referrals' ? 'No referrals created yet' : cases.length ? 'No cases match this filter' : 'Your queue is clear')}</h3><p>{t(activeNav === 'Referrals' ? 'Review a case and create a referral slip to begin tracking referrals.' : cases.length ? 'Try another urgency filter.' : 'New patient and ASHA worker submissions will appear here for your review.')}</p>{activeNav === 'Overview' && cases.length > 4 && <button className="button button-outline" onClick={() => setActiveNav('Patient queue')} type="button">{t('Open full patient queue')}</button>}</div>
        ) : <div className="case-list">{visibleCases.map((encounter) => (
          <CaseCard
            actions={<>
              {encounter.referralId && <span className="review-confirmed">✓ {t('Referral created')}</span>}
              <button className="button button-small button-outline" onClick={() => setEditingCase(encounter)} type="button">📷 {t('Scan prescription')}</button>
              <button className="button button-small button-outline" onClick={() => setFollowUpCase(encounter)} type="button">{t('Schedule follow-up')}</button>
              {encounter.reviewStatus !== 'Reviewed' && <button className="button button-small button-outline" onClick={() => onUpdateCase(encounter.id, { reviewStatus: 'Reviewed' })} type="button">{t('Mark reviewed')}</button>}
              {encounter.reviewStatus === 'Reviewed' && <button className="button button-small button-outline" onClick={() => setEditingCase(encounter)} type="button">{t(encounter.clinicalPlan ? 'Edit tests & medicines' : 'Add tests & medicines')}</button>}
              {!encounter.referralId && <button className="button button-small button-primary" onClick={() => onUpdateCase(encounter.id, { reviewStatus: 'Reviewed', referralId: `RF-${crypto.randomUUID().slice(0, 8).toUpperCase()}` })} type="button">{t('Create referral')}</button>}
            </>}
            encounter={encounter}
            key={encounter.id}
            showPatientName
          />
        ))}</div>}
      </section>}
      {isCaseListPage && activeNav !== 'Referrals' && <div className="patient-disclaimer"><span>ⓘ</span><p><b>{t('Doctor review required.')}</b> {t('Triage and specialist routing are rule-based suggestions from reported symptoms, oxygen saturation, and heart rate only. They do not replace a complete clinical assessment.')}</p></div>}
      {editingCase && (
        <DoctorOrdersForm
          doctorName={user.name}
          encounter={editingCase}
          onClose={() => setEditingCase(null)}
          onSave={(updates) => {
            onUpdateCase(editingCase.id, updates);
            setEditingCase(null);
          }}
        />
      )}
      {followUpCase && (
        <FollowUpForm
          encounter={followUpCase}
          onClose={() => setFollowUpCase(null)}
          onSave={(details) => {
            onAddFollowUp(details);
            setFollowUpCase(null);
          }}
        />
      )}
    </DashboardLayout>
  );
}
