"use client"

import { useState } from "react"
import type { PredictionResult, RambergOsgoodTrainingPoint } from "@/types"
import { PredictionForm } from "@/components/prediction-form"
import { ResultsDisplay } from "@/components/results-display"

type PredictionWorkspaceProps = {
  trainingData: RambergOsgoodTrainingPoint[]
}

export function PredictionWorkspace({ trainingData }: PredictionWorkspaceProps) {
  const [result, setResult] = useState<PredictionResult | null>(null)

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
      <section className="h-full">
        <PredictionForm trainingData={trainingData} onResult={setResult} />
      </section>

      <section className="h-full">
        <ResultsDisplay result={result} trainingData={trainingData} />
      </section>
    </div>
  )
}
