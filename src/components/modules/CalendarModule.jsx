import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Trash2, Loader } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCouple } from '../../context/CoupleContext';

import { useRealtime } from '../../hooks/useRealtime';

const CalendarModule = () => {
    const { coupleData } = useCouple();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedDay, setSelectedDay] = useState(null);
    const [newEvent, setNewEvent] = useState({ title: '', date: '', type: 'appointment' });
    const [loading, setLoading] = useState(true);

    useRealtime('events', () => {
        fetchEvents();
    });

    useEffect(() => {
        if (coupleData?.couple?.id) {
            fetchEvents();
        }
    }, [coupleData?.couple?.id]);

    const fetchEvents = async () => {
        try {
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .eq('couple_id', coupleData.couple.id);

            if (error) throw error;
            setEvents(data || []);
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    };

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    const handleAddEvent = async (e) => {
        e.preventDefault();
        if (!newEvent.title || !newEvent.date || !coupleData?.couple?.id) return;

        try {
            const { data, error } = await supabase
                .from('events')
                .insert([{
                    couple_id: coupleData.couple.id,
                    title: newEvent.title,
                    date: new Date(newEvent.date).toISOString(),
                    type: newEvent.type
                }])
                .select()
                .single();

            if (error) throw error;

            setEvents([...events, data]);
            setShowAddModal(false);
            setNewEvent({ title: '', date: '', type: 'appointment' });
        } catch (error) {
            console.error('Error adding event:', error);
            alert('Erreur lors de l\'ajout de l\'événement');
        }
    };

    const deleteEvent = async (id) => {
        try {
            const { error } = await supabase
                .from('events')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setEvents(events.filter(e => e.id !== id));
        } catch (error) {
            console.error('Error deleting event:', error);
            alert('Erreur lors de la suppression');
        }
    };

    const getEventsForDay = (day) => {
        // Create date in UTC to match ISO string comparison
        const targetDate = new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), day));
        const targetDateStr = targetDate.toISOString().split('T')[0];

        return events.filter(e => {
            const eventDateStr = e.date.split('T')[0];
            return eventDateStr === targetDateStr;
        });
    };

    const eventColors = {
        appointment: '#0984e3',
        birthday: '#e17055',
        trip: '#00b894',
        other: '#636e72'
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><Loader className="animate-spin" /></div>;

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <button onClick={prevMonth}><ChevronLeft size={20} /></button>
                <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                    {currentDate.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}
                </span>
                <button onClick={nextMonth}><ChevronRight size={20} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => <div key={i}>{d}</div>)}
            </div>

            {/* Calendar Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', flex: 1, overflow: 'auto' }}>
                {[...Array(startDay)].map((_, i) => <div key={`empty-${i}`} />)}
                {[...Array(daysInMonth)].map((_, i) => {
                    const day = i + 1;
                    const dayEvents = getEventsForDay(day);
                    const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
                    const isSelected = selectedDay === day;

                    return (
                        <div
                            key={day}
                            style={{
                                border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                                borderRadius: '4px',
                                padding: '2px',
                                minHeight: '40px',
                                backgroundColor: isToday ? 'rgba(225, 112, 85, 0.1)' : 'transparent',
                                position: 'relative',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center'
                            }}
                            onClick={() => setSelectedDay(day)}
                        >
                            <div style={{ fontSize: '0.8rem', fontWeight: isToday ? 'bold' : 'normal' }}>{day}</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', justifyContent: 'center' }}>
                                {dayEvents.map(ev => (
                                    <div
                                        key={ev.id}
                                        style={{
                                            width: '6px',
                                            height: '6px',
                                            borderRadius: '50%',
                                            backgroundColor: eventColors[ev.type] || eventColors.other,
                                        }}
                                        title={ev.title}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Selected Day Details */}
            {selectedDay && (
                <div style={{ marginTop: '1rem', padding: '0.5rem', background: 'var(--color-bg)', borderRadius: '8px', animation: 'fadeIn 0.2s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                            {new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDay).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </h4>
                        <button onClick={() => setSelectedDay(null)}><X size={16} /></button>
                    </div>

                    <div style={{ maxHeight: '100px', overflow: 'auto', marginBottom: '0.5rem' }}>
                        {getEventsForDay(selectedDay).length === 0 ? (
                            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Aucun événement</p>
                        ) : (
                            getEventsForDay(selectedDay).map(ev => (
                                <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: eventColors[ev.type] }} />
                                    <span style={{ flex: 1 }}>{ev.title}</span>
                                    <button onClick={() => deleteEvent(ev.id)} style={{ color: '#ff7675' }}><Trash2 size={14} /></button>
                                </div>
                            ))
                        )}
                    </div>

                    <button
                        onClick={() => {
                            // Format date for input type="date" (YYYY-MM-DD)
                            // Use UTC to avoid timezone shifts
                            const d = new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), selectedDay));
                            setNewEvent(prev => ({ ...prev, date: d.toISOString().split('T')[0] }));
                            setShowAddModal(true);
                        }}
                        style={{
                            width: '100%',
                            padding: '0.5rem',
                            backgroundColor: 'var(--color-surface)',
                            border: '1px dashed var(--color-border)',
                            borderRadius: '4px',
                            color: 'var(--color-primary)',
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <Plus size={14} /> Ajouter à cette date
                    </button>
                </div>
            )}

            {/* Add Modal */}
            {showAddModal && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    zIndex: 2000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', width: '300px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <h3>Nouvel événement</h3>
                            <button onClick={() => setShowAddModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleAddEvent} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <input
                                type="text"
                                placeholder="Titre"
                                value={newEvent.title}
                                onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                                style={{ padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                                autoFocus
                            />
                            <input
                                type="date"
                                value={newEvent.date}
                                onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
                                style={{ padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                            />
                            <select
                                value={newEvent.type}
                                onChange={e => setNewEvent({ ...newEvent, type: e.target.value })}
                                style={{ padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                            >
                                <option value="appointment">Rendez-vous</option>
                                <option value="birthday">Anniversaire</option>
                                <option value="trip">Voyage</option>
                                <option value="other">Autre</option>
                            </select>
                            <button
                                type="submit"
                                style={{ padding: '0.5rem', backgroundColor: 'var(--color-primary)', color: 'white', borderRadius: '4px' }}
                            >
                                Ajouter
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarModule;
