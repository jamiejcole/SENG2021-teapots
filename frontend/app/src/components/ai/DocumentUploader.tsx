import { useRef, useState } from 'react'
import { Sparkles, Upload, X, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { extractDocument, type ExtractedFields } from '@/api/ai'
import { Button } from '@/components/ui/button'

interface DocumentUploaderProps {
  onExtracted: (fields: ExtractedFields) => void
  className?: string
}

const ACCEPTED = '.pdf,.png,.jpg,.jpeg,.webp,.xml'
const ACCEPTED_MIME = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'text/xml',
  'application/xml',
]

function FieldRow({ label, value }: { label: string; value: string | number | undefined }) {
  if (!value && value !== 0) return null
  return (
    <div className="flex gap-2 text-xs">
      <span className="w-28 shrink-0 font-medium text-muted-foreground">{label}</span>
      <span className="truncate text-foreground">{String(value)}</span>
    </div>
  )
}

function ExtractionPreview({
  fields,
  fileName,
  onApply,
  onDiscard,
}: {
  fields: ExtractedFields
  fileName: string
  onApply: () => void
  onDiscard: () => void
}) {
  const [showLines, setShowLines] = useState(false)
  const lineCount = fields.lines?.length ?? 0

  return (
    <div className="mt-2 rounded-xl border border-amber-300/60 bg-amber-50/80 p-3 dark:border-amber-800/50 dark:bg-amber-950/30">
      <div className="mb-2 flex items-center gap-1.5">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-amber-500" />
        <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
          Extracted from: <span className="font-normal">{fileName}</span>
        </p>
      </div>

      <div className="space-y-1">
        <FieldRow label="Buyer" value={fields.buyer?.name} />
        <FieldRow label="Buyer street" value={fields.buyer?.address?.street} />
        <FieldRow label="Buyer city" value={fields.buyer?.address?.city} />
        <FieldRow label="Buyer country" value={fields.buyer?.address?.country} />
        <FieldRow label="Seller" value={fields.seller?.name} />
        <FieldRow label="Seller street" value={fields.seller?.address?.street} />
        <FieldRow label="Seller city" value={fields.seller?.address?.city} />
        <FieldRow label="Seller country" value={fields.seller?.address?.country} />
        <FieldRow label="Currency" value={fields.currency} />
        <FieldRow label="Issue date" value={fields.issueDate} />
        <FieldRow label="Order ref." value={fields.orderReference} />
      </div>

      {lineCount > 0 && (
        <button
          type="button"
          onClick={() => setShowLines((v) => !v)}
          className="mt-1.5 flex items-center gap-1 text-xs text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200"
        >
          {showLines ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {lineCount} line item{lineCount !== 1 ? 's' : ''} found
        </button>
      )}

      {showLines && lineCount > 0 && (
        <div className="mt-1 space-y-1 border-t border-amber-200/60 pt-1 dark:border-amber-800/40">
          {fields.lines!.map((l, i) => (
            <div key={i} className="flex gap-2 text-xs text-muted-foreground">
              <span className="w-5 shrink-0 text-right">{i + 1}.</span>
              <span className="flex-1 truncate">{l.description}</span>
              <span className="shrink-0">×{l.quantity}</span>
              <span className="shrink-0">${l.unitPrice}</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <Button
          type="button"
          size="sm"
          className="h-7 rounded-lg bg-amber-400 px-3 text-xs font-semibold text-slate-900 hover:bg-amber-500"
          onClick={onApply}
        >
          Apply to form
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 rounded-lg px-3 text-xs text-muted-foreground hover:text-foreground"
          onClick={onDiscard}
        >
          Discard
        </Button>
      </div>
    </div>
  )
}

export function DocumentUploader({ onExtracted, className }: DocumentUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [pending, setPending] = useState<ExtractedFields | null>(null)

  const processFile = async (file: File) => {
    if (!ACCEPTED_MIME.includes(file.type)) {
      toast.error('Unsupported file type. Upload a PDF, image, or XML file.')
      return
    }
    setFileName(file.name)
    setPending(null)
    setLoading(true)
    const toastId = toast.loading('Reading document with AI…')
    try {
      const fields = await extractDocument(file)
      toast.dismiss(toastId)

      const hasData =
        fields.buyer?.name ||
        fields.seller?.name ||
        fields.currency ||
        (fields.lines && fields.lines.length > 0)

      if (!hasData) {
        toast.warning('No fields could be extracted. Try a clearer image or a different file.')
        setFileName(null)
        return
      }

      toast.success('Document read — review fields below before applying.')
      setPending(fields)
    } catch (err) {
      toast.dismiss(toastId)
      const msg = err instanceof Error ? err.message : 'Extraction failed'
      toast.error(msg)
      setFileName(null)
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) void processFile(file)
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) void processFile(file)
  }

  const apply = () => {
    if (pending) {
      onExtracted(pending)
      toast.success('Fields applied. Review and adjust as needed.')
    }
    setPending(null)
  }

  const discard = () => {
    setPending(null)
    setFileName(null)
  }

  return (
    <div className={className}>
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload document to autofill fields"
        onClick={() => !loading && !pending && inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && !loading && !pending && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={[
          'group relative flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed px-4 py-3 transition-colors',
          dragging
            ? 'border-amber-400 bg-amber-50 dark:border-amber-500 dark:bg-amber-950/30'
            : 'border-amber-300/70 bg-amber-50/50 hover:border-amber-400 hover:bg-amber-50 dark:border-amber-800/50 dark:bg-amber-950/20 dark:hover:border-amber-700',
          loading || pending ? 'pointer-events-none opacity-70' : '',
        ].join(' ')}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/40">
          {loading ? (
            <Sparkles className="h-4 w-4 animate-pulse text-amber-500" />
          ) : (
            <Upload className="h-4 w-4 text-amber-500" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          {loading ? (
            <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
              Analysing with AI…
            </p>
          ) : fileName && pending ? (
            <p className="truncate text-sm font-medium text-amber-700 dark:text-amber-300">
              Ready to apply — review below
            </p>
          ) : (
            <>
              <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                Autofill from document
              </p>
              <p className="text-xs text-amber-600/70 dark:text-amber-500/70">
                Drop or click — PDF (incl. scanned), image, or XML
              </p>
            </>
          )}
        </div>

        {pending && (
          <button
            type="button"
            aria-label="Discard extraction"
            onClick={(e) => { e.stopPropagation(); discard() }}
            className="ml-1 shrink-0 rounded p-0.5 text-amber-500 hover:bg-amber-100 hover:text-amber-700 dark:hover:bg-amber-900/50"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {pending && fileName && (
        <ExtractionPreview
          fields={pending}
          fileName={fileName}
          onApply={apply}
          onDiscard={discard}
        />
      )}
    </div>
  )
}
