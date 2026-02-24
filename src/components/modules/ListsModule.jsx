import React, { useState, useEffect } from 'react';
import { Plus, X, List, Check, Trash2, ArrowLeft, MoreVertical, Edit2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCouple } from '../../context/CoupleContext';
import { useRealtime } from '../../hooks/useRealtime'; // Assuming this hook exists and works for generic tables

const ICONS = ['List', 'ShoppingCart', 'Film', 'Gift', 'Plane', 'Heart', 'Utensils', 'Music', 'Book', 'Home'];
const COLORS = ['#0984e3', '#e17055', '#00b894', '#6c5ce7', '#fdcb6e', '#e84393', '#2d3436'];

const ListsModule = () => {
    const { coupleData, session } = useCouple();
    const [lists, setLists] = useState([]);
    const [activeList, setActiveList] = useState(null); // If null, show grid. If set, show detail.
    const [loading, setLoading] = useState(true);

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    // Form State
    const [newListName, setNewListName] = useState('');
    const [newListIcon, setNewIcon] = useState('List');
    const [newListColor, setNewColor] = useState('#0984e3');

    // Realtime subscriptions
    useRealtime('lists', () => fetchLists());
    useRealtime('list_items', () => fetchLists()); // Update counts when items change

    useEffect(() => {
        if (coupleData?.couple?.id) {
            fetchLists();
        }
    }, [coupleData?.couple?.id]);

    const fetchLists = async () => {
        try {
            const { data, error } = await supabase
                .from('lists')
                .select('*, list_items(count)') // Get count of items if possible, or just raw
                .eq('couple_id', coupleData.couple.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setLists(data || []);
        } catch (error) {
            console.error('Error fetching lists:', error);
        } finally {
            setLoading(false);
        }
    };

    const createList = async (e) => {
        e.preventDefault();
        if (!newListName.trim()) return;

        try {
            const { error } = await supabase.from('lists').insert([{
                couple_id: coupleData.couple.id,
                title: newListName,
                icon: newListIcon,
                color: newListColor
            }]);

            if (error) throw error;
            setShowCreateModal(false);
            setNewListName('');
            fetchLists(); // Refresh immediately
        } catch (error) {
            console.error('Error creating list:', error);
        }
    };

    const deleteList = async (listId) => {
        if (!window.confirm("Supprimer cette liste et tout son contenu ?")) return;
        try {
            const { error } = await supabase.from('lists').delete().eq('id', listId);
            if (error) throw error;
            if (activeList?.id === listId) setActiveList(null);
            fetchLists();
        } catch (error) {
            console.error('Error deleting list:', error);
        }
    };

    // --- Render Helpers ---

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>Chargement...</div>;

    // View: List Detail
    if (activeList) {
        return (
            <ListDetailView
                list={activeList}
                onBack={() => setActiveList(null)}
                onDelete={() => deleteList(activeList.id)}
                coupleData={coupleData}
                session={session}
            />
        );
    }

    // View: Grid of Lists
    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header / Actions */}
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                    onClick={() => setShowCreateModal(true)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        fontSize: '0.9rem', color: 'var(--color-primary)',
                        padding: '0.5rem 1rem', borderRadius: '20px',
                        backgroundColor: 'rgba(0,0,0,0.05)', border: 'none', cursor: 'pointer'
                    }}
                >
                    <Plus size={16} /> Nouvelle Liste
                </button>
            </div>

            {/* Grid */}
            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: '1rem', overflowY: 'auto', paddingRight: '0.5rem', paddingBottom: '1rem'
            }}>
                {lists.map(list => (
                    <div
                        key={list.id}
                        onClick={() => setActiveList(list)}
                        style={{
                            backgroundColor: list.color + '20', // 20% opacity
                            border: `2px solid ${list.color}`,
                            borderRadius: '16px',
                            padding: '1.5rem',
                            cursor: 'pointer',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            textAlign: 'center', gap: '0.5rem',
                            aspectRatio: '1',
                            transition: 'transform 0.2s',
                        }}
                        className="list-card"
                    >
                        <div style={{
                            fontSize: '2rem', color: list.color,
                            background: 'white', borderRadius: '50%', width: '48px', height: '48px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                        }}>
                            {/* Simple emoji fallback for now, or lucide icon mapping could go here */}
                            {list.icon === 'List' ? <List size={24} /> :
                                list.icon === 'Film' ? '🎬' :
                                    list.icon === 'ShoppingCart' ? '🛒' :
                                        list.icon === 'Gift' ? '🎁' :
                                            list.icon === 'Plane' ? '✈️' :
                                                list.icon === 'Heart' ? '❤️' :
                                                    list.icon === 'Utensils' ? '🍽️' :
                                                        list.icon === 'Music' ? '🎵' :
                                                            list.icon === 'Book' ? '📚' :
                                                                list.icon === 'Home' ? '🏠' : <List size={24} />}
                        </div>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: 'var(--color-text)' }}>{list.title}</h3>
                        <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                            {list.list_items?.[0]?.count || 0} éléments
                        </span>
                    </div>
                ))}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }} onClick={() => setShowCreateModal(false)}>
                    <div style={{
                        backgroundColor: 'var(--color-bg-card)', padding: '2rem', borderRadius: '24px',
                        width: '90%', maxWidth: '400px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
                    }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ marginTop: 0 }}>Créer une liste</h2>
                        <form onSubmit={createList}>
                            <input
                                autoFocus
                                type="text" placeholder="Titre (ex: Courses, Films...)"
                                value={newListName} onChange={e => setNewListName(e.target.value)}
                                style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid var(--color-border)', marginBottom: '1rem' }}
                            />

                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Couleur</label>
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                                {COLORS.map(c => (
                                    <div
                                        key={c} onClick={() => setNewColor(c)}
                                        style={{
                                            width: '32px', height: '32px', borderRadius: '50%', background: c,
                                            cursor: 'pointer', border: newListColor === c ? '3px solid white' : 'none',
                                            boxShadow: newListColor === c ? '0 0 0 2px var(--color-primary)' : 'none'
                                        }}
                                    />
                                ))}
                            </div>

                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Icône</label>
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                                {ICONS.map(icon => (
                                    <div
                                        key={icon} onClick={() => setNewIcon(icon)}
                                        style={{
                                            width: '40px', height: '40px', borderRadius: '12px',
                                            background: newListIcon === icon ? 'var(--color-primary)' : 'rgba(0,0,0,0.05)',
                                            color: newListIcon === icon ? 'white' : 'var(--color-text)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1.2rem'
                                        }}
                                    >
                                        {icon === 'List' ? <List size={20} /> :
                                            icon === 'Film' ? '🎬' :
                                                icon === 'ShoppingCart' ? '🛒' :
                                                    icon === 'Gift' ? '🎁' :
                                                        icon === 'Plane' ? '✈️' :
                                                            icon === 'Heart' ? '❤️' :
                                                                icon === 'Utensils' ? '🍽️' :
                                                                    icon === 'Music' ? '🎵' :
                                                                        icon === 'Book' ? '📚' :
                                                                            icon === 'Home' ? '🏠' : '❓'}
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="button" onClick={() => setShowCreateModal(false)} style={{ flex: 1, padding: '1rem', borderRadius: '12px', border: '1px solid var(--color-border)', background: 'transparent' }}>Annuler</button>
                                <button type="submit" style={{ flex: 1, padding: '1rem', borderRadius: '12px', border: 'none', background: 'var(--color-primary)', color: 'white', fontWeight: 'bold' }}>Créer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <style>{`
                .list-card:hover { transform: translateY(-2px); }
            `}</style>
        </div>
    );
};

// --- Sub-Component: List Detail View ---

const ListDetailView = ({ list, onBack, onDelete, coupleData, session }) => {
    const [items, setItems] = useState([]);
    const [newItemText, setNewItemText] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchItems();
        // Subscribe to items for this list
        const channel = supabase.channel(`list:${list.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'list_items', filter: `list_id=eq.${list.id}` },
                () => fetchItems()
            )
            .subscribe();
        return () => supabase.removeChannel(channel);
    }, [list.id]);

    const fetchItems = async () => {
        const { data } = await supabase.from('list_items')
            .select('*').eq('list_id', list.id).order('created_at', { ascending: true });
        setItems(data || []);
        setLoading(false);
    };

    const addItem = async (e) => {
        e.preventDefault();
        if (!newItemText.trim()) return;

        // Optimistic update could go here
        await supabase.from('list_items').insert([{
            list_id: list.id,
            content: newItemText.trim(),
            added_by: session?.user?.id,
            couple_id: coupleData.couple.id
        }]);
        setNewItemText('');
    };

    const toggleItem = async (itemId, currentStatus) => {
        // Optimistic
        setItems(prev => prev.map(i => i.id === itemId ? { ...i, is_checked: !currentStatus } : i));

        await supabase.from('list_items').update({ is_checked: !currentStatus }).eq('id', itemId);
    };

    const deleteItem = async (itemId) => {
        setItems(prev => prev.filter(i => i.id !== itemId));
        await supabase.from('list_items').delete().eq('id', itemId);
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}><ArrowLeft /></button>
                <div style={{ flex: 1 }}>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', color: list.color }}>{list.title}</h2>
                </div>
                <button onClick={onDelete} style={{ background: 'none', border: 'none', color: '#ff7675', cursor: 'pointer' }}><Trash2 size={20} /></button>
            </div>

            {/* Items List */}
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
                {items.length === 0 && (
                    <div style={{ textAlign: 'center', opacity: 0.5, marginTop: '2rem' }}>Vide pour l'instant...</div>
                )}
                {items.map(item => (
                    <div key={item.id} style={{
                        display: 'flex', alignItems: 'center', gap: '1rem',
                        padding: '1rem', marginBottom: '0.5rem',
                        backgroundColor: 'var(--color-bg-card)', borderRadius: '12px',
                        opacity: item.is_checked ? 0.6 : 1,
                        transition: 'opacity 0.2s',
                        border: '1px solid var(--color-border)'
                    }}>
                        <div
                            onClick={() => toggleItem(item.id, item.is_checked)}
                            style={{
                                width: '24px', height: '24px', borderRadius: '6px',
                                border: `2px solid ${list.color}`,
                                backgroundColor: item.is_checked ? list.color : 'transparent',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', flexShrink: 0
                            }}
                        >
                            {item.is_checked && <Check size={16} color="white" />}
                        </div>
                        <span style={{
                            flex: 1,
                            textDecoration: item.is_checked ? 'line-through' : 'none',
                            fontSize: '1rem'
                        }}>
                            {item.content}
                        </span>
                        <button onClick={() => deleteItem(item.id)} style={{ background: 'none', border: 'none', color: '#ff7675', opacity: 0.5, cursor: 'pointer' }}>
                            <X size={18} />
                        </button>
                    </div>
                ))}
            </div>

            {/* Input */}
            <form onSubmit={addItem} style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                <input
                    type="text" placeholder="Ajouter un élément..."
                    value={newItemText} onChange={e => setNewItemText(e.target.value)}
                    style={{ flex: 1, padding: '1rem', borderRadius: '24px', border: '1px solid var(--color-border)', outline: 'none' }}
                />
                <button type="submit" style={{
                    width: '50px', borderRadius: '24px', border: 'none',
                    background: list.color, color: 'white', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Plus />
                </button>
            </form>
        </div>
    );
};

export default ListsModule;
