import React, { useState, useEffect } from 'react';
import { Plus, X, Check, Trash2, Edit2, Pin } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCouple } from '../../context/CoupleContext';

const COLORS = {
    yellow: { bg: '#fef9c3', border: '#fde047', text: '#854d0e' },
    pink: { bg: '#fce7f3', border: '#fbcfe8', text: '#9d174d' },
    blue: { bg: '#e0f2fe', border: '#bae6fd', text: '#075985' },
    green: { bg: '#dcfce7', border: '#86efac', text: '#166534' },
    purple: { bg: '#f3e8ff', border: '#d8b4fe', text: '#6b21a8' }
};

const NoteItem = ({ note, coupleData, onDelete, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(note.content);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const theme = COLORS[note.color] || COLORS.yellow;
    const author = note.user_id === coupleData.personA.id ? coupleData.personA : coupleData.personB;

    const handleSave = () => {
        if (editContent.trim() !== note.content) {
            onUpdate(note.id, { content: editContent });
        }
        setIsEditing(false);
    };

    return (
        <div style={{
            backgroundColor: theme.bg,
            border: `1px solid ${theme.border}`,
            borderRadius: '8px', // Slightly rounded, but square-ish for post-it feel
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            boxShadow: '2px 2px 5px rgba(0,0,0,0.05)',
            position: 'relative',
            minHeight: '150px',
            transition: 'transform 0.2s',
            fontFamily: 'var(--font-sans)' // Or handwriting font if we had one
        }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
            {/* Pin Indicator */}
            {note.is_pinned && <Pin size={12} style={{ position: 'absolute', top: '8px', left: '8px', color: theme.text, opacity: 0.5, transform: 'rotate(45deg)' }} fill="currentColor" />}

            {/* Actions */}
            <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '4px', opacity: 0.6 }}>
                {!isEditing && (
                    <>
                        <button onClick={() => setIsEditing(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.text, padding: 0 }}>
                            <Edit2 size={14} />
                        </button>
                        {confirmDelete ? (
                            <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.8)', borderRadius: '4px', padding: '2px' }}>
                                <button onClick={() => onDelete(note.id)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}><Check size={14} /></button>
                                <button onClick={() => setConfirmDelete(false)} style={{ color: theme.text, border: 'none', background: 'none', cursor: 'pointer' }}><X size={14} /></button>
                            </div>
                        ) : (
                            <button onClick={() => setConfirmDelete(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.text, padding: 0 }}>
                                <Trash2 size={14} />
                            </button>
                        )}
                    </>
                )}
            </div>

            {/* Content */}
            <div style={{ flex: 1, color: theme.text, fontSize: '0.95rem', lineHeight: '1.4', marginTop: '1rem' }}>
                {isEditing ? (
                    <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        style={{
                            width: '100%', height: '100%', background: 'rgba(255,255,255,0.3)',
                            border: 'none', resize: 'none', outline: 'none',
                            fontFamily: 'inherit', fontSize: 'inherit', color: 'inherit',
                            borderRadius: '4px', padding: '4px'
                        }}
                        autoFocus
                        onBlur={handleSave}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSave(); } }}
                    />
                ) : (
                    <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{note.content}</div>
                )}
            </div>

            {/* Footer / Attribution */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '0.5rem' }}>
                <span style={{ fontSize: '0.7rem', color: theme.text, opacity: 0.7 }}>
                    {new Date(note.created_at).toLocaleDateString()}
                </span>
                <div
                    title={author.name}
                    style={{
                        width: '20px', height: '20px', borderRadius: '50%',
                        backgroundColor: author.color,
                        backgroundImage: `url(${author.photo})`,
                        backgroundSize: 'cover',
                        border: `1px solid rgba(0,0,0,0.1)`
                    }}
                />
            </div>
        </div>
    );
};

const NotesModule = () => {
    const { coupleData, session } = useCouple();
    const [notes, setNotes] = useState([]);
    const [showAdd, setShowAdd] = useState(false);
    const [newNote, setNewNote] = useState({ content: '', color: 'yellow' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (coupleData?.couple?.id) {
            fetchNotes();

            // Realtime Subscription
            const channel = supabase
                .channel('notes_changes')
                .on('postgres_changes',
                    { event: '*', schema: 'public', table: 'notes', filter: `couple_id=eq.${coupleData.couple.id}` },
                    (payload) => {
                        if (payload.eventType === 'INSERT') {
                            setNotes(prev => {
                                if (prev.some(n => n.id === payload.new.id)) return prev;
                                return [payload.new, ...prev];
                            });
                        } else if (payload.eventType === 'DELETE') {
                            setNotes(prev => prev.filter(n => n.id !== payload.old.id));
                        } else if (payload.eventType === 'UPDATE') {
                            setNotes(prev => prev.map(n => n.id === payload.new.id ? payload.new : n));
                        }
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [coupleData?.couple?.id]);

    const fetchNotes = async () => {
        try {
            const { data, error } = await supabase
                .from('notes')
                .select('*')
                .eq('couple_id', coupleData.couple.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setNotes(data || []);
        } catch (err) {
            console.error('Error fetching notes:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newNote.content.trim()) return;

        try {
            const { data, error } = await supabase
                .from('notes')
                .insert([{
                    couple_id: coupleData.couple.id,
                    user_id: session.user.id,
                    content: newNote.content,
                    color: newNote.color
                }])
                .select()
                .single();

            if (error) throw error;

            // Manual Refrence Upgrade: Update state immediately
            setNotes(prev => [data, ...prev]);

            setShowAdd(false);
            setNewNote({ content: '', color: 'yellow' });
        } catch (err) {
            console.error('Error creating note:', err);
        }
    };

    const handleDelete = async (id) => {
        try {
            // Optimistic Update
            setNotes(prev => prev.filter(n => n.id !== id));

            const { error } = await supabase.from('notes').delete().eq('id', id);
            if (error) {
                // Revert if error (simple refetch for safety)
                fetchNotes();
                throw error;
            }
        } catch (err) {
            console.error('Error deleting note:', err);
        }
    };

    const handleUpdate = async (id, updates) => {
        try {
            // Optimistic Update
            setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));

            const { error } = await supabase.from('notes').update(updates).eq('id', id);
            if (error) {
                fetchNotes();
                throw error;
            }
        } catch (err) {
            console.error('Error updating note:', err);
        }
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            {/* Header / Actions */}
            <div style={{ paddingBottom: '0.5rem', marginBottom: '0.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowAdd(!showAdd)} style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.25rem 0.75rem', borderRadius: '12px',
                    background: 'var(--color-primary)', color: 'white',
                    border: 'none', cursor: 'pointer', fontSize: '0.8rem'
                }}>
                    <Plus size={14} /> Nouvelle Note
                </button>
            </div>

            {/* Add Form */}
            {showAdd && (
                <div style={{ marginBottom: '1rem', padding: '1rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', animation: 'fadeIn 0.2s' }}>
                    <textarea
                        placeholder="Écrivez un petit mot..."
                        value={newNote.content}
                        onChange={e => setNewNote({ ...newNote, content: e.target.value })}
                        style={{ width: '100%', minHeight: '60px', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)', marginBottom: '0.5rem', background: 'var(--color-bg)' }}
                        autoFocus
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {Object.keys(COLORS).map(color => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => setNewNote({ ...newNote, color })}
                                    style={{
                                        width: '24px', height: '24px', borderRadius: '50%',
                                        backgroundColor: COLORS[color].border, // Use darker border color for visibility
                                        border: `2px solid ${newNote.color === color ? 'var(--color-primary)' : 'transparent'}`,
                                        cursor: 'pointer', boxSizing: 'border-box',
                                        transition: 'transform 0.1s',
                                        transform: newNote.color === color ? 'scale(1.1)' : 'scale(1)'
                                    }}
                                    title={color}
                                />
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}>Annuler</button>
                            <button onClick={handleCreate} style={{ background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 12px', cursor: 'pointer', fontSize: '0.8rem' }}>Ajouter</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Grid */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: '1rem',
                padding: '0.2rem'
            }}>
                {notes.map(note => (
                    <NoteItem
                        key={note.id || `temp-${Math.random()}`} // Fallback key
                        note={note}
                        coupleData={coupleData}
                        onDelete={handleDelete}
                        onUpdate={handleUpdate}
                    />
                ))}
            </div>
            {notes.length === 0 && !loading && (
                <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '2rem' }}>
                    C'est vide ! Ajoutez une note pour votre moitié. 💌
                </div>
            )}
        </div>
    );
};

export default NotesModule;
