const specialistRules = [
  {
    specialist: 'Cardiologist',
    department: 'Heart & circulation',
    terms: ['chest pain', 'chest discomfort', 'palpitation', 'heart'],
  },
  {
    specialist: 'Pulmonologist',
    department: 'Lungs & breathing',
    terms: ['breath', 'shortness of breath', 'cough', 'wheez', 'asthma'],
  },
  {
    specialist: 'Dermatologist',
    department: 'Skin & hair',
    terms: ['rash', 'skin', 'itch', 'lesion'],
  },
  {
    specialist: 'Gastroenterologist',
    department: 'Digestive health',
    terms: ['stomach', 'abdominal', 'vomit', 'diarrhea', 'digest', 'nausea'],
  },
  {
    specialist: 'Neurologist',
    department: 'Brain & nerves',
    terms: ['headache', 'seizure', 'numb', 'weakness', 'dizz', 'stroke'],
  },
  {
    specialist: 'Orthopedic specialist',
    department: 'Bones & joints',
    terms: ['joint', 'bone', 'fracture', 'back pain', 'knee', 'injury'],
  },
];

const emergencyTerms = [
  'chest pain',
  'chest discomfort',
  'severe breath',
  'severe dyspnea',
  'difficulty breathing',
  'cannot breathe',
  'unconscious',
  'loss of consciousness',
  'seizure',
  'stroke',
  'severe bleeding',
  'hemorrhag',
  'shock',
];

export function getTriageAssessment({ symptoms = '', oxygen = '', pulse = '' }) {
  const normalizedSymptoms = symptoms.toLowerCase();
  const oxygenValue = Number(oxygen);
  const pulseValue = Number(pulse);
  const emergency = emergencyTerms.some((term) => normalizedSymptoms.includes(term))
    || (oxygen !== '' && oxygenValue < 90)
    || (pulse !== '' && pulseValue > 130);

  let urgency;
  let urgencyLabel;
  let nextStep;
  if (emergency) {
    urgency = 'red';
    urgencyLabel = 'Urgent attention';
    nextStep = 'Seek immediate in-person medical care or contact local emergency services.';
  } else if (
    normalizedSymptoms.includes('high fever')
    || (oxygen !== '' && oxygenValue < 94)
    || (pulse !== '' && pulseValue > 110)
  ) {
    urgency = 'orange';
    urgencyLabel = 'Priority review';
    nextStep = 'Please arrange a prompt assessment by a healthcare professional.';
  } else if (
    normalizedSymptoms.includes('fever')
    || normalizedSymptoms.includes('pain')
    || normalizedSymptoms.includes('persistent')
  ) {
    urgency = 'yellow';
    urgencyLabel = 'Review recommended';
    nextStep = 'A clinician should review these symptoms and advise on the next steps.';
  } else {
    urgency = 'green';
    urgencyLabel = 'Routine review';
    nextStep = 'Book a routine consultation if symptoms continue or get worse.';
  }

  const match = specialistRules.find(({ terms }) =>
    terms.some((term) => normalizedSymptoms.includes(term)),
  );

  return {
    urgency,
    urgencyLabel,
    nextStep,
    specialist: match?.specialist ?? 'General physician',
    department: match?.department ?? 'Primary care',
  };
}

export function formatDate(value, language = 'en') {
  const locale = { en: 'en-IN', hi: 'hi-IN', or: 'or-IN' }[language] ?? 'en-IN';
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}
