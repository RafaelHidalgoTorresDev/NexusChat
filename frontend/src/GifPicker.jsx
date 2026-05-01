import { useState, useEffect } from 'react'
import { X, Search } from 'lucide-react'

const GIPHY_KEY = 'GlVGYHkr3WSBnllca54iNt0yFbjz7L65'

export default function GifPicker({ onSelect }) {
  const [query, setQuery] = useState('')
  const [gifs, setGifs] = useState([])
  const [loading, setLoading] = useState(false)

  const searchGifs = async (q) => {
    if (!q.trim()) return
    setLoading(true)
    try {
      const url = `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(q)}&limit=20&rating=g`
      const res = await fetch(url)
      const data = await res.json()
      setGifs(data.data || [])
    } catch { setGifs([]) }
    finally { setLoading(false) }
  }

  const loadTrending = async () => {
    setLoading(true)
    try {
      const url = `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_KEY}&limit=20&rating=g`
      const res = await fetch(url)
      const data = await res.json()
      setGifs(data.data || [])
    } catch { setGifs([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { loadTrending() }, [])

  return (
    <div className="picker-popup gif-picker" onClick={e => e.stopPropagation()}>
      <div className="picker-header">
        <div className="picker-search-wrapper">
          <Search size={14} className="picker-search-icon"/>
          <input type="text" className="picker-search-input" placeholder="Buscar GIFs..." value={query}
            onChange={e=>{setQuery(e.target.value); if(e.target.value.length>2) searchGifs(e.target.value)}}
            onKeyDown={e=>{if(e.key==='Enter') searchGifs(query)}} />
        </div>
      </div>
      <div className="picker-body">
        {loading && <p className="picker-loading">Buscando...</p>}
        <div className="gif-grid">
          {gifs.map(g => (
            <img key={g.id} src={g.images?.fixed_height_small?.url} alt="gif"
              className="gif-grid-item" onClick={() => onSelect(g.images?.original?.url)} />
          ))}
        </div>
        {!loading && gifs.length === 0 && <p className="picker-empty">Escribe algo para buscar GIFs</p>}
      </div>
    </div>
  )
}
