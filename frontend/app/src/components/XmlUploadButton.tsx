import { useRef } from 'react'
import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'

type XmlUploadButtonProps = {
  onUpload: (xml: string) => void
  accept?: string
  className?: string
}

export function XmlUploadButton({ onUpload, accept = '.xml,application/xml,text/xml', className }: XmlUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = reader.result as string
      if (text) onUpload(text)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={className}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="size-4" />
        Upload
      </Button>
    </>
  )
}
