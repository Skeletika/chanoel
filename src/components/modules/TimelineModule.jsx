import React, { useState, useEffect } from 'react';
import { Plus, Heart, Star, Smile, Sun, Loader } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCouple } from '../../context/CoupleContext';

const TimelineModule = () => {
    const { coupleData } = useCouple();
    const [events, setEvents] = useState([]);
    const [showAdd, setShowAdd] = useState(false);
    const [newEvent, setNewEvent] = useState({ title: '', date: '', emotion: 'heart', description: '' });
    const [loading, setLoading] = useState(true);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        if (coupleData?.couple?.id) {
            fetchEvents();
        }
    }, [coupleData?.couple?.id]);

    const fetchEvents = async () => {
        try {
            const { data, error } = await supabase
                .from('timeline_events')
                .select('*')
                .eq('couple_id', coupleData.couple.id)
                .order('date', { ascending: false });

            if (error) throw error;
            setEvents(data || []);
        } catch (error) {
            console.error('Error fetching timeline events:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveEvent = async (e) => {
        e.preventDefault();
        if (!newEvent.title || !newEvent.date || !coupleData?.couple?.id) return;

        try {
            if (editingId) {
                // Update existing event
                const { data, error } = await supabase
                    .from('timeline_events')
                    .update({
                        title: newEvent.title,
                        date: newEvent.date,
                        emotion: newEvent.emotion,
                        description: newEvent.description
                    })
                    .eq('id', editingId)
                    .select()
                    .single();

                if (error) throw error;
                setEvents(events.map(ev => ev.id === editingId ? data : ev).sort((a, b) => new Date(b.date) - new Date(a.date)));
                setEditingId(null);
            } else {
                // Create new event
                const { data, error } = await supabase
                    .from('timeline_events')
                    .insert([{
                        couple_id: coupleData.couple.id,
                        title: newEvent.title,
                        date: newEvent.date,
                        emotion: newEvent.emotion,
                        description: newEvent.description
                    }])
                    .select()
                    .single();

                if (error) throw error;
                setEvents([data, ...events].sort((a, b) => new Date(b.date) - new Date(a.date)));
            }
            setShowAdd(false);
            setNewEvent({ title: '', date: '', emotion: 'heart', description: '' });
        } catch (error) {
            console.error('Error saving timeline event:', error);
        }
    };

    const deleteEvent = async (id) => {
        try {
            const { error } = await supabase
                .from('timeline_events')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setEvents(events.filter(ev => ev.id !== id));
            if (editingId === id) {
                setEditingId(null);
                setNewEvent({ title: '', date: '', emotion: 'heart', description: '' });
                setShowAdd(false);
            }
            setConfirmDeleteId(null);
        } catch (error) {
            console.error('Error deleting event:', error);
        }
    };

    const startEdit = (event) => {
        setNewEvent({
            title: event.title,
            date: event.date,
            emotion: event.emotion,
            description: event.description || ''
        });
        setEditingId(event.id);
        setShowAdd(true);
    };

    const getIcon = (emotion) => {
        switch (emotion) {
            case 'heart': return <Heart size={16} fill="var(--color-accent)" color="var(--color-accent)" />;
            case 'star': return <Star size={16} fill="#fdcb6e" color="#fdcb6e" />;
            case 'smile': return <Smile size={16} color="#0984e3" />;
            case 'sun': return <Sun size={16} color="#e17055" />;
            default: return <Heart size={16} />;
        }
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><Loader className="animate-spin" /></div>;

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                <button
                    onClick={() => setShowAdd(!showAdd)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        fontSize: '0.8rem', color: 'var(--color-primary)',
                        padding: '0.25rem 0.75rem', borderRadius: '12px',
                        border: '1px solid var(--color-border)'
                    }}
                >
                    <Plus size={14} /> Ajouter un souvenir
                </button>
            </div>

            {showAdd && (
                <form onSubmit={handleSaveEvent} style={{ marginBottom: '1rem', padding: '1rem', background: 'var(--color-bg)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <h4 style={{ margin: 0, fontSize: '0.9rem' }}>{editingId ? 'Modifier le souvenir' : 'Nouveau souvenir'}</h4>
                        <button type="button" onClick={() => { setShowAdd(false); setEditingId(null); setNewEvent({ title: '', date: '', emotion: 'heart', description: '' }); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>&times;</button>
                    </div>
                    <input
                        type="text" placeholder="Titre"
                        value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                        style={{ width: '100%', marginBottom: '0.5rem', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <input
                            type="date"
                            value={newEvent.date} onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
                            style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                        />
                        <select
                            value={newEvent.emotion} onChange={e => setNewEvent({ ...newEvent, emotion: e.target.value })}
                            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                        >
                            <option value="heart">Amour</option>
                            <option value="star">Important</option>
                            <option value="smile">Joie</option>
                            <option value="sun">Voyage</option>
                        </select>
                    </div>
                    <textarea
                        placeholder="Description..."
                        value={newEvent.description} onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)', minHeight: '60px' }}
                    />
                    <button type="submit" style={{ marginTop: '0.5rem', width: '100%', padding: '0.5rem', background: 'var(--color-primary)', color: 'white', borderRadius: '4px' }}>
                        {editingId ? 'Mettre à jour' : 'Enregistrer'}
                    </button>
                </form>
            )}

            <div style={{ flex: 1, overflow: 'auto', paddingRight: '0.5rem' }}>
                {events.map((event, index) => (
                    <div key={event.id} style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', position: 'relative', group: 'iso' }} className="timeline-item">
                        {/* Line */}
                        {index !== events.length - 1 && (
                            <div style={{
                                position: 'absolute', left: '15px', top: '30px', bottom: '-20px',
                                width: '2px', background: 'var(--color-border)'
                            }} />
                        )}

                        {/* Icon */}
                        <div style={{
                            width: '32px', height: '32px', borderRadius: '50%',
                            background: 'white', border: '2px solid var(--color-border)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            zIndex: 1, flexShrink: 0
                        }}>
                            {getIcon(event.emotion)}
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>{new Date(event.date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                <div className="event-actions" style={{ gap: '0.5rem', display: 'flex', opacity: confirmDeleteId === event.id ? 1 : 0.5 }}>
                                    {confirmDeleteId === event.id ? (
                                        <>
                                            <span style={{ fontSize: '0.8rem', marginRight: '4px', color: '#ff7675' }}>Sûr ?</span>
                                            <button onClick={() => deleteEvent(event.id)} style={{ background: '#ff7675', border: 'none', borderRadius: '4px', padding: '2px 6px', color: 'white', fontSize: '0.7rem', cursor: 'pointer' }}>Oui</button>
                                            <button onClick={() => setConfirmDeleteId(null)} style={{ background: 'var(--color-border)', border: 'none', borderRadius: '4px', padding: '2px 6px', color: 'var(--color-text)', fontSize: '0.7rem', cursor: 'pointer' }}>Non</button>
                                        </>
                                    ) : (
                                        <>
                                            <button onClick={() => startEdit(event)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--color-text)' }} title="Modifier">
                                                ✏️
                                            </button>
                                            <button onClick={() => setConfirmDeleteId(event.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} title="Supprimer">
                                                ❌
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>{event.title}</h4>
                            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>{event.description}</p>
                        </div>
                    </div>
                ))}
                <style>{`
                    .timeline-item:hover .event-actions { opacity: 1 !important; }
                `}</style>
            </div>
        </div>
    );
};

export default TimelineModule;
