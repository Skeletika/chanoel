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

    const addEvent = async (e) => {
        e.preventDefault();
        if (!newEvent.title || !newEvent.date || !coupleData?.couple?.id) return;

        try {
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
            setShowAdd(false);
            setNewEvent({ title: '', date: '', emotion: 'heart', description: '' });
        } catch (error) {
            console.error('Error adding timeline event:', error);
        }
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
                <form onSubmit={addEvent} style={{ marginBottom: '1rem', padding: '1rem', background: 'var(--color-bg)', borderRadius: '8px' }}>
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
                    <button type="submit" style={{ marginTop: '0.5rem', width: '100%', padding: '0.5rem', background: 'var(--color-primary)', color: 'white', borderRadius: '4px' }}>Enregistrer</button>
                </form>
            )}

            <div style={{ flex: 1, overflow: 'auto', paddingRight: '0.5rem' }}>
                {events.map((event, index) => (
                    <div key={event.id} style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', position: 'relative' }}>
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
                        <div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                {new Date(event.date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </div>
                            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>{event.title}</h4>
                            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>{event.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TimelineModule;
