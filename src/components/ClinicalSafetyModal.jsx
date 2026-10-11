import { useLanguage } from '../lib/useLanguage.js';

export default function ClinicalSafetyModal({ onClose }) {
  const { t } = useLanguage();

  return (
    <div
      className="modal-backdrop safety-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        aria-labelledby="safety-modal-title"
        aria-modal="true"
        className="modal-card safety-modal"
        role="dialog"
      >
        <div className="modal-heading">
          <div>
            <p className="eyebrow">SEVAMITRA</p>
            <h2 id="safety-modal-title">{t('Clinical safety & AI')}</h2>
            <p>{t('How to use care suggestions safely.')}</p>
          </div>
          <button aria-label={t('Close')} className="modal-close" onClick={onClose} type="button">×</button>
        </div>
        <div className="safety-modal-content">
          <article>
            <span aria-hidden="true">✚</span>
            <div>
              <h3>{t('Guidance, not diagnosis')}</h3>
              <p>{t('SevaMitra uses a basic rules-based demo to suggest a next step from reported symptoms and optional vitals. It does not diagnose conditions or prescribe treatment. A qualified clinician makes clinical decisions.')}</p>
            </div>
          </article>
          <article>
            <span aria-hidden="true">◉</span>
            <div>
              <h3>{t('Photo and voice inputs')}</h3>
              <p>{t('Photo processing reads visible text only; it does not assess images for medical conditions. Voice transcription depends on your browser. Review all information before submitting.')}</p>
            </div>
          </article>
          <article>
            <span aria-hidden="true">▣</span>
            <div>
              <h3>{t('Demo data and privacy')}</h3>
              <p>{t('This demo stores account and case information in this browser. Avoid entering real patient-identifying or highly sensitive health information.')}</p>
            </div>
          </article>
          <div className="safety-emergency">
            {t('If you may be experiencing a medical emergency, seek urgent in-person care or call your local emergency service now.')}
          </div>
        </div>
        <div className="modal-actions">
          <button className="button button-primary" onClick={onClose} type="button">{t('Close')}</button>
        </div>
      </section>
    </div>
  );
}
