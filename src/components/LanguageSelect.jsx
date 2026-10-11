import { useLanguage } from '../lib/useLanguage.js';

export default function LanguageSelect({ className = '' }) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <label className={`language-select ${className}`}>
      <span className="sr-only">{t('Language')}</span>
      <select aria-label={t('Language')} onChange={(event) => setLanguage(event.target.value)} value={language}>
        <option value="en">{t('English')}</option>
        <option value="hi">{t('Hindi')}</option>
        <option value="or">{t('Odia')}</option>
      </select>
    </label>
  );
}
