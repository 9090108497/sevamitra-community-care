import { useState } from 'react';
import { useLanguage } from '../lib/useLanguage.js';
import LanguageSelect from './LanguageSelect.jsx';

const roles = [
  { id: 'patient', label: 'Patient' },
  { id: 'worker', label: 'ASHA worker' },
  { id: 'doctor', label: 'Doctor' },
];

const publicBase = import.meta.env.BASE_URL;

export default function Signin({ onSignIn, onRegister }) {
  const { t } = useLanguage();
  const [role, setRole] = useState('patient');
  const [mode, setMode] = useState('signin');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const values = {
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
      accessCode: formData.get('accessCode') ?? '',
      role,
    };

    try {
      if (mode === 'signup') {
        await onRegister(values);
      } else {
        await onSignIn(values);
      }
    } catch (submissionError) {
      setError(submissionError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function changeRole(nextRole) {
    setRole(nextRole);
    setError('');
  }

  const isSignup = mode === 'signup';

  if (!showAuth) {
    return (
      <main className="signin-landing">
        <video
          aria-hidden="true"
          autoPlay
          className="signin-background-video"
          loop
          muted
          playsInline
          poster={`${publicBase}sevamitra-care-photo.jpg`}
          preload="metadata"
        >
          <source src={`${publicBase}sevamitra-signin-bg.webm`} type="video/webm" />
        </video>
        <div aria-hidden="true" className="signin-background-overlay" />
        <header className="landing-header">
          <a className="brand landing-brand" href="#" aria-label={t('SevaMitra home')}>
            <span className="brand-mark"><span>+</span></span>
            <span className="scroll-reveal-text">SevaMitra</span>
          </a>
          <span className="landing-tagline">{t('COMMUNITY CARE, CONNECTED')}</span>
        </header>
        <LanguageSelect className="landing-language-select" />
        <button
          className="landing-signin-button"
          onClick={() => setShowAuth(true)}
          type="button"
        >
          {t('Sign in')} <span aria-hidden="true">→</span>
        </button>
        <section className="landing-hero">
          <div className="landing-copy">
              <p className="landing-eyebrow">{t('CARE THAT COMES CLOSER')}</p>
              <h1>
                <span className="landing-title-drop landing-title-drop-first">{t('Better care,')}</span>{' '}
                <span className="landing-title-drop landing-title-drop-second landing-title-accent">{t('together.')}</span>
              </h1>
              <p className="landing-description">{t('Connecting patients, ASHA workers, and doctors for a clearer path from symptoms to the right care.')}</p>
              <div className="landing-highlights" aria-label={t('SevaMitra care features')}>
                <span><i aria-hidden="true">♡</i> {t('Patient-first support')}</span>
                <span><i aria-hidden="true">⌂</i> {t('Community health')}</span>
                <span><i aria-hidden="true">✚</i> {t('Clinician-guided care')}</span>
            </div>
            <button
              className="landing-primary-action"
              onClick={() => setShowAuth(true)}
              type="button"
            >
              {t('Get started')} <span aria-hidden="true">→</span>
            </button>
          </div>
          <div className="landing-art">
            <img alt="" className="landing-hero-image" src={`${publicBase}sevamitra-care-photo.jpg`} />
            <div className="landing-image-note">
              <span className="landing-note-icon">✚</span>
              <span><b>{t('Care, connected')}</b><small>{t('Support at every step')}</small></span>
            </div>
          </div>
        </section>
        <footer className="landing-footer">
          <span>{t('Thoughtful care for every community')}</span>
          <span><i /> {t('Patient')} <b>→</b> {t('ASHA worker')} <b>→</b> {t('Doctor')}</span>
        </footer>
      </main>
    );
  }

  return (
    <main className="auth-page auth-page-open">
      <video
        aria-hidden="true"
        autoPlay
        className="signin-background-video"
        loop
        muted
        playsInline
        poster={`${publicBase}sevamitra-care-photo.jpg`}
        preload="metadata"
      >
        <source src={`${publicBase}sevamitra-signin-bg.webm`} type="video/webm" />
      </video>
      <div aria-hidden="true" className="signin-background-overlay" />
      <LanguageSelect className="auth-language-select" />
      <section className="auth-panel auth-panel-centered">
        <button
          className="auth-top-signin"
          onClick={() => setShowAuth(false)}
          type="button"
        >
          <span aria-hidden="true">←</span> {t('Home')}
        </button>
        <div className="auth-card">
          <div className="brand auth-brand" aria-label="SevaMitra">
            <span className="brand-mark"><span>+</span></span>
            <span className="scroll-reveal-text">SevaMitra</span>
          </div>
          <h2>{t(isSignup ? 'Create your account' : 'Sign in to continue')}</h2>
          <p className="auth-subtitle">{t('Choose how you use SevaMitra to get started.')}</p>

          <div className="role-tabs" role="tablist" aria-label={t('Choose account type')}>
            {roles.map((option) => (
              <button
                aria-selected={role === option.id}
                className={role === option.id ? 'role-tab active' : 'role-tab'}
                key={option.id}
                onClick={() => changeRole(option.id)}
                role="tab"
                type="button"
              >
                {t(option.label)}
              </button>
            ))}
          </div>

          <div className="auth-mode-switch">
            <button
              className={mode === 'signin' ? 'mode-link selected' : 'mode-link'}
              onClick={() => { setMode('signin'); setError(''); }}
              type="button"
            >
              {t('Sign in')}
            </button>
            <button
              className={mode === 'signup' ? 'mode-link selected' : 'mode-link'}
              onClick={() => { setMode('signup'); setError(''); }}
              type="button"
            >
              {t('Create account')}
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {isSignup && (
              <label className="field-label" htmlFor="name">
                {t('Full name')}
                <input autoComplete="name" id="name" minLength="2" name="name" placeholder={t('e.g. Ananya Sharma')} required />
              </label>
            )}
            <label className="field-label" htmlFor="email">
              {t('Email address')}
              <input autoComplete="email" id="email" name="email" placeholder={t('you@example.com')} required type="email" />
            </label>
            <label className="field-label" htmlFor="password">
              {t('Password')}
              <input autoComplete={isSignup ? 'new-password' : 'current-password'} id="password" minLength="8" name="password" placeholder={t('At least 8 characters')} required type="password" />
            </label>
            {isSignup && role !== 'patient' && (
              <label className="field-label" htmlFor="accessCode">
                {t('Staff access code')}
                <input autoCapitalize="characters" autoComplete="off" id="accessCode" name="accessCode" placeholder={t('Enter your invitation code')} required />
                <small className="field-hint">
                  {t('Demo codes:')} <b>ASHA-CARE26</b> {t('for ASHA workers')} · <b>DOCTOR-CARE26</b> {t('for doctors')}
                </small>
              </label>
            )}
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="button button-primary auth-submit" disabled={isSubmitting} type="submit">
              {isSubmitting ? t('Please wait…') : t(isSignup ? 'Create account' : 'Sign in')}
              <span aria-hidden="true">→</span>
            </button>
          </form>
          <div className="security-note">
            <span className="lock-icon">⌑</span>
            <span>{t('Your information stays in this browser in this demo.')}</span>
          </div>
        </div>
        <p className="auth-legal">
          {t('SevaMitra offers guidance only. It is not a diagnosis or a substitute for professional care.')}
        </p>
      </section>
    </main>
  );
}
