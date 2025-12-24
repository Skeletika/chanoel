import React, { useState, useEffect } from 'react';
import { useCouple } from '../context/CoupleContext';
import GridContainer from '../components/layout/GridContainer';
import ModuleCard from '../components/layout/ModuleCard';
import GalleryModule from '../components/modules/GalleryModule';
import CalendarModule from '../components/modules/CalendarModule';
import TimelineModule from '../components/modules/TimelineModule';
import TodoModule from '../components/modules/TodoModule';
import MealsModule from '../components/modules/MealsModule';
import ChatModule from '../components/modules/ChatModule';
import JournalModule from '../components/modules/JournalModule';
import NotesModule from '../components/modules/NotesModule';
import SurprisesModule from '../components/modules/SurprisesModule';
import SettingsModal from '../components/ui/SettingsModal';
import ProfileModal from '../components/ui/ProfileModal';
import { Settings, LogOut } from 'lucide-react';

const Dashboard = () => {
    const { coupleData, logout } = useCouple();
    const [showSettings, setShowSettings] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);

    useEffect(() => {
        if (coupleData?.couple?.name) {
            document.title = coupleData.couple.name;
        }
        return () => {
            document.title = 'Ideal'; // Reset on unmount
        };
    }, [coupleData?.couple?.name]);

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--color-bg, #121212)',
            overflow: 'hidden' // Main container no scroll
        }}>
            {/* Header */}
            <header style={{
                padding: '1rem 2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'var(--color-surface, #1e1e1e)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                zIndex: 10
            }}>
                <div>
                    <h1 style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: '1.5rem',
                        color: 'var(--color-primary)',
                        marginBottom: '0.2rem'
                    }}>
                        {coupleData.couple.name || 'Notre Espace'}
                    </h1>
                    {coupleData.couple.meetDate && (
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                            Depuis le {coupleData.couple.meetDate ? new Date(coupleData.couple.meetDate).toLocaleDateString() : ''}
                        </p>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <button onClick={() => setShowSettings(true)} style={{ color: 'var(--color-text-muted)' }}><Settings size={20} /></button>
                    <button onClick={logout} style={{ color: 'var(--color-text-muted)' }}><LogOut size={20} /></button>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <div
                            onClick={() => setShowProfileModal(true)}
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                backgroundColor: coupleData.personA.color,
                                backgroundImage: coupleData.personA.photo ? `url(${coupleData.personA.photo})` : 'none',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                border: `3px solid ${coupleData.personA.color}`,
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                position: 'relative',
                                zIndex: 2,
                                cursor: 'pointer'
                            }}
                            className="profile-icon"
                        >
                            <div className="tooltip" style={{
                                position: 'absolute',
                                bottom: '-30px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                background: 'rgba(0,0,0,0.8)',
                                color: 'white',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                whiteSpace: 'nowrap',
                                opacity: 0,
                                pointerEvents: 'none',
                                transition: 'opacity 0.2s'
                            }}>
                                {coupleData.personA.nickname || coupleData.personA.name}
                            </div>
                        </div>
                        <div
                            onClick={() => setShowProfileModal(true)}
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                backgroundColor: coupleData.personB.color,
                                backgroundImage: coupleData.personB.photo ? `url(${coupleData.personB.photo})` : 'none',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                marginLeft: '-15px',
                                border: `3px solid ${coupleData.personB.color}`,
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                position: 'relative',
                                zIndex: 1,
                                cursor: 'pointer'
                            }}
                            className="profile-icon"
                        >
                            <div className="tooltip" style={{
                                position: 'absolute',
                                bottom: '-30px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                background: 'rgba(0,0,0,0.8)',
                                color: 'white',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                whiteSpace: 'nowrap',
                                opacity: 0,
                                pointerEvents: 'none',
                                transition: 'opacity 0.2s'
                            }}>
                                {coupleData.personB.nickname || coupleData.personB.name}
                            </div>
                        </div>
                        <style>{`
                            .profile-icon:hover .tooltip { opacity: 1 !important; }
                            .profile-icon:hover { z-index: 10 !important; }
                        `}</style>
                    </div>
                </div>
            </header>

            {/* Grid Content */}
            <div style={{ flex: 1, overflow: 'auto', paddingBottom: '1rem' }}>
                <GridContainer>
                    <ModuleCard key="gallery" title="Galerie">
                        <GalleryModule />
                    </ModuleCard>
                    <ModuleCard key="calendar" title="Calendrier">
                        <CalendarModule />
                    </ModuleCard>
                    <ModuleCard key="timeline" title="Notre Histoire">
                        <TimelineModule />
                    </ModuleCard>
                    <ModuleCard key="todo" title="À faire">
                        <TodoModule />
                    </ModuleCard>
                    <ModuleCard key="meals" title="Repas">
                        <MealsModule />
                    </ModuleCard>
                    <ModuleCard key="chat" title="Discussion">
                        <ChatModule />
                    </ModuleCard>
                    <ModuleCard key="journal" title="Journal">
                        <JournalModule />
                    </ModuleCard>
                    <ModuleCard key="notes" title="Notes">
                        <NotesModule />
                    </ModuleCard>
                    <ModuleCard key="surprises" title="Surprises">
                        <SurprisesModule />
                    </ModuleCard>
                </GridContainer>
            </div>

            {/* Settings Modal */}
            {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
            {showProfileModal && <ProfileModal onClose={() => setShowProfileModal(false)} />}
        </div>
    );
};

export default Dashboard;
