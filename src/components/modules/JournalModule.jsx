import React, { useState, useEffect } from 'react';
import { BookOpen, Smile, Frown, Meh, Save, ChevronDown, ChevronUp, Loader } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCouple } from '../../context/CoupleContext';

import { useRealtime } from '../../hooks/useRealtime';

const JournalModule = () => {
    const { coupleData, session } = useCouple();
    const [entries, setEntries] = useState([]);
    const [newEntry, setNewEntry] = useState('');
    const [mood, setMood] = useState('neutral');
    const [editingId, setEditingId] = useState(null);
    const [expandedEntry, setExpandedEntry] = useState(null);
    const [loading, setLoading] = useState(true);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    useRealtime('journal_entries', () => {
        fetchEntries();
    });

    useEffect(() => {
        if (coupleData?.couple?.id) {
            fetchEntries();
        }
    }, [coupleData?.couple?.id]);

    const fetchEntries = async () => {
        try {
            const { data, error } = await supabase
                .from('journal_entries')
                .select('*')
                .eq('couple_id', coupleData.couple.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setEntries(data || []);
        } catch (error) {
            console.error('Error fetching journal entries:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveEntry = async () => {
        if (!newEntry.trim() || !coupleData?.couple?.id) return;

        try {
            if (editingId) {
                // Update
                const { data, error } = await supabase
                    .from('journal_entries')
                    .update({
                        text: newEntry,
                        mood,
                        // date: existing entry date is usually kept, or updated? User usually wants to just fix a typo. Let's keep original date unless user wants to change it (not in UI). Or update 'updated_at'?
                        // Keeping original date.
                    })
                    .eq('id', editingId)
                    .select()
                    .single();

                if (error) throw error;
                setEntries(entries.map(e => e.id === editingId ? data : e));
                setEditingId(null);
            } else {
                // Insert
                const { data, error } = await supabase
                    .from('journal_entries')
                    .insert([{
                        couple_id: coupleData.couple.id,
                        user_id: session?.user?.id,
                        text: newEntry,
                        mood,
                        date: new Date().toISOString()
                    }])
                    .select()
                    .single();

                if (error) throw error;
                setEntries([data, ...entries]);
            }
            setNewEntry('');
            setMood('neutral');
        } catch (error) {
            console.error('Error saving journal entry:', error);
        }
    };

    const deleteEntry = async (id) => {
        try {
            const { error } = await supabase.from('journal_entries').delete().eq('id', id);
            if (error) throw error;
            setEntries(entries.filter(e => e.id !== id));
            if (editingId === id) {
                setEditingId(null);
                setNewEntry('');
            }
            setConfirmDeleteId(null);
        } catch (error) {
            console.error('Error deleting entry:', error);
        }
    };

    const startEdit = (entry) => {
        setNewEntry(entry.text);
        setMood(entry.mood);
        setEditingId(entry.id);
        // Scroll to top to see editor? 
        // Not strictly necessary but good UX if list is long.
    };

    const cancelEdit = () => {
        setEditingId(null);
        setNewEntry('');
        setMood('neutral');
    };

    const getMoodIcon = (m) => {
        switch (m) {
            case 'happy': return <Smile size={20} color="#00b894" />;
            case 'sad': return <Frown size={20} color="#636e72" />;
            case 'neutral': return <Meh size={20} color="#fdcb6e" />;
            default: return <Meh size={20} />;
        }
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><Loader className="animate-spin" /></div>;

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: '1rem', background: 'var(--color-bg)', padding: '1rem', borderRadius: '12px', border: editingId ? '2px solid var(--color-primary)' : 'none' }}>
                <textarea
                    value={newEntry}
                    onChange={(e) => setNewEntry(e.target.value)}
                    placeholder="Comment s'est passée votre journée ?"
                    style={{
                        width: '100%',
                        minHeight: '80px',
                        background: 'transparent',
                        border: 'none',
                        resize: 'none',
                        outline: 'none',
                        fontSize: '0.95rem',
                        color: 'var(--color-text)'
                    }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => setMood('happy')} style={{ opacity: mood === 'happy' ? 1 : 0.4 }}><Smile size={24} color="#00b894" /></button>
                        <button onClick={() => setMood('neutral')} style={{ opacity: mood === 'neutral' ? 1 : 0.4 }}><Meh size={24} color="#fdcb6e" /></button>
                        <button onClick={() => setMood('sad')} style={{ opacity: mood === 'sad' ? 1 : 0.4 }}><Frown size={24} color="#636e72" /></button>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {editingId && (
                            <button onClick={cancelEdit} style={{ padding: '0.5rem 1rem', borderRadius: '20px', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}>
                                Annuler
                            </button>
                        )}
                        <button
                            onClick={handleSaveEntry}
                            disabled={!newEntry.trim()}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                background: 'var(--color-primary)', color: 'white',
                                padding: '0.5rem 1rem', borderRadius: '20px',
                                opacity: !newEntry.trim() ? 0.5 : 1
                            }}
                        >
                            <Save size={16} /> {editingId ? 'Mettre à jour' : 'Enregistrer'}
                        </button>
                    </div>
                </div>
            </div>

            <div style={{ flex: 1, overflow: 'auto' }}>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <BookOpen size={16} /> Entrées précédentes
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {entries.map(entry => (
                        <div
                            key={entry.id}
                            style={{
                                padding: '0.75rem',
                                border: '1px solid var(--color-border)',
                                borderRadius: '8px',
                                cursor: 'default', // Changed to default
                                transition: 'background 0.2s',
                                position: 'relative'
                            }}
                            className="journal-entry-item"
                        // Removed onClick for expansion to avoid conflict with buttons, using explicit expand button logic if needed or just always show brief and expand logic
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {entry.user_id && (
                                        <div style={{
                                            width: '20px', height: '20px', borderRadius: '50%',
                                            backgroundImage: `url(${coupleData.personA.id === entry.user_id ? coupleData.personA.photo : coupleData.personB.photo})`,
                                            backgroundSize: 'cover',
                                            backgroundColor: coupleData.personA.id === entry.user_id ? coupleData.personA.color : coupleData.personB.color
                                        }} />
                                    )}
                                    {new Date(entry.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    {getMoodIcon(entry.mood)}
                                    <div className="entry-actions" style={{ display: 'flex', gap: '0.25rem', opacity: confirmDeleteId === entry.id ? 1 : 0.5 }}>
                                        {confirmDeleteId === entry.id ? (
                                            <>
                                                <span style={{ fontSize: '0.8rem', marginRight: '4px', color: '#ff7675' }}>Sûr ?</span>
                                                <button onClick={(e) => { e.stopPropagation(); deleteEntry(entry.id); }} style={{ background: '#ff7675', border: 'none', borderRadius: '4px', padding: '2px 6px', color: 'white', fontSize: '0.7rem', cursor: 'pointer' }}>Oui</button>
                                                <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }} style={{ background: 'var(--color-border)', border: 'none', borderRadius: '4px', padding: '2px 6px', color: 'var(--color-text)', fontSize: '0.7rem', cursor: 'pointer' }}>Non</button>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={(e) => { e.stopPropagation(); startEdit(entry); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }} title="Modifier">✏️</button>
                                                <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(entry.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }} title="Supprimer">❌</button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div
                                style={{
                                    fontSize: '0.9rem',
                                    lineHeight: '1.4',
                                    maxHeight: expandedEntry === entry.id ? 'none' : '40px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    display: '-webkit-box',
                                    WebkitLineClamp: expandedEntry === entry.id ? 'none' : 2,
                                    WebkitBoxOrient: 'vertical',
                                    cursor: 'pointer' // Click text to expand
                                }}
                                onClick={() => setExpandedEntry(expandedEntry === entry.id ? null : entry.id)}
                            >
                                {entry.text}
                            </div>
                            {entry.text.length > 50 && (
                                <div
                                    style={{ display: 'flex', justifyContent: 'center', marginTop: '0.25rem', color: 'var(--color-text-muted)', cursor: 'pointer' }}
                                    onClick={() => setExpandedEntry(expandedEntry === entry.id ? null : entry.id)}
                                >
                                    {expandedEntry === entry.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </div>
                            )}
                        </div>
                    ))}
                    <style>{`
                        .journal-entry-item:hover .entry-actions { opacity: 1 !important; }
                    `}</style>
                </div>
            </div>
        </div>
    );
};

export default JournalModule;
