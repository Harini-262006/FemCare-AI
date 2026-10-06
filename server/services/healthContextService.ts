import User from '../models/User.js';
import Sleep from '../models/Sleep.js';
import Mood from '../models/Mood.js';
import Workout from '../models/Workout.js';
import Cycle from '../models/Cycle.js';
import Hydration from '../models/Hydration.js';
import MedicalReport from '../models/MedicalReport.js';
import Prescription from '../models/Prescription.js';

export interface UserHealthContext {
  profile: any;
  sleepRecords: any[];
  moodRecords: any[];
  workoutRecords: any[];
  cycleRecords: any[];
  hydrationRecord: any | null;
  medicalReports: any[];
  prescriptions: any[];
}

/**
 * Efficiently fetches the complete patient context in parallel
 */
export async function fetchUserHealthContext(
  userId: string,
  userMessage?: string
): Promise<UserHealthContext> {
  const msgLower = (userMessage || '').toLowerCase();

  const isSleepQuery = /sleep|tired|exhausted|insomnia|fatigue|bedtime|wake|rest/i.test(msgLower);
  const isCycleQuery = /period|cramp|cycle|flow|menstrual|pcos|ovulation|bleed|spotting|pregnant|pregnancy|trimester/i.test(msgLower);
  const isWorkoutQuery = /workout|exercise|gym|fitness|stretching|yoga|activity|cardio|weight/i.test(msgLower);
  const isReportQuery = /report|test|blood|cbc|scan|ultrasound|doctor|lab|prescription|diagnosis|result/i.test(msgLower);

  let sleepLimit = 3;
  let moodLimit = 3;
  let workoutLimit = 3;
  let cycleLimit = 3;
  let reportLimit = 5;

  if (isSleepQuery) {
    sleepLimit = 6;
    moodLimit = 4;
  } else if (isCycleQuery) {
    cycleLimit = 6;
    moodLimit = 4;
  } else if (isWorkoutQuery) {
    workoutLimit = 6;
  } else if (isReportQuery) {
    reportLimit = 8;
  }

  // Execute all independent database queries in parallel
  const [
    user,
    sleepRecords,
    moodRecords,
    workoutRecords,
    cycleRecords,
    hydrationRecord,
    medicalReports,
    prescriptions,
  ] = await Promise.all([
    User.findById(userId).select('-password -__v').lean(),
    Sleep.find({ userId })
      .select('date durationHours quality bedtime notes')
      .sort({ date: -1, createdAt: -1 })
      .limit(sleepLimit)
      .lean(),
    Mood.find({ userId })
      .select('date mood stressLevel notes')
      .sort({ date: -1, createdAt: -1 })
      .limit(moodLimit)
      .lean(),
    Workout.find({ userId })
      .select('date workoutType duration intensity notes')
      .sort({ date: -1, createdAt: -1 })
      .limit(workoutLimit)
      .lean(),
    Cycle.find({ userId })
      .select('date isPeriod flowIntensity notes')
      .sort({ date: -1, createdAt: -1 })
      .limit(cycleLimit)
      .lean(),
    Hydration.findOne({ userId })
      .select('date consumedMl goalMl')
      .sort({ date: -1, createdAt: -1 })
      .lean(),
    MedicalReport.find({ userId })
      .select('title type category notes extractedText analysis date createdAt')
      .sort({ date: -1, createdAt: -1 })
      .limit(reportLimit)
      .lean(),
    Prescription.find({ userId })
      .select('medication dosage frequency duration instructions notes date createdAt')
      .sort({ date: -1, createdAt: -1 })
      .limit(4)
      .lean(),
  ]);

  return {
    profile: user,
    sleepRecords: sleepRecords || [],
    moodRecords: moodRecords || [],
    workoutRecords: workoutRecords || [],
    cycleRecords: cycleRecords || [],
    hydrationRecord,
    medicalReports: medicalReports || [],
    prescriptions: prescriptions || [],
  };
}

/**
 * Builds a structured, high-density health context prompt for the AI model
 */
export function buildStructuredHealthContext(healthData: UserHealthContext): string {
  const { profile, sleepRecords, moodRecords, workoutRecords, cycleRecords, hydrationRecord, medicalReports, prescriptions } = healthData;
  const userName = profile?.name || profile?.profile?.name || 'Patient';
  const p = profile?.profile || {};

  // 1. Core Profile & Demographics
  const bmiCalc = p.weight && p.height ? (p.weight / ((p.height / 100) ** 2)).toFixed(1) : null;
  const coreDemographics = [
    `Name: ${userName}`,
    p.age ? `Age: ${p.age} yrs` : null,
    p.bloodGroup ? `Blood Group: ${p.bloodGroup}` : null,
    p.maritalStatus ? `Marital Status: ${p.maritalStatus}` : null,
    p.height && p.weight ? `Height: ${p.height}cm | Weight: ${p.weight}kg (BMI: ${bmiCalc})` : null,
  ].filter(Boolean).join(' | ');

  // 2. Reproductive, Menstrual & Pregnancy Profile
  const lastPeriodStr = p.lastPeriodDate ? new Date(p.lastPeriodDate).toISOString().split('T')[0] : null;
  const symptomsStr = Array.isArray(p.symptoms) && p.symptoms.length > 0 ? p.symptoms.join(', ') : (p.menstrualHistory || null);
  
  const reproductiveDetails = [
    p.pregnancyStatus ? `Pregnancy Status: ${p.pregnancyStatus}` : null,
    p.trimester ? `Trimester: ${p.trimester}` : null,
    p.pregnancyHistory ? `Obstetric History: ${p.pregnancyHistory}` : null,
    p.fertilityPlanning ? `Fertility Goal: ${p.fertilityPlanning}` : null,
    p.cycleRegularity ? `Cycle Regularity: ${p.cycleRegularity}` : null,
    p.cycleLength ? `Avg Cycle Length: ${p.cycleLength} days` : null,
    lastPeriodStr ? `Last Period: ${lastPeriodStr}` : null,
    p.periodDuration ? `Period Duration: ${p.periodDuration}` : null,
    symptomsStr ? `Logged Symptoms/Discomforts: ${symptomsStr}` : null,
    p.pcos && p.pcos !== 'No' ? `PCOS/PCOD: ${p.pcos}` : null,
    p.thyroid && p.thyroid !== 'No' ? `Thyroid: ${p.thyroid}` : null,
    p.menopauseStatus && p.menopauseStatus !== 'No' ? `Menopause Stage: ${p.menopauseStatus}` : null,
  ].filter(Boolean).join('\n• ');

  // 3. Clinical Baseline, Conditions & Medications
  const conditionsList = Array.isArray(p.existingConditions) && p.existingConditions.length > 0 
    ? p.existingConditions.join(', ') 
    : (p.chronicConditions || p.chronicDiseases || 'None reported');

  const allergiesList = Array.isArray(p.allergyList) && p.allergyList.length > 0 
    ? p.allergyList.join(', ') 
    : (p.allergies || 'None reported');

  const medsList = Array.isArray(p.medicationList) && p.medicationList.length > 0 
    ? p.medicationList.join(', ') 
    : (p.currentMedications || p.currentMedicines || 'None reported');

  const clinicalDetails = [
    `Existing Health Conditions: ${conditionsList}`,
    `Known Allergies: ${allergiesList}`,
    `Current Medications / Supplements: ${medsList}`,
    p.medicalHistory ? `Medical History: ${p.medicalHistory}` : null,
    p.previousSurgeries || p.surgeries ? `Previous Surgeries: ${p.previousSurgeries || p.surgeries}` : null,
    p.familyMedicalHistory ? `Family Medical History: ${p.familyMedicalHistory}` : null,
  ].filter(Boolean).join('\n• ');

  // 4. Lifestyle, Sleep & Wellness
  const lifestyleDetails = [
    p.dietPreference || p.foodPreference ? `Diet Preference: ${p.dietPreference || p.foodPreference}` : null,
    p.exerciseRoutine || p.activityLevel ? `Exercise & Activity: ${p.exerciseRoutine || p.activityLevel}` : null,
    p.sleepQuality ? `Sleep Quality: ${p.sleepQuality}` : null,
    p.sleepHours ? `Avg Sleep: ${p.sleepHours} hrs/night` : null,
    p.sleepSchedule ? `Sleep Schedule: ${p.sleepSchedule}` : null,
    p.stressLevel ? `Stress Level: ${p.stressLevel}` : null,
    p.waterIntake ? `Water Goal: ${p.waterIntake} L/day` : null,
    p.alcoholStatus ? `Alcohol: ${p.alcoholStatus}` : null,
    p.caffeineStatus ? `Caffeine: ${p.caffeineStatus}` : null,
  ].filter(Boolean).join(' | ');

  // 5. Stored Medical Documents / Lab Reports
  let reportsSection = 'STORED LAB & MEDICAL REPORTS (Auto-Retrieved from Patient Records): None on file.';
  if (medicalReports.length > 0) {
    const reportSummaries = medicalReports.map((r, idx) => {
      const rDate = r.date ? new Date(r.date).toLocaleDateString() : 'N/A';
      const rSummary = r.analysis?.summary 
        ? `Analysis: ${typeof r.analysis.summary === 'string' ? r.analysis.summary.slice(0, 300) : JSON.stringify(r.analysis.summary)}`
        : (r.extractedText ? `Extracted Excerpt: ${r.extractedText.slice(0, 200)}...` : (r.notes ? `Notes: ${r.notes}` : 'Uploaded report'));
      return `[Report #${idx + 1}] "${r.title}" (${r.category || r.type || 'Medical'} - ${rDate})\n  ${rSummary}`;
    }).join('\n');
    reportsSection = `STORED LAB & MEDICAL REPORTS (Auto-Retrieved from Patient Records):\n${reportSummaries}`;
  }

  // 6. Prescriptions on Record
  let prescriptionsSection = '';
  if (prescriptions.length > 0) {
    const rxLines = prescriptions.map(
      pr => `• ${pr.medication} (${pr.dosage}, ${pr.frequency}${pr.duration ? `, ${pr.duration}` : ''})${pr.instructions ? ` - Instructions: ${pr.instructions}` : ''}`
    ).join('\n');
    prescriptionsSection = `DOCTOR PRESCRIPTIONS ON RECORD:\n${rxLines}`;
  }

  // 7. Recent Logged Activity (Sleep, Mood, Workout, Cycle, Hydration)
  let recentLogsSection = '';
  const logLines: string[] = [];
  if (sleepRecords.length > 0) {
    logLines.push(`Recent Sleep: ${sleepRecords.map(s => `${s.date}: ${s.durationHours}h (${s.quality || 'normal'})`).join('; ')}`);
  }
  if (moodRecords.length > 0) {
    logLines.push(`Recent Mood/Stress: ${moodRecords.map(m => `${m.date}: ${m.mood} (Stress: ${m.stressLevel}/10)`).join('; ')}`);
  }
  if (workoutRecords.length > 0) {
    logLines.push(`Recent Activity: ${workoutRecords.map(w => `${w.date}: ${w.workoutType} (${w.duration}m)`).join('; ')}`);
  }
  if (cycleRecords.length > 0) {
    logLines.push(`Recent Cycle Entries: ${cycleRecords.map(c => `${c.date}: Flow=${c.flowIntensity || 'None'}`).join('; ')}`);
  }
  if (hydrationRecord) {
    logLines.push(`Today's Hydration: ${hydrationRecord.consumedMl || 0}/${hydrationRecord.goalMl || 2000} ml`);
  }
  if (logLines.length > 0) {
    recentLogsSection = `RECENT PATIENT TRACKING LOGS:\n• ${logLines.join('\n• ')}`;
  }

  return `=== COMPLETE PATIENT HEALTH PROFILE & CLINICAL CONTEXT ===
[1. DEMOGRAPHICS]: ${coreDemographics || 'General Profile'}

[2. REPRODUCTIVE & MATERNAL PROFILE]:
• ${reproductiveDetails || 'No specific reproductive history recorded.'}

[3. CLINICAL BASELINE & ALLERGIES]:
• ${clinicalDetails}

[4. LIFESTYLE & WELLNESS]:
${lifestyleDetails || 'Standard wellness balance.'}

[5. LAB & DIAGNOSTIC REPORTS]:
${reportsSection}

${prescriptionsSection ? `[6. ACTIVE PRESCRIPTIONS]:\n${prescriptionsSection}\n` : ''}${recentLogsSection ? `[7. RECENT LOGS]:\n${recentLogsSection}\n` : ''}=============================================================`.trim();
}
