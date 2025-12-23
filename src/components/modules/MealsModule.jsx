import React, { useState, useEffect } from 'react';
import { Utensils, Shuffle, Plus, Trash2, Loader } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCouple } from '../../context/CoupleContext';

import { useRealtime } from '../../hooks/useRealtime';

const MealsModule = () => {
    const { coupleData } = useCouple();
    const [meals, setMeals] = useState([]);
    const [newMeal, setNewMeal] = useState('');
    const [suggestion, setSuggestion] = useState(null);
    const [loading, setLoading] = useState(true);

    useRealtime('meals', () => {
        fetchMeals();
    });

    useEffect(() => {
        if (coupleData?.couple?.id) {
            fetchMeals();
        }
    }, [coupleData?.couple?.id]);

    const fetchMeals = async () => {
        try {
            const { data, error } = await supabase
                .from('meals')
                .select('*')
                .eq('couple_id', coupleData.couple.id);

            if (error) throw error;
            setMeals(data || []);
        } catch (error) {
            console.error('Error fetching meals:', error);
        } finally {
            setLoading(false);
        }
    };

    const addMeal = async (e) => {
        e.preventDefault();
        if (!newMeal.trim() || !coupleData?.couple?.id) return;

        try {
            const { data, error } = await supabase
                .from('meals')
                .insert([{
                    couple_id: coupleData.couple.id,
                    name: newMeal.trim()
                }])
                .select()
                .single();

            if (error) throw error;
            setMeals([...meals, data]);
            setNewMeal('');
        } catch (error) {
            console.error('Error adding meal:', error);
        }
    };

    const deleteMeal = async (id) => {
        try {
            const { error } = await supabase
                .from('meals')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setMeals(meals.filter(m => m.id !== id));
        } catch (error) {
            console.error('Error deleting meal:', error);
        }
    };

    const randomize = () => {
        if (meals.length === 0) return;
        let count = 0;
        const interval = setInterval(() => {
            setSuggestion(meals[Math.floor(Math.random() * meals.length)].name);
            count++;
            if (count > 10) clearInterval(interval);
        }, 100);
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><Loader className="animate-spin" /></div>;

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <button
                    onClick={randomize}
                    style={{
                        background: 'linear-gradient(135deg, #e17055 0%, #d63031 100%)',
                        color: 'white',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '50px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontWeight: 600,
                        boxShadow: '0 4px 10px rgba(225, 112, 85, 0.3)',
                        transition: 'transform 0.2s'
                    }}
                    onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <Shuffle size={18} /> Qu'est-ce qu'on mange ?
                </button>
            </div>

            {suggestion && (
                <div style={{
                    textAlign: 'center',
                    marginBottom: '1.5rem',
                    padding: '1rem',
                    background: 'var(--color-bg)',
                    borderRadius: '12px',
                    animation: 'fadeIn 0.5s'
                }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Ce soir, c'est :</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>{suggestion}</div>
                </div>
            )}

            <div style={{ flex: 1, overflow: 'auto' }}>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Vos favoris</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {meals.map((meal) => (
                        <div
                            key={meal.id}
                            style={{
                                padding: '0.5rem 1rem',
                                background: 'var(--color-surface)',
                                border: '1px solid var(--color-border)',
                                borderRadius: '20px',
                                fontSize: '0.9rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            {meal.name}
                            <button onClick={() => deleteMeal(meal.id)} style={{ color: '#ff7675', display: 'flex' }}>
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <form onSubmit={addMeal} style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                <input
                    type="text"
                    value={newMeal}
                    onChange={(e) => setNewMeal(e.target.value)}
                    placeholder="Ajouter un plat..."
                    style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}
                />
                <button type="submit" style={{ padding: '0.5rem', background: 'var(--color-primary)', color: 'white', borderRadius: '8px' }}>
                    <Plus size={20} />
                </button>
            </form>
        </div>
    );
};

export default MealsModule;
