import { Loading } from "@/components/ui/loading"

export default function GlobalLoading({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
      <Loading text={text} size="lg" />
    </div>
  )
}