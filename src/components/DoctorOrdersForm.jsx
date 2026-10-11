import { useEffect, useRef, useState } from 'react';
import { createWorker } from 'tesseract.js';
import { compressImageToDataUrl } from '../lib/image.js';
import { useLanguage } from '../lib/useLanguage.js';

function createMedication() {
  return { name: '', dose: '', instructions: '' };
}

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
function extractDraft(text) {
  const tests = [];
  const medications = [];
  const testPattern = /\b(CBC|complete blood count|blood glucose|fasting blood sugar|FBS|HbA1c|hemoglobin|urine test|urinalysis|lipid profile|liver function|kidney function|X[- ]?ray|ECG|ultrasound|culture|thyroid function)\b/i;
  const dosePattern = /\b\d+(?:\.\d+)?\s?(?:mg|mcg|µg|g|ml|mL|units?)\b/i;
  const prefixPattern = /^(?:rx\.?\s*)?(?:(?:tab(?:let)?|cap(?:sule)?|syp(?:rup)?|susp(?:ension)?|inj(?:ection)?|oint(?:ment)?)\.?\s*)/i;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/^[\s•*-]+/, '').trim();
    if (!line) continue;
    if (testPattern.test(line)) {
      tests.push(line);
      continue;
    }

    const doseMatch = line.match(dosePattern);
    if (doseMatch) {
      const name = line.slice(0, doseMatch.index).replace(prefixPattern, '').replace(/[,;:.-]+$/, '').trim();
      if (name) {
        const instructions = line.slice(doseMatch.index + doseMatch[0].length).replace(/^[\s,;:.-]+/, '').trim();
        medications.push({ name, dose: doseMatch[0], instructions });
      }
    }
  }

  return {
    tests: [...new Set(tests)],
    medications,
  };
}

export default function DoctorOrdersForm({ encounter, doctorName, onClose, onSave }) {
  const { t } = useLanguage();
  const existingPlan = encounter.clinicalPlan ?? { tests: [], medications: [], notes: '' };
  const [tests, setTests] = useState(existingPlan.tests.join('\n'));
  const [medications, setMedications] = useState(
    existingPlan.medications.length ? existingPlan.medications : [createMedication()],
  );
  const [notes, setNotes] = useState(existingPlan.notes);
  const [prescriptionImage, setPrescriptionImage] = useState(existingPlan.prescriptionImage ?? '');
  const [recognizedText, setRecognizedText] = useState('');
  const [scanStatus, setScanStatus] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isOpeningCamera, setIsOpeningCamera] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [error, setError] = useState('');
  const fileInput = useRef(null);
  const cameraVideo = useRef(null);
  const cameraStream = useRef(null);

  useEffect(() => () => {
    cameraStream.current?.getTracks().forEach((track) => track.stop());
  }, []);

  useEffect(() => {
    if (!isCameraOpen || !cameraVideo.current || !cameraStream.current) return;

    const video = cameraVideo.current;
    video.srcObject = cameraStream.current;
    video.play().catch((cameraError) => {
      setError(`${t('Could not start the camera preview:')} ${cameraError.message}`);
    });
  }, [isCameraOpen, t]);

  async function scanPrescription(file) {
    setError('');
    setRecognizedText('');
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError(t('Choose an image file for the prescription photo.'));
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setError(t('The photo must be 10 MB or smaller.'));
      return;
    }

    setIsScanning(true);
    setScanStatus(t('Preparing the prescription photo…'));
    let imageData;
    let worker;
    try {
      imageData = await compressImageToDataUrl(file);
      setPrescriptionImage(imageData);
      setScanStatus(t('Reading English text in this browser…'));
      worker = await createWorker('eng');
      const { data } = await worker.recognize(imageData);
      const text = data.text.trim();
      if (!text) throw new Error(t('No readable text was found. Try a clearer, well-lit photo.'));

      setRecognizedText(text);
      const draft = extractDraft(text);
      setTests((current) => {
        const currentTests = current.split('\n').map((test) => test.trim()).filter(Boolean);
        return [...new Set([...currentTests, ...draft.tests])].join('\n');
      });
      if (draft.medications.length) {
        setMedications((current) => {
          const existing = current.filter((medication) => medication.name || medication.dose || medication.instructions);
          const existingKeys = new Set(existing.map((medication) =>
            `${medication.name.trim().toLowerCase()}|${medication.dose.trim().toLowerCase()}`,
          ));
          return [
            ...existing,
            ...draft.medications.filter((medication) => {
              const key = `${medication.name.toLowerCase()}|${medication.dose.toLowerCase()}`;
              if (existingKeys.has(key)) return false;
              existingKeys.add(key);
              return true;
            }),
          ];
        });
      }
      setScanStatus(t('Text recognized. Check every draft field against the original before saving.'));
    } catch (scanError) {
      if (imageData) setPrescriptionImage(imageData);
      setScanStatus(t('Photo attached. Text recognition did not complete; enter the orders manually.'));
      setError(`${t('Prescription scan failed:')} ${scanError.message}`);
    } finally {
      if (worker) await worker.terminate();
      setIsScanning(false);
    }
  }

  async function startLiveCamera() {
    setError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(t('Live camera access is not supported here. Use the photo upload option instead.'));
      return;
    }

    setIsOpeningCamera(true);
    try {
      cameraStream.current = await navigator.mediaDevices.getUserMedia({
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
      setError(message);
    } finally {
      setIsOpeningCamera(false);
    }
  }

  function stopLiveCamera() {
    cameraStream.current?.getTracks().forEach((track) => track.stop());
    cameraStream.current = null;
    if (cameraVideo.current) cameraVideo.current.srcObject = null;
    setIsCameraOpen(false);
  }

  async function captureLivePhoto() {
    const video = cameraVideo.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setError(t('The camera is not ready yet. Wait for the preview and try again.'));
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) {
      setError(t('Photo capture is unavailable in this browser.'));
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
    if (!blob) {
      setError(t('Could not capture a photo. Please try again or upload an image.'));
      return;
    }

    stopLiveCamera();
    await scanPrescription(new File([blob], 'prescription-photo.jpg', { type: 'image/jpeg' }));
  }

  function updateMedication(index, field, value) {
    setMedications((current) =>
      current.map((medication, medicationIndex) =>
        medicationIndex === index ? { ...medication, [field]: value } : medication,
      ),
    );
  }

  function saveOrders(event) {
    event.preventDefault();
    const testList = tests.split('\n').map((test) => test.trim()).filter(Boolean);
    const medicationList = medications
      .map((medication) => ({
        name: medication.name.trim(),
        dose: medication.dose.trim(),
        instructions: medication.instructions.trim(),
      }))
      .filter((medication) => medication.name || medication.dose || medication.instructions);

    if (medicationList.some((medication) => !medication.name || !medication.dose || !medication.instructions)) {
      setError(t('Complete the medicine name, dose, and instructions for each medicine, or remove the empty row.'));
      return;
    }

    onSave({
      reviewStatus: 'Reviewed',
      clinicalPlan: {
        tests: testList,
        medications: medicationList,
        notes: notes.trim(),
        prescriptionImage,
        prescribedBy: 'doctor',
        prescribedByName: doctorName,
        prescribedAt: new Date().toISOString(),
      },
    });
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section aria-labelledby="doctor-orders-title" aria-modal="true" className="modal-card orders-modal" role="dialog">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">{t('DOCTOR REVIEW')}</p>
            <h2 id="doctor-orders-title">{t('Tests & medicines')}</h2>
            <p>{t('For')} {encounter.patientName} · {t('case')} {encounter.id}</p>
          </div>
          <button aria-label={t('Close')} className="modal-close" onClick={onClose} type="button">×</button>
        </div>
        <div className="notice notice-soft"><span>ⓘ</span> {t('Only add tests and medicines you have clinically assessed and decided to order. The patient will see these after you save.')}</div>
        <form className="intake-form" onSubmit={saveOrders}>
          <section className="prescription-scan">
            <div>
              <b>{t('Prescription photo')}</b>
              <p>{t('Capture or upload a prescription. English text recognition creates an editable draft; verify every detail before saving.')}</p>
            </div>
            <input
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={(event) => {
                scanPrescription(event.target.files?.[0]);
                event.target.value = '';
              }}
              ref={fileInput}
              type="file"
            />
            <div className="photo-upload-actions">
              <button className="button button-small button-outline" disabled={isScanning || isOpeningCamera || isCameraOpen} onClick={startLiveCamera} type="button">
                {isOpeningCamera ? t('Opening camera…') : t('Open live camera')}
              </button>
              <button className="button button-small button-outline" disabled={isScanning || isOpeningCamera || isCameraOpen} onClick={() => fileInput.current?.click()} type="button">
                {prescriptionImage ? t('Upload / replace photo') : t('Upload photo')}
              </button>
            </div>
            {isCameraOpen && (
              <div className="live-camera">
                <video aria-label={t('Live prescription camera preview')} autoPlay playsInline ref={cameraVideo} />
                <div className="photo-upload-actions">
                  <button className="button button-small button-primary" onClick={captureLivePhoto} type="button">{t('Capture photo')}</button>
                  <button className="button button-small button-quiet" onClick={stopLiveCamera} type="button">{t('Cancel camera')}</button>
                </div>
              </div>
            )}
            {prescriptionImage && <img className="prescription-preview" src={prescriptionImage} alt={t('Prescription photo attached to this case')} />}
            {scanStatus && <p className="scan-status" role="status">{scanStatus}</p>}
            {recognizedText && (
              <details className="recognized-text">
                <summary>{t('View recognized text')}</summary>
                <pre>{recognizedText}</pre>
              </details>
            )}
          </section>
          <label className="field-label" htmlFor="ordered-tests">{t('Tests ordered')} <span className="optional">{t('One test per line')}</span>
            <textarea id="ordered-tests" onChange={(event) => setTests(event.target.value)} placeholder={t('e.g. Complete blood count\nBlood glucose')} rows="3" value={tests} />
          </label>
          <div className="orders-medication-heading">
            <div><b>{t('Medicines prescribed')}</b><small>{t('Enter clinician-prescribed details only.')}</small></div>
            <button className="button button-small button-outline" onClick={() => setMedications((current) => [...current, createMedication()])} type="button">＋ {t('Add medicine')}</button>
          </div>
          {medications.map((medication, index) => (
            <div className="medication-row" key={`medicine-${index}`}>
              <label className="field-label">{t('Medicine name')}
                <input onChange={(event) => updateMedication(index, 'name', event.target.value)} placeholder={t('Name')} value={medication.name} />
              </label>
              <label className="field-label">{t('Dose')}
                <input onChange={(event) => updateMedication(index, 'dose', event.target.value)} placeholder={t('As prescribed')} value={medication.dose} />
              </label>
              <label className="field-label medication-instructions">{t('Instructions')}
                <input onChange={(event) => updateMedication(index, 'instructions', event.target.value)} placeholder={t('When and how to take')} value={medication.instructions} />
              </label>
              {medications.length > 1 && <button aria-label={`${t('Remove medicine')} ${index + 1}`} className="remove-medication" onClick={() => setMedications((current) => current.filter((_, medicationIndex) => medicationIndex !== index))} type="button">×</button>}
            </div>
          ))}
          <label className="field-label" htmlFor="doctor-notes">{t('Care instructions')} <span className="optional">{t('Optional')}</span>
            <textarea id="doctor-notes" onChange={(event) => setNotes(event.target.value)} placeholder={t('Follow-up instructions for the patient…')} rows="2" value={notes} />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="modal-actions">
            <button className="button button-quiet" onClick={onClose} type="button">{t('Cancel')}</button>
            <button className="button button-primary" disabled={isScanning || isOpeningCamera || isCameraOpen} type="submit">{t('Save doctor’s orders')}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
