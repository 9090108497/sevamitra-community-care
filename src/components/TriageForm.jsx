import { useEffect, useRef, useState } from 'react';
import { createWorker } from 'tesseract.js';
import { compressImageToDataUrl } from '../lib/image.js';
import { useLanguage } from '../lib/useLanguage.js';

const COMMON_SYMPTOMS = [
  'Fever',
  'Cough',
  'Headache',
  'Sore throat',
  'Body aches',
  'Fatigue',
  'Nausea',
  'Vomiting',
  'Diarrhea',
  'Stomach pain',
  'Shortness of breath',
  'Rash',
];

export default function TriageForm({ user, patients = [], onClose, onSubmit }) {
  const { language, t } = useLanguage();
  const isPatient = user.role === 'patient';
  const [error, setError] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [patientPhoto, setPatientPhoto] = useState('');
  const [photoDescription, setPhotoDescription] = useState('');
  const [photoStatus, setPhotoStatus] = useState('');
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);
  const [isOpeningCamera, setIsOpeningCamera] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [symptoms, setSymptoms] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [voiceState, setVoiceState] = useState('idle');
  const [voiceMessage, setVoiceMessage] = useState('');
  const [isVoiceWarning, setIsVoiceWarning] = useState(false);
  const [voiceLanguage, setVoiceLanguage] = useState(() =>
    language === 'hi' ? 'hi-IN' : language === 'or' ? 'or-IN' : 'en-IN',
  );
  const recognitionRef = useRef(null);
  const symptomInputRef = useRef(null);
  const photoInputRef = useRef(null);
  const cameraVideoRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const selectedPatient = patients.find((patient) => patient.patientId === selectedPatientId);

  function addCommonSymptom(symptom) {
    const normalizedSymptoms = symptoms.toLocaleLowerCase();
    if (normalizedSymptoms.includes(symptom.toLocaleLowerCase())) return;

    const displayText = language === 'en' ? symptom : `${t(symptom)} (${symptom.toLocaleLowerCase()})`;
    setSymptoms((current) => `${current.trimEnd()}${current.trim() ? '; ' : ''}${displayText}`);
    symptomInputRef.current?.focus();
  }

  useEffect(() => () => {
    recognitionRef.current?.abort();
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  useEffect(() => {
    if (!isCameraOpen || !cameraVideoRef.current || !cameraStreamRef.current) return;

    const video = cameraVideoRef.current;
    video.srcObject = cameraStreamRef.current;
    video.play().catch((cameraError) => {
      setPhotoError(`${t('Could not start the camera preview:')} ${cameraError.message}`);
    });
  }, [isCameraOpen, t]);

  function toggleVoiceInput() {
    if (voiceState === 'listening') {
      recognitionRef.current?.stop();
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceMessage(t('Voice input is not supported by this browser. Please type your symptoms instead.'));
      setIsVoiceWarning(true);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = voiceLanguage;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognitionRef.current = recognition;
    let finalTranscript = '';

    recognition.onstart = () => {
      setVoiceState('listening');
      setVoiceMessage(t('Listening… Speak clearly, then press Stop listening.'));
      setIsVoiceWarning(false);
    };
    recognition.onresult = (event) => {
      let interimTranscript = '';
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const transcript = event.results[index][0].transcript;
        if (event.results[index].isFinal) {
          finalTranscript += `${transcript} `;
        } else {
          interimTranscript += transcript;
        }
      }
      const spokenText = `${finalTranscript}${interimTranscript}`.trim();
      const committedText = finalTranscript.trim();
      const priorCommitted = recognition.committedText ?? '';
      const newCommitted = committedText.slice(priorCommitted.length).trim();
      recognition.committedText = committedText;
      if (newCommitted) {
        setSymptoms((current) => {
          const existingText = current.trimEnd();
          return existingText ? `${existingText} ${newCommitted}` : newCommitted;
        });
      }
      if (interimTranscript) {
        setVoiceMessage(`${t('Hearing:')} ${interimTranscript}`);
        setIsVoiceWarning(false);
      } else if (spokenText) {
        setVoiceMessage(t('Your spoken words were added. You can edit them before submitting.'));
        setIsVoiceWarning(false);
      }
    };
    recognition.onerror = (event) => {
      const messages = {
        'not-allowed': 'Microphone access was blocked. Allow microphone access in your browser settings, or type your symptoms.',
        'no-speech': 'No speech was detected. Try again or type your symptoms.',
        'audio-capture': 'No microphone was found. Connect a microphone or type your symptoms.',
        network: 'Voice recognition could not connect. Check your internet and try again, or type your symptoms.',
      };
      setVoiceMessage(t(messages[event.error] ?? 'Voice input stopped unexpectedly. Please try again or type your symptoms.'));
      setIsVoiceWarning(true);
      setVoiceState('idle');
    };
    recognition.onend = () => {
      setVoiceState('idle');
      recognitionRef.current = null;
      symptomInputRef.current?.focus();
    };

    setError('');
    setIsVoiceWarning(false);
    try {
      recognition.start();
    } catch (recognitionError) {
      setVoiceState('idle');
      setVoiceMessage(`${t('Could not start voice input:')} ${recognitionError.message}`);
      setIsVoiceWarning(true);
    }
  }

  async function analyzePhoto(file) {
    setPhotoError('');
    setPhotoDescription('');
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setPhotoError(t('Choose an image file for the patient photo.'));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setPhotoError(t('The photo must be 10 MB or smaller.'));
      return;
    }

    setIsAnalyzingPhoto(true);
    setPhotoStatus(t('Preparing photo…'));
    let imageData;
    let worker;
    try {
      imageData = await compressImageToDataUrl(file, 350 * 1024);
      setPatientPhoto(imageData);
      setPhotoStatus(t('Reading text from the photo in this browser…'));
      worker = await createWorker('eng');
      const { data } = await worker.recognize(imageData);
      const textLines = data.text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
      const excerpt = textLines.slice(0, 2).join(' ').slice(0, 180);
      setPhotoDescription(excerpt
        ? `${t('OCR detected readable text:')} “${excerpt}”.`
        : t('No readable text detected. Doctor visual review is needed.'));
      setPhotoStatus(t('Photo is ready to attach to this case.'));
    } catch (photoAnalysisError) {
      if (imageData) {
        setPatientPhoto(imageData);
        setPhotoDescription(t('Text recognition did not complete. Doctor visual review is needed.'));
        setPhotoStatus(t('Photo attached; text recognition failed.'));
      } else {
        setPhotoError(`${t('Could not process this photo:')} ${photoAnalysisError.message}`);
        setPhotoStatus('');
      }
    } finally {
      if (worker) await worker.terminate();
      setIsAnalyzingPhoto(false);
    }
  }

  async function startLiveCamera() {
    setPhotoError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setPhotoError(t('Live camera access is not supported here. Use the photo upload option instead.'));
      return;
    }

    setIsOpeningCamera(true);
    try {
      cameraStreamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'environment' } },
      });
      setIsCameraOpen(true);
    } catch (cameraError) {
      const message = cameraError.name === 'NotAllowedError'
        ? t('Camera access was denied. Allow camera permission in your browser settings, or upload a photo instead.')
        : cameraError.name === 'NotFoundError'
          ? t('No camera was found. Upload a photo instead.')
          : `${t('Could not access the camera:')} ${cameraError.message}`;
      setPhotoError(message);
    } finally {
      setIsOpeningCamera(false);
    }
  }

  function stopLiveCamera() {
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    cameraStreamRef.current = null;
    if (cameraVideoRef.current) cameraVideoRef.current.srcObject = null;
    setIsCameraOpen(false);
  }

  async function captureLivePhoto() {
    const video = cameraVideoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setPhotoError(t('The camera is not ready yet. Wait for the preview and try again.'));
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) {
      setPhotoError(t('Photo capture is unavailable in this browser.'));
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
    if (!blob) {
      setPhotoError(t('Could not capture a photo. Please try again or upload an image.'));
      return;
    }

    stopLiveCamera();
    await analyzePhoto(new File([blob], 'patient-photo.jpg', { type: 'image/jpeg' }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (isAnalyzingPhoto) {
      setError(t('Wait for photo processing to finish before submitting.'));
      return;
    }
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const age = selectedPatient ? Number(selectedPatient.age) : Number(values.age);
    const oxygen = values.oxygen ? Number(values.oxygen) : '';
    const pulse = values.pulse ? Number(values.pulse) : '';
    const temperature = values.temperature ? Number(values.temperature) : '';
    const glucose = values.glucose ? Number(values.glucose) : '';
    const weight = values.weight ? Number(values.weight) : '';
    const bloodPressure = values.bloodPressure?.trim() ?? '';
    if (!Number.isFinite(age) || age < 0 || age > 120) {
      setError(t('Enter an age between 0 and 120.'));
      return;
    }
    if (oxygen !== '' && (oxygen < 50 || oxygen > 100)) {
      setError(t('Oxygen saturation should be between 50% and 100%.'));
      return;
    }
    if (pulse !== '' && (pulse < 20 || pulse > 250)) {
      setError(t('Heart rate should be between 20 and 250 beats per minute.'));
      return;
    }
    if (temperature !== '' && (!Number.isFinite(temperature) || temperature < 80 || temperature > 115)) {
      setError(t('Temperature should be between 80°F and 115°F.'));
      return;
    }
    if (glucose !== '' && (!Number.isFinite(glucose) || glucose < 20 || glucose > 600)) {
      setError(t('Blood glucose should be between 20 and 600 mg/dL.'));
      return;
    }
    if (weight !== '' && (!Number.isFinite(weight) || weight < 1 || weight > 300)) {
      setError(t('Weight should be between 1 and 300 kg.'));
      return;
    }
    if (bloodPressure && !/^\d{2,3}\s*\/\s*\d{2,3}$/.test(bloodPressure)) {
      setError(t('Blood pressure should use the format 120/80.'));
      return;
    }

    onSubmit({
      patientId: selectedPatient?.patientId,
      patientName: isPatient ? user.name : selectedPatient?.patientName ?? values.patientName.trim(),
      age,
      gender: selectedPatient?.gender ?? values.gender,
      symptoms: values.symptoms.trim(),
      duration: values.duration.trim(),
      reportedSeverity: values.severity,
      facility: values.facility.trim(),
      oxygen,
      pulse,
      temperature,
      bloodPressure,
      glucose,
      weight,
      patientPhoto,
      photoDescription,
    });
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section aria-labelledby="triage-form-title" aria-modal="true" className="modal-card intake-modal" role="dialog">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">{t('SYMPTOM INTAKE')}</p>
            <h2 id="triage-form-title">{t(isPatient ? 'Tell us how you are feeling' : 'Register a patient')}</h2>
            <p>{t('Share a few details so we can suggest an appropriate next step.')}</p>
          </div>
          <button aria-label={t('Close')} className="modal-close" onClick={onClose} type="button">×</button>
        </div>
        <div className="notice notice-soft"><span>ⓘ</span> {t('This is a guidance tool, not a medical diagnosis. If this is an emergency, seek urgent care now.')}</div>
        <form className="intake-form" onSubmit={handleSubmit}>
          {!isPatient && (
            patients.length > 0 && (
              <label className="field-label">{t('Use an existing patient record')} <span className="optional">{t('Optional')}</span>
                <select name="registeredPatient" onChange={(event) => setSelectedPatientId(event.target.value)} value={selectedPatientId}>
                  <option value="">{t('Register a new patient')}</option>
                  {patients.map((patient) => <option key={patient.patientId} value={patient.patientId}>{patient.patientName} · {patient.patientId}</option>)}
                </select>
              </label>
            )
          )}
          {!isPatient && !selectedPatient && (
            <div className="form-grid">
              <label className="field-label">{t('Patient full name')}
                <input autoFocus name="patientName" placeholder={t('Enter patient name')} required />
              </label>
              <label className="field-label">{t('Age')}
                <input min="0" max="120" name="age" placeholder={t('e.g. 35')} required type="number" />
              </label>
            </div>
          )}
          {isPatient && (
            <div className="patient-name-chip"><span className="avatar avatar-small">{user.name.charAt(0).toUpperCase()}</span><span><small>{t('Adding symptoms for')}</small><b>{user.name}</b></span></div>
          )}
          <div className="form-grid">
            {isPatient && (
              <label className="field-label">{t('Age')}
                <input min="0" max="120" name="age" placeholder={t('e.g. 35')} required type="number" />
              </label>
            )}
            {(isPatient || !selectedPatient) && <label className="field-label">{t('Gender')} <span className="optional">{t('Optional')}</span>
              <select name="gender" defaultValue="">
                <option value="">{t('Select')}</option><option value="Female">{t('Female')}</option><option value="Male">{t('Male')}</option><option value="Other">{t('Other')}</option><option value="Prefer not to say">{t('Prefer not to say')}</option>
              </select>
            </label>}
            <label className="field-label">{t('How long have you had this?')}
              <select name="duration" defaultValue="">
                <option value="">{t('Choose duration')}</option><option value="Today">{t('Today')}</option><option value="1–3 days">{t('1–3 days')}</option><option value="4–7 days">{t('4–7 days')}</option><option value="More than a week">{t('More than a week')}</option>
              </select>
            </label>
            <label className="field-label">{t('Reported symptom severity')} <span className="optional">{t('Optional')}</span>
              <select name="severity" defaultValue="">
                <option value="">{t('Select')}</option>
                <option value="Mild">{t('Mild')}</option>
                <option value="Moderate">{t('Moderate')}</option>
                <option value="Severe">{t('Severe')}</option>
                <option value="Critical">{t('Critical')}</option>
              </select>
            </label>
            <label className="field-label">{t('Facility or village')} <span className="optional">{t('Optional')}</span>
              <input maxLength="120" name="facility" placeholder={t('Enter facility or village')} />
            </label>
          </div>
          <p className="field-hint">{t('Reported severity is recorded for clinician review and does not change the automated triage result.')}</p>
          <div className="field-label symptom-field">
            <label htmlFor="symptoms">{t('What symptoms are you experiencing?')}</label>
            <div className="voice-controls">
              <label className="voice-language-label" htmlFor="voiceLanguage">{t('Voice language')}</label>
              <select aria-label={t('Voice language')} className="voice-language" id="voiceLanguage" onChange={(event) => setVoiceLanguage(event.target.value)} value={voiceLanguage}>
                <option value="en-IN">{t('English')}</option>
                <option value="hi-IN">{t('Hindi')}</option>
                <option value="bn-IN">{t('Bengali')}</option>
                <option value="or-IN">{t('Odia')}</option>
              </select>
              <button aria-pressed={voiceState === 'listening'} className={voiceState === 'listening' ? 'button voice-button listening' : 'button voice-button'} onClick={toggleVoiceInput} type="button">
                <span aria-hidden="true">{voiceState === 'listening' ? '■' : '●'}</span>
                {voiceState === 'listening' ? t('Stop listening') : t('Speak symptoms')}
              </button>
            </div>
            <div className="common-symptoms">
              <span className="common-symptoms-label">{t('Common symptoms')}</span>
              <div aria-label={t('Common symptoms')} className="common-symptom-options">
                {COMMON_SYMPTOMS.map((symptom) => {
                  const isIncluded = symptoms.toLocaleLowerCase().includes(symptom.toLocaleLowerCase());
                  return (
                    <button
                      aria-pressed={isIncluded}
                      className={isIncluded ? 'symptom-chip selected' : 'symptom-chip'}
                      disabled={isIncluded}
                      key={symptom}
                      onClick={() => addCommonSymptom(symptom)}
                      type="button"
                    >
                      {isIncluded && <span aria-hidden="true">✓ </span>}{t(symptom)}
                    </button>
                  );
                })}
              </div>
              <small className="field-hint">{t('Select any symptoms to add them to your description. You can edit the text afterward.')}</small>
            </div>
            <textarea
              autoFocus={isPatient}
              id="symptoms"
              maxLength="1000"
              name="symptoms"
              onChange={(event) => setSymptoms(event.target.value)}
              placeholder={t('Speak or type symptoms, when they started, and anything that makes them better or worse…')}
              ref={symptomInputRef}
              required
              rows="4"
              value={symptoms}
            />
            <small aria-live="polite" className={isVoiceWarning ? 'voice-message voice-message-warning' : 'voice-message'}>{voiceMessage || t('Voice input uses your browser’s speech recognition. Review the transcript before submitting.')}</small>
            <small className="field-hint">{t('Include one symptom at a time if you can. This helps us find a relevant care team.')}</small>
          </div>
          <div className="patient-photo-upload">
            <div>
              <b>{t('Patient photo')} <span className="optional">{t('Optional')}</span></b>
              <p>{t('Add a photo to help the doctor review this case. Text recognition runs in your browser and does not diagnose images.')}</p>
            </div>
            <input
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={(event) => {
                analyzePhoto(event.target.files?.[0]);
                event.target.value = '';
              }}
              ref={photoInputRef}
              type="file"
            />
            <div className="photo-upload-actions">
              <button className="button button-small button-outline" disabled={isAnalyzingPhoto || isOpeningCamera || isCameraOpen} onClick={startLiveCamera} type="button">
                {isOpeningCamera ? t('Opening camera…') : t('Open live camera')}
              </button>
              <button className="button button-small button-outline" disabled={isAnalyzingPhoto || isOpeningCamera || isCameraOpen} onClick={() => photoInputRef.current?.click()} type="button">
                {patientPhoto ? t('Upload / replace photo') : t('Upload photo')}
              </button>
              {patientPhoto && <button className="text-button" disabled={isAnalyzingPhoto} onClick={() => { setPatientPhoto(''); setPhotoDescription(''); setPhotoStatus(''); }} type="button">{t('Remove photo')}</button>}
            </div>
            {isCameraOpen && (
              <div className="live-camera">
                <video aria-label={t('Live camera preview')} autoPlay playsInline ref={cameraVideoRef} />
                <div className="photo-upload-actions">
                  <button className="button button-small button-primary" onClick={captureLivePhoto} type="button">{t('Capture photo')}</button>
                  <button className="button button-small button-quiet" onClick={stopLiveCamera} type="button">{t('Cancel camera')}</button>
                </div>
              </div>
            )}
            {patientPhoto && <img className="patient-photo-preview" src={patientPhoto} alt={t('Patient-submitted photo preview')} />}
            {photoStatus && <p className="photo-upload-status" role="status">{photoStatus}</p>}
            {photoDescription && <p className="photo-description"><b>{t('Automated photo note (OCR only):')}</b> {photoDescription}</p>}
            {photoError && <p className="form-error" role="alert">{photoError}</p>}
          </div>
          <div className="form-grid">
            <label className="field-label">{t('Oxygen saturation')} <span className="optional">{t('Optional')} · %</span>
              <input max="100" min="50" name="oxygen" placeholder={t('e.g. 98')} type="number" />
            </label>
            <label className="field-label">{t('Heart rate')} <span className="optional">{t('Optional')} · bpm</span>
              <input max="250" min="20" name="pulse" placeholder={t('e.g. 76')} type="number" />
            </label>
          </div>
          <div className="form-grid">
            <label className="field-label">{t('Temperature')} <span className="optional">{t('Optional')} · °F</span>
              <input max="115" min="80" name="temperature" placeholder={t('e.g. 98.6')} step="0.1" type="number" />
            </label>
            <label className="field-label">{t('Blood pressure')} <span className="optional">{t('Optional')}</span>
              <input name="bloodPressure" placeholder={t('e.g. 120/80')} />
            </label>
            <label className="field-label">{t('Blood glucose')} <span className="optional">{t('Optional')} · mg/dL</span>
              <input max="600" min="20" name="glucose" placeholder={t('e.g. 100')} type="number" />
            </label>
            <label className="field-label">{t('Weight')} <span className="optional">{t('Optional')} · kg</span>
              <input max="300" min="1" name="weight" placeholder={t('e.g. 65')} step="0.1" type="number" />
            </label>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="modal-actions">
            <button className="button button-quiet" onClick={onClose} type="button">{t('Cancel')}</button>
            <button className="button button-primary" disabled={isAnalyzingPhoto} type="submit">{isAnalyzingPhoto ? t('Please wait…') : t('Get care suggestion')} <span>→</span></button>
          </div>
        </form>
      </section>
    </div>
  );
}
