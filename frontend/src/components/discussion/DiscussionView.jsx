import { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageSquare, Send, Paperclip, Mic, Square, File, Trash2, X,
  Users, Plus, Search, ArrowLeft, Check, CheckCheck, Image, Smile,
  Camera, ChevronRight, MoreVertical, Phone, Video, Info
} from 'lucide-react';
import { api } from '../../services/api';
import { fmt } from '../../constants/data';
import { getMediaUrl } from '../members/VirtualCard';

/* ─────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────── */
function timeAgo(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return 'maintenant';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} min`;
  if (diff < 86400000) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

function Avatar({ src, name, size = 42, ring = false, online = false }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const bg = stringToColor(name || '?');
  return (
    <div className={`wa-avatar ${ring ? 'wa-avatar-ring' : ''}`} style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
      {src
        ? <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <div style={{ width: '100%', height: '100%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.36, fontWeight: 700, color: '#fff', userSelect: 'none' }}>{initials}</div>
      }
      {online && <span className="wa-online-dot" />}
    </div>
  );
}

function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const h = hash % 360;
  return `hsl(${h}, 55%, 42%)`;
}

/* ─────────────────────────────────────────────────────────────
   CONVERSATION LIST ITEM
───────────────────────────────────────────────────────────── */
function ConvItem({ conv, isActive, onClick }) {
  return (
    <button
      className={`wa-conv-item ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      <Avatar
        src={conv.photo ? getMediaUrl(conv.photo) : null}
        name={conv.name}
        size={50}
        ring={conv.type === 'status'}
      />
      <div className="wa-conv-info">
        <div className="wa-conv-header">
          <span className="wa-conv-name">{conv.name}</span>
          <span className="wa-conv-time">{conv.lastTime ? timeAgo(conv.lastTime) : ''}</span>
        </div>
        <div className="wa-conv-preview">
          <span className="wa-conv-last">{conv.lastMsg || 'Démarrer la conversation…'}</span>
          {conv.unread > 0 && <span className="wa-conv-badge">{conv.unread}</span>}
        </div>
      </div>
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────
   STATUS BAR (WhatsApp Stories)
───────────────────────────────────────────────────────────── */
function StatusBar({ statuses, member, onPost }) {
  const [showCompose, setShowCompose] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [bgColor, setBgColor] = useState('#6366f1');
  const [sending, setSending] = useState(false);

  const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#3b82f6', '#8b5cf6', '#14b8a6'];

  // Group statuses by member
  const grouped = statuses.reduce((acc, s) => {
    const key = s.member_id;
    if (!acc[key]) acc[key] = { ...s, items: [] };
    acc[key].items.push(s);
    return acc;
  }, {});

  const [viewStatus, setViewStatus] = useState(null);

  async function handlePost() {
    if (!statusText.trim()) return;
    setSending(true);
    try {
      await api.postStatus({ member_id: member.id, content: statusText.trim(), bg_color: bgColor });
      setStatusText('');
      setShowCompose(false);
      onPost();
    } catch { /* ignore */ }
    setSending(false);
  }

  return (
    <div className="wa-status-bar">
      <div className="wa-status-section-title">Statuts</div>

      {/* Add my status */}
      <div className="wa-status-my">
        <button className="wa-status-add-btn" onClick={() => setShowCompose(true)}>
          <div style={{ position: 'relative' }}>
            <Avatar src={member.photo_path ? getMediaUrl(member.photo_path) : null} name={`${member.first_name} ${member.last_name}`} size={52} />
            <span className="wa-status-plus"><Plus size={12} /></span>
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Mon statut</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Appuyez pour ajouter</div>
          </div>
        </button>
      </div>

      {/* Others statuses */}
      {Object.values(grouped).length > 0 && (
        <>
          <div className="wa-status-section-title" style={{ paddingTop: 16 }}>Récents</div>
          {Object.values(grouped).map(s => (
            <button key={s.member_id} className="wa-status-item" onClick={() => setViewStatus(s)}>
              <Avatar
                src={s.member_photo ? getMediaUrl(s.member_photo) : null}
                name={s.member_name}
                size={52}
                ring
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{s.member_name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{timeAgo(s.created_at)}</div>
              </div>
            </button>
          ))}
        </>
      )}

      {/* Compose modal */}
      {showCompose && (
        <div className="wa-modal-overlay" onClick={() => setShowCompose(false)}>
          <div className="wa-modal" onClick={e => e.stopPropagation()}>
            <div className="wa-modal-header">
              <button className="wa-icon-btn" onClick={() => setShowCompose(false)}><X size={18} /></button>
              <span>Ajouter un statut</span>
            </div>
            <div className="wa-status-preview" style={{ background: bgColor }}>
              <p style={{ color: '#fff', fontSize: 20, fontWeight: 600, textAlign: 'center', padding: 24, wordBreak: 'break-word' }}>
                {statusText || 'Votre texte ici…'}
              </p>
            </div>
            <div className="wa-modal-body">
              <textarea
                className="wa-status-input"
                placeholder="Saisissez votre statut…"
                value={statusText}
                onChange={e => setStatusText(e.target.value)}
                rows={3}
                maxLength={140}
              />
              <div className="wa-color-palette">
                {colors.map(c => (
                  <button
                    key={c}
                    className={`wa-color-swatch ${bgColor === c ? 'selected' : ''}`}
                    style={{ background: c }}
                    onClick={() => setBgColor(c)}
                  />
                ))}
              </div>
              <button className="btn btn-primary wa-send-btn" onClick={handlePost} disabled={sending || !statusText.trim()}>
                {sending ? 'Publication…' : 'Publier le statut'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View status modal */}
      {viewStatus && (
        <div className="wa-modal-overlay" onClick={() => setViewStatus(null)}>
          <div className="wa-status-viewer" style={{ background: viewStatus.bg_color || '#6366f1' }} onClick={e => e.stopPropagation()}>
            <button className="wa-close-btn" onClick={() => setViewStatus(null)}><X size={22} /></button>
            <div className="wa-status-viewer-header">
              <Avatar
                src={viewStatus.member_photo ? getMediaUrl(viewStatus.member_photo) : null}
                name={viewStatus.member_name}
                size={40}
              />
              <div>
                <div style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>{viewStatus.member_name}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{timeAgo(viewStatus.created_at)}</div>
              </div>
            </div>
            {viewStatus.media_path
              ? <img src={getMediaUrl(viewStatus.media_path)} alt="status" className="wa-status-media" />
              : <p className="wa-status-viewer-text">{viewStatus.content}</p>
            }
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   CREATE GROUP MODAL
───────────────────────────────────────────────────────────── */
function CreateGroupModal({ member, members, onCreated, onClose }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);

  const filtered = members.filter(m =>
    m.id !== member.id &&
    (`${m.first_name} ${m.last_name}`).toLowerCase().includes(search.toLowerCase())
  );

  function toggleMember(id) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  async function handleCreate() {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const res = await api.createChatGroup({
        name: name.trim(),
        description: description.trim(),
        created_by_id: member.id,
        member_ids: selected
      });
      if (!res.error) {
        onCreated(res);
        onClose();
      }
    } catch { /* ignore */ }
    setCreating(false);
  }

  return (
    <div className="wa-modal-overlay" onClick={onClose}>
      <div className="wa-modal" onClick={e => e.stopPropagation()} style={{ width: 440, maxWidth: '95vw' }}>
        <div className="wa-modal-header">
          <button className="wa-icon-btn" onClick={onClose}><X size={18} /></button>
          <span>Nouveau groupe</span>
        </div>
        <div className="wa-modal-body">
          <input
            className="wa-search-input"
            placeholder="Nom du groupe…"
            value={name}
            onChange={e => setName(e.target.value)}
            style={{ marginBottom: 8 }}
          />
          <input
            className="wa-search-input"
            placeholder="Description (optionnel)…"
            value={description}
            onChange={e => setDescription(e.target.value)}
            style={{ marginBottom: 14 }}
          />
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Ajouter des membres ({selected.length})
          </div>
          <div className="wa-search-wrapper">
            <Search size={14} className="wa-search-icon" />
            <input
              className="wa-search-input"
              placeholder="Rechercher un membre…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {/* Selected pills */}
          {selected.length > 0 && (
            <div className="wa-selected-pills">
              {selected.map(id => {
                const m = members.find(x => x.id === id);
                return m ? (
                  <span key={id} className="wa-pill" onClick={() => toggleMember(id)}>
                    {m.first_name} {m.last_name} <X size={12} />
                  </span>
                ) : null;
              })}
            </div>
          )}
          <div className="wa-member-list">
            {filtered.map(m => (
              <button key={m.id} className={`wa-member-item ${selected.includes(m.id) ? 'selected' : ''}`} onClick={() => toggleMember(m.id)}>
                <Avatar src={m.photo_path ? getMediaUrl(m.photo_path) : null} name={`${m.first_name} ${m.last_name}`} size={38} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{m.first_name} {m.last_name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.member_number}</div>
                </div>
                {selected.includes(m.id) && <Check size={16} className="wa-check-icon" />}
              </button>
            ))}
          </div>
          <button className="btn btn-primary wa-send-btn" onClick={handleCreate} disabled={!name.trim() || creating}>
            {creating ? 'Création…' : `Créer le groupe${selected.length ? ` (${selected.length + 1} membres)` : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   CHAT MESSAGES PANEL
───────────────────────────────────────────────────────────── */
function ChatPanel({ member, conv, onBack, showToast }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);

  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const loadMessages = useCallback(() => {
    if (!conv) return;
    let params = '';
    if (conv.type === 'group') {
      params = `?group_id=${conv.id}`;
    } else if (conv.type === 'dm') {
      params = `?member_id=${member.id}&receiver_id=${conv.id}`;
    } else {
      params = '';
    }
    api.getDiscussion(params)
      .then(d => setMessages(Array.isArray(d) ? d : []))
      .catch(err => console.error(err));
  }, [conv, member.id]);

  useEffect(() => {
    setMessages([]);
    loadMessages();
    const interval = setInterval(loadMessages, 4000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(e) {
    if (e) e.preventDefault();
    if (!input.trim() && !attachment && !audioBlob) return;

    const fd = new FormData();
    fd.append('member_id', member.id);
    if (conv.type === 'group') fd.append('group_id', conv.id);
    if (conv.type === 'dm') fd.append('receiver_id', conv.id);
    if (input.trim()) fd.append('message', input.trim());
    if (attachment) fd.append('file', attachment);
    else if (audioBlob) {
      fd.append('file', audioBlob, 'voicenote.webm');
      fd.append('attachment_type', 'voice');
    }

    try {
      const res = await api.postDiscussion(fd);
      if (res.error) { showToast(res.error, 'error'); return; }
      setInput('');
      setAttachment(null);
      setAudioBlob(null);
      loadMessages();
    } catch { showToast("Erreur d'envoi.", 'error'); }
  }

  async function toggleRecording() {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];
        mediaRecorderRef.current.ondataavailable = e => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };
        mediaRecorderRef.current.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          setAudioBlob(blob);
          stream.getTracks().forEach(t => t.stop());
        };
        mediaRecorderRef.current.start();
        setIsRecording(true);
      } catch { showToast("Erreur d'accès au microphone.", 'error'); }
    }
  }

  async function deleteMsg(msgId) {
    if (!window.confirm('Supprimer ce message ?')) return;
    try {
      await api.deleteDiscussionMessage(msgId);
      loadMessages();
    } catch { showToast('Erreur de suppression.', 'error'); }
  }

  if (!conv) return null;

  return (
    <div className="wa-chat-panel">
      {/* Header */}
      <div className="wa-chat-header">
        <button className="wa-icon-btn wa-back-btn" onClick={onBack}><ArrowLeft size={20} /></button>
        <Avatar
          src={conv.photo ? getMediaUrl(conv.photo) : null}
          name={conv.name}
          size={40}
        />
        <div className="wa-chat-header-info">
          <div className="wa-chat-name">{conv.name}</div>
          <div className="wa-chat-sub">
            {conv.type === 'group' ? `${conv.memberCount || ''} membres` : conv.memberNumber || 'Discussion privée'}
          </div>
        </div>
        <div className="wa-header-actions">
          <button className="wa-icon-btn"><MoreVertical size={18} /></button>
        </div>
      </div>

      {/* Messages */}
      <div className="wa-messages-area">
        {messages.length === 0 ? (
          <div className="wa-empty-chat">
            <MessageSquare size={40} opacity={0.3} />
            <p>Aucun message. Démarrez la conversation !</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isOwn = msg.member_id === member.id;
            const senderPhotoUrl = msg.sender_photo ? getMediaUrl(msg.sender_photo) : null;
            const mediaUrl = msg.attachment_path ? getMediaUrl(msg.attachment_path) : null;
            const showAvatar = !isOwn && (idx === 0 || messages[idx - 1].member_id !== msg.member_id);
            const showSenderName = !isOwn && conv.type === 'group' && showAvatar;

            return (
              <div key={msg.id} className={`wa-msg-row ${isOwn ? 'own' : ''}`}>
                {!isOwn && (
                  <div className="wa-msg-avatar-col">
                    {showAvatar ? <Avatar src={senderPhotoUrl} name={msg.sender_name} size={28} /> : <div style={{ width: 28 }} />}
                  </div>
                )}
                <div className={`wa-bubble ${isOwn ? 'wa-bubble-own' : 'wa-bubble-other'}`}>
                  {showSenderName && (
                    <div className="wa-bubble-sender" style={{ color: stringToColor(msg.sender_name) }}>
                      {msg.sender_name}
                    </div>
                  )}
                  {msg.message && <p className="wa-bubble-text">{msg.message}</p>}
                  {mediaUrl && (
                    <div className="wa-bubble-media">
                      {msg.attachment_type === 'photo' && (
                        <img src={mediaUrl} alt="photo" className="wa-media-img" onClick={() => window.open(mediaUrl, '_blank')} />
                      )}
                      {msg.attachment_type === 'video' && (
                        <video src={mediaUrl} controls className="wa-media-video" />
                      )}
                      {msg.attachment_type === 'voice' && (
                        <audio src={mediaUrl} controls className="wa-media-audio" />
                      )}
                      {msg.attachment_type === 'document' && (
                        <a href={mediaUrl} target="_blank" rel="noreferrer" className="wa-media-doc">
                          <File size={18} />
                          <span>{msg.attachment_name}</span>
                        </a>
                      )}
                    </div>
                  )}
                  <div className="wa-bubble-footer">
                    <span className="wa-bubble-time">{timeAgo(msg.sent_at)}</span>
                    {isOwn && <CheckCheck size={13} className="wa-bubble-check" />}
                    {(isOwn || member.is_bureau) && (
                      <button className="wa-delete-btn" onClick={() => deleteMsg(msg.id)} title="Supprimer">
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Attachment preview */}
      {(attachment || audioBlob) && (
        <div className="wa-attachment-preview">
          <File size={14} />
          <span>{attachment ? attachment.name : 'Note vocale enregistrée'}</span>
          <button className="wa-icon-btn" style={{ marginLeft: 'auto' }} onClick={() => { setAttachment(null); setAudioBlob(null); }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Input bar */}
      <form className="wa-input-bar" onSubmit={sendMessage}>
        <input type="file" ref={fileInputRef} onChange={e => setAttachment(e.target.files[0] || null)} style={{ display: 'none' }} />
        <button type="button" className="wa-icon-btn" onClick={() => fileInputRef.current?.click()} title="Joindre">
          <Paperclip size={20} />
        </button>
        <button
          type="button"
          className={`wa-icon-btn ${isRecording ? 'recording' : ''}`}
          onClick={toggleRecording}
          title={isRecording ? "Arrêter" : "Note vocale"}
        >
          {isRecording ? <Square size={20} /> : <Mic size={20} />}
        </button>
        <input
          className="wa-text-input"
          placeholder={isRecording ? '🔴 Enregistrement…' : 'Tapez un message…'}
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={isRecording}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
        />
        <button type="submit" className={`wa-send-fab ${(input.trim() || attachment || audioBlob) ? 'active' : ''}`}>
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN DISCUSSION VIEW
───────────────────────────────────────────────────────────── */
export function DiscussionView({ member, showToast }) {
  const [tab, setTab] = useState('chats'); // 'chats' | 'statuses'
  const [groups, setGroups] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [activeConv, setActiveConv] = useState(null); // { id, type, name, photo, ... }
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showDMPicker, setShowDMPicker] = useState(false);

  // Load groups
  function loadGroups() {
    api.getChatGroups()
      .then(d => setGroups(Array.isArray(d) ? d : []))
      .catch(() => {});
  }

  // Load statuses
  function loadStatuses() {
    api.getStatuses()
      .then(d => setStatuses(Array.isArray(d) ? d : []))
      .catch(() => {});
  }

  // Load all members for DM picker
  function loadMembers() {
    api.getMembers()
      .then(d => setAllMembers(Array.isArray(d) ? d : []))
      .catch(() => {});
  }

  useEffect(() => {
    loadGroups();
    loadStatuses();
    loadMembers();
    const i1 = setInterval(loadGroups, 10000);
    const i2 = setInterval(loadStatuses, 30000);
    return () => { clearInterval(i1); clearInterval(i2); };
  }, []);

  // Build conversation list
  const generalConv = {
    id: 'general',
    type: 'general',
    name: '🌐 Discussion Générale',
    photo: null,
    lastMsg: 'Canal officiel du club C-TECH',
    lastTime: null
  };

  const groupConvs = groups.map(g => ({
    id: g.id,
    type: 'group',
    name: g.name,
    photo: g.icon_path,
    lastMsg: g.description || `${g.member_count} membres`,
    lastTime: g.created_at,
    memberCount: g.member_count
  }));

  const allConvs = [generalConv, ...groupConvs];

  const filteredConvs = allConvs.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMembers = allMembers.filter(m =>
    m.id !== member.id &&
    (`${m.first_name} ${m.last_name}`).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="wa-container">
      {/* ── SIDEBAR ── */}
      <div className={`wa-sidebar ${activeConv ? 'wa-sidebar-hidden' : ''}`}>
        {/* Sidebar Header */}
        <div className="wa-sidebar-header">
          <Avatar
            src={member.photo_path ? getMediaUrl(member.photo_path) : null}
            name={`${member.first_name} ${member.last_name}`}
            size={40}
          />
          <span className="wa-sidebar-title">Messages</span>
          <div className="wa-sidebar-actions">
            <button className="wa-icon-btn" title="Nouveau groupe" onClick={() => setShowCreateGroup(true)}>
              <Users size={18} />
            </button>
            <button className="wa-icon-btn" title="Nouveau message privé" onClick={() => setShowDMPicker(true)}>
              <Plus size={18} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="wa-tabs">
          <button className={`wa-tab ${tab === 'chats' ? 'active' : ''}`} onClick={() => setTab('chats')}>
            <MessageSquare size={15} /> Discussions
          </button>
          <button className={`wa-tab ${tab === 'statuses' ? 'active' : ''}`} onClick={() => setTab('statuses')}>
            <Camera size={15} /> Statuts
          </button>
        </div>

        {/* Search */}
        {tab === 'chats' && (
          <div className="wa-search-bar">
            <Search size={14} className="wa-search-icon" />
            <input
              className="wa-search-input"
              placeholder="Rechercher une conversation…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        )}

        {/* Content */}
        <div className="wa-sidebar-body">
          {tab === 'chats' && (
            <>
              {filteredConvs.map(conv => (
                <ConvItem
                  key={`${conv.type}-${conv.id}`}
                  conv={conv}
                  isActive={activeConv?.id === conv.id && activeConv?.type === conv.type}
                  onClick={() => setActiveConv(conv)}
                />
              ))}

              {/* DM contacts */}
              {searchQuery && filteredMembers.length > 0 && (
                <>
                  <div className="wa-section-title">Membres</div>
                  {filteredMembers.map(m => (
                    <ConvItem
                      key={`dm-${m.id}`}
                      conv={{
                        id: m.id, type: 'dm',
                        name: `${m.first_name} ${m.last_name}`,
                        photo: m.photo_path,
                        lastMsg: m.member_number,
                        memberNumber: m.member_number
                      }}
                      isActive={activeConv?.id === m.id && activeConv?.type === 'dm'}
                      onClick={() => setActiveConv({ id: m.id, type: 'dm', name: `${m.first_name} ${m.last_name}`, photo: m.photo_path, memberNumber: m.member_number })}
                    />
                  ))}
                </>
              )}

              {filteredConvs.length === 0 && !searchQuery && (
                <div className="wa-empty-list">
                  <MessageSquare size={36} opacity={0.3} />
                  <p>Aucune conversation</p>
                  <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => setShowCreateGroup(true)}>
                    <Plus size={15} /> Créer un groupe
                  </button>
                </div>
              )}
            </>
          )}

          {tab === 'statuses' && (
            <StatusBar statuses={statuses} member={member} onPost={loadStatuses} />
          )}
        </div>
      </div>

      {/* ── CHAT PANEL ── */}
      <div className={`wa-main ${activeConv ? 'wa-main-active' : ''}`}>
        {activeConv ? (
          <ChatPanel
            key={`${activeConv.type}-${activeConv.id}`}
            member={member}
            conv={activeConv}
            onBack={() => setActiveConv(null)}
            showToast={showToast}
          />
        ) : (
          <div className="wa-welcome">
            <div className="wa-welcome-icon">
              <MessageSquare size={64} />
            </div>
            <h2>C-TECH Chat</h2>
            <p>Sélectionnez une conversation dans la liste ou créez un nouveau groupe pour commencer.</p>
            <div className="wa-welcome-actions">
              <button className="btn btn-primary" onClick={() => setActiveConv(generalConv)}>
                <MessageSquare size={15} /> Discussion Générale
              </button>
              <button className="btn btn-secondary" onClick={() => setShowCreateGroup(true)}>
                <Users size={15} /> Nouveau Groupe
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── DM Picker Modal ── */}
      {showDMPicker && (
        <div className="wa-modal-overlay" onClick={() => setShowDMPicker(false)}>
          <div className="wa-modal" onClick={e => e.stopPropagation()} style={{ width: 380, maxWidth: '95vw' }}>
            <div className="wa-modal-header">
              <button className="wa-icon-btn" onClick={() => setShowDMPicker(false)}><X size={18} /></button>
              <span>Nouveau message privé</span>
            </div>
            <div className="wa-modal-body">
              <div className="wa-search-wrapper">
                <Search size={14} className="wa-search-icon" />
                <input className="wa-search-input" placeholder="Rechercher un membre…" autoFocus />
              </div>
              <div className="wa-member-list">
                {allMembers.filter(m => m.id !== member.id).map(m => (
                  <button key={m.id} className="wa-member-item" onClick={() => {
                    setActiveConv({ id: m.id, type: 'dm', name: `${m.first_name} ${m.last_name}`, photo: m.photo_path, memberNumber: m.member_number });
                    setShowDMPicker(false);
                  }}>
                    <Avatar src={m.photo_path ? getMediaUrl(m.photo_path) : null} name={`${m.first_name} ${m.last_name}`} size={40} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{m.first_name} {m.last_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.member_number}</div>
                    </div>
                    <ChevronRight size={16} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Create Group Modal ── */}
      {showCreateGroup && (
        <CreateGroupModal
          member={member}
          members={allMembers}
          onCreated={loadGroups}
          onClose={() => setShowCreateGroup(false)}
        />
      )}
    </div>
  );
}
