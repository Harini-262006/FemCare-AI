import { useEffect, useRef } from 'react';
import { useAppStore, useReminders as useStoreReminders, type Reminder } from '../store';
import { reminderAPI } from '../services/api';

let audioContext: AudioContext | null = null;

const playBeep = async () => {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    const beepCount = 5;
    const beepDuration = 0.4;
    const gapBetweenBeeps = 0.15;

    for (let i = 0; i < beepCount; i++) {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.type = 'sine';
      oscillator.frequency.value = i % 2 === 0 ? 1000 : 1200;

      const startDelay = i * (beepDuration + gapBetweenBeeps);
      oscillator.start(audioContext.currentTime + startDelay);

      gainNode.gain.setValueAtTime(0, audioContext.currentTime + startDelay);
      gainNode.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + startDelay + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + startDelay + beepDuration);

      oscillator.stop(audioContext.currentTime + startDelay + beepDuration);
    }
  } catch (e) {
    console.error('Error playing beep:', e);
  }
};

const requestNotificationPermission = async () => {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') return;
  if (Notification.permission !== 'denied') {
    await Notification.requestPermission();
  }
};

const showNotification = (title: string, body: string) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  new Notification(title, {
    body,
    requireInteraction: true,
  });
};

export { playBeep, requestNotificationPermission, showNotification };

export const useReminders = () => {
  const reminders = useStoreReminders();
  const user = useAppStore((state) => state.user);
  const { updateReminder, addNotification, addReminder } = useAppStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckedMinute = useRef<string>('');

  // Fetch reminders from MongoDB backend when user is logged in
  useEffect(() => {
    if (!user || !user.token || user.role !== 'patient') return;

    let isMounted = true;
    const fetchBackendReminders = async () => {
      try {
        const backendReminders = await reminderAPI.getReminders();
        if (isMounted && Array.isArray(backendReminders)) {
          backendReminders.forEach((r) => {
            const formatted: Reminder = {
              id: r._id,
              title: r.title,
              type: (r.type as any) || 'medicine',
              time: r.time,
              date: r.date,
              notes: r.notes,
              recurrence: r.recurrence || 'daily',
              enabled: r.enabled,
              completedDates: r.completedDates || [],
              lastTriggered: r.lastTriggered,
            };
            const existing = reminders.find((item) => item.id === r._id);
            if (existing) {
              updateReminder(r._id, formatted);
            } else {
              addReminder(formatted);
            }
          });
        }
      } catch (err) {
        console.error('Failed to sync backend reminders:', err);
      }
    };

    fetchBackendReminders();
  }, [user?.id]);

  const checkReminders = () => {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD

    if (lastCheckedMinute.current === currentTime) return;
    lastCheckedMinute.current = currentTime;

    reminders.forEach((reminder: Reminder) => {
      if (!reminder.enabled) return;

      const recurrence = reminder.recurrence || 'daily';
      let isDateMatch = false;

      if (recurrence === 'daily' || recurrence === 'custom') {
        isDateMatch = true; // Repeats every day
      } else if (recurrence === 'once') {
        isDateMatch = !reminder.date || reminder.date === today;
      } else if (recurrence === 'weekly') {
        if (!reminder.date) {
          isDateMatch = true;
        } else {
          const reminderDay = new Date(reminder.date).getDay();
          const currentDay = now.getDay();
          isDateMatch = reminderDay === currentDay;
        }
      }

      if (!isDateMatch) return;
      if (reminder.time !== currentTime) return;
      if (reminder.lastTriggered === today) return;

      playBeep();
      showNotification('FemCare Reminder', reminder.title);

      addNotification({
        id: Date.now().toString(),
        title: 'Reminder',
        message: `${reminder.title} (${recurrence === 'daily' ? 'Daily' : recurrence})`,
        type: 'reminder',
        read: false,
        timestamp: new Date(),
      });

      updateReminder(reminder.id, { lastTriggered: today });

      // Update backend if logged in
      if (user && user.token && user.role === 'patient' && reminder.id.length > 10) {
        reminderAPI.updateReminder(reminder.id, { lastTriggered: today }).catch(() => {});
      }
    });
  };

  useEffect(() => {
    requestNotificationPermission();
    intervalRef.current = setInterval(checkReminders, 10000);
    checkReminders();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [reminders]);

  return null;
};
