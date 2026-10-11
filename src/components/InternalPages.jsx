import { useMemo, useState } from 'react';
import { formatDate } from '../lib/triage.js';
import { useLanguage } from '../lib/useLanguage.js';
import CaseCard from './CaseCard.jsx';

function EmptyRecords({ title, message }) {
  return (
    <div className="empty-state">
      <span className="empty-state-icon">♡</span>
      <h3>{title}</h3>
      <p>{message}</p>
    </div>
  );
}

export function PatientMedicalHistory({ cases }) {
  const { language, t } = useLanguage();
  const history = [...cases].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <section className="internal-page">
      <div className="internal-page-heading">
        <div><h2>{t('My medical history')}</h2><p>{t('A timeline of assessments and clinician-entered care saved to this account.')}</p></div>
        <span className="subtle-count">{history.length} {t('record(s)')}</span>
      </div>
      {history.length ? (
        <div className="history-timeline">
          {history.map((encounter) => (
            <article className="history-entry" key={encounter.id}>
              <span className={`history-marker urgency-${encounter.urgency}`} />
              <div className="history-entry-content">
                <div className="history-entry-meta"><b>{formatDate(encounter.createdAt, language)}</b><span>{encounter.id}</span></div>
                <CaseCard encounter={encounter} />
              </div>
            </article>
          ))}
        </div>
      ) : <EmptyRecords title={t('No medical history yet')} message={t('Completed assessments will appear here as a personal health timeline.')} />}
    </section>
  );
}

export function PatientReferrals({ cases }) {
  const { language, t } = useLanguage();
  const referrals = cases.filter((encounter) => encounter.referralId);

  return (
    <section className="internal-page">
      <div className="internal-page-heading">
        <div><h2>{t('Referral records')}</h2><p>{t('Referral identifiers created by your doctor for your assessments.')}</p></div>
        <span className="subtle-count">{referrals.length} {t('referral(s)')}</span>
      </div>
      {referrals.length ? (
        <div className="referral-list">
          {referrals.map((encounter) => (
            <article className="internal-record-card" key={encounter.id}>
              <div className="internal-record-heading">
                <div><p className="eyebrow">{t('Referral ID')}</p><h3>{encounter.referralId}</h3></div>
                <span className={`review-status ${encounter.reviewStatus === 'Reviewed' ? 'reviewed' : ''}`}>{t('Referral created')}</span>
              </div>
              <p>{encounter.specialist} · {encounter.department}</p>
              <small>{t('Assessment')}: {encounter.id} · {formatDate(encounter.createdAt, language)}</small>
              <p className="field-hint">{t('Contact your care team for transfer status. This demo does not receive live facility updates.')}</p>
            </article>
          ))}
        </div>
      ) : <EmptyRecords title={t('No referrals yet')} message={t('Doctor-created referral identifiers will appear here.')} />}
    </section>
  );
}

export function PatientProfile({ user, cases }) {
  const { t } = useLanguage();
  const latest = [...cases].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
  const values = [
    [t('Email address'), user.email],
    [t('Account type'), t('Patient')],
    [t('Patient ID'), user.id],
    [t('Assessments on this account'), String(cases.length)],
  ];

  return (
    <section className="internal-page">
      <div className="internal-page-heading">
        <div><h2>{t('My health profile')}</h2><p>{t('Your account details and health information currently available in this demo.')}</p></div>
      </div>
      <div className="profile-grid">
        <article className="internal-record-card profile-summary">
          <span className="profile-avatar">{user.name.charAt(0).toUpperCase()}</span>
          <h3>{user.name}</h3>
        </article>
        <article className="internal-record-card">
          <h3>{t('Account information')}</h3>
          <dl className="profile-details">{values.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || t('Not provided')}</dd></div>)}</dl>
        </article>
      </div>
      <article className="internal-record-card profile-health-note">
        <h3>{t('Health record status')}</h3>
        <p>{latest ? t('Your latest assessment and any doctor-entered tests, medicines, and care instructions are shown in My care.') : t('No assessment has been saved to your account yet.')}</p>
        <p className="field-hint">{t('This demo does not store a separate verified conditions or allergies list. Ask a clinician to review any health history you share.')}</p>
      </article>
    </section>
  );
}

export function AccountSettings({ user, onSignOut }) {
  const { t } = useLanguage();

  return (
    <section className="internal-page">
      <div className="internal-page-heading">
        <div><h2>{t('Account settings')}</h2><p>{t('Manage this demo account and review how its data is stored.')}</p></div>
      </div>
      <article className="internal-record-card settings-card">
        <h3>{t('Browser storage')}</h3>
        <p>{t('Your account and assessments are saved in this browser on this device. Clearing browser storage removes this demo data.')}</p>
        <p className="field-hint">{t('Use the language selector in the top bar to change the app language. Password reset and multi-device sync are not available in this demo.')}</p>
      </article>
      <article className="internal-record-card settings-card">
        <h3>{t('Signed in as')}</h3>
        <p><b>{user.name}</b> · {user.email}</p>
        <button className="button button-outline" onClick={onSignOut} type="button">{t('Sign out')}</button>
      </article>
    </section>
  );
}

function PatientDirectory({ cases, title, description, t }) {
  const [search, setSearch] = useState('');
  const [activePatientId, setActivePatientId] = useState('');
  const patients = useMemo(() => {
    const records = new Map();
    for (const encounter of cases) {
      const current = records.get(encounter.patientId);
      if (!current) records.set(encounter.patientId, { patientId: encounter.patientId, name: encounter.patientName, age: encounter.age, gender: encounter.gender, latest: encounter, count: 1 });
      else {
        current.count += 1;
        if (new Date(encounter.createdAt) > new Date(current.latest.createdAt)) current.latest = encounter;
      }
    }
    return [...records.values()].sort((a, b) => new Date(b.latest.createdAt) - new Date(a.latest.createdAt));
  }, [cases]);
  const visiblePatients = patients.filter((patient) =>
    `${patient.name} ${patient.patientId} ${patient.latest.symptoms}`.toLowerCase().includes(search.toLowerCase()),
  );
  const activePatient = patients.find((patient) => patient.patientId === activePatientId);
  const patientCases = activePatient ? cases.filter((encounter) => encounter.patientId === activePatient.patientId) : [];

  return (
    <section className="internal-page">
      <div className="internal-page-heading">
        <div><h2>{title}</h2><p>{description}</p></div>
        <span className="subtle-count">{patients.length} {t('patient record(s)')}</span>
      </div>
      <label className="directory-search">
        <span className="sr-only">{t('Search patients')}</span>
        <input onChange={(event) => setSearch(event.target.value)} placeholder={t('Search name, patient ID, or symptom')} type="search" value={search} />
      </label>
      {visiblePatients.length ? (
        <div className="directory-layout">
          <div className="directory-list">
            {visiblePatients.map((patient) => (
              <button className={activePatientId === patient.patientId ? 'directory-patient active' : 'directory-patient'} key={patient.patientId} onClick={() => setActivePatientId(patient.patientId)} type="button">
                <span className="avatar">{patient.name.charAt(0).toUpperCase()}</span>
                <span><b>{patient.name}</b><small>{patient.patientId} · {patient.count} {t('assessment(s)')}</small></span>
                <span className={`urgency-badge urgency-${patient.latest.urgency}`}>{t(patient.latest.urgencyLabel)}</span>
              </button>
            ))}
          </div>
          {activePatient && (
            <div className="directory-detail">
              <div className="internal-record-heading"><div><h3>{activePatient.name}</h3><p>{activePatient.age} {t('yrs')}{activePatient.gender ? ` · ${t(activePatient.gender)}` : ''} · {activePatient.patientId}</p></div></div>
              <p className="field-hint">{t('Assessment history linked to this patient record')}</p>
              <div className="case-list">{patientCases.map((encounter) => <CaseCard encounter={encounter} key={encounter.id} showPatientName />)}</div>
            </div>
          )}
        </div>
      ) : <EmptyRecords title={t('No patient records found')} message={search ? t('Try another search term.') : t('Patient records will appear after you submit an assessment for someone.')} />}
    </section>
  );
}

export function WorkerPatientDirectory({ cases }) {
  const { t } = useLanguage();
  return <PatientDirectory cases={cases} description={t('People assessed by you in this browser. Select a record to review its linked assessment history.')} title={t('Patient directory')} t={t} />;
}

export function DoctorPatientRecords({ cases }) {
  const { t } = useLanguage();
  return <PatientDirectory cases={cases} description={t('Patient records and their linked assessments in this demo workspace.')} title={t('Patient directory')} t={t} />;
}

export function FollowUpsPanel({ followUps, canComplete = false, onComplete }) {
  const { language, t } = useLanguage();
  const [notesById, setNotesById] = useState({});
  const ordered = [...followUps].sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  return (
    <section className="internal-page">
      <div className="internal-page-heading">
        <div><h2>{t('Scheduled follow-ups')}</h2><p>{t('Follow-up reminders recorded in this browser for patient care coordination.')}</p></div>
        <span className="subtle-count">{ordered.filter((item) => item.status === 'Pending').length} {t('pending')}</span>
      </div>
      {ordered.length ? (
        <div className="follow-up-list">
          {ordered.map((item) => (
            <article className="internal-record-card follow-up-card" key={item.id}>
              <div className="internal-record-heading">
                <div><p className="eyebrow">{item.patientName} · {item.encounterId}</p><h3>{item.reason}</h3></div>
                <span className={`follow-up-status ${item.status === 'Completed' ? 'completed' : ''} ${item.status === 'Pending' && new Date(item.scheduledDate) < startOfToday ? 'overdue' : ''}`}>
                  {t(item.status === 'Pending' && new Date(item.scheduledDate) < startOfToday ? 'Overdue' : item.status)}
                </span>
              </div>
              <p>{t('Scheduled')}: <b>{formatDate(item.scheduledDate, language)}</b></p>
              <small>{t('Added by')} {item.createdByName}</small>
              {item.outcomeNotes && <p className="follow-up-outcome"><b>{t('Outcome')}:</b> {item.outcomeNotes}</p>}
              {canComplete && item.status === 'Pending' && (
                <div className="follow-up-complete">
                  <label className="field-label">{t('Visit outcome notes')}
                    <input onChange={(event) => setNotesById((current) => ({ ...current, [item.id]: event.target.value }))} placeholder={t('Optional')} value={notesById[item.id] ?? ''} />
                  </label>
                  <button className="button button-small button-outline" onClick={() => onComplete(item.id, notesById[item.id] ?? '')} type="button">{t('Mark complete')}</button>
                </div>
              )}
            </article>
          ))}
        </div>
      ) : <EmptyRecords title={t('No follow-ups scheduled')} message={t('A clinician can schedule follow-up reminders from a patient assessment.')} />}
    </section>
  );
}

export function StaffProfile({ user }) {
  const { t } = useLanguage();
  const fields = [
    [t('Full name'), user.name],
    [t('Email address'), user.email],
    [t('Role'), t(user.role === 'doctor' ? 'Doctor' : 'ASHA worker')],
    [t('Staff ID'), user.id],
  ];

  return (
    <section className="internal-page">
      <article className="internal-record-card">
        <dl className="profile-details">{fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || t('Not provided')}</dd></div>)}</dl>
        <p className="field-hint">{t('Facility, license, and official staff verification details are not configured in this demo.')}</p>
      </article>
    </section>
  );
}
