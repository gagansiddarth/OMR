import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  AlertTriangle, 
  Target, 
  Info,
  Zap,
  Balance,
  Shield
} from 'lucide-react';

export type EvaluationMode = 'easy' | 'moderate' | 'strict';

interface EvaluationModeSelectorProps {
  selectedMode: EvaluationMode;
  onModeChange: (mode: EvaluationMode) => void;
  disabled?: boolean;
}

const modeConfig = {
  easy: {
    title: 'Easy Mode',
    description: 'Human-friendly evaluation with tolerance for faint marks',
    icon: Zap,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    tolerance: '±15% tolerance',
    features: [
      'Accepts faint bubble marks',
      '10-20% fill tolerance',
      'Human-like evaluation',
      'Reduced false negatives'
    ]
  },
  moderate: {
    title: 'Moderate Mode',
    description: 'Balanced approach combining CV, ML, and AI',
    icon: Balance,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    tolerance: '±10% tolerance',
    features: [
      'Hybrid CV + ML + AI',
      '0.2-0.6 confidence range',
      'Balanced accuracy',
      'Default evaluation mode'
    ]
  },
  strict: {
    title: 'Strict Mode',
    description: 'Machine-precise evaluation with zero tolerance',
    icon: Shield,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    tolerance: '±5% tolerance',
    features: [
      'Precise fill validation',
      'Rejects faint marks',
      'Machine accuracy',
      'Zero tolerance for ambiguity'
    ]
  }
};

const EvaluationModeSelector: React.FC<EvaluationModeSelectorProps> = ({
  selectedMode,
  onModeChange,
  disabled = false
}) => {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Evaluation Mode</h3>
        <p className="text-sm text-muted-foreground">
          Choose how strictly the system evaluates OMR sheets
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(modeConfig).map(([mode, config]) => {
          const IconComponent = config.icon;
          const isSelected = selectedMode === mode;
          
          return (
            <Card 
              key={mode}
              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                isSelected 
                  ? `${config.borderColor} border-2 shadow-md` 
                  : 'border-gray-200 hover:border-gray-300'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => !disabled && onModeChange(mode as EvaluationMode)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <IconComponent className={`h-5 w-5 ${config.color}`} />
                    <CardTitle className="text-base">{config.title}</CardTitle>
                  </div>
                  {isSelected && (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                </div>
                <CardDescription className="text-sm">
                  {config.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Tolerance:</span>
                    <Badge variant="secondary" className={config.bgColor}>
                      {config.tolerance}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <span className="text-sm font-medium">Features:</span>
                    <ul className="space-y-1">
                      {config.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <div className="w-1 h-1 bg-gray-400 rounded-full" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {selectedMode && (
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium">
                {modeConfig[selectedMode].title} Selected
              </p>
              <p className="text-muted-foreground">
                {modeConfig[selectedMode].description}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EvaluationModeSelector;
