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
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)] xl:min-h-0 xl:flex-1">
      <section className="flex min-h-0 flex-col">
        <PredictionForm trainingData={trainingData} onResult={handleResult} />
      </section>

      <section className="flex min-h-0 flex-col">
        <ResultsDisplay result={result} trainingData={trainingData} />
      </section>
    </div>
  )
}
