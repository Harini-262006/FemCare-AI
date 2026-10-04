import { type Profile, type Reminder } from '@/store'

export interface SmartReminderDefinition {
  smartKey: string
  title: string
  type: Reminder['type']
  time: string
  notes: string
  smartPurpose: string
  recurrence: 'daily' | 'once' | 'weekly'
}

export function generateSmartReminderDefinitions(profile: Profile | null): SmartReminderDefinition[] {
  const defs: SmartReminderDefinition[] = []

  // 1. Morning Hydration
  const waterTarget = profile?.waterIntake || 2.5
  defs.push({
    smartKey: 'smart-hydration-morning',
    title: 'Morning Hydration Kickstart',
    type: 'water',
    time: '08:00',
    notes: `Drink 350-500ml of water to start your day toward your ${waterTarget}L daily hydration goal.`,
    smartPurpose: 'Hydration Goal',
    recurrence: 'daily',
  })

  // 2. Afternoon Hydration Boost
  defs.push({
    smartKey: 'smart-hydration-afternoon',
    title: 'Midday Hydration & Energy Boost',
    type: 'water',
    time: '14:30',
    notes: 'Stay hydrated through the afternoon for optimal hormonal health and cellular recharge.',
    smartPurpose: 'Hydration Goal',
    recurrence: 'daily',
  })

  // 3. Balanced Nutrition
  const dietPref = profile?.dietPreference || profile?.foodPreference || 'Balanced'
  defs.push({
    smartKey: 'smart-meal-lunch',
    title: `Nutritious ${dietPref} Lunch`,
    type: 'meal',
    time: '13:00',
    notes: `Fuel your afternoon with a wholesome ${dietPref.toLowerCase()} meal rich in protein, fiber, and micronutrients.`,
    smartPurpose: 'Nutrition Plan',
    recurrence: 'daily',
  })

  // 4. Physical Fitness / Movement
  const exercise = profile?.exerciseRoutine || 'Regular'
  const isYoga = exercise.toLowerCase().includes('yoga')
  defs.push({
    smartKey: 'smart-exercise-routine',
    title: isYoga ? 'Daily Mindful Yoga Flow' : 'Movement & Physical Activity',
    type: isYoga ? 'yoga' : 'exercise',
    time: '18:00',
    notes: `Personalized for your ${profile?.activityLevel || 'moderate'} activity level (${exercise}).`,
    smartPurpose: 'Fitness Routine',
    recurrence: 'daily',
  })

  // 5. Sleep & Wind-down
  const sleepHrs = profile?.sleepHours || 8
  const sleepSched = profile?.sleepSchedule || ''
  let bedtimeTime = '22:30'
  if (sleepSched.includes('10 PM')) bedtimeTime = '21:30'
  else if (sleepSched.includes('1 AM')) bedtimeTime = '00:15'
  else if (sleepSched.includes('11 PM')) bedtimeTime = '22:30'

  defs.push({
    smartKey: 'smart-sleep-winddown',
    title: 'Nighttime Wind-Down & Sleep Prep',
    type: 'sleep',
    time: bedtimeTime,
    notes: `Aiming for your ${sleepHrs} hrs restorative sleep goal. Dim screens and begin relaxation.`,
    smartPurpose: 'Sleep Recovery',
    recurrence: 'daily',
  })

  // 6. Pregnancy Care
  if (profile?.pregnancyStatus === 'Yes') {
    defs.push({
      smartKey: 'smart-pregnancy-prenatal',
      title: 'Prenatal Vitamins & Folic Acid',
      type: 'prenatal-vitamins',
      time: '09:30',
      notes: `${profile.trimester ? `${profile.trimester} - ` : ''}Take prenatal nutrients with a meal for baby development & maternal wellness.`,
      smartPurpose: 'Maternal Care',
      recurrence: 'daily',
    })
  }

  // 7. Clinical Condition Reminders (Iron / Anemia)
  const medList = profile?.medicationList || []
  const conditions = profile?.existingConditions || []
  const hasIron = medList.includes('Iron Supplements') || conditions.includes('Anemia / Iron Deficiency')
  if (hasIron) {
    defs.push({
      smartKey: 'smart-med-iron',
      title: 'Iron Supplement & Vitamin C',
      type: 'iron',
      time: '11:00',
      notes: 'Take with a glass of water or citrus juice (avoid calcium/dairy for 2 hours) for maximum absorption.',
      smartPurpose: 'Prescribed Care',
      recurrence: 'daily',
    })
  }

  // 8. Thyroid condition
  const hasThyroid = (profile?.thyroid && profile.thyroid !== 'No') || medList.includes('Thyroid Hormone (Levothyroxine)')
  if (hasThyroid) {
    defs.push({
      smartKey: 'smart-med-thyroid',
      title: 'Morning Thyroid Hormone',
      type: 'medicine',
      time: '06:30',
      notes: 'Take with plain water on an empty stomach 30-60 minutes before breakfast.',
      smartPurpose: 'Endocrine Care',
      recurrence: 'daily',
    })
  }

  // 9. PCOS Support
  if (profile?.pcos === 'Yes' || profile?.pcos === 'Suspected' || conditions.includes('PCOS / PCOD')) {
    defs.push({
      smartKey: 'smart-pcos-care',
      title: 'PCOS Hormonal & Metabolic Check',
      type: 'self-care',
      time: '16:00',
      notes: 'Hydrate, enjoy spearmint tea or herbal infusion, and do 10 mins of gentle blood-sugar balancing movement.',
      smartPurpose: 'PCOS Support',
      recurrence: 'daily',
    })
  }

  // 10. Cycle & Symptom Check-in (if not pregnant)
  if (profile?.pregnancyStatus !== 'Yes') {
    defs.push({
      smartKey: 'smart-cycle-tracking',
      title: 'Cycle & Symptom Daily Check-in',
      type: 'period',
      time: '20:00',
      notes: 'Log any flow, cramps, energy, or mood shifts to keep cycle predictions highly personalized.',
      smartPurpose: 'Cycle Tracking',
      recurrence: 'daily',
    })
  }

  return defs
}

/**
 * Idempotently synchronize smart reminders with existing reminders.
 * Retains all manual reminders untouched.
 * For smart reminders, preserves user's enabled state and customized time if modified.
 */
export function syncSmartReminders(
  existingReminders: Reminder[],
  profile: Profile | null
): { reminders: Reminder[]; hasChanges: boolean } {
  const manualReminders = existingReminders.filter((r) => !r.isSmart && r.category !== 'smart')
  const existingSmartMap = new Map<string, Reminder>()
  existingReminders
    .filter((r) => r.isSmart || r.category === 'smart')
    .forEach((r) => {
      const key = r.smartKey || r.title
      existingSmartMap.set(key, r)
    })

  const newDefs = generateSmartReminderDefinitions(profile)
  let hasChanges = false

  const mergedSmartReminders: Reminder[] = newDefs.map((def) => {
    const existing = existingSmartMap.get(def.smartKey)
    if (existing) {
      // Retain existing user modifications (enabled toggle, custom time)
      return {
        ...existing,
        title: def.title,
        type: def.type,
        notes: def.notes,
        smartPurpose: def.smartPurpose,
        isSmart: true,
        category: 'smart',
        smartKey: def.smartKey,
      }
    } else {
      hasChanges = true
      return {
        id: `smart-${def.smartKey}-${Date.now()}`,
        title: def.title,
        type: def.type,
        time: def.time,
        notes: def.notes,
        recurrence: def.recurrence,
        enabled: true,
        isSmart: true,
        category: 'smart',
        smartKey: def.smartKey,
        smartPurpose: def.smartPurpose,
      }
    }
  })

  // Check if any old smart reminders are no longer valid (e.g. no longer pregnant)
  const newKeySet = new Set(newDefs.map((d) => d.smartKey))
  for (const [key] of existingSmartMap) {
    if (!newKeySet.has(key)) {
      hasChanges = true
    }
  }

  return {
    reminders: [...mergedSmartReminders, ...manualReminders],
    hasChanges,
  }
}
