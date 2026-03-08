export type TrustStatus = 'healthy' | 'caution' | 'degraded';

export interface ModelStatus {
  id: string;
  name: string;
  status: TrustStatus;
  accuracy: number;
  drift: number;
  region: string;
  lastCalibrated: string;
  cause: string;
  recommendation: string;
  explanation: string;
  accuracyHistory: { date: string; accuracy: number }[];
}

export interface DataSource {
  id: string;
  name: string;
  completeness: number;
  freshness: string;
  status: TrustStatus;
  region: string;
  anomaly: string | null;
  lastUpdate: string;
}

export interface BlindSpot {
  id: string;
  category: string;
  description: string;
  severity: TrustStatus;
  affectedDomains: string[];
  missingVariables: string[];
  explanation: string;
}

export interface Prediction {
  id: string;
  model: string;
  predicted: number;
  actual: number | null;
  confidence: number;
  issuedDate: string;
  evaluationDate: string;
  status: 'accurate' | 'degraded' | 'failed' | 'pending';
  domain: string;
  explanation: string;
}

export interface Recommendation {
  id: string;
  type: 'retrain' | 'collect_data' | 'downweight' | 'human_review' | 'widen_uncertainty' | 'pause';
  priority: TrustStatus;
  target: string;
  description: string;
  explanation: string;
}
