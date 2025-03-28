'use client'

import { PutCallRatioIndicator } from '@/components/dashboard/PutCallRatioIndicator'

export function SampleDashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      <PutCallRatioIndicator />
      {/* Add other indicators here */}
    </div>
  )
} 