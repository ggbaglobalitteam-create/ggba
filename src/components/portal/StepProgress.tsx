import React from 'react';
import { Check } from 'lucide-react';

interface StepProgressProps {
    steps: string[];
    currentStep: number;
}

export function StepProgress({ steps, currentStep }: StepProgressProps) {
    const totalSteps = steps.length;
    // Calculate percentage based on current step index (0-based) vs totalSteps
    // If we're at the end (currentStep === totalSteps - 1), it should be 100%
    const percentage = totalSteps > 1
        ? Math.round((currentStep / (totalSteps - 1)) * 100)
        : 0;

    const isCompleted = currentStep === totalSteps - 1;
    const currentStepTitle = steps[currentStep] || '';

    return (
        <div className="w-full py-2 mb-6 text-center animate-in fade-in duration-500">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                Step {currentStep + 1} of {totalSteps}
            </h3>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 tracking-tight">
                {currentStepTitle}
            </h2>

            <div className="relative w-full max-w-3xl mx-auto h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                    className="absolute top-0 left-0 h-full bg-[#C6A96A] rounded-full transition-all duration-700 ease-out flex items-center justify-end"
                    style={{ width: `${percentage}%` }}
                >
                </div>
            </div>

            <div className="flex justify-between max-w-3xl mx-auto mt-3 text-xs font-semibold text-gray-500">
                <span>0%</span>
                <span className={percentage > 0 && percentage < 100 ? "text-[#C6A96A]" : ""}>{percentage}% Complete</span>
                <span>100%</span>
            </div>
        </div>
    );
}
