import React, { useState, useEffect, useRef } from 'react';
import { Plus, Heart, Star, Smile, Sun, Loader, Search, X, FileDown, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCouple } from '../../context/CoupleContext';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const TimelineItem = ({ event, coupleData, confirmDeleteId, setConfirmDeleteId, deleteEvent, startEdit, index, isLast }) => {
    // ... (rest of TimelineItem remains unchanged for now, will update for photos later)
    const [isExpanded, setIsExpanded] = useState(false);
    const description = event.description || '';
    const isLong = description.length > 150;
    const displayDescription = isExpanded ? description : (isLong ? description.slice(0, 150) + '...' : description);

    const getIcon = (emotion) => {
        switch (emotion) {
            case 'heart': return <Heart size={16} fill="var(--color-accent)" color="var(--color-accent)" />;
            case 'star': return <Star size={16} fill="#fdcb6e" color="#fdcb6e" />;
            case 'smile': return <Smile size={16} color="#0984e3" />;
            case 'sun': return <Sun size={16} color="#e17055" />;
            default: return <Heart size={16} />;
        }
    };

    return (
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', position: 'relative' }} className="timeline-item">
            {/* Line */}
            {!isLast && (
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
                zIndex: 1, flexShrink: 0,
                position: 'relative'
            }}>
                {getIcon(event.emotion)}
                {/* Attribution Badge */}
                {event.user_id && (
                    <div style={{
                        position: 'absolute',
                        bottom: '-4px',
                        right: '-4px',
                        width: '16px', height: '16px', borderRadius: '50%',
                        border: '1px solid white',
                        backgroundImage: `url(${coupleData.personA.id === event.user_id ? coupleData.personA.photo : coupleData.personB.photo})`,
                        backgroundSize: 'cover',
                        backgroundColor: coupleData.personA.id === event.user_id ? coupleData.personA.color : coupleData.personB.color
                    }} />
                )}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{new Date(event.date).toLocaleDateString('fr-FR', { month: 'long', day: 'numeric' })}</span>
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

                {/* Image */}
                {event.image_url && (
                    <div style={{ marginBottom: '0.5rem', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--color-border)', maxWidth: '200px' }}>
                        <img src={event.image_url} alt="Souvenir" style={{ width: '100%', display: 'block' }} />
                    </div>
                )}

                <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>{event.title}</h4>
                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
                    {displayDescription}
                    {isLong && (
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            style={{
                                background: 'none', border: 'none', padding: '0 0 0 5px',
                                color: 'var(--color-primary)', cursor: 'pointer', fontSize: '0.8rem',
                                fontWeight: '500'
                            }}
                        >
                            {isExpanded ? '(moins)' : '... (lire plus)'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const TimelineModule = () => {
    const { coupleData, session } = useCouple();
    const [events, setEvents] = useState([]);
    const [showAdd, setShowAdd] = useState(false);
    const [newEvent, setNewEvent] = useState({ title: '', date: '', emotion: 'heart', description: '', image: null, image_url: null }); // Added image state
    const [loading, setLoading] = useState(true);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [uploading, setUploading] = useState(false); // New uploading state

    // Search & Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [filterEmotion, setFilterEmotion] = useState(null);
    const [isExporting, setIsExporting] = useState(false);
    const timelineRef = useRef(null);

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
        setUploading(true);

        try {
            let publicUrl = newEvent.image_url;

            // Handle Image Upload
            if (newEvent.image) {
                const file = newEvent.image;
                const fileExt = file.name.split('.').pop();
                const fileName = `timeline_${Date.now()}.${fileExt}`;
                const filePath = `${coupleData.couple.id}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('images')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl: url } } = supabase.storage
                    .from('images')
                    .getPublicUrl(filePath);

                publicUrl = url;
            }

            if (editingId) {
                // Update
                const { data, error } = await supabase
                    .from('timeline_events')
                    .update({
                        title: newEvent.title,
                        date: newEvent.date,
                        emotion: newEvent.emotion,
                        description: newEvent.description,
                        image_url: publicUrl // Save URL
                    })
                    .eq('id', editingId)
                    .select()
                    .single();

                if (error) throw error;
                setEvents(prev => prev.map(ev => ev.id === editingId ? data : ev).sort((a, b) => new Date(b.date) - new Date(a.date)));
                setEditingId(null);
            } else {
                // Create
                const { data, error } = await supabase
                    .from('timeline_events')
                    .insert([{
                        couple_id: coupleData.couple.id,
                        user_id: session?.user?.id,
                        title: newEvent.title,
                        date: newEvent.date,
                        emotion: newEvent.emotion,
                        description: newEvent.description,
                        image_url: publicUrl // Save URL
                    }])
                    .select()
                    .single();

                if (error) throw error;
                setEvents(prev => [data, ...prev].sort((a, b) => new Date(b.date) - new Date(a.date)));
            }
            setShowAdd(false);
            setNewEvent({ title: '', date: '', emotion: 'heart', description: '', image: null, image_url: null });
        } catch (error) {
            console.error('Error saving timeline event:', error);
            alert('Erreur lors de la sauvegarde : ' + error.message);
        } finally {
            setUploading(false);
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
                setNewEvent({ title: '', date: '', emotion: 'heart', description: '', image: null, image_url: null });
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
            description: event.description || '',
            image_url: event.image_url,
            image: null
        });
        setEditingId(event.id);
        setShowAdd(true);
    };

    // Filter Logic
    const filteredEvents = React.useMemo(() => {
        return events.filter(event => {
            const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesEmotion = filterEmotion ? event.emotion === filterEmotion : true;
            return matchesSearch && matchesEmotion;
        });
    }, [events, searchQuery, filterEmotion]);

    // Grouping Logic (using filteredEvents)
    const groupedEvents = React.useMemo(() => {
        const groups = {};
        filteredEvents.forEach(event => {
            const date = new Date(event.date);
            const year = date.getFullYear();
            const month = date.getMonth(); // 0-11

            if (!groups[year]) groups[year] = {};
            if (!groups[year][month]) groups[year][month] = [];
            groups[year][month].push(event);
        });

        // Convert to array sorted by Year DESC, then Month DESC
        return Object.entries(groups).sort((a, b) => b[0] - a[0]).map(([year, monthsObj]) => {
            const sortedMonths = Object.entries(monthsObj).sort((a, b) => b[0] - a[0]).map(([monthIndex, monthEvents]) => {
                const date = new Date(year, monthIndex);
                const monthName = date.toLocaleDateString('fr-FR', { month: 'long' });
                return {
                    name: monthName.charAt(0).toUpperCase() + monthName.slice(1), // Capitalize
                    events: monthEvents
                };
            });
            return { year, months: sortedMonths };
        });
    }, [filteredEvents]);

    // PDF Generation
    const loadImage = (url) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = url;
        });
    };

    const generateBookPDF = async () => {
        setIsExporting(true);
        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 20;
            const contentWidth = pageWidth - (margin * 2);
            let y = margin;

            // --- Cover Page ---
            doc.setFillColor(255, 255, 255);
            doc.rect(0, 0, pageWidth, pageHeight, 'F');

            doc.setFontSize(32);
            doc.setTextColor(50, 50, 50);
            doc.text("Notre Histoire", pageWidth / 2, pageHeight / 3, { align: 'center' });

            if (coupleData?.personA && coupleData?.personB) {
                doc.setFontSize(18);
                doc.setTextColor(100, 100, 100);
                doc.text(`${coupleData.personA.name} & ${coupleData.personB.name}`, pageWidth / 2, (pageHeight / 3) + 20, { align: 'center' });
            }

            doc.setFontSize(12);
            doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, pageHeight - 30, { align: 'center' });

            doc.addPage();
            y = margin;

            // --- Content ---
            // Sort Chronologically (Oldest First)
            const notes = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));

            let currentYear = null;

            for (const event of notes) {
                if (y > pageHeight - 50) {
                    doc.addPage();
                    y = margin;
                }

                // Year Header
                const eventDate = new Date(event.date);
                const year = eventDate.getFullYear();
                if (year !== currentYear) {
                    currentYear = year;
                    if (y > pageHeight - 60) { doc.addPage(); y = margin; }

                    doc.setFontSize(24);
                    doc.setTextColor(225, 112, 85);
                    doc.text(`${year}`, margin, y + 10);

                    doc.setDrawColor(225, 112, 85);
                    doc.setLineWidth(0.5);
                    doc.line(margin, y + 15, pageWidth - margin, y + 15);

                    y += 30;
                }

                // Event Item
                const dateStr = eventDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });

                doc.setFontSize(10);
                doc.setTextColor(120, 120, 120);
                doc.text(dateStr.toUpperCase(), margin, y);

                let emotionSymbol = "❤️";
                if (event.emotion === 'star') emotionSymbol = "⭐";
                if (event.emotion === 'smile') emotionSymbol = "😊";
                if (event.emotion === 'sun') emotionSymbol = "☀️";

                doc.text(emotionSymbol, pageWidth - margin - 10, y);

                y += 8;

                doc.setFontSize(14);
                doc.setTextColor(40, 40, 40);
                doc.setFont("helvetica", "bold");
                const splitTitle = doc.splitTextToSize(event.title, contentWidth);
                doc.text(splitTitle, margin, y);
                y += (splitTitle.length * 6) + 4;

                if (event.image_url) {
                    try {
                        // Determine visual width (max 80% of content or natural aspect)
                        // Load image to get dims
                        const response = await fetch(event.image_url);
                        const blob = await response.blob();
                        const base64 = await new Promise((resolve) => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result);
                            reader.readAsDataURL(blob);
                        });

                        const imgProps = doc.getImageProperties(base64);
                        const imgMaxHeight = 80;
                        const imgWidth = Math.min(contentWidth, (imgProps.width * imgMaxHeight) / imgProps.height);
                        const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

                        if (y + imgHeight > pageHeight - margin) {
                            doc.addPage();
                            y = margin;
                        }

                        doc.addImage(base64, 'JPEG', margin, y, imgWidth, imgHeight);
                        y += imgHeight + 5;
                    } catch (err) {
                        console.warn('Image PDF error', err);
                    }
                }

                if (event.description) {
                    doc.setFontSize(11);
                    doc.setTextColor(60, 60, 60);
                    doc.setFont("helvetica", "normal");

                    const splitDescription = doc.splitTextToSize(event.description, contentWidth);

                    if (y + (splitDescription.length * 6) > pageHeight - margin) {
                        if (splitDescription.length * 6 > (pageHeight - margin * 2)) {
                            doc.addPage();
                            y = margin;
                        } else {
                            doc.addPage();
                            y = margin;
                        }
                    }

                    doc.text(splitDescription, margin, y);
                    y += (splitDescription.length * 6) + 5;
                }

                y += 15;
            }

            doc.save('notre_histoire.pdf');
        } catch (err) {
            console.error(err);
            alert('Erreur PDF : ' + err.message);
        } finally {
            setIsExporting(false);
        }
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><Loader className="animate-spin" /></div>;

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header / Config Bar */}
            <div style={{ paddingBottom: '0.5rem', borderBottom: '1px solid var(--color-border)', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={14} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%', padding: '0.4rem 0.5rem 0.4rem 2rem',
                                borderRadius: '15px', border: '1px solid var(--color-border)',
                                fontSize: '0.9rem', outline: 'none'
                            }}
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                <X size={12} />
                            </button>
                        )}
                    </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                        {['heart', 'star', 'smile', 'sun'].map(emo => (
                            <button
                                key={emo}
                                onClick={() => setFilterEmotion(filterEmotion === emo ? null : emo)}
                                style={{
                                    background: filterEmotion === emo ? 'var(--color-primary-light)' : 'transparent',
                                    border: `1px solid ${filterEmotion === emo ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                    borderRadius: '50%', width: '28px', height: '28px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', transition: 'all 0.2s'
                                }}
                            >
                                {emo === 'heart' && <Heart size={14} fill={filterEmotion === emo ? "currentColor" : "none"} />}
                                {emo === 'star' && <Star size={14} fill={filterEmotion === emo ? "currentColor" : "none"} />}
                                {emo === 'smile' && <Smile size={14} />}
                                {emo === 'sun' && <Sun size={14} />}
                            </button>
                        ))}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            onClick={generateBookPDF}
                            disabled={isExporting}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                fontSize: '0.8rem', color: 'var(--color-text)',
                                padding: '0.25rem 0.5rem', borderRadius: '8px',
                                border: '1px solid var(--color-border)', background: 'transparent',
                                cursor: isExporting ? 'wait' : 'pointer'
                            }}
                            title="Exporter en PDF"
                        >
                            {isExporting ? <Loader size={14} className="animate-spin" /> : <FileDown size={14} />}
                        </button>
                        <button
                            onClick={() => setShowAdd(!showAdd)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                fontSize: '0.8rem', color: 'white',
                                padding: '0.25rem 0.75rem', borderRadius: '12px',
                                background: 'var(--color-primary)', border: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            <Plus size={14} /> Ajouter
                        </button>
                    </div>
                </div>
            </div>

            {showAdd && (
                <form onSubmit={handleSaveEvent} style={{ marginBottom: '1rem', padding: '1rem', background: 'var(--color-bg)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <h4 style={{ margin: 0, fontSize: '0.9rem' }}>{editingId ? 'Modifier le souvenir' : 'Nouveau souvenir'}</h4>
                        <button type="button" onClick={() => { setShowAdd(false); setEditingId(null); setNewEvent({ title: '', date: '', emotion: 'heart', description: '', image: null, image_url: null }); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>&times;</button>
                    </div>

                    {/* File Input */}
                    <div style={{ marginBottom: '0.5rem' }}>
                        <label style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--color-primary)', padding: '0.25rem 0.5rem', border: '1px dashed var(--color-border)', borderRadius: '4px' }}>
                            <ImageIcon size={14} />
                            {newEvent.image ? 'Image sélectionnée' : (newEvent.image_url ? 'Changer l\'image' : 'Ajouter une image')}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    if (e.target.files[0]) {
                                        setNewEvent({ ...newEvent, image: e.target.files[0] });
                                    }
                                }}
                                style={{ display: 'none' }}
                            />
                        </label>
                        {(newEvent.image || newEvent.image_url) && (
                            <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                {newEvent.image ? newEvent.image.name : 'Image actuelle'}
                            </span>
                        )}
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
                    <button type="submit" disabled={uploading} style={{ marginTop: '0.5rem', width: '100%', padding: '0.5rem', background: 'var(--color-primary)', color: 'white', borderRadius: '4px', opacity: uploading ? 0.7 : 1 }}>
                        {uploading ? 'Enregistrement...' : (editingId ? 'Mettre à jour' : 'Enregistrer')}
                    </button>
                </form>
            )}

            <div ref={timelineRef} style={{ flex: 1, overflow: 'auto', paddingRight: '0.5rem' }}>
                {events.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginTop: '2rem' }}>
                        Aucun souvenir pour le moment.
                    </div>
                )}

                {groupedEvents.map((yearGroup) => (
                    <div key={yearGroup.year} style={{ marginBottom: '1.5rem' }}>
                        <div style={{
                            position: 'sticky', top: 0, zIndex: 10,
                            backgroundColor: 'var(--color-surface)',
                            padding: '0.5rem 0', marginBottom: '0.5rem',
                            borderBottom: '1px solid var(--color-border)',
                            fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--color-primary)'
                        }}>
                            {yearGroup.year}
                        </div>
                        {yearGroup.months.map((monthGroup) => (
                            <div key={monthGroup.name} style={{ marginBottom: '1rem' }}>
                                <div style={{
                                    fontSize: '0.9rem', fontWeight: '600', color: 'var(--color-text-muted)',
                                    marginBottom: '0.75rem', marginLeft: '0.25rem',
                                    textTransform: 'uppercase', letterSpacing: '0.05em'
                                }}>
                                    {monthGroup.name}
                                </div>
                                {monthGroup.events.map((event, index) => (
                                    <TimelineItem
                                        key={event.id}
                                        event={event}
                                        coupleData={coupleData}
                                        confirmDeleteId={confirmDeleteId}
                                        setConfirmDeleteId={setConfirmDeleteId}
                                        deleteEvent={deleteEvent}
                                        startEdit={startEdit}
                                        index={index}
                                        isLast={index === monthGroup.events.length - 1}
                                    />
                                ))}
                            </div>
                        ))}
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
