import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ page, pages, total, onPageChange }) {
  if (pages <= 1) return null

  const getPages = () => {
    const p = []
    const start = Math.max(1, page - 2)
    const end = Math.min(pages, page + 2)
    if (start > 1) { p.push(1); if (start > 2) p.push('...') }
    for (let i = start; i <= end; i++) p.push(i)
    if (end < pages) { if (end < pages - 1) p.push('...'); p.push(pages) }
    return p
  }

  return (
    <div className="flex items-center justify-between pt-4 pb-2">
      <p className="text-sm text-slate-500">{total} results</p>
      <div className="flex items-center gap-1">
        <button disabled={page <= 1} onClick={() => onPageChange(page - 1)}
          className="p-2  hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronLeft className="w-4 h-4" />
        </button>
        {getPages().map((p, i) =>
          p === '...' ? <span key={`e${i}`} className="px-2 text-slate-400">...</span> : (
            <button key={p} onClick={() => onPageChange(p)}
              className={`min-w-[32px] h-8 text-sm  ${p === page ? 'bg-blue-700 text-white' : 'hover:bg-slate-100 text-slate-700'}`}>
              {p}
            </button>
          )
        )}
        <button disabled={page >= pages} onClick={() => onPageChange(page + 1)}
          className="p-2  hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}


