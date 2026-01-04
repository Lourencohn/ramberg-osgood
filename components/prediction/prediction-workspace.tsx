'use client'

import { useState } from 'react'
import type { PredictionResult, RambergOsgoodTrainingPoint } from '@/types'
import { PredictionForm } from '@/components/prediction-form'
import { ResultsDisplay } from '@/components/results-display'
import { useSettings } from '@/components/settings-provider'
import { savePrediction } from '@/lib/prediction-storage'

type PredictionWorkspaceProps = {
  trainingData: RambergOsgoodTrainingPoint[]
}

export function PredictionWorkspace({ trainingData }: PredictionWorkspaceProps) {
  const { settings } = useSettings()
  const [result, setResult] = useState<PredictionResult | null>(null)

  const handleResult = (next: PredictionResult) => {
    setResult(next)
    if (settings.autoSavePredictions) {
      savePrediction(next, settings.cacheSize)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
      <section className="h-full">
        <PredictionForm trainingData={trainingData} onResult={handleResult} />
      </section>

      <section className="h-full">
        <ResultsDisplay result={result} trainingData={trainingData} />
      </section>
    </div>
  )
}
