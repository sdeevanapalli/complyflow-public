import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sparkles,
  ChevronRight,
  FileText,
  Receipt,
  Repeat,
  Globe,
  Smartphone,
  Clock,
  Tag,
  UserCheck,
  Play,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import demoData from '@/data/demo-scenarios.json';

const iconMap: Record<string, any> = {
  'file-text': FileText,
  receipt: Receipt,
  repeat: Repeat,
  globe: Globe,
  smartphone: Smartphone,
  clock: Clock,
  tag: Tag,
  'user-check': UserCheck,
};

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  teal: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  green: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  pink: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
  cyan: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
};

const difficultyColors: Record<string, string> = {
  Basic: 'bg-green-100 text-green-700',
  Intermediate: 'bg-yellow-100 text-yellow-700',
  Advanced: 'bg-red-100 text-red-700',
};

interface DemoScenariosProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectScenario: (questions: string[]) => void;
}

export function DemoScenarios({ isOpen, onClose, onSelectScenario }: DemoScenariosProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<any>(null);

  const handleRunScenario = (questions: string[]) => {
    onSelectScenario(questions);
    onClose();
  };

  const selectedCategoryData = demoData.categories.find((c) => c.id === selectedCategory);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[900px] md:max-h-[80vh] bg-white rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-zinc-200/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-700 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-zinc-950">Demo Scenarios</h2>
                  <p className="text-sm text-zinc-500">Pre-built compliance questions for quick testing</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-zinc-100 transition-colors"
              >
                <X className="w-5 h-5 text-zinc-500" strokeWidth={1.5} />
              </motion.button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {!selectedCategory ? (
                /* Category Grid */
                <div className="p-6">
                  <p className="text-sm text-zinc-500 mb-4">Choose a compliance topic to explore</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {demoData.categories.map((category) => {
                      const Icon = iconMap[category.icon] || FileText;
                      const colors = colorMap[category.color] || colorMap.indigo;

                      return (
                        <motion.button
                          key={category.id}
                          whileHover={{ y: -2 }}
                          onClick={() => setSelectedCategory(category.id)}
                          className={`p-4 rounded-xl border ${colors.border} ${colors.bg} text-left transition-all hover:shadow-md`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg ${colors.bg} border ${colors.border}`}>
                                <Icon className={`w-5 h-5 ${colors.text}`} strokeWidth={1.5} />
                              </div>
                              <div>
                                <h3 className="font-medium text-zinc-950 mb-1">{category.name}</h3>
                                <p className="text-xs text-zinc-600">
                                  {category.scenarios.length} scenario{category.scenarios.length !== 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-zinc-400" strokeWidth={1.5} />
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              ) : !selectedScenario ? (
                /* Scenarios List */
                <div className="p-6">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="text-sm text-zinc-500 hover:text-zinc-700 mb-4 flex items-center gap-1"
                  >
                    ← Back to categories
                  </button>
                  <h3 className="text-lg font-semibold text-zinc-950 mb-4">{selectedCategoryData?.name}</h3>
                  <div className="space-y-3">
                    {selectedCategoryData?.scenarios.map((scenario) => (
                      <motion.button
                        key={scenario.id}
                        whileHover={{ x: 4 }}
                        onClick={() => setSelectedScenario(scenario)}
                        className="w-full p-4 rounded-xl border border-zinc-200/60 bg-white hover:bg-zinc-50 text-left transition-all"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-zinc-950">{scenario.title}</h4>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              difficultyColors[scenario.difficulty]
                            }`}
                          >
                            {scenario.difficulty}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-600 mb-2">{scenario.description}</p>
                        <p className="text-xs text-zinc-500">
                          {scenario.questions.length} question{scenario.questions.length !== 1 ? 's' : ''}
                        </p>
                      </motion.button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Scenario Details */
                <div className="p-6">
                  <button
                    onClick={() => setSelectedScenario(null)}
                    className="text-sm text-zinc-500 hover:text-zinc-700 mb-4 flex items-center gap-1"
                  >
                    ← Back to scenarios
                  </button>
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-zinc-950">{selectedScenario.title}</h3>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          difficultyColors[selectedScenario.difficulty]
                        }`}
                      >
                        {selectedScenario.difficulty}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-600">{selectedScenario.description}</p>
                  </div>

                  <div className="space-y-3 mb-6">
                    <h4 className="text-sm font-medium text-zinc-700">Questions in this scenario:</h4>
                    {selectedScenario.questions.map((question: string, idx: number) => (
                      <div key={idx} className="p-3 rounded-lg bg-zinc-50 border border-zinc-200/60">
                        <div className="flex gap-3">
                          <span className="text-xs font-medium text-zinc-500 mt-0.5">{idx + 1}.</span>
                          <p className="text-sm text-zinc-700 flex-1">{question}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => handleRunScenario(selectedScenario.questions)}
                    className="w-full bg-zinc-950 text-white hover:bg-zinc-800 flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" strokeWidth={1.5} />
                    Run This Scenario
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
