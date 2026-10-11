import { useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '../lib/useLanguage.js';

function getLocalDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return window.Notification.permission;
}

function formatReminderTime(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function MedicationReminders({ cases, patientId }) {
  const { t } = useLanguage();
  const storageKey = `caretriage.medication-reminders.${patientId}`;
  const [reminders, setReminders] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedMedication, setSelectedMedication] = useState('');
  const [time, setTime] = useState('08:00');
  const [formError, setFormError] = useState('');
  const [notificationError, setNotificationError] = useState('');
  const [notificationPermission, setNotificationPermission] = useState(getNotificationPermission);
  const [clock, setClock] = useState(() => Date.now());
  const notifiedReminders = useRef(new Set());

  const medications = useMemo(
    () => cases.flatMap((encounter) => (
      encounter.clinicalPlan?.medications ?? []
    ).map((medication, index) => ({
      id: `${encounter.id}:${encounter.clinicalPlan.prescribedAt}:${index}`,
      name: medication.name,
      dose: medication.dose,
    }))),
    [cases],
  );
  const medicationIds = useMemo(() => new Set(medications.map((medication) => medication.id)), [medications]);
  const activeReminders = useMemo(
    () => reminders.filter((reminder) => medicationIds.has(reminder.medicationId)),
    [medicationIds, reminders],
  );
  const inactiveReminders = useMemo(
    () => reminders.filter((reminder) => !medicationIds.has(reminder.medicationId)),
    [medicationIds, reminders],
  );
  const now = new Date(clock);
  const today = getLocalDateKey(now);
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const dueReminders = activeReminders.filter((reminder) =>
    reminder.time <= currentTime && reminder.lastAction?.date !== today,
  );

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(reminders));
  }, [reminders, storageKey]);

  useEffect(() => {
    const intervalId = window.setInterval(() => setClock(Date.now()), 15000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    function notifyIfDue() {
      const checkedAt = new Date();
      const dateKey = getLocalDateKey(checkedAt);
      const timeKey = `${String(checkedAt.getHours()).padStart(2, '0')}:${String(checkedAt.getMinutes()).padStart(2, '0')}`;

      for (const reminder of activeReminders) {
        if (reminder.time > timeKey || reminder.lastAction?.date === dateKey) continue;
        const notificationKey = `${reminder.id}:${dateKey}`;
        if (notifiedReminders.current.has(notificationKey)) continue;
        notifiedReminders.current.add(notificationKey);

        if (notificationPermission === 'granted') {
          try {
            new window.Notification(t('Medicine reminder'), {
              body: `${t('Time to take')} ${reminder.name} · ${reminder.dose}`,
            });
          } catch (notificationFailure) {
            setNotificationError(`${t('Could not show a browser notification:')} ${notificationFailure.message}`);
          }
        }
      }
    }

    notifyIfDue();
    const intervalId = window.setInterval(notifyIfDue, 15000);
    return () => window.clearInterval(intervalId);
  }, [activeReminders, notificationPermission, t]);

  async function enableNotifications() {
    setNotificationError('');
    if (notificationPermission === 'unsupported') return;
    try {
      const permission = await window.Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'denied') {
        setNotificationError(t('Browser notifications are blocked. You can allow them in your browser site settings.'));
      }
    } catch (permissionFailure) {
      setNotificationError(`${t('Could not enable browser notifications:')} ${permissionFailure.message}`);
    }
  }

  function addReminder(event) {
    event.preventDefault();
    setFormError('');
    const medication = medications.find((item) => item.id === selectedMedication);
    if (!medication || !/^\d{2}:\d{2}$/.test(time)) {
      setFormError(t('Choose a prescribed medicine and a reminder time.'));
      return;
    }
    if (activeReminders.some((item) => item.medicationId === medication.id && item.time === time)) {
      setFormError(t('A daily reminder for this medicine is already set at that time.'));
      return;
    }

    setReminders((current) => [{
      id: crypto.randomUUID(),
      medicationId: medication.id,
      name: medication.name,
      dose: medication.dose,
      time,
      lastAction: null,
    }, ...current]);
  }

  function recordAction(reminderId, status) {
    setReminders((current) => current.map((reminder) => (
      reminder.id === reminderId
        ? { ...reminder, lastAction: { date: getLocalDateKey(new Date()), status } }
        : reminder
    )));
  }

  function removeReminder(reminderId) {
    setReminders((current) => current.filter((reminder) => reminder.id !== reminderId));
  }

  return (
    <section aria-labelledby="medicine-reminders-title" className="section-block medicine-reminders">
      <div className="section-heading">
        <div>
          <h2 id="medicine-reminders-title">{t('Medicine reminders')}</h2>
          <p>{t('Set a gentle daily reminder for medicines prescribed by your doctor.')}</p>
        </div>
        {notificationPermission !== 'granted' && notificationPermission !== 'unsupported' && (
          <button className="button button-outline reminder-notification-button" onClick={enableNotifications} type="button">
            {t('Enable notifications')}
          </button>
        )}
        {notificationPermission === 'granted' && <span className="reminder-enabled">{t('Notifications enabled')}</span>}
      </div>

      <div className="notice notice-soft reminder-info">
        <span aria-hidden="true">◷</span>
        <p>{t('Reminders use your device’s local time and are saved in this browser. Keep the app open for in-app alerts. Browser notifications may work while the tab is in the background, but not after the app is closed.')}</p>
      </div>

      {dueReminders.length > 0 && (
        <section aria-label={t('Reminders due now')} aria-live="polite" className="reminders-due">
          <div className="reminders-due-heading"><span aria-hidden="true">⏰</span><div><h3>{t('Time for your medicine')}</h3><p>{t('Record what you did for today’s reminder.')}</p></div></div>
          {dueReminders.map((reminder) => (
            <article className="reminder-due-card" key={reminder.id}>
              <div><b>{reminder.name}</b><span>{reminder.dose} · {formatReminderTime(reminder.time)}</span></div>
              <div className="reminder-actions">
                <button className="button button-primary button-small" onClick={() => recordAction(reminder.id, 'taken')} type="button">{t('Taken')}</button>
                <button className="button button-outline button-small" onClick={() => recordAction(reminder.id, 'skipped')} type="button">{t('Skip')}</button>
              </div>
            </article>
          ))}
        </section>
      )}

      <form className="reminder-form" onSubmit={addReminder}>
        <label className="reminder-field">
          <span>{t('Prescribed medicine')}</span>
          <select
            disabled={medications.length === 0}
            onChange={(event) => setSelectedMedication(event.target.value)}
            required
            value={selectedMedication}
          >
            <option value="">{t('Choose a medicine')}</option>
            {medications.map((medication) => (
              <option key={medication.id} value={medication.id}>{medication.name} · {medication.dose}</option>
            ))}
          </select>
        </label>
        <label className="reminder-field">
          <span>{t('Reminder time')}</span>
          <input onChange={(event) => setTime(event.target.value)} required type="time" value={time} />
        </label>
        <button className="button button-primary reminder-add-button" disabled={!medications.length} type="submit">
          <span aria-hidden="true">＋</span> {t('Add daily reminder')}
        </button>
      </form>
      {formError && <p className="reminder-error" role="alert">{formError}</p>}
      {notificationError && <p className="reminder-error" role="alert">{notificationError}</p>}
      {notificationPermission === 'unsupported' && (
        <p className="reminder-note">{t('This browser does not support desktop notifications. In-app reminders are still available while this page is open.')}</p>
      )}

      <div className="reminder-list-heading">
        <h3>{t('Your daily schedule')}</h3>
        <span className="subtle-count">{activeReminders.length} {activeReminders.length === 1 ? t('reminder') : t('reminders')}</span>
      </div>
      {activeReminders.length ? (
        <div className="reminder-list">
          {[...activeReminders].sort((a, b) => a.time.localeCompare(b.time)).map((reminder) => {
            const completedToday = reminder.lastAction?.date === today;
            return (
              <article className="reminder-schedule-card" key={reminder.id}>
                <span aria-hidden="true" className="reminder-clock">◷</span>
                <div className="reminder-schedule-copy">
                  <b>{reminder.name}</b>
                  <span>{reminder.dose}</span>
                  <small>{t('Every day at')} {formatReminderTime(reminder.time)}</small>
                </div>
                {completedToday && <span className={`reminder-status ${reminder.lastAction.status}`}>{t(reminder.lastAction.status === 'taken' ? 'Taken today' : 'Skipped today')}</span>}
                <button aria-label={`${t('Remove reminder for')} ${reminder.name}`} className="reminder-remove" onClick={() => removeReminder(reminder.id)} type="button">{t('Remove')}</button>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="orders-empty reminder-empty">
          <span aria-hidden="true" className="empty-state-icon">◷</span>
          <div>
            <h3>{t(medications.length ? 'No reminders set yet' : 'No prescribed medicines available')}</h3>
            <p>{t(medications.length ? 'Add a time for a medicine above and it will appear in your daily schedule.' : 'Medicines prescribed by your doctor will appear here. Reminders can only be set for those medicines.')}</p>
          </div>
        </div>
      )}

      {inactiveReminders.length > 0 && (
        <section className="reminder-inactive">
          <h3>{t('Review these reminders')}</h3>
          <p>{t('The prescription has changed or is no longer listed. These reminders are paused.')}</p>
          {inactiveReminders.map((reminder) => (
            <article className="reminder-schedule-card" key={reminder.id}>
              <div className="reminder-schedule-copy"><b>{reminder.name}</b><span>{reminder.dose}</span></div>
              <button aria-label={`${t('Remove reminder for')} ${reminder.name}`} className="reminder-remove" onClick={() => removeReminder(reminder.id)} type="button">{t('Remove')}</button>
            </article>
          ))}
        </section>
      )}

      <p className="reminder-note">{t('A reminder does not change your prescription. Follow your clinician’s instructions, and contact your doctor or pharmacist if you are unsure about a dose.')}</p>
    </section>
  );
}
