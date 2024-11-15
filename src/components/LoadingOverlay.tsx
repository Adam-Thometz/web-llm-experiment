import { LoadingState } from "../types";

const LoadingOverlay = ({ loadingInfo, text = "" }: { loadingInfo: LoadingState, text?: string }) => {
  if (!loadingInfo.isLoading) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      aria-busy="true"
      role="progressbar"
    >
      <div className="flex flex-col items-center gap-2">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <span className="text-lg font-medium text-white">{loadingInfo.loading}</span>
        {text && <span className="text-sm font-medium text-white">{text}</span>}
      </div>
    </div>
  )
}
export default LoadingOverlay;