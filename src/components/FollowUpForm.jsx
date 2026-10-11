import { useState } from 'react';
import { useLanguage } from '../lib/useLanguage.js';

function formatLocalDate(value) {
  const localDate = new Date(value.getTime() - value.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
}

function getTomorrowDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return formatLocalDate(tomorrow);
}

export default function FollowUpForm({ encounter, onClose, onSave }) {
  const { t } = useLanguage();
  const [scheduledDate, setScheduledDate] = useState(getTomorrowDate);
  const [reason, setReason] = useState(t('Review symptoms and check progress.'));

  function handleSubmit(event) {
    event.preventDefault();
    onSave({
      encounterId: encounter.id,
      patientId: encounter.patientId,
      patientName: encounter.patientName,
      scheduledDate: new Date(`${scheduledDate}T12:00:00`).toISOString(),
      reason: reason.trim(),
    });
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section aria-labelledby="follow-up-title" aria-modal="true" className="modal-card" role="dialog">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">{t('CARE FOLLOW-UP')}</p>
            <h2 id="follow-up-title">{t('Schedule a follow-up')}</h2>
            <p>{encounter.patientName} · {t('Case')} {encounter.id}</p>
          </div>
          <button aria-label={t('Close')} className="modal-close" onClick={onClose} type="button">×</button>
        </div>
        <form className="intake-form" onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="follow-up-date">{t('Visit or check-in date')}
            <input id="follow-up-date" min={formatLocalDate(new Date())} onChange={(event) => setScheduledDate(event.target.value)} required type="date" value={scheduledDate} />
          </label>
          <label className="field-label" htmlFor="follow-up-reason">{t('Reason for follow-up')}
            <textarea id="follow-up-reason" maxLength="300" onChange={(event) => setReason(event.target.value)} required rows="3" value={reason} />
          </label>
          <p className="field-hint">{t('This is a reminder in this browser only. It does not contact the patient or care team.')}</p>
          <div className="modal-actions">
            <button className="button button-quiet" onClick={onClose} type="button">{t('Cancel')}</button>
            <button className="button button-primary" type="submit">{t('Save follow-up')}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
