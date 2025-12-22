import React, { useState, useEffect } from 'react';
import { Gift, Lock, Unlock, Clock, Plus, Loader } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCouple } from '../../context/CoupleContext';

const SurprisesModule = () => {
    const { coupleData } = useCouple();
    const [surprises, setSurprises] = useState([]);
    const [showAdd, setShowAdd] = useState(false);
    const [newSurprise, setNewSurprise] = useState({ title: '', message: '', unlockDate: '' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (coupleData?.couple?.id) {
            fetchSurprises();
        }
    }, [coupleData?.couple?.id]);

    // Update timer every minute to refresh lock status visually if needed
    useEffect(() => {
        const interval = setInterval(() => {
            setSurprises(s => [...s]); // Force re-render
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    const fetchSurprises = async () => {
        try {
            const { data, error } = await supabase
                .from('surprises')
                .select('*')
                .eq('couple_id', coupleData.couple.id)
                .order('unlock_date', { ascending: true });

            if (error) throw error;
            setSurprises(data || []);
        } catch (error) {
            console.error('Error fetching surprises:', error);
        } finally {
            setLoading(false);
        }
    };

    const addSurprise = async (e) => {
        e.preventDefault();
        if (!newSurprise.title || !newSurprise.unlockDate || !coupleData?.couple?.id) return;

        try {
            const { data, error } = await supabase
                .from('surprises')
                .insert([{
                    couple_id: coupleData.couple.id,
                    title: newSurprise.title,
                    message: newSurprise.message,
                    unlock_date: new Date(newSurprise.unlockDate).toISOString()
                }])
                .select()
                .single();

            if (error) throw error;
            setSurprises([...surprises, data]);
            setShowAdd(false);
            setNewSurprise({ title: '', message: '', unlockDate: '' });
        } catch (error) {
            console.error('Error adding surprise:', error);
        }
    };

    const isLocked = (date) => {
        return new Date(date) > new Date();
    };

    const getTimeRemaining = (date) => {
        const total = Date.parse(date) - Date.parse(new Date());
        const days = Math.floor(total / (1000 * 60 * 60 * 24));
        const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
        return `${days}j ${hours}h`;
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
                    <Plus size={14} /> Préparer une surprise
                </button>
            </div>

            {showAdd && (
                <form onSubmit={addSurprise} style={{ marginBottom: '1rem', padding: '1rem', background: 'var(--color-bg)', borderRadius: '8px' }}>
                    <input
                        type="text" placeholder="Titre (visible)"
                        value={newSurprise.title} onChange={e => setNewSurprise({ ...newSurprise, title: e.target.value })}
                        style={{ width: '100%', marginBottom: '0.5rem', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                    />
                    <div style={{ marginBottom: '0.5rem' }}>
                        <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.25rem' }}>Date d'ouverture :</label>
                        <input
                            type="datetime-local"
                            value={newSurprise.unlockDate} onChange={e => setNewSurprise({ ...newSurprise, unlockDate: e.target.value })}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                        />
                    </div>
                    <textarea
                        placeholder="Message secret..."
                        value={newSurprise.message} onChange={e => setNewSurprise({ ...newSurprise, message: e.target.value })}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)', minHeight: '60px' }}
                    />
                    <button type="submit" style={{ marginTop: '0.5rem', width: '100%', padding: '0.5rem', background: 'var(--color-primary)', color: 'white', borderRadius: '4px' }}>Cacher la surprise</button>
                </form>
            )}

            <div style={{ flex: 1, overflow: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
                {surprises.map(surprise => {
                    const locked = isLocked(surprise.unlock_date);
                    return (
                        <div
                            key={surprise.id}
                            style={{
                                background: locked ? 'var(--color-bg)' : '#ffeaa7',
                                borderRadius: '12px',
                                padding: '1rem',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textAlign: 'center',
                                border: locked ? '1px dashed var(--color-border)' : 'none',
                                position: 'relative',
                                minHeight: '120px'
                            }}
                        >
                            <div style={{ marginBottom: '0.5rem', color: locked ? 'var(--color-text-muted)' : 'var(--color-primary)' }}>
                                {locked ? <Lock size={24} /> : <Gift size={24} />}
                            </div>
                            <h4 style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>{surprise.title}</h4>

                            {locked ? (
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <Clock size={12} /> {getTimeRemaining(surprise.unlock_date)}
                                </div>
                            ) : (
                                <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', fontStyle: 'italic' }}>
                                    "{surprise.message}"
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SurprisesModule;
