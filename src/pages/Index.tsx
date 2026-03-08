import { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain } from 'lucide-react';
import { TrustStatusPanel } from '@/components/diagnosis/TrustStatusPanel';
import { DataQualityPanel } from '@/components/diagnosis/DataQualityPanel';
import { ModelDriftTimeline } from '@/components/diagnosis/ModelDriftTimeline';
import { BlindSpotRegister } from '@/components/diagnosis/BlindSpotRegister';
import { PredictionReality } from '@/components/diagnosis/PredictionReality';
import { RecommendationEngine } from '@/components/diagnosis/RecommendationEngine';
import { BiasDetectionMap } from '@/components/diagnosis/BiasDetectionMap';
import { ConfidenceDecayCurves } from '@/components/diagnosis/ConfidenceDecayCurves';
import { AlertHistoryTimeline } from '@/components/diagnosis/AlertHistoryTimeline';
import { AlertSummaryCard } from '@/components/diagnosis/AlertSummaryCard';
import { DiagnosticFilters, type FilterState } from '@/components/diagnosis/DiagnosticFilters';

const ALL_DOMAINS = [
  'Flood Risk', 'Agriculture', 'Migration', 'Health', 'Climate',
  'Water Security', 'Social Stability', 'Urban Risk', 'Ecosystem Health',
  'Conservation', 'Humanitarian',
];

const Index = () => {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    domain: '',
  });

  return (
    <div className="min-h-screen bg-background atlas-grid-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Self-Diagnosis Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Atlas continuously evaluates the health, reliability, and limitations of its own intelligence systems.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-3 text-xs font-mono text-muted-foreground">
            <span className="px-2 py-1 rounded bg-secondary">Last scan: 12 min ago</span>
            <span className="px-2 py-1 rounded bg-secondary">5 models monitored</span>
            <span className="px-2 py-1 rounded bg-secondary">6 data sources active</span>
          </div>
        </motion.header>

        {/* Trust Status - Full width */}
        <div className="mb-6">
          <TrustStatusPanel />
        </div>

        {/* Filters */}
        <div className="mb-6">
          <DiagnosticFilters filters={filters} onChange={setFilters} domains={ALL_DOMAINS} />
        </div>

        {/* Bias Detection Map - Full width */}
        <div className="mb-6">
          <BiasDetectionMap />
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DataQualityPanel filters={filters} />
          <ModelDriftTimeline filters={filters} />
          <BlindSpotRegister filters={filters} />
          <PredictionReality filters={filters} />
        </div>

        {/* Confidence Decay Curves - Full width */}
        <div className="mt-6">
          <ConfidenceDecayCurves />
        </div>

        {/* Alert History - Full width */}
        <div className="mt-6">
          <AlertHistoryTimeline />
        </div>

        {/* Recommendations - Full width */}
        <div className="mt-6">
          <RecommendationEngine filters={filters} />
        </div>

        {/* Footer */}
        <footer className="mt-12 pb-8 text-center">
          <p className="text-xs text-muted-foreground font-mono">
            ATLAS SELF-DIAGNOSIS v1.0 · Intelligence is recognizing when your answers may be failing
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
