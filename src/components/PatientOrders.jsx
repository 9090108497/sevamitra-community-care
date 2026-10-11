import { formatDate } from '../lib/triage.js';
import { useLanguage } from '../lib/useLanguage.js';

export default function PatientOrders({ cases, compact = false }) {
  const { language, t } = useLanguage();
  const orders = cases
    .filter((encounter) => encounter.clinicalPlan)
    .map((encounter) => ({ ...encounter, plan: encounter.clinicalPlan }));

  return (
    <section className={`section-block patient-orders${compact ? ' patient-orders-compact' : ''}`}>
      <div className="section-heading">
        <div><h2>{t('Tests & medicines')}</h2><p>{t('Tests and medicines recorded by your doctor.')}</p></div>
        <span className="subtle-count">{orders.length} {orders.length === 1 ? t('care plan') : t('care plans')}</span>
      </div>
      {orders.length === 0 ? (
        <div className="orders-empty">
          <span className="empty-state-icon">＋</span>
          <div><h3>{t('No doctor’s orders yet')}</h3><p>{t('When your doctor adds tests or prescribes medicine, the details will appear here.')}</p></div>
        </div>
      ) : (
        <div className="orders-list">
          {orders.slice(0, compact ? 2 : undefined).map((encounter) => (
            <article className="orders-card" key={encounter.id}>
              <div className="orders-card-heading">
                <div><h3>{t('Doctor’s orders')}</h3><p>{t('Case')} {encounter.id} · {formatDate(encounter.plan.prescribedAt, language)}</p></div>
                <span className="review-confirmed">✓ {t('Clinician entered')}</span>
              </div>
              <div className="orders-groups">
                <section className="orders-group">
                  <h4>{t('Tests')}</h4>
                  {encounter.plan.tests.length ? (
                    <ul>{encounter.plan.tests.map((test, index) => <li key={`${encounter.id}-test-${index}`}>{test}</li>)}</ul>
                  ) : <p className="orders-none">{t('No tests recorded for this care plan.')}</p>}
                </section>
                <section className="orders-group">
                  <h4>{t('Medicines')}</h4>
                  {encounter.plan.medications.length ? (
                    <ul className="medication-list">
                      {encounter.plan.medications.map((medication, index) => (
                        <li key={`${encounter.id}-medicine-${index}`}>
                          <b>{medication.name}</b>
                          <span>{medication.dose}</span>
                          <small>{medication.instructions}</small>
                        </li>
                      ))}
                    </ul>
                  ) : <p className="orders-none">{t('No medicines recorded for this care plan.')}</p>}
                </section>
              </div>
              {encounter.plan.prescriptionImage && (
                <details className="patient-prescription-photo">
                  <summary>{t('View prescription photo')}</summary>
                  <img src={encounter.plan.prescriptionImage} alt={t('Prescription photo shared by your doctor')} />
                </details>
              )}
              {encounter.plan.notes && <p className="orders-notes"><b>{t('Care instructions:')}</b> {encounter.plan.notes}</p>}
              <p className="orders-disclaimer">{t('Follow your doctor’s instructions. If anything is unclear, contact your doctor or pharmacist. Do not start, stop, or change medicine based on an automated suggestion.')}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
