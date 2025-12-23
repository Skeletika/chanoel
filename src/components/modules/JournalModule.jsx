import React, { useState, useEffect } from 'react';
import { BookOpen, Smile, Frown, Meh, Save, ChevronDown, ChevronUp, Loader } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCouple } from '../../context/CoupleContext';

import { useRealtime } from '../../hooks/useRealtime';

const JournalModule = () => {
    const { coupleData } = useCouple();
    const [entries, setEntries] = useState([]);
    const [newEntry, setNewEntry] = useState('');
    const [mood, setMood] = useState('neutral');
    const [expandedEntry, setExpandedEntry] = useState(null);
    const [loading, setLoading] = useState(true);

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

    const saveEntry = async () => {
        if (!newEntry.trim() || !coupleData?.couple?.id) return;

        try {
            const { data, error } = await supabase
                .from('journal_entries')
                .insert([{
                    couple_id: coupleData.couple.id,
                    text: newEntry,
                    mood,
                    date: new Date().toISOString()
                }])
                .select()
                .single();

            if (error) throw error;
            setEntries([data, ...entries]);
            setNewEntry('');
            setMood('neutral');
        } catch (error) {
            console.error('Error saving journal entry:', error);
        }
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
            <div style={{ marginBottom: '1rem', background: 'var(--color-bg)', padding: '1rem', borderRadius: '12px' }}>
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
                    <button
                        onClick={saveEntry}
                        disabled={!newEntry.trim()}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            background: 'var(--color-primary)', color: 'white',
                            padding: '0.5rem 1rem', borderRadius: '20px',
                            opacity: !newEntry.trim() ? 0.5 : 1
                        }}
                    >
                        <Save size={16} /> Enregistrer
                    </button>
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
                                cursor: 'pointer',
                                transition: 'background 0.2s'
                            }}
                            onClick={() => setExpandedEntry(expandedEntry === entry.id ? null : entry.id)}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                    {new Date(entry.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </div>
                                {getMoodIcon(entry.mood)}
                            </div>
                            <div style={{
                                fontSize: '0.9rem',
                                lineHeight: '1.4',
                                maxHeight: expandedEntry === entry.id ? 'none' : '40px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: expandedEntry === entry.id ? 'none' : 2,
                                WebkitBoxOrient: 'vertical'
                            }}>
                                {entry.text}
                            </div>
                            {entry.text.length > 50 && (
                                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.25rem', color: 'var(--color-text-muted)' }}>
                                    {expandedEntry === entry.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default JournalModule;
