import { useState, useEffect, useRef } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client/dist/sockjs'
import { Send, LogIn, Users, MessageSquare, LogOut, KeyRound, UserPlus, Plus, X, Settings, Image as ImageIcon, Palette, Smile, Film, Mic, MicOff, Camera, Phone, PhoneOff, Video, VideoOff, Home, Check, CheckCircle, Trash2, UserCheck, Search } from 'lucide-react'
import EmojiPicker from './EmojiPicker'
import GifPicker from './GifPicker'
import './App.css'

function App() {
  const API_BASE = `http://${window.location.hostname}:8080`
  const [stompClient, setStompClient] = useState(null)
  const [connected, setConnected] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoginMode, setIsLoginMode] = useState(true)
  const [authError, setAuthError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [savedAccounts, setSavedAccounts] = useState([])
  const [showSelector, setShowSelector] = useState(true)
  const [message, setMessage] = useState('')
  const [generalMessages, setGeneralMessages] = useState([])
  const [privateMessages, setPrivateMessages] = useState({})
  const [connectedUsers, setConnectedUsers] = useState([])
  const [activeTab, setActiveTab] = useState('FRIENDS')
  const [showSettings, setShowSettings] = useState(false)
  const [showProfile, setShowProfile] = useState(null)
  const [myProfile, setMyProfile] = useState({ avatarUrl: '', bio: '', accentColor: '#00f2ff', friends: [], incomingRequests: [], outgoingRequests: [] })
  const [appBgUrl, setAppBgUrl] = useState(localStorage.getItem('nexus_bg') || '')
  const [editProfile, setEditProfile] = useState({ avatarUrl: '', bio: '', accentColor: '#00f2ff' })
  const [viewedProfile, setViewedProfile] = useState(null)
  const [showEmoji, setShowEmoji] = useState(false)
  const [showGif, setShowGif] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [lightboxImg, setLightboxImg] = useState(null)
  // WebRTC Call states
  const [inCall, setInCall] = useState(false)
  const [incomingCall, setIncomingCall] = useState(null)
  const [callTarget, setCallTarget] = useState('')
  const [localMuted, setLocalMuted] = useState(false)
  const [localVideoOff, setLocalVideoOff] = useState(false)

  // Navigation & Friends states
  const [mainView, setMainView] = useState('HOME') // 'HOME' or 'SERVER'
  const [friendsFilter, setFriendsFilter] = useState('ONLINE') // 'ONLINE', 'ALL', 'PENDING', 'ADD'
  const [addFriendInput, setAddFriendInput] = useState('')

  const messagesEndRef = useRef(null)
  const hasConnectedRef = useRef(false)
  const fileInputRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const cameraStreamRef = useRef(null)
  // WebRTC refs
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const pcRef = useRef(null)
  const localStreamRef = useRef(null)
  const stompRef = useRef(null)
  const usernameRef = useRef('')

  const curAccent = myProfile.accentColor || '#00f2ff'

  useEffect(() => {
    if (appBgUrl) document.documentElement.style.setProperty('--bg-image', `url('${appBgUrl}')`)
    const c = curAccent
    document.documentElement.style.setProperty('--accent-color', c)
    const r=parseInt(c.slice(1,3),16), g=parseInt(c.slice(3,5),16), b=parseInt(c.slice(5,7),16)
    document.documentElement.style.setProperty('--accent-glow', `rgba(${r},${g},${b},0.35)`)
    document.documentElement.style.setProperty('--accent-hover', `rgba(${r},${g},${b},0.8)`)
    document.documentElement.style.setProperty('--accent-subtle', `rgba(${r},${g},${b},0.08)`)
    document.documentElement.style.setProperty('--accent-mid', `rgba(${r},${g},${b},0.15)`)
  }, [appBgUrl, curAccent])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [generalMessages, privateMessages, activeTab])

  useEffect(() => {
    const accs = JSON.parse(localStorage.getItem('nexus_accounts')) || []
    setSavedAccounts(accs)
    setShowSelector(accs.length > 0)
  }, [])

  const fetchMyProfile = async (user) => {
    try { const r = await fetch(`${API_BASE}/api/users/${user}`); if(r.ok){const d=await r.json(); setMyProfile(d); setEditProfile(d)} } catch{}
  }

  const saveProfileSettings = async () => {
    try {
      const r = await fetch(`${API_BASE}/api/users/${username}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({...editProfile, username}) })
      if(r.ok){ const d=await r.json(); setMyProfile(d); setShowSettings(false); localStorage.setItem('nexus_bg', appBgUrl) }
    } catch{}
  }

  const openUserProfile = async (user) => {
    try { const r=await fetch(`${API_BASE}/api/users/${user}`); if(r.ok){setViewedProfile(await r.json()); setShowProfile(user)} } catch{}
  }

  const saveAccountToLocal = (user, pass) => {
    const accs = JSON.parse(localStorage.getItem('nexus_accounts'))||[]
    const f = accs.filter(a=>a.username!==user); f.push({username:user,password:pass})
    localStorage.setItem('nexus_accounts', JSON.stringify(f)); setSavedAccounts(f)
  }

  const removeAccount = (e, u) => { e.stopPropagation(); const f=savedAccounts.filter(a=>a.username!==u); localStorage.setItem('nexus_accounts',JSON.stringify(f)); setSavedAccounts(f); if(!f.length) setShowSelector(false) }

  const handleAuth = async (e, du=null, dp=null) => {
    if(e) e.preventDefault()
    const u=du||username.trim(), p=dp||password
    if(!u||!p){setAuthError('Rellena todos los campos.');return}
    setIsLoading(true); setAuthError('')
    const ep = (du||isLoginMode)?'/api/auth/login':'/api/auth/register'
    try {
      const r=await fetch(`${API_BASE}${ep}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:u,password:p})})
      const d=await r.json()
      if(d.success){setUsername(d.username); saveAccountToLocal(d.username,p); await fetchMyProfile(d.username); connectWS(d.username)}
      else{setAuthError(d.message); if(du) setShowSelector(false)}
    } catch{setAuthError('Servidor no disponible.')} finally{setIsLoading(false)}
  }

  const connectWS = (name) => {
    if(hasConnectedRef.current) return; hasConnectedRef.current=true
    const client = new Client({ webSocketFactory:()=>new SockJS(`${API_BASE}/ws`), reconnectDelay:5000 })
    client.onConnect = () => {
      setConnected(true); setAuthError('')
      client.subscribe('/topic/public', pl => {
        const m=JSON.parse(pl.body)
        if(m.type==='USER_LIST') setConnectedUsers(m.connectedUsers||[])
        else if(m.type==='HISTORY') setGeneralMessages(m.history||[])
        else setGeneralMessages(p=>[...p,m])
      })
      client.subscribe('/topic/private', pl => {
        const m = JSON.parse(pl.body)
        if (m.sender === name || m.targetUser === name) {
          // Filtrar mensajes de señalización WebRTC para que no aparezcan en el chat
          const signalingTypes = ['VIDEO_OFFER', 'VIDEO_ANSWER', 'ICE_CANDIDATE', 'CALL_REJECTED']
          if (signalingTypes.includes(m.type)) {
            if (m.targetUser === name) {
              if (m.type === 'VIDEO_OFFER') setIncomingCall(m)
              else if (m.type === 'VIDEO_ANSWER') handleAnswer(JSON.parse(m.content))
              else if (m.type === 'ICE_CANDIDATE') handleIceCandidate(JSON.parse(m.content))
              else if (m.type === 'CALL_REJECTED') endCall()
            }
            return
          }
          
          const other = m.sender === name ? m.targetUser : m.sender
          setPrivateMessages(p => ({ ...p, [other]: [...(p[other] || []), m] }))
        }
      })
      client.publish({destination:'/app/chat.addUser',body:JSON.stringify({sender:name,type:'JOIN'})})
    }
    client.onDisconnect = () => { hasConnectedRef.current=false }
    client.activate(); setStompClient(client); stompRef.current=client; usernameRef.current=name
  }

  // ===== WebRTC VIDEOLLAMADA =====
  const ICE_SERVERS = [{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun1.l.google.com:19302'}]
  const createPC = (target) => {
    const pc = new RTCPeerConnection({iceServers:ICE_SERVERS})
    pc.onicecandidate = (e) => { if(e.candidate && stompRef.current) stompRef.current.publish({destination:'/app/chat.sendPrivate', body:JSON.stringify({sender:usernameRef.current,targetUser:target,content:JSON.stringify(e.candidate),type:'ICE_CANDIDATE'})}) }
    pc.ontrack = (e) => { if(remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0] }
    pc.onconnectionstatechange = () => { if(pc.connectionState==='disconnected'||pc.connectionState==='failed') endCall() }
    pcRef.current = pc; return pc
  }
  const startCall = async (target) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({video:true,audio:true}); localStreamRef.current = stream; setCallTarget(target); setInCall(true)
      setTimeout(()=>{if(localVideoRef.current) localVideoRef.current.srcObject=stream},100)
      const pc = createPC(target); stream.getTracks().forEach(t=>pc.addTrack(t,stream))
      const offer = await pc.createOffer(); await pc.setLocalDescription(offer)
      stompRef.current.publish({destination:'/app/chat.sendPrivate', body:JSON.stringify({sender:usernameRef.current,targetUser:target,content:JSON.stringify(offer),type:'VIDEO_OFFER'})})
    } catch(err){ alert('No se puede acceder a cámara/micrófono'); endCall() }
  }
  const acceptCall = async () => {
    if(!incomingCall) return; const caller = incomingCall.sender, offer = JSON.parse(incomingCall.content)
    setIncomingCall(null); setCallTarget(caller); setInCall(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({video:true,audio:true}); localStreamRef.current = stream
      setTimeout(()=>{if(localVideoRef.current) localVideoRef.current.srcObject=stream},100)
      const pc = createPC(caller); stream.getTracks().forEach(t=>pc.addTrack(t,stream)); await pc.setRemoteDescription(new RTCSessionDescription(offer))
      const answer = await pc.createAnswer(); await pc.setLocalDescription(answer)
      stompRef.current.publish({destination:'/app/chat.sendPrivate', body:JSON.stringify({sender:usernameRef.current,targetUser:caller,content:JSON.stringify(answer),type:'VIDEO_ANSWER'})})
    } catch(err){ endCall() }
  }
  const handleAnswer = async (answer) => { if(pcRef.current) await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer)) }
  const handleIceCandidate = async (candidate) => { if(pcRef.current) try{await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate))}catch{} }
  const rejectCall = () => { if(incomingCall && stompRef.current) stompRef.current.publish({destination:'/app/chat.sendPrivate', body:JSON.stringify({sender:usernameRef.current,targetUser:incomingCall.sender,content:'',type:'CALL_REJECTED'})}); setIncomingCall(null) }
  const endCall = () => { pcRef.current?.close(); pcRef.current=null; localStreamRef.current?.getTracks().forEach(t=>t.stop()); localStreamRef.current=null; setInCall(false); setCallTarget(''); setLocalMuted(false); setLocalVideoOff(false) }
  const toggleMute = () => { if(localStreamRef.current){ localStreamRef.current.getAudioTracks().forEach(t=>{t.enabled=!t.enabled}); setLocalMuted(!localMuted) } }
  const toggleVideo = () => { if(localStreamRef.current){ localStreamRef.current.getVideoTracks().forEach(t=>{t.enabled=!t.enabled}); setLocalVideoOff(!localVideoOff) } }

  const manageFriend = async (action, target) => {
    try {
      const ep = `/api/users/${username}/friends/${action}/${target}`
      const method = action === 'remove' ? 'DELETE' : 'POST'
      const r = await fetch(`${API_BASE}${ep}`, { method })
      if(r.ok) { setMyProfile(await r.json()); setAddFriendInput('') }
    } catch(err) { console.error('Friend action failed:', err) }
  }

  const disconnect = () => { stompClient?.deactivate(); hasConnectedRef.current=false; setConnected(false); setGeneralMessages([]); setPrivateMessages({}); setConnectedUsers([]); setActiveTab('FRIENDS'); setMainView('HOME'); setPassword(''); setShowSelector(savedAccounts.length>0) }

  const sendMsg = (e) => {
    if(e) e.preventDefault(); if(!message.trim()||!stompClient) return
    const dest = activeTab==='GENERAL'?'/app/chat.sendMessage':'/app/chat.sendPrivate'
    const body = activeTab==='GENERAL' ? {sender:username,content:message,type:'CHAT'} : {sender:username,targetUser:activeTab,content:message,type:'PRIVATE_CHAT'}
    stompClient.publish({destination:dest,body:JSON.stringify(body)}); setMessage('')
  }

  const sendMedia = (type, content) => {
    if(!stompClient) return
    const dest = activeTab==='GENERAL'?'/app/chat.sendMessage':'/app/chat.sendPrivate'
    const body = activeTab==='GENERAL' ? {sender:username,content,type} : {sender:username,targetUser:activeTab,content,type}
    stompClient.publish({destination:dest,body:JSON.stringify(body)})
  }

  const uploadFile = async (blob, filename) => {
    const fd = new FormData(); fd.append('file', blob, filename)
    try { const res = await fetch(`${API_BASE}/api/media/upload`, { method:'POST', body:fd }); if(res.ok){ const d = await res.json(); return d.filename } } catch{}
    return null
  }

  const handleImageUpload = async (e) => { const file = e.target.files[0]; if(!file) return; e.target.value = ''; const url = await uploadFile(file, file.name); if(url) sendMedia('IMAGE', url) }
  const toggleRecording = async () => {
    if(isRecording){ mediaRecorderRef.current?.stop(); setIsRecording(false); return }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({audio:true}), mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm', mr = new MediaRecorder(stream, {mimeType:mime})
      audioChunksRef.current = []; mr.ondataavailable = (e) => { if(e.data.size>0) audioChunksRef.current.push(e.data) }
      mr.onstop = async () => { stream.getTracks().forEach(t=>t.stop()); const blob = new Blob(audioChunksRef.current, {type:mime}), url = await uploadFile(blob, 'voice_'+Date.now()+'.webm'); if(url) sendMedia('AUDIO', url) }
      mr.start(200); mediaRecorderRef.current = mr; setIsRecording(true)
    } catch{ alert('No se puede acceder al micrófono.') }
  }
  const openCamera = async () => { try { const stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:640},height:{ideal:480}}}); cameraStreamRef.current = stream; setShowCamera(true) } catch{ alert('No se puede acceder a la cámara.') } }
  useEffect(() => { if(showCamera && videoRef.current && cameraStreamRef.current) videoRef.current.srcObject = cameraStreamRef.current }, [showCamera])
  const capturePhoto = () => {
    const v=videoRef.current, c=canvasRef.current; if(!v||!c||!v.videoWidth) return
    c.width=v.videoWidth; c.height=v.videoHeight; c.getContext('2d').drawImage(v,0,0); c.toBlob(async (blob) => { if(blob){ const url=await uploadFile(blob,'photo_'+Date.now()+'.jpg'); if(url) sendMedia('IMAGE',url) }; closeCamera() }, 'image/jpeg', 0.85)
  }
  const closeCamera = () => { cameraStreamRef.current?.getTracks().forEach(t=>t.stop()); cameraStreamRef.current=null; setShowCamera(false) }

  const renderContent = (msg) => {
    if(msg.type==='IMAGE'){ const src = msg.content.startsWith('http') ? msg.content : `${API_BASE}/api/media/files/${msg.content}`; return <img src={src} alt="img" className="chat-image" onClick={()=>setLightboxImg(src)}/> }
    if(msg.type==='GIF') return <img src={msg.content} alt="gif" className="chat-image gif"/>
    if(msg.type==='AUDIO'){ const src = msg.content.startsWith('http') ? msg.content : `${API_BASE}/api/media/files/${msg.content}`; return <audio controls src={src} className="chat-audio"/> }
    return <span>{msg.content}</span>
  }

  const renderFriendsList = () => {
    let list = []
    const friends = myProfile.friends || [], incoming = myProfile.incomingRequests || [], outgoing = myProfile.outgoingRequests || []
    if(friendsFilter === 'ALL' || friendsFilter === 'ONLINE') {
      list = friends.map(f => ({ name: f, status: connectedUsers.some(u=>u.username===f)?'Online':'Offline', type: 'FRIEND' }))
      if(friendsFilter === 'ONLINE') list = list.filter(f => f.status === 'Online')
    } else if(friendsFilter === 'PENDING') {
      list = [...incoming.map(f => ({ name: f, status: 'Solicitud entrante', type: 'INCOMING' })), ...outgoing.map(f => ({ name: f, status: 'Solicitud enviada', type: 'OUTGOING' }))]
    }
    return (
      <div className="friends-content">
        {friendsFilter === 'ADD' ? (
          <div className="add-friend-section">
            <h2>AÑADIR AMIGO</h2>
            <p>Puedes añadir amigos con su nombre de usuario.</p>
            <div className="add-input-wrapper">
              <input placeholder="Introduce un nombre de usuario" value={addFriendInput} onChange={e=>setAddFriendInput(e.target.value)} onKeyPress={e=>e.key==='Enter'&&manageFriend('request', addFriendInput)}/>
              <button className="btn-primary" onClick={()=>manageFriend('request', addFriendInput)}>Enviar solicitud</button>
            </div>
          </div>
        ) : (
          <>
            <div className="friends-search"><Search size={18}/><input placeholder="Buscar"/></div>
            <div className="friends-count">{friendsFilter} — {list.length}</div>
            {list.map((f, i) => (
              <div key={i} className="friend-row" onClick={() => f.type==='FRIEND'&&setActiveTab(f.name)}>
                <div className="friend-info">
                  <div className="user-avatar" style={{background:curAccent}}>{f.name.charAt(0).toUpperCase()}</div>
                  <div><div className="friend-name">{f.name}</div><div className="friend-status">{f.status}</div></div>
                </div>
                <div className="friend-actions">
                  {f.type === 'INCOMING' && <><button className="action-icon accept" onClick={(e)=>{e.stopPropagation();manageFriend('accept', f.name)}}><Check size={20}/></button><button className="action-icon reject" onClick={(e)=>{e.stopPropagation();manageFriend('reject', f.name)}}><X size={20}/></button></>}
                  {f.type === 'FRIEND' && <><button className="action-icon" onClick={(e)=>{e.stopPropagation();setActiveTab(f.name)}}><MessageSquare size={18}/></button><button className="action-icon reject" onClick={(e)=>{e.stopPropagation();manageFriend('remove', f.name)}}><Trash2 size={18}/></button></>}
                  {f.type === 'OUTGOING' && <button className="action-icon reject" onClick={(e)=>{e.stopPropagation();manageFriend('reject', f.name)}}><X size={18}/></button>}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    )
  }

  if(!connected) return (
    <div className="app-container">
      <div className="login-screen glass-panel">
        <h1>NexusWeb</h1>
        {showSelector ? (
          <div className="account-selector-container">
            <h3>¿Quién eres?</h3>
            {authError && <div className="auth-error">{authError}</div>}
            <div className="accounts-grid">
              {savedAccounts.map((a,i)=>(<div key={i} className="account-card" onClick={()=>handleAuth(null,a.username,a.password)}><button className="btn-remove-account" onClick={e=>removeAccount(e,a.username)}><X size={14}/></button><div className="account-avatar-large">{a.username.charAt(0).toUpperCase()}</div><span className="account-name">{a.username}</span></div>))}
              <div className="account-card new-account" onClick={()=>setShowSelector(false)}><div className="account-avatar-large"><Plus size={32}/></div><span className="account-name">Añadir</span></div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleAuth} className="auth-form">
            <button type="button" className="btn-back" onClick={()=>setShowSelector(true)}>← Volver</button>
            <div className="auth-tabs"><button type="button" className={`auth-tab ${isLoginMode?'active':''}`} onClick={()=>setIsLoginMode(true)}>Login</button><button type="button" className={`auth-tab ${!isLoginMode?'active':''}`} onClick={()=>setIsLoginMode(false)}>Registro</button></div>
            {authError && <div className="auth-error">{authError}</div>}
            <input className="login-input" placeholder="Usuario" value={username} onChange={e=>setUsername(e.target.value)}/>
            <input className="login-input" type="password" placeholder="Contraseña" value={password} onChange={e=>setPassword(e.target.value)}/>
            <button className="btn-primary" type="submit" disabled={isLoading}>{isLoading?'Procesando...':isLoginMode?'Entrar':'Registrarse'}</button>
          </form>
        )}
      </div>
    </div>
  )

  const curMsgs = activeTab==='GENERAL'?generalMessages:(privateMessages[activeTab]||[])
  return (
    <div className="app-container">
      {lightboxImg && <div className="modal-overlay" onClick={()=>setLightboxImg(null)}><img src={lightboxImg} alt="full" className="lightbox-img"/></div>}
      {incomingCall && <div className="modal-overlay"><div className="incoming-call-card glass-panel"><div className="call-pulse"/><Phone size={40} color="var(--accent-color)"/><h2 className="call-sender">{incomingCall.sender}</h2><p className="call-status">Llamada entrante...</p><div className="call-actions-row"><button className="btn-call-accept" onClick={acceptCall}><Phone size={20}/> Aceptar</button><button className="btn-call-reject" onClick={rejectCall}><PhoneOff size={20}/> Rechazar</button></div></div></div>}
      {inCall && <div className="call-fullscreen"><video ref={remoteVideoRef} autoPlay playsInline className="call-remote-video"/><video ref={localVideoRef} autoPlay playsInline muted className="call-local-video"/><div className="call-info">Llamada con <strong>{callTarget}</strong></div><div className="call-controls"><button className={`btn-call-ctrl ${localMuted?'off':''}`} onClick={toggleMute}>{localMuted?<MicOff size={22}/>:<Mic size={22}/>}</button><button className={`btn-call-ctrl ${localVideoOff?'off':''}`} onClick={toggleVideo}>{localVideoOff?<VideoOff size={22}/>:<Video size={22}/>}</button><button className="btn-call-ctrl hangup" onClick={endCall}><PhoneOff size={22}/></button></div></div>}
      {showSettings && <div className="modal-overlay" onClick={()=>setShowSettings(false)}><div className="modal-content glass-panel" onClick={e=>e.stopPropagation()}><div className="modal-header"><h3>Ajustes</h3><button className="btn-close" onClick={()=>setShowSettings(false)}><X size={20}/></button></div><div className="settings-section"><h4>Fondo (URL)</h4><input className="login-input" value={appBgUrl} onChange={e=>setAppBgUrl(e.target.value)}/></div><div className="settings-section"><h4>Avatar (URL)</h4><input className="login-input" value={editProfile.avatarUrl} onChange={e=>setEditProfile({...editProfile,avatarUrl:e.target.value})}/></div><div className="settings-section"><h4>Biografía</h4><textarea className="login-input" style={{height:'80px'}} value={editProfile.bio} onChange={e=>setEditProfile({...editProfile,bio:e.target.value})}/></div><div className="settings-section"><h4>Tema</h4><div className="color-grid">{['#00f2ff','#ff2e63','#08f7af','#faa61a','#eb459e','#5865f2'].map(c=>(<div key={c} className="color-swatch" style={{background:c,border:editProfile.accentColor===c?`3px solid white`:'none'}} onClick={()=>setEditProfile({...editProfile,accentColor:c})}/>))}</div></div><button className="btn-primary" onClick={saveProfileSettings}>Guardar</button></div></div>}
      {showCamera && <div className="modal-overlay" onClick={closeCamera}><div className="modal-content glass-panel" onClick={e=>e.stopPropagation()} style={{alignItems:'center'}}><h2>📷 Capturar Foto</h2><video ref={videoRef} autoPlay playsInline style={{width:'100%',borderRadius:'10px'}}/><canvas ref={canvasRef} style={{display:'none'}}/><div style={{display:'flex',gap:'1rem',marginTop:'1rem'}}><button className="btn-primary" onClick={capturePhoto}><Camera size={18}/> Capturar</button><button className="btn-primary btn-danger" onClick={closeCamera}><X size={18}/> Cerrar</button></div></div></div>}
      {showProfile && viewedProfile && <div className="modal-overlay" onClick={()=>setShowProfile(null)}><div className="public-profile-card glass-panel" onClick={e=>e.stopPropagation()} style={{borderColor:viewedProfile.accentColor}}><div className="profile-banner" style={{background:`linear-gradient(135deg, ${viewedProfile.accentColor}, ${viewedProfile.accentColor}88)`}}/><div className="profile-avatar-container">{viewedProfile.avatarUrl?<img src={viewedProfile.avatarUrl} alt="" className="profile-avatar-img"/>:<div className="profile-avatar-placeholder" style={{background:viewedProfile.accentColor}}>{viewedProfile.username.charAt(0).toUpperCase()}</div>}</div><div className="profile-info"><h2>{viewedProfile.username}</h2><div className="profile-bio"><p>{viewedProfile.bio||'Sin biografía'}</p></div><button className="btn-primary" style={{background:viewedProfile.accentColor}} onClick={()=>{setMainView('HOME');setActiveTab(viewedProfile.username);setShowProfile(null)}}><MessageSquare size={16}/> Enviar Mensaje</button></div></div></div>}

      <div className="chat-screen">
        <div className="activity-bar">
          <div className={`nav-item ${mainView==='HOME'?'active':''}`} onClick={()=>{setMainView('HOME');setActiveTab('FRIENDS')}}><Home size={22}/></div>
          <div className="activity-separator"/>
          <div className={`nav-item ${mainView==='SERVER'?'active':''}`} onClick={()=>{setMainView('SERVER');setActiveTab('GENERAL')}}><MessageSquare size={22}/></div>
        </div>
        <div className="sidebar">
          {mainView === 'HOME' ? (
            <>
              <div className={`channel-item ${activeTab==='FRIENDS'?'active':''}`} onClick={()=>setActiveTab('FRIENDS')}><Users size={18}/> Amigos</div>
              <div className="sidebar-section-title">Mensajes Directos</div>
              <div className="user-list-scroll">{(myProfile.friends || []).map(f=>(<div key={f} className={`user-item ${activeTab===f?'active':''}`} onClick={()=>setActiveTab(f)}><div className="user-avatar" style={{background:curAccent}}>{f.charAt(0).toUpperCase()}</div><span>{f}</span></div>))}</div>
            </>
          ) : (
            <>
              <div className={`channel-item ${activeTab==='GENERAL'?'active':''}`} onClick={()=>setActiveTab('GENERAL')}><MessageSquare size={18}/> General</div>
              <div className="sidebar-section-title">En Línea</div>
              <div className="user-list-scroll">{connectedUsers.map(u=>(<div key={u.username} className={`user-item ${u.username===username?'is-me':''} ${activeTab===u.username?'active':''}`} onClick={()=>u.username!==username&&setActiveTab(u.username)}><div className="user-avatar" style={{background:u.profile?.accentColor||'#7289da'}}>{u.username.charAt(0).toUpperCase()}</div><span>{u.username}</span></div>))}</div>
            </>
          )}
          <div className="sidebar-user-area">
            <div className="user-avatar" onClick={()=>openUserProfile(username)} style={{background:curAccent,cursor:'pointer'}}>{username.charAt(0).toUpperCase()}</div>
            <div className="user-info-text"><div className="user-info-name">{username}</div><div className="user-info-status">En línea</div></div>
            <div className="user-area-actions">
              <button onClick={()=>setShowSettings(true)} className="action-icon"><Settings size={16}/></button>
              <button onClick={disconnect} className="action-icon reject"><LogOut size={16}/></button>
            </div>
          </div>
        </div>
        <div className="chat-area">
          {activeTab === 'FRIENDS' ? (
            <div className="friends-view">
              <div className="friends-header">
                <h3><Users size={20}/> Amigos</h3>
                <div className="header-separator"/>
                <div className={`friends-tab ${friendsFilter==='ONLINE'?'active':''}`} onClick={()=>setFriendsFilter('ONLINE')}>En línea</div>
                <div className={`friends-tab ${friendsFilter==='ALL'?'active':''}`} onClick={()=>setFriendsFilter('ALL')}>Todos</div>
                <div className={`friends-tab ${friendsFilter==='PENDING'?'active':''}`} onClick={()=>setFriendsFilter('PENDING')}>Pendiente</div>
                <div className={`friends-tab add-btn ${friendsFilter==='ADD'?'active':''}`} onClick={()=>setFriendsFilter('ADD')}>Añadir amigo</div>
              </div>
              {renderFriendsList()}
            </div>
          ) : (
            <>
              <div className="chat-header">
                <h3 className="chat-title">
                  {activeTab==='GENERAL'?<><MessageSquare size={20}/> general</>:<><div className="user-avatar" style={{background:curAccent}}>{activeTab.charAt(0).toUpperCase()}</div>{activeTab}</>}
                </h3>
                {activeTab!=='GENERAL'&&<button className="btn-call" onClick={()=>startCall(activeTab)}><Video size={18}/> Llamar</button>}
              </div>
              <div className="chat-messages">
                {curMsgs.map((m,i)=>(
                  <div key={i} className={`message-wrapper ${m.sender===username?'mine':'other'}`}>
                    {m.type==='JOIN'||m.type==='LEAVE'?<div className="system-message">{m.content}</div>:<><div className="message-meta"><span>{m.sender}</span><span>{new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span></div><div className="message-bubble">{renderContent(m)}</div></>}
                  </div>
                ))}
                <div ref={messagesEndRef}/>
              </div>
              <div className="chat-input-area">
                <div className="input-container">
                  <button className="btn-media" onClick={()=>fileInputRef.current.click()}><Plus size={20}/></button>
                  <input type="file" ref={fileInputRef} style={{display:'none'}} onChange={handleImageUpload} accept="image/*"/>
                  <input className="chat-input" placeholder={`Mensaje...`} value={message} onChange={e=>setMessage(e.target.value)} onKeyPress={e=>e.key==='Enter'&&sendMsg()}/>
                  <div className="input-actions-group">
                    <button className={`btn-media ${showGif?'active':''}`} onClick={()=>setShowGif(!showGif)}><Film size={20}/></button>
                    <button className={`btn-media ${showEmoji?'active':''}`} onClick={()=>setShowEmoji(!showEmoji)}><Smile size={20}/></button>
                    <button className={`btn-media ${isRecording?'recording':''}`} onClick={toggleRecording}><Mic size={20}/></button>
                    <button className="btn-media" onClick={openCamera}><Camera size={20}/></button>
                  </div>
                  <button className="btn-send" onClick={sendMsg} disabled={!message.trim()}><Send size={18}/></button>
                </div>
                {showEmoji&&<EmojiPicker onSelect={e=>{setMessage(p=>p+e);setShowEmoji(false)}}/>}
                {showGif&&<GifPicker onSelect={g=>{sendMedia('GIF',g);setShowGif(false)}}/>}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
export default App
