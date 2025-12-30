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
    <div className="grid gap-6 lg:grid-cols-2">
      <section>
        <PredictionForm trainingData={trainingData} onResult={setResult} />
      </section>

      <section>
        <ResultsDisplay result={result} trainingData={trainingData} />
      </section>
    </div>
  )
}
