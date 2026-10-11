import { useState } from 'react';
import { formatDate } from '../lib/triage.js';
import { useLanguage } from '../lib/useLanguage.js';
import PrintAssessment from './PrintAssessment.jsx';

export default function CaseCard({ encounter, showPatientName = false, actions }) {
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const { language, t } = useLanguage();

  return (
    <article className="case-card">
      <div className="case-card-top">
        <div className={`urgency-dot urgency-${encounter.urgency}`} />
        <div className="case-card-title">
          <span className={`urgency-badge urgency-${encounter.urgency}`}>{t(encounter.urgencyLabel)}</span>
          <h3>{encounter.specialist}</h3>
          <p>{encounter.department} <span>·</span> {encounter.duration ? t(encounter.duration) : t('Duration not shared')}</p>
        </div>
        <span className="case-id">{encounter.id}</span>
      </div>
      {showPatientName && <p className="case-patient">{encounter.patientName} <span>·</span> {encounter.age} {t('yrs')} {encounter.gender ? `· ${t(encounter.gender)}` : ''}</p>}
      <p className="case-symptoms">{encounter.symptoms}</p>
      {showPatientName && encounter.patientPhoto && (
        <section className="case-patient-photo" aria-label={t('Patient-submitted photo')}>
          <div>
            <b>{t('Patient photo · review required')}</b>
            {encounter.photoDescription && <p><b>{t('Automated photo note (OCR only):')}</b> {encounter.photoDescription}</p>}
            <small>{t('OCR detects text only; it does not analyze visual symptoms or provide a diagnosis.')}</small>
          </div>
          <img src={encounter.patientPhoto} alt={t('Photo submitted for this case')} />
        </section>
      )}
      {(encounter.oxygen || encounter.pulse || encounter.temperature || encounter.bloodPressure || encounter.glucose || encounter.weight || encounter.reportedSeverity || encounter.facility) && (
        <p className="case-vitals">
          {encounter.reportedSeverity && <span>{t('Reported severity')} <b>{t(encounter.reportedSeverity)}</b></span>}
          {encounter.facility && <span>{t('Facility or village')} <b>{encounter.facility}</b></span>}
          {encounter.oxygen && <span>SpO₂ <b>{encounter.oxygen}%</b></span>}
          {encounter.pulse && <span>{t('Heart rate')} <b>{encounter.pulse} {t('bpm')}</b></span>}
          {encounter.temperature && <span>{t('Temperature')} <b>{encounter.temperature}°F</b></span>}
          {encounter.bloodPressure && <span>{t('Blood pressure')} <b>{encounter.bloodPressure}</b></span>}
          {encounter.glucose && <span>{t('Blood glucose')} <b>{encounter.glucose} mg/dL</b></span>}
          {encounter.weight && <span>{t('Weight')} <b>{encounter.weight} kg</b></span>}
        </p>
      )}
      <p className="case-next-step"><b>{t('Suggested next step:')}</b> {encounter.nextStep}</p>
      {encounter.referralId && (
        <p className="referral-tracking">{t('Digital referral')} <b>{encounter.referralId}</b></p>
      )}
      <div className="case-card-bottom">
        <span className="case-time">{formatDate(encounter.createdAt, language)}</span>
        <span className={`review-status ${encounter.reviewStatus === 'Reviewed' ? 'reviewed' : ''}`}>
          {t(encounter.referralId ? 'Referral created' : encounter.reviewStatus)}
        </span>
        <button
          aria-label={`${t('Print assessment')} ${encounter.id}`}
          className="button button-small button-outline print-case-button"
          onClick={() => setIsPrintOpen(true)}
          type="button"
        >
          {t('Print assessment')}
        </button>
      </div>
      {actions && <div className="case-actions">{actions}</div>}
      {isPrintOpen && <PrintAssessment encounter={encounter} onClose={() => setIsPrintOpen(false)} />}
    </article>
  );
}
