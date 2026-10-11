import { useEffect, useState } from 'react';
import Signin from './components/Signin.jsx';
import DoctorDashboard from './components/DoctorDashboard.jsx';
import PatientDashboard from './components/PatientDashboard.jsx';
import WorkerDashboard from './components/WorkerDashboard.jsx';
import { getTriageAssessment } from './lib/triage.js';

const USERS_KEY = 'caretriage.users';
const CASES_KEY = 'caretriage.cases';
const FOLLOW_UPS_KEY = 'caretriage.followups';

function readStoredList(key) {
  const saved = localStorage.getItem(key);
  return saved ? JSON.parse(saved) : [];
}

function createId(prefix) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

export default function App() {
  const [users, setUsers] = useState(() => readStoredList(USERS_KEY));
  const [cases, setCases] = useState(() => readStoredList(CASES_KEY));
  const [followUps, setFollowUps] = useState(() => readStoredList(FOLLOW_UPS_KEY));
  const [activeUser, setActiveUser] = useState(null);

  useEffect(() => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(CASES_KEY, JSON.stringify(cases));
  }, [cases]);

  useEffect(() => {
    localStorage.setItem(FOLLOW_UPS_KEY, JSON.stringify(followUps));
  }, [followUps]);

  async function registerAccount({ name, email, password, role, accessCode }) {
    const normalizedEmail = email.trim().toLowerCase();
    if (users.some((user) => user.email === normalizedEmail)) {
      throw new Error('An account with this email already exists. Please sign in instead.');
    }

    const requiredCode = role === 'doctor' ? 'DOCTOR-CARE26' : 'ASHA-CARE26';
    if (role !== 'patient' && accessCode.trim().toUpperCase() !== requiredCode) {
      throw new Error('That staff access code is not valid. Check the code and try again.');
    }

    const passwordHash = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(password),
    );
    const user = {
      id: createId(role === 'patient' ? 'PT' : role === 'worker' ? 'AS' : 'DR'),
      name: name.trim(),
      email: normalizedEmail,
      role,
      passwordHash: Array.from(new Uint8Array(passwordHash), (byte) =>
        byte.toString(16).padStart(2, '0'),
      ).join(''),
    };

    setUsers((current) => [...current, user]);
    setActiveUser(user);
  }

  async function signIn({ email, password, role }) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = users.find((item) => item.email === normalizedEmail && item.role === role);
    if (!user) {
      throw new Error('No account was found for this email and role.');
    }

    const passwordHash = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(password),
    );
    const submittedHash = Array.from(new Uint8Array(passwordHash), (byte) =>
      byte.toString(16).padStart(2, '0'),
    ).join('');
    if (submittedHash !== user.passwordHash) {
      throw new Error('The password you entered is incorrect.');
    }
    setActiveUser(user);
  }

  function addCase(details) {
    const assessment = getTriageAssessment(details);
    const encounter = {
      ...details,
      ...assessment,
      id: createId('CT'),
      patientId: activeUser.role === 'patient' ? activeUser.id : details.patientId || createId('PT'),
      createdBy: activeUser.id,
      createdByRole: activeUser.role,
      createdAt: new Date().toISOString(),
      reviewStatus: 'Awaiting doctor review',
    };
    setCases((current) => [encounter, ...current]);
    return encounter;
  }

  function updateCase(caseId, updates) {
    setCases((current) =>
      current.map((encounter) =>
        encounter.id === caseId ? { ...encounter, ...updates } : encounter,
      ),
    );
  }

  function addFollowUp(details) {
    const followUp = {
      ...details,
      id: createId('FU'),
      createdBy: activeUser.id,
      createdByName: activeUser.name,
      createdAt: new Date().toISOString(),
      status: 'Pending',
    };
    setFollowUps((current) => [followUp, ...current]);
    return followUp;
  }

  function completeFollowUp(followUpId, outcomeNotes) {
    setFollowUps((current) => current.map((item) => (
      item.id === followUpId
        ? { ...item, status: 'Completed', outcomeNotes: outcomeNotes.trim(), completedAt: new Date().toISOString() }
        : item
    )));
  }

  if (!activeUser) {
    return <Signin onSignIn={signIn} onRegister={registerAccount} />;
  }

  const signOut = () => setActiveUser(null);
  const sharedProps = { user: activeUser, onSignOut: signOut };

  if (activeUser.role === 'doctor') {
    return (
      <DoctorDashboard
        {...sharedProps}
        cases={cases}
        followUps={followUps}
        onAddFollowUp={addFollowUp}
        onCompleteFollowUp={completeFollowUp}
        onUpdateCase={updateCase}
      />
    );
  }

  if (activeUser.role === 'worker') {
    const workerCases = cases.filter((encounter) => encounter.createdBy === activeUser.id);
    const workerCaseIds = new Set(workerCases.map((encounter) => encounter.id));
    return (
      <WorkerDashboard
        {...sharedProps}
        cases={workerCases}
        followUps={followUps.filter((item) => workerCaseIds.has(item.encounterId))}
        onAddCase={addCase}
        onCompleteFollowUp={completeFollowUp}
      />
    );
  }

  const patientCases = cases.filter((encounter) => encounter.patientId === activeUser.id);
  return (
    <PatientDashboard
      {...sharedProps}
      cases={patientCases}
      followUps={followUps.filter((item) => item.patientId === activeUser.id)}
      onAddCase={addCase}
    />
  );
}
