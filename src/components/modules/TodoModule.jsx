import React, { useState, useEffect } from 'react';
import { CheckSquare, Square, Trash2, Plus, Loader } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCouple } from '../../context/CoupleContext';

import { useRealtime } from '../../hooks/useRealtime';

const TodoModule = () => {
    const { coupleData } = useCouple();
    const [todos, setTodos] = useState([]);
    const [newTodo, setNewTodo] = useState('');
    const [category, setCategory] = useState('Maison');
    const [loading, setLoading] = useState(true);

    useRealtime('todos', () => {
        fetchTodos();
    });

    useEffect(() => {
        if (coupleData?.couple?.id) {
            fetchTodos();
        }
    }, [coupleData?.couple?.id]);

    const fetchTodos = async () => {
        try {
            const { data, error } = await supabase
                .from('todos')
                .select('*')
                .eq('couple_id', coupleData.couple.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTodos(data || []);
        } catch (error) {
            console.error('Error fetching todos:', error);
        } finally {
            setLoading(false);
        }
    };

    const addTodo = async (e) => {
        e.preventDefault();
        if (!newTodo.trim() || !coupleData?.couple?.id) return;

        try {
            const { data, error } = await supabase
                .from('todos')
                .insert([{
                    couple_id: coupleData.couple.id,
                    text: newTodo.trim(),
                    category,
                    done: false
                }])
                .select()
                .single();

            if (error) throw error;
            setTodos([data, ...todos]);
            setNewTodo('');
        } catch (error) {
            console.error('Error adding todo:', error);
        }
    };

    const toggleTodo = async (id, currentStatus) => {
        try {
            const { error } = await supabase
                .from('todos')
                .update({ done: !currentStatus })
                .eq('id', id);

            if (error) throw error;
            setTodos(todos.map(t => t.id === id ? { ...t, done: !t.done } : t));
        } catch (error) {
            console.error('Error toggling todo:', error);
        }
    };

    const deleteTodo = async (id) => {
        try {
            const { error } = await supabase
                .from('todos')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setTodos(todos.filter(t => t.id !== id));
        } catch (error) {
            console.error('Error deleting todo:', error);
        }
    };

    const categories = ['Maison', 'Loisirs', 'Voyages', 'Projets'];
    const categoryColors = {
        'Maison': '#0984e3',
        'Loisirs': '#00b894',
        'Voyages': '#e17055',
        'Projets': '#6c5ce7'
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><Loader className="animate-spin" /></div>;

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <form onSubmit={addTodo} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <input
                    type="text"
                    value={newTodo}
                    onChange={(e) => setNewTodo(e.target.value)}
                    placeholder="Nouvelle tâche..."
                    style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}
                />
                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--color-border)', maxWidth: '100px' }}
                >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <button type="submit" style={{ padding: '0.5rem', background: 'var(--color-primary)', color: 'white', borderRadius: '8px' }}>
                    <Plus size={20} />
                </button>
            </form>

            <div style={{ flex: 1, overflow: 'auto' }}>
                {todos.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginTop: '2rem' }}>
                        Rien à faire pour le moment !
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {todos.sort((a, b) => a.done - b.done).map(todo => (
                            <div
                                key={todo.id}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                                    padding: '0.75rem', background: 'var(--color-bg)', borderRadius: '8px',
                                    opacity: todo.done ? 0.6 : 1,
                                    transition: 'opacity 0.2s'
                                }}
                            >
                                <button onClick={() => toggleTodo(todo.id, todo.done)} style={{ color: todo.done ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                                    {todo.done ? <CheckSquare size={20} /> : <Square size={20} />}
                                </button>
                                <div style={{ flex: 1 }}>
                                    <div style={{
                                        textDecoration: todo.done ? 'line-through' : 'none',
                                        fontSize: '0.95rem'
                                    }}>
                                        {todo.text}
                                    </div>
                                    <div style={{
                                        fontSize: '0.7rem',
                                        color: categoryColors[todo.category],
                                        fontWeight: 600,
                                        marginTop: '2px'
                                    }}>
                                        {todo.category.toUpperCase()}
                                    </div>
                                </div>
                                <button onClick={() => deleteTodo(todo.id)} style={{ color: '#ff7675', opacity: 0.5 }} onMouseOver={e => e.target.style.opacity = 1} onMouseOut={e => e.target.style.opacity = 0.5}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TodoModule;
