import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend, ReferenceLine } from 'recharts';
import { confidenceDecayData } from './mockData';

const lineColors: Record<string, string> = {
  'Short-term Flood': 'hsl(142 72% 45%)',
  'Medium-term Migration': 'hsl(0 72% 51%)',
  'Long-range Biodiversity': 'hsl(45 95% 55%)',
  'Disease Outbreak': 'hsl(200 80% 50%)',
  'Crop Yield': 'hsl(280 60% 55%)',
};

export function ConfidenceDecayCurves() {
  const [hoveredModel, setHoveredModel] = useState<string | null>(null);

  const allModels = Object.keys(confidenceDecayData[0]).filter(k => k !== 'daysAfterIssuance');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45 }}
      className="rounded-lg border border-border bg-card"
    >
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-accent" />
          <h3 className="font-semibold text-foreground">Confidence Decay Curves</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          How prediction reliability degrades over time for each model class
        </p>
      </div>

      <div className="p-4">
        {/* Chart */}
        <div className="h-64 bg-secondary/20 rounded-lg p-3">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={confidenceDecayData}>
              <XAxis
                dataKey="daysAfterIssuance"
                tick={{ fontSize: 10, fill: 'hsl(215 15% 50%)' }}
                axisLine={false}
                tickLine={false}
                label={{ value: 'Days after issuance', position: 'insideBottom', offset: -5, fontSize: 10, fill: 'hsl(215 15% 50%)' }}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: 'hsl(215 15% 50%)' }}
                axisLine={false}
                tickLine={false}
                width={30}
                label={{ value: 'Confidence %', angle: -90, position: 'insideLeft', offset: 10, fontSize: 10, fill: 'hsl(215 15% 50%)' }}
              />
              <ReferenceLine y={50} stroke="hsl(0 72% 51%)" strokeDasharray="3 3" strokeOpacity={0.4} />
              <ReferenceLine y={75} stroke="hsl(45 95% 55%)" strokeDasharray="3 3" strokeOpacity={0.3} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(220 18% 10%)',
                  border: '1px solid hsl(220 15% 18%)',
                  borderRadius: '6px',
                  fontSize: '11px',
                }}
                labelStyle={{ color: 'hsl(210 20% 90%)' }}
                labelFormatter={(v) => `Day ${v}`}
              />
              {allModels.map((model) => (
                <Line
                  key={model}
                  type="monotone"
                  dataKey={model}
                  stroke={lineColors[model] || 'hsl(215 15% 50%)'}
                  strokeWidth={hoveredModel === model ? 3 : 1.5}
                  strokeOpacity={hoveredModel && hoveredModel !== model ? 0.2 : 1}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Model legend with interaction */}
        <div className="flex flex-wrap gap-2 mt-4">
          {allModels.map((model) => (
            <button
              key={model}
              onMouseEnter={() => setHoveredModel(model)}
              onMouseLeave={() => setHoveredModel(null)}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-all cursor-pointer
                ${hoveredModel === model
                  ? 'border-foreground/30 bg-secondary text-foreground'
                  : 'border-border bg-secondary/30 text-muted-foreground hover:text-foreground'
                }`}
            >
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: lineColors[model] || 'hsl(215 15% 50%)' }}
              />
              <span className="font-mono">{model}</span>
            </button>
          ))}
        </div>

        {/* Interpretation */}
        <div className="mt-4 bg-secondary/20 rounded-lg p-3 border border-border">
          <p className="text-xs text-foreground/80 leading-relaxed">
            Short-term forecasts (flood, disease) maintain high confidence for 7–14 days before degrading.
            Medium-term models (migration, crop yield) decay faster due to policy and seasonal volatility.
            Long-range biodiversity predictions lose reliability rapidly beyond 30 days, reflecting the
            inherent uncertainty of complex ecological systems.
          </p>
        </div>

        {/* Threshold markers */}
        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-0 border-t-2 border-dashed border-trust-caution/60" />
            <span>Caution threshold (75%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-0 border-t-2 border-dashed border-trust-degraded/60" />
            <span>Unreliable threshold (50%)</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
