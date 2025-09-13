'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="p-6 text-sm text-gray-800">
      <div className="mb-2 font-semibold text-red-600">エラーが発生しました</div>
      <pre className="whitespace-pre-wrap break-words text-xs bg-red-50 border border-red-200 rounded p-2">
        {error?.message || 'Unknown error'}
      </pre>
      <button
        className="mt-3 px-3 py-1.5 rounded bg-gray-800 text-white text-xs hover:bg-black"
        onClick={() => reset()}
      >
        再試行
      </button>
    </div>
  )
}

