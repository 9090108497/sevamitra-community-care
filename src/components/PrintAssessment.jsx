import { formatDate } from '../lib/triage.js';
import { useLanguage } from '../lib/useLanguage.js';

export default function PrintAssessment({ encounter, onClose }) {
  const { language, t } = useLanguage();

  return (
    <div
      className="modal-backdrop print-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        aria-labelledby="print-assessment-title"
        aria-modal="true"
        className="modal-card print-assessment"
        role="dialog"
      >
        <header className="print-assessment-header">
          <div>
            <p className="eyebrow">SEVAMITRA · {t('Assessment summary')}</p>
            <h2 id="print-assessment-title">{encounter.patientName || t('Patient')}</h2>
            <p>{t('Created')}: {formatDate(encounter.createdAt, language)} · {encounter.id}</p>
          </div>
          <span className={`urgency-badge urgency-${encounter.urgency}`}>{t(encounter.urgencyLabel)}</span>
        </header>
        <div className="print-assessment-content">
          <dl>
            {encounter.age !== undefined && <div><dt>{t('Age')}</dt><dd>{encounter.age}</dd></div>}
            {encounter.gender && <div><dt>{t('Gender')}</dt><dd>{encounter.gender}</dd></div>}
            {encounter.duration && <div><dt>{t('Duration')}</dt><dd>{t(encounter.duration)}</dd></div>}
            {encounter.reportedSeverity && <div><dt>{t('Reported severity')}</dt><dd>{t(encounter.reportedSeverity)}</dd></div>}
            {encounter.facility && <div><dt>{t('Facility or village')}</dt><dd>{encounter.facility}</dd></div>}
            {encounter.oxygen && <div><dt>{t('Oxygen saturation')}</dt><dd>{encounter.oxygen}%</dd></div>}
            {encounter.pulse && <div><dt>{t('Heart rate')}</dt><dd>{encounter.pulse} {t('bpm')}</dd></div>}
            {encounter.temperature && <div><dt>{t('Temperature')}</dt><dd>{encounter.temperature}°F</dd></div>}
            {encounter.bloodPressure && <div><dt>{t('Blood pressure')}</dt><dd>{encounter.bloodPressure}</dd></div>}
            {encounter.glucose && <div><dt>{t('Blood glucose')}</dt><dd>{encounter.glucose} mg/dL</dd></div>}
            {encounter.weight && <div><dt>{t('Weight')}</dt><dd>{encounter.weight} kg</dd></div>}
            <div><dt>{t('Review status')}</dt><dd>{t(encounter.referralId ? 'Referral created' : encounter.reviewStatus)}</dd></div>
            {encounter.referralId && <div><dt>{t('Referral ID')}</dt><dd>{encounter.referralId}</dd></div>}
          </dl>
          <section>
            <h3>{t('Symptoms')}</h3>
            <p>{encounter.symptoms || '—'}</p>
          </section>
          <section>
            <h3>{t('Suggested next step')}</h3>
            <p>{encounter.nextStep || '—'}</p>
            <p className="print-specialist">{encounter.specialist} · {encounter.department}</p>
          </section>
          {encounter.clinicalPlan && (
            <section>
              <h3>{t('Clinician plan')}</h3>
              {encounter.clinicalPlan.tests?.length > 0 && <p><b>{t('Tests:')}</b> {encounter.clinicalPlan.tests.join(', ')}</p>}
              {encounter.clinicalPlan.medications?.length > 0 && (
                <ul>
                  {encounter.clinicalPlan.medications.map((medication, index) => (
                    <li key={`${encounter.id}-print-medication-${index}`}>
                      {medication.name} · {medication.dose}{medication.instructions ? ` · ${medication.instructions}` : ''}
                    </li>
                  ))}
                </ul>
              )}
              {encounter.clinicalPlan.notes && <p>{encounter.clinicalPlan.notes}</p>}
            </section>
          )}
          <p className="print-disclaimer">{t('Preliminary, rules-based guidance only. This summary is not a diagnosis or a substitute for professional medical advice.')}</p>
        </div>
        <footer className="print-assessment-actions">
          <button className="button button-quiet" onClick={onClose} type="button">{t('Close')}</button>
          <button className="button button-primary" onClick={() => window.print()} type="button">{t('Print / Save as PDF')}</button>
        </footer>
      </section>
    </div>
  );
}
