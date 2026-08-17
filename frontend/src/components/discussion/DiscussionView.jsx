import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Paperclip, Mic, Square, File, Trash2, X } from 'lucide-react';
import { api } from '../../services/api';
import { fmt } from '../../constants/data';
import { getMediaUrl } from '../members/VirtualCard';

export function DiscussionView({ member, showToast }) {
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);

  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);

  function loadChat() {
    api.getDiscussion()
      .then(d => setChatMessages(Array.isArray(d) ? d : []))
      .catch(err => console.error(err));
  }

  useEffect(() => {
    loadChat();
    const interval = setInterval(loadChat, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  async function sendChat(e) {
    if (e) e.preventDefault();
    if (!chatInput.trim() && !attachment && !audioBlob) return;

    const fd = new FormData();
    fd.append('member_id', member.id);
    if (chatInput.trim()) fd.append('message', chatInput.trim());

    if (attachment) {
      fd.append('file', attachment);
    } else if (audioBlob) {
      fd.append('file', audioBlob, 'voicenote.webm');
      fd.append('attachment_type', 'voice');
    }

    try {
      const res = await api.postDiscussion(fd);
      if (res.error) {
        showToast(res.error, 'error');
        return;
      }
      setChatInput('');
      setAttachment(null);
      setAudioBlob(null);
      loadChat();
    } catch (err) {
      showToast('Erreur d\'envoi.', 'error');
    }
  }

  async function toggleRecording() {
    if (isRecording) {
      mediaRecorder.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder.current = new MediaRecorder(stream);
        audioChunks.current = [];

        mediaRecorder.current.ondataavailable = e => {
          if (e.data.size > 0) audioChunks.current.push(e.data);
        };

        mediaRecorder.current.onstop = () => {
          const blob = new Blob(audioChunks.current, { type: 'audio/webm' });
          setAudioBlob(blob);
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.current.start();
        setIsRecording(true);
      } catch (err) {
        showToast('Erreur d\'accès au microphone.', 'error');
      }
    }
  }

  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) setAttachment(file);
  }

  async function deleteMsg(msgId) {
    if (!window.confirm("Supprimer ce message ?")) return;
    try {
      const res = await api.deleteDiscussionMessage(msgId);
      if (res.error) {
        showToast(res.error, 'error');
        return;
      }
      loadChat();
    } catch (err) {
      showToast('Erreur de suppression.', 'error');
    }
  }

  return (
    <div className="card" style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 200px)', minHeight: 400 }}>
      <div className="card-header">
        <div className="card-title"><MessageSquare size={16} />Discussion Club</div>
      </div>
      <div className="chat-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="chat-messages" style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {chatMessages.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24, fontSize: 13 }}>Aucun message. Démarrez la conversation !</div>
          ) : (
            chatMessages.map(msg => {
              const isOwn = msg.member_id === member.id;
              const senderPhotoUrl = getMediaUrl(msg.sender_photo);
              const mediaUrl = getMediaUrl(msg.attachment_path);

              return (
                <div key={msg.id} className={`chat-message ${isOwn ? 'own' : ''}`} style={{ display: 'flex', gap: 12, marginBottom: 16, flexDirection: isOwn ? 'row-reverse' : 'row' }}>
                  <div className="avatar" style={{ width: 36, height: 36, flexShrink: 0, backgroundImage: senderPhotoUrl ? `url(${senderPhotoUrl})` : 'none', backgroundSize: 'cover', display: 'flex', alignItems: 'center', justifyContent: 'center', background: senderPhotoUrl ? 'none' : 'var(--bg-secondary)' }}>
                    {!senderPhotoUrl && (msg.sender_name || '?')[0]}
                  </div>
                  <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start' }}>
                    {!isOwn && <div className="chat-sender" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>{msg.sender_name}</div>}
                    <div className={`chat-bubble ${isOwn ? 'chat-bubble-own' : 'chat-bubble-other'}`} style={{ padding: '8px 12px', borderRadius: 12, background: isOwn ? 'var(--accent-primary)' : 'var(--bg-secondary)', color: isOwn ? '#fff' : 'var(--text-primary)', wordBreak: 'break-word' }}>
                      {msg.message && <div style={{ whiteSpace: 'pre-wrap' }}>{msg.message}</div>}

                      {mediaUrl && (
                        <div style={{ marginTop: msg.message ? 8 : 0 }}>
                          {msg.attachment_type === 'photo' && <img src={mediaUrl} alt="attachment" style={{ maxWidth: '100%', borderRadius: 8, cursor: 'pointer' }} onClick={() => window.open(mediaUrl, '_blank')} />}
                          {msg.attachment_type === 'video' && <video src={mediaUrl} controls style={{ maxWidth: '100%', borderRadius: 8 }} />}
                          {msg.attachment_type === 'voice' && <audio src={mediaUrl} controls style={{ maxWidth: '100%' }} />}
                          {msg.attachment_type === 'document' && (
                            <a href={mediaUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'inherit', textDecoration: 'none', background: 'rgba(0,0,0,0.1)', padding: '6px 10px', borderRadius: 6 }}>
                              <File size={16} /> <span style={{ fontSize: 13 }}>{msg.attachment_name}</span>
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="chat-time" style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {fmt(msg.sent_at)}
                      {(isOwn || member.is_bureau) && (
                        <button onClick={() => deleteMsg(msg.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', opacity: 0.7, padding: 2 }} title="Supprimer">
                          <Trash2 size={12} />
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

        {(attachment || audioBlob) && (
          <div className="chat-attachment-preview" style={{ padding: '8px 16px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <File size={14} />
              {attachment ? attachment.name : 'Note vocale enregistrée'}
            </span>
            <button className="btn btn-icon btn-secondary" style={{ padding: 2 }} onClick={() => { setAttachment(null); setAudioBlob(null); }}>
              <X size={14} />
            </button>
          </div>
        )}

        <form onSubmit={sendChat} className="chat-input-area" style={{ padding: 12, borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="file" ref={fileInputRef} onChange={handleFileSelect} style={{ display: 'none' }} />
          <button type="button" className="btn btn-secondary btn-icon" onClick={() => fileInputRef.current?.click()} title="Joindre un fichier">
            <Paperclip size={18} />
          </button>
          <button type="button" className={`btn ${isRecording ? 'btn-danger' : 'btn-secondary'} btn-icon`} onClick={toggleRecording} title={isRecording ? "Arrêter l'enregistrement" : "Enregistrer une note vocale"}>
            {isRecording ? <Square size={18} /> : <Mic size={18} />}
          </button>
          <input
            className="form-input"
            placeholder={isRecording ? "Enregistrement audio en cours..." : "Tapez votre message..."}
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            disabled={isRecording}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary btn-icon" disabled={!chatInput.trim() && !attachment && !audioBlob}>
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
