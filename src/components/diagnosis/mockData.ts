import type { ModelStatus, DataSource, BlindSpot, Prediction, Recommendation, BiasRegion } from './types';

export const models: ModelStatus[] = [
  {
    id: 'm1',
    name: 'Flood Exposure Predictor',
    status: 'caution',
    accuracy: 78,
    drift: 18,
    region: 'Nairobi Basin',
    lastCalibrated: '2025-11-14',
    cause: 'Rainfall pattern shift, new construction expansion',
    recommendation: 'Retraining recommended with 2025 precipitation data',
    explanation: 'Atlas is becoming less accurate in the Nairobi Basin because recent rainfall patterns differ significantly from the historical data used to train this model. Urban expansion has also altered flood dynamics.',
    accuracyHistory: [
      { date: '2025-06', accuracy: 94 }, { date: '2025-07', accuracy: 92 },
      { date: '2025-08', accuracy: 91 }, { date: '2025-09', accuracy: 87 },
      { date: '2025-10', accuracy: 84 }, { date: '2025-11', accuracy: 81 },
      { date: '2025-12', accuracy: 79 }, { date: '2026-01', accuracy: 78 },
    ],
  },
  {
    id: 'm2',
    name: 'Crop Yield Forecaster',
    status: 'healthy',
    accuracy: 91,
    drift: 3,
    region: 'East Africa',
    lastCalibrated: '2026-01-22',
    cause: 'Minor seasonal variance',
    recommendation: 'No action needed. Monitor next quarter.',
    explanation: 'This model continues to perform within expected parameters. Slight seasonal adjustments are normal and do not indicate systemic drift.',
    accuracyHistory: [
      { date: '2025-06', accuracy: 93 }, { date: '2025-07', accuracy: 92 },
      { date: '2025-08', accuracy: 91 }, { date: '2025-09', accuracy: 92 },
      { date: '2025-10', accuracy: 91 }, { date: '2025-11', accuracy: 90 },
      { date: '2025-12', accuracy: 91 }, { date: '2026-01', accuracy: 91 },
    ],
  },
  {
    id: 'm3',
    name: 'Migration Flow Estimator',
    status: 'degraded',
    accuracy: 62,
    drift: 34,
    region: 'Horn of Africa',
    lastCalibrated: '2025-08-03',
    cause: 'New subsidy policy in Ethiopia, border policy changes',
    recommendation: 'Urgent retraining required. Pause automated recommendations.',
    explanation: 'This model has significantly degraded since new government policies altered migration incentives. The training data predates these policy changes and no longer reflects current movement patterns.',
    accuracyHistory: [
      { date: '2025-06', accuracy: 88 }, { date: '2025-07', accuracy: 85 },
      { date: '2025-08', accuracy: 79 }, { date: '2025-09', accuracy: 74 },
      { date: '2025-10', accuracy: 70 }, { date: '2025-11', accuracy: 66 },
      { date: '2025-12', accuracy: 64 }, { date: '2026-01', accuracy: 62 },
    ],
  },
  {
    id: 'm4',
    name: 'Urban Heat Risk Model',
    status: 'healthy',
    accuracy: 89,
    drift: 5,
    region: 'Global Urban',
    lastCalibrated: '2026-02-10',
    cause: 'Stable conditions',
    recommendation: 'Routine monitoring.',
    explanation: 'Performance remains strong across all monitored urban areas. No significant environmental or data shifts detected.',
    accuracyHistory: [
      { date: '2025-06', accuracy: 90 }, { date: '2025-07', accuracy: 91 },
      { date: '2025-08', accuracy: 90 }, { date: '2025-09', accuracy: 89 },
      { date: '2025-10', accuracy: 89 }, { date: '2025-11', accuracy: 88 },
      { date: '2025-12', accuracy: 89 }, { date: '2026-01', accuracy: 89 },
    ],
  },
  {
    id: 'm5',
    name: 'Disease Outbreak Predictor',
    status: 'caution',
    accuracy: 76,
    drift: 15,
    region: 'West Africa',
    lastCalibrated: '2025-12-01',
    cause: 'Delayed health reporting from 3 counties',
    recommendation: 'Investigate data pipeline. Consider alternative data sources.',
    explanation: 'Accuracy has declined in western counties over the last 6 weeks, likely due to delayed health reporting and rainfall anomalies outside historical norms.',
    accuracyHistory: [
      { date: '2025-06', accuracy: 89 }, { date: '2025-07', accuracy: 87 },
      { date: '2025-08', accuracy: 85 }, { date: '2025-09', accuracy: 82 },
      { date: '2025-10', accuracy: 80 }, { date: '2025-11', accuracy: 78 },
      { date: '2025-12', accuracy: 77 }, { date: '2026-01', accuracy: 76 },
    ],
  },
];

export const dataSources: DataSource[] = [
  { id: 'd1', name: 'Sentinel-2 Satellite', completeness: 94, freshness: '2h ago', status: 'healthy', region: 'Global', anomaly: null, lastUpdate: '2026-03-08T10:30:00Z' },
  { id: 'd2', name: 'WHO Health Reports', completeness: 67, freshness: '12d ago', status: 'caution', region: 'Sub-Saharan Africa', anomaly: '3 counties reporting with 10+ day delays', lastUpdate: '2026-02-24T08:00:00Z' },
  { id: 'd3', name: 'Ground Sensor Network', completeness: 82, freshness: '45m ago', status: 'healthy', region: 'East Africa', anomaly: null, lastUpdate: '2026-03-08T11:15:00Z' },
  { id: 'd4', name: 'Social Media Sentiment', completeness: 71, freshness: '1h ago', status: 'caution', region: 'Urban Centers', anomaly: 'Overrepresents urban populations by 3.2x', lastUpdate: '2026-03-08T10:00:00Z' },
  { id: 'd5', name: 'Economic Indicators (WB)', completeness: 88, freshness: '3d ago', status: 'healthy', region: 'Global', anomaly: null, lastUpdate: '2026-03-05T14:00:00Z' },
  { id: 'd6', name: 'Rainfall Gauge Network', completeness: 45, freshness: '6h ago', status: 'degraded', region: 'Western Kenya', anomaly: 'Sensor coverage concentrated in wealthy regions. 60% of rural stations offline.', lastUpdate: '2026-03-08T05:00:00Z' },
];

export const blindSpots: BlindSpot[] = [
  {
    id: 'b1', category: 'Missing Variable', severity: 'degraded',
    description: 'Groundwater depletion data absent from agricultural stability models',
    affectedDomains: ['Agriculture', 'Water Security'],
    missingVariables: ['Aquifer levels', 'Extraction rates', 'Recharge rates'],
    explanation: 'Agricultural predictions assume stable water availability, but groundwater in key regions is declining at rates not captured by any current feed.',
  },
  {
    id: 'b2', category: 'Under-observed Region', severity: 'caution',
    description: 'Informal settlements in Nairobi lack ground-truth social data',
    affectedDomains: ['Social Stability', 'Urban Risk'],
    missingVariables: ['Community trust indices', 'Informal economy metrics'],
    explanation: 'Social unrest models have no direct signal from informal settlement populations, which represent 60% of the urban poor in the region.',
  },
  {
    id: 'b3', category: 'Weak Causal Link', severity: 'caution',
    description: 'Biodiversity recovery models lack species-level ground-truth',
    affectedDomains: ['Ecosystem Health', 'Conservation'],
    missingVariables: ['Species population counts', 'Habitat connectivity data'],
    explanation: 'Ecosystem health scores are derived from satellite vegetation indices, not direct biodiversity measurement. This creates a blind spot for species-level collapse.',
  },
  {
    id: 'b4', category: 'Unvalidated Assumption', severity: 'degraded',
    description: 'Migration models assume linear relationship between drought and displacement',
    affectedDomains: ['Migration', 'Humanitarian'],
    missingVariables: ['Community resilience factors', 'Social network strength'],
    explanation: 'The assumption that drought intensity maps linearly to displacement volume ignores community adaptation capacity and social support structures.',
  },
];

export const predictions: Prediction[] = [
  { id: 'p1', model: 'Flood Exposure Predictor', predicted: 2400, actual: 3100, confidence: 72, issuedDate: '2025-12-01', evaluationDate: '2026-02-15', status: 'degraded', domain: 'Flood Risk', explanation: 'Underestimated flood exposure by 29% due to unmodeled construction in flood plains.' },
  { id: 'p2', model: 'Crop Yield Forecaster', predicted: 4200, actual: 4150, confidence: 88, issuedDate: '2025-10-15', evaluationDate: '2026-01-30', status: 'accurate', domain: 'Agriculture', explanation: 'Prediction fell within 1.2% of actual yield. Model performing within expected parameters.' },
  { id: 'p3', model: 'Migration Flow Estimator', predicted: 15000, actual: 28000, confidence: 65, issuedDate: '2025-09-01', evaluationDate: '2026-02-01', status: 'failed', domain: 'Migration', explanation: 'Dramatically underestimated migration flows. New Ethiopian subsidy policy created pull factors not present in training data.' },
  { id: 'p4', model: 'Disease Outbreak Predictor', predicted: 340, actual: 410, confidence: 74, issuedDate: '2025-11-20', evaluationDate: '2026-02-20', status: 'degraded', domain: 'Health', explanation: 'Underpredicted case count by 20%. Delayed reporting from rural counties likely obscured early signals.' },
  { id: 'p5', model: 'Urban Heat Risk Model', predicted: 42, actual: null, confidence: 85, issuedDate: '2026-02-01', evaluationDate: '2026-06-01', status: 'pending', domain: 'Climate', explanation: 'Forecast pending evaluation. Confidence remains high based on current data quality.' },
];

export const recommendations: Recommendation[] = [
  { id: 'r1', type: 'retrain', priority: 'degraded', target: 'Migration Flow Estimator', description: 'Retrain with post-policy migration data from Ethiopia and Eritrea', explanation: 'Model accuracy has dropped below acceptable thresholds. New training data reflecting 2025 policy changes is available.' },
  { id: 'r2', type: 'collect_data', priority: 'degraded', target: 'Groundwater Monitoring', description: 'Deploy IoT sensors in 12 priority aquifer zones', explanation: 'Agricultural models are operating blind to groundwater depletion. Field data collection is the only remedy.' },
  { id: 'r3', type: 'human_review', priority: 'caution', target: 'Disease Outbreak Predictor', description: 'Request epidemiologist review of West Africa prediction pipeline', explanation: 'Data delays suggest pipeline issues, but the root cause may also include reporting methodology changes.' },
  { id: 'r4', type: 'downweight', priority: 'caution', target: 'Social Media Sentiment', description: 'Reduce weight of social media signals in rural risk assessments', explanation: 'Social media data overrepresents urban populations by 3.2x. Using it at full weight biases risk scores against rural areas.' },
  { id: 'r5', type: 'widen_uncertainty', priority: 'caution', target: 'Flood Exposure Predictor', description: 'Expand confidence intervals by 15% until model retrained', explanation: 'Current confidence intervals are too narrow given observed drift. Wider bands will prevent overconfident recommendations.' },
  { id: 'r6', type: 'pause', priority: 'degraded', target: 'Migration Flow Estimator', description: 'Pause automated policy recommendations based on migration forecasts', explanation: 'Model accuracy is below the threshold for safe automated recommendations. Human-in-the-loop review required.' },
];
