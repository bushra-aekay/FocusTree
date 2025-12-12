import React, { useEffect, useState } from 'react';
import { aiService } from '../../services/aiService';
import { SessionRecord, SessionInsights } from '../../types';
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, Loader2 } from 'lucide-react';

export const InsightsPanel: React.FC<{ data: SessionRecord }> = ({ data }) => {
  const [insights, setInsights] = useState<SessionInsights | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const result = await aiService.generateSessionInsights(data);
        setInsights(result);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
  }, [data]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin mb-2" />
        <span className="text-sm">Generating AI insights...</span>
      </div>
    );
  }

  if (!insights) return null;

  return (
    <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-emerald-100 p-6 animate-fade-in-up">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="w-5 h-5 text-emerald-500" />
        <h3 className="font-bold text-gray-800">AI Session Analysis</h3>
      </div>

      <div className="space-y-4">
        {/* Positive */}
        <div className="flex gap-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
          <div className="bg-emerald-100 p-2 rounded-lg h-fit">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h4 className="font-bold text-emerald-900 text-sm mb-1">What Went Well</h4>
            <p className="text-emerald-800 text-sm leading-relaxed">{insights.positive}</p>
          </div>
        </div>

        {/* Improvement */}
        <div className="flex gap-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
          <div className="bg-amber-100 p-2 rounded-lg h-fit">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h4 className="font-bold text-amber-900 text-sm mb-1">To Improve</h4>
            <p className="text-amber-800 text-sm leading-relaxed">{insights.improvement}</p>
          </div>
        </div>

        {/* Pattern */}
        <div className="flex gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <div className="bg-blue-100 p-2 rounded-lg h-fit">
            <Lightbulb className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h4 className="font-bold text-blue-900 text-sm mb-1">Pattern Spotted</h4>
            <p className="text-blue-800 text-sm leading-relaxed">{insights.pattern}</p>
          </div>
        </div>
      </div>
    </div>
  );
};