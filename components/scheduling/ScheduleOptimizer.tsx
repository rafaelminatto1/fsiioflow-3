"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { OptimizeScheduleUseCase, ScheduleOptimizationOutput } from '../../src/application/use-cases/optimize-schedule';

interface ScheduleOptimizerProps {
  scheduleId: string;
  date: Date;
  onOptimizationComplete?: (result: ScheduleOptimizationOutput) => void;
}

interface OptimizationMetrics {
  conflictsResolved: number;
  timeSaved: number;
  efficiencyImprovement: number;
  suggestionsApplied: number;
}

export const ScheduleOptimizer: React.FC<ScheduleOptimizerProps> = ({
  scheduleId,
  date,
  onOptimizationComplete
}) => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<ScheduleOptimizationOutput | null>(null);
  const [metrics, setMetrics] = useState<OptimizationMetrics | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleOptimize = async () => {
    setIsOptimizing(true);
    try {
      // In a real implementation, this would be injected or obtained from a service
      // const optimizeUseCase = new OptimizeScheduleUseCase(scheduleRepo, therapistRepo, roomRepo);
      
      // Simulated optimization for demonstration
      const mockResult: ScheduleOptimizationOutput = {
        originalSchedule: {} as any,
        optimizedSchedule: {} as any,
        appliedSuggestions: [
          {
            id: '1',
            type: 'reschedule',
            priority: 8,
            estimatedSavings: 30,
            description: 'Rescheduled morning appointment to fill gap',
            originalAppointmentId: 'apt-1',
            suggestedChanges: { newTime: new Date() }
          },
          {
            id: '2',
            type: 'reassign_therapist',
            priority: 6,
            estimatedSavings: 15,
            description: 'Reassigned therapist to balance workload',
            originalAppointmentId: 'apt-2',
            suggestedChanges: { newTherapist: 'therapist-2' }
          }
        ],
        resolvedConflicts: [
          {
            id: '1',
            type: 'double_booking',
            severity: 'high',
            description: 'Therapist double booking resolved',
            affectedAppointments: ['apt-1', 'apt-2']
          }
        ],
        efficiencyImprovement: 15.5,
        estimatedTimeSaved: 45,
        recommendations: [
          'Applied 2 optimization suggestions',
          'Estimated 45 minutes saved through optimization',
          'Resolved 1 scheduling conflict'
        ]
      };

      setTimeout(() => {
        setOptimizationResult(mockResult);
        setMetrics({
          conflictsResolved: mockResult.resolvedConflicts.length,
          timeSaved: mockResult.estimatedTimeSaved,
          efficiencyImprovement: mockResult.efficiencyImprovement,
          suggestionsApplied: mockResult.appliedSuggestions.length
        });
        setIsOptimizing(false);
        onOptimizationComplete?.(mockResult);
      }, 3000);

    } catch (error) {
      console.error('Optimization failed:', error);
      setIsOptimizing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Schedule Optimizer</h2>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4" />
          <span>{date.toLocaleDateString()}</span>
        </div>
      </div>

      {!optimizationResult && (
        <div className="text-center py-8">
          <div className="mb-4">
            <TrendingUp className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Optimize Your Schedule
            </h3>
            <p className="text-gray-600 mb-6">
              Automatically resolve conflicts, fill gaps, and improve efficiency
            </p>
          </div>
          
          <button
            onClick={handleOptimize}
            disabled={isOptimizing}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
          >
            {isOptimizing ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Optimizing...</span>
              </div>
            ) : (
              'Start Optimization'
            )}
          </button>
        </div>
      )}

      {isOptimizing && (
        <div className="text-center py-8">
          <div className="animate-pulse">
            <div className="h-2 bg-blue-200 rounded-full mb-4">
              <div className="h-2 bg-blue-600 rounded-full animate-pulse"></div>
            </div>
            <p className="text-gray-600">Analyzing schedule and applying optimizations...</p>
          </div>
        </div>
      )}

      {metrics && optimizationResult && (
        <div className="space-y-6">
          {/* Metrics Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-900">{metrics.conflictsResolved}</div>
              <div className="text-sm text-green-700">Conflicts Resolved</div>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <Clock className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-900">{metrics.timeSaved}min</div>
              <div className="text-sm text-blue-700">Time Saved</div>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <TrendingUp className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-900">+{metrics.efficiencyImprovement}%</div>
              <div className="text-sm text-purple-700">Efficiency</div>
            </div>
            
            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <Users className="h-6 w-6 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-orange-900">{metrics.suggestionsApplied}</div>
              <div className="text-sm text-orange-700">Suggestions Applied</div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">Optimization Summary</h3>
            <ul className="space-y-2">
              {optimizationResult.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start space-x-2 text-sm text-gray-700">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{recommendation}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Detailed Results */}
          <div className="border-t pt-4">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm"
            >
              {showDetails ? 'Hide Details' : 'Show Detailed Results'}
            </button>

            {showDetails && (
              <div className="mt-4 space-y-4">
                {/* Applied Suggestions */}
                {optimizationResult.appliedSuggestions.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Applied Suggestions</h4>
                    <div className="space-y-2">
                      {optimizationResult.appliedSuggestions.map((suggestion) => (
                        <div key={suggestion.id} className="bg-blue-50 rounded p-3 text-sm">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium text-blue-900">{suggestion.description}</div>
                              <div className="text-blue-700 text-xs mt-1">
                                Type: {suggestion.type} • Priority: {suggestion.priority}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium text-green-600">+{suggestion.estimatedSavings}min</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resolved Conflicts */}
                {optimizationResult.resolvedConflicts.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Resolved Conflicts</h4>
                    <div className="space-y-2">
                      {optimizationResult.resolvedConflicts.map((conflict) => (
                        <div key={conflict.id} className="bg-green-50 rounded p-3 text-sm">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium text-green-900">{conflict.description}</div>
                              <div className="text-green-700 text-xs mt-1">
                                Type: {conflict.type} • Severity: {conflict.severity}
                              </div>
                            </div>
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-4 border-t">
            <button
              onClick={handleOptimize}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Optimize Again
            </button>
            <button
              onClick={() => {
                setOptimizationResult(null);
                setMetrics(null);
                setShowDetails(false);
              }}
              className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
};