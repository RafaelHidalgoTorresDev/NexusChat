import { useState } from 'react'
import { X, Search } from 'lucide-react'

const EMOJI_DATA = {
  '😊 Caritas': ['😀','😂','🤣','😊','😍','🥰','😎','😢','😭','😡','🤔','🤗','😴','😈','👻','💀','🥳','😱','🤩','😜'],
  '👍 Gestos': ['👍','👎','👏','🤝','💪','🙏','✌️','🤘','👋','🤞','🫶','🫡','🤙','👌','✊','👊'],
  '❤️ Amor': ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','💔','❤️‍🔥','💕','💖','💗','💘','💝'],
  '🔥 Objetos': ['🔥','⭐','💯','⚡','💎','🎯','🏆','💰','🎉','🎊','🎁','🎮','💻','📱','🎧','📸','🎬','🔑','💡'],
  '🐶 Animales': ['🐶','🐱','🐻','🦊','🐼','🐨','🦁','🐯','🐸','🐵','🦄','🐙','🦋','🐝'],
  '🍕 Comida': ['🍕','🍔','🌮','🍣','🍩','🍫','🍺','🍷','☕','🍰','🥑','🍓']
}

export default function EmojiPicker({ onSelect }) {
  const [filter, setFilter] = useState('')
  const allEmojis = Object.values(EMOJI_DATA).flat()
  const filtered = filter ? allEmojis.filter(e => e.includes(filter)) : null

  return (
    <div className="picker-popup emoji-picker" onClick={e => e.stopPropagation()}>
      <div className="picker-header">
        <div className="picker-search-wrapper">
          <Search size={14} className="picker-search-icon"/>
          <input type="text" className="picker-search-input" placeholder="Buscar emoji..." value={filter} onChange={e=>setFilter(e.target.value)}/>
        </div>
      </div>
      <div className="picker-body">
        {filtered ? (
          <div className="emoji-grid">{filtered.map((e,i)=><span key={i} className="emoji-item" onClick={()=>onSelect(e)}>{e}</span>)}</div>
        ) : Object.entries(EMOJI_DATA).map(([cat,emojis])=>(
          <div key={cat} className="emoji-section">
            <div className="emoji-cat-title">{cat}</div>
            <div className="emoji-grid">{emojis.map((e,i)=><span key={i} className="emoji-item" onClick={()=>onSelect(e)}>{e}</span>)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
