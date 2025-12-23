import React, { useState, useEffect } from 'react';
import { Gift, Lock, Unlock, Clock, Plus, Loader } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCouple } from '../../context/CoupleContext';

import { useRealtime } from '../../hooks/useRealtime';

const SurprisesModule = () => {
    const { coupleData, session } = useCouple();
    const [surprises, setSurprises] = useState([]);
    const [showAdd, setShowAdd] = useState(false);
    const [newSurprise, setNewSurprise] = useState({ title: '', message: '', unlockDate: '' });
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    useRealtime('surprises', () => {
        fetchSurprises();
    });

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

    const handleSaveSurprise = async (e) => {
        e.preventDefault();
        if (!newSurprise.title || !newSurprise.unlockDate || !coupleData?.couple?.id) return;

        try {
            if (editingId) {
                // Update
                const { data, error } = await supabase
                    .from('surprises')
                    .update({
                        title: newSurprise.title,
                        message: newSurprise.message,
                        unlock_date: new Date(newSurprise.unlockDate).toISOString()
                    })
                    .eq('id', editingId)
                    .select()
                    .single();

                if (error) throw error;
                setSurprises(surprises.map(s => s.id === editingId ? data : s));
                setEditingId(null);
            } else {
                // Insert
                const { data, error } = await supabase
                    .from('surprises')
                    .insert([{
                        couple_id: coupleData.couple.id,
                        user_id: session?.user?.id,
                        title: newSurprise.title,
                        message: newSurprise.message,
                        unlock_date: new Date(newSurprise.unlockDate).toISOString()
                    }])
                    .select()
                    .single();

                if (error) throw error;
                setSurprises([...surprises, data]);
            }
            setShowAdd(false);
            setNewSurprise({ title: '', message: '', unlockDate: '' });
        } catch (error) {
            console.error('Error saving surprise:', error);
        }
    };

    const deleteSurprise = async (id) => {
        try {
            const { error } = await supabase.from('surprises').delete().eq('id', id);
            if (error) throw error;
            setSurprises(surprises.filter(s => s.id !== id));
            if (editingId === id) {
                setEditingId(null);
                setNewSurprise({ title: '', message: '', unlockDate: '' });
                setShowAdd(false);
            }
            setConfirmDeleteId(null);
        } catch (error) {
            console.error('Error deleting surprise:', error);
        }
    };

    const startEdit = (surprise) => {
        // Format date for datetime-local input (YYYY-MM-DDTHH:mm)
        // Adjust for timezone offset for simplistic local editing
        const date = new Date(surprise.unlock_date);
        const offset = date.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(date.getTime() - offset)).toISOString().slice(0, 16);

        setNewSurprise({
            title: surprise.title,
            message: surprise.message,
            unlockDate: localISOTime
        });
        setEditingId(surprise.id);
        setShowAdd(true);
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
                <form onSubmit={handleSaveSurprise} style={{ marginBottom: '1rem', padding: '1rem', background: 'var(--color-bg)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <h4 style={{ margin: 0, fontSize: '0.9rem' }}>{editingId ? 'Modifier' : 'Nouvelle surprise'}</h4>
                        <button type="button" onClick={() => { setShowAdd(false); setEditingId(null); setNewSurprise({ title: '', message: '', unlockDate: '' }); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>&times;</button>
                    </div>
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
                    <button type="submit" style={{ marginTop: '0.5rem', width: '100%', padding: '0.5rem', background: 'var(--color-primary)', color: 'white', borderRadius: '4px' }}>
                        {editingId ? 'Mettre à jour' : 'Cacher la surprise'}
                    </button>
                </form>
            )}

            <div style={{ flex: 1, overflow: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
                {surprises.map(surprise => {
                    const locked = isLocked(surprise.unlock_date);
                    return (
                        <div
                            key={surprise.id}
                            className="surprise-item"
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

                            {/* Attribution */}
                            {surprise.user_id && (
                                <div style={{
                                    position: 'absolute',
                                    bottom: '8px',
                                    right: '8px',
                                    width: '16px', height: '16px', borderRadius: '50%',
                                    backgroundImage: `url(${coupleData.personA.id === surprise.user_id ? coupleData.personA.photo : coupleData.personB.photo})`,
                                    backgroundSize: 'cover',
                                    backgroundColor: coupleData.personA.id === surprise.user_id ? coupleData.personA.color : coupleData.personB.color,
                                    opacity: 0.5
                                }} />
                            )}

                            {/* Owner Actions */}
                            {session?.user?.id === surprise.user_id && (
                                <div style={{
                                    position: 'absolute',
                                    top: '4px',
                                    right: '4px',
                                    display: 'flex',
                                    gap: '4px',
                                    zIndex: 10
                                }}>
                                    {confirmDeleteId === surprise.id ? (
                                        <div style={{ display: 'flex', gap: '2px', background: 'rgba(255,255,255,0.95)', padding: '2px', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                            <button onClick={() => deleteSurprise(surprise.id)} style={{ fontSize: '0.7rem', color: '#ff7675', border: '1px solid #ff7675', borderRadius: '4px', padding: '0 4px', cursor: 'pointer', background: 'white' }}>Oui</button>
                                            <button onClick={() => setConfirmDeleteId(null)} style={{ fontSize: '0.7rem', color: '#636e72', border: '1px solid #636e72', borderRadius: '4px', padding: '0 4px', cursor: 'pointer', background: 'white' }}>Non</button>
                                        </div>
                                    ) : (
                                        <>
                                            <button onClick={() => startEdit(surprise)} style={{ background: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} title="Modifier">✏️</button>
                                            <button onClick={() => setConfirmDeleteId(surprise.id)} style={{ background: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} title="Supprimer">❌</button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SurprisesModule;
