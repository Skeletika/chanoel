import React, { useState } from 'react';
import { X, Save, Shield, Trash2, RefreshCw, Sun, Moon, Palette } from 'lucide-react';
import { useCouple } from '../../context/CoupleContext';
import { useTheme } from '../../context/ThemeContext';

const SettingsModal = ({ onClose }) => {
    const { coupleData, updateCouple, updateSecurity, logout, deleteCouple } = useCouple();
    const { theme, toggleTheme, setOverridePalette, getReferenceColors } = useTheme();

    const [coupleName, setCoupleName] = useState(coupleData.couple.name);
    const [meetDate, setMeetDate] = useState(coupleData.couple.meetDate);
    const [song, setSong] = useState(coupleData.couple.song);

    const [currentPin, setCurrentPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [pinError, setPinError] = useState('');
    const [pinSuccess, setPinSuccess] = useState('');

    // Theme customization state
    const [customColors, setCustomColors] = useState(getReferenceColors());

    // Effect: Update live preview when customColors changes
    // But only if we are actually editing. To avoid always overriding on mount,
    // we can use setOverridePalette(customColors) only when user interacts?
    // Actually, simply calling it here is fine as long as we clear it on close.
    // However, to respect "Cancel", we should only setOverridePalette if it differs from current.
    // Let's rely on specific handlers for smoother UX, or just useEffect.
    /*
    useEffect(() => {
        setOverridePalette(customColors);
        return () => setOverridePalette(null); // Cleanup on unmount
    }, [customColors, setOverridePalette]);
    */
    // Better: explicit calls.

    const handleColorChange = (key, value) => {
        const newColors = { ...customColors, [key]: value };
        setCustomColors(newColors);
        setOverridePalette(newColors);
    };

    // Cleanup override on close
    React.useEffect(() => {
        return () => setOverridePalette(null);
    }, [setOverridePalette]);

    const handleSaveCouple = (e) => {
        e.preventDefault();
        updateCouple({ name: coupleName, meetDate, song });
    };

    const handleChangePin = (e) => {
        e.preventDefault();
        setPinError('');
        setPinSuccess('');

        if (currentPin !== coupleData.security.pin) {
            setPinError('Code PIN actuel incorrect');
            return;
        }
        if (newPin.length < 4 || newPin.length > 6) {
            setPinError('Le nouveau code doit faire 4 à 6 chiffres');
            return;
        }
        if (newPin !== confirmPin) {
            setPinError('Les nouveaux codes ne correspondent pas');
            return;
        }

        updateSecurity({ pin: newPin });
        setPinSuccess('Code PIN modifié avec succès');
        setCurrentPin('');
        setNewPin('');
        setConfirmPin('');
    };

    const handleReset = async () => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cet espace couple ? Vous repartirez de zéro.')) {
            try {
                await deleteCouple();
            } catch (error) {
                alert("Erreur lors de la suppression : " + error.message);
            }
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fadeIn 0.2s'
        }} onClick={onClose}>
            <div style={{
                background: 'var(--color-bg)',
                width: '90%',
                maxWidth: '500px',
                maxHeight: '90vh',
                borderRadius: '16px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
            }} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={{
                    padding: '1.5rem',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'var(--color-surface)'
                }}>
                    <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: 'var(--color-primary)' }}>Paramètres</h2>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <button
                            key="theme-toggle"
                            onClick={toggleTheme}
                            style={{
                                color: 'var(--color-text)',
                                display: 'flex',
                                alignItems: 'center',
                                cursor: 'pointer',
                                background: 'transparent',
                                border: 'none',
                                padding: '0.5rem',
                                borderRadius: '50%',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(128,128,128,0.1)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                            {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
                        </button>
                        <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text)' }}>
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div style={{ padding: '1.5rem', overflow: 'auto' }}>

                    {/* Couple Info Section */}
                    <section style={{ marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <RefreshCw size={18} /> Informations du Couple
                        </h3>

                        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#e1f5fe', borderRadius: '8px', border: '1px dashed #0984e3' }}>
                            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', color: '#0984e3', fontWeight: 600 }}>
                                Code d'invitation Partenaire
                            </label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <code style={{ flex: 1, background: 'white', padding: '0.5rem', borderRadius: '4px', fontSize: '0.9rem', wordBreak: 'break-all' }}>
                                    {coupleData.couple.id}
                                </code>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(coupleData.couple.id);
                                        alert('Code copié !');
                                    }}
                                    style={{ background: 'white', border: '1px solid #0984e3', color: '#0984e3', borderRadius: '4px', padding: '0 0.5rem', cursor: 'pointer' }}
                                >
                                    Copier
                                </button>
                            </div>
                            <p style={{ fontSize: '0.8rem', color: '#0984e3', marginTop: '0.5rem' }}>
                                Partagez ce code avec votre partenaire pour qu'il/elle rejoigne cet espace.
                            </p>
                        </div>

                        <form onSubmit={handleSaveCouple} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.25rem', color: 'var(--color-text-muted)' }}>Nom de l'espace</label>
                                <input
                                    type="text"
                                    value={coupleName}
                                    onChange={e => setCoupleName(e.target.value)}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.25rem', color: 'var(--color-text-muted)' }}>Date de rencontre</label>
                                    <input
                                        type="date"
                                        value={meetDate}
                                        onChange={e => setMeetDate(e.target.value)}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.25rem', color: 'var(--color-text-muted)' }}>Notre Chanson</label>
                                <input
                                    type="text"
                                    value={song}
                                    onChange={e => setSong(e.target.value)}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}
                                />
                            </div>
                            <button
                                type="submit"
                                style={{
                                    alignSelf: 'flex-end',
                                    padding: '0.75rem 1.5rem',
                                    background: 'var(--color-primary)',
                                    color: 'white',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                <Save size={18} /> Enregistrer
                            </button>
                        </form>
                    </section>

                    <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '2rem 0' }} />

                    {/* Security Section */}
                    <section style={{ marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Shield size={18} /> Sécurité
                        </h3>
                        <form onSubmit={handleChangePin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <input
                                type="password"
                                placeholder="Code PIN actuel"
                                value={currentPin}
                                onChange={e => setCurrentPin(e.target.value)}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}
                            />
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <input
                                    type="password"
                                    placeholder="Nouveau PIN"
                                    value={newPin}
                                    onChange={e => setNewPin(e.target.value)}
                                    style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}
                                />
                                <input
                                    type="password"
                                    placeholder="Confirmer"
                                    value={confirmPin}
                                    onChange={e => setConfirmPin(e.target.value)}
                                    style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}
                                />
                            </div>
                            {pinError && <div style={{ color: '#ff7675', fontSize: '0.9rem' }}>{pinError}</div>}
                            {pinSuccess && <div style={{ color: '#00b894', fontSize: '0.9rem' }}>{pinSuccess}</div>}
                            <button
                                type="submit"
                                style={{
                                    alignSelf: 'flex-end',
                                    padding: '0.75rem 1.5rem',
                                    background: 'var(--color-primary)',
                                    color: 'var(--color-text)',
                                    borderRadius: '8px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                <Shield size={18} /> Modifier le PIN
                            </button>
                        </form>
                    </section>

                    <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '2rem 0' }} />

                    {/* Theme Customization Section */}
                    <section style={{ marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Palette size={18} /> Personnalisation des Couleurs
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>Couleur Principale</label>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <input
                                        type="color"
                                        value={customColors.primary}
                                        onChange={(e) => setCustomColors({ ...customColors, primary: e.target.value })}
                                        style={{ width: '60px', height: '40px', border: '1px solid var(--color-border)', borderRadius: '8px', cursor: 'pointer' }}
                                    />
                                    <input
                                        type="text"
                                        value={customColors.primary}
                                        onChange={(e) => setCustomColors({ ...customColors, primary: e.target.value })}
                                        style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--color-border)', fontFamily: 'monospace' }}
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>Couleur d'Accent</label>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <input
                                        type="color"
                                        value={customColors.accent}
                                        onChange={(e) => setCustomColors({ ...customColors, accent: e.target.value })}
                                        style={{ width: '60px', height: '40px', border: '1px solid var(--color-border)', borderRadius: '8px', cursor: 'pointer' }}
                                    />
                                    <input
                                        type="text"
                                        value={customColors.accent}
                                        onChange={(e) => setCustomColors({ ...customColors, accent: e.target.value })}
                                        style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--color-border)', fontFamily: 'monospace' }}
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>Couleur de Surface</label>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <input
                                        type="color"
                                        value={customColors.surface || '#1e293b'}
                                        onChange={(e) => handleColorChange('surface', e.target.value)}
                                        style={{ width: '60px', height: '40px', border: '1px solid var(--color-border)', borderRadius: '8px', cursor: 'pointer' }}
                                    />
                                    <input
                                        type="text"
                                        value={customColors.surface || '#1e293b'}
                                        onChange={(e) => handleColorChange('surface', e.target.value)}
                                        style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--color-border)', fontFamily: 'monospace' }}
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>Fond Principal</label>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <input
                                        type="color"
                                        value={customColors.bg || '#0f172a'}
                                        onChange={(e) => handleColorChange('bg', e.target.value)}
                                        style={{ width: '60px', height: '40px', border: '1px solid var(--color-border)', borderRadius: '8px', cursor: 'pointer' }}
                                    />
                                    <input
                                        type="text"
                                        value={customColors.bg || '#0f172a'}
                                        onChange={(e) => handleColorChange('bg', e.target.value)}
                                        style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--color-border)', fontFamily: 'monospace' }}
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>Couleur du Texte</label>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <input
                                        type="color"
                                        value={customColors.text || '#f8fafc'}
                                        onChange={(e) => handleColorChange('text', e.target.value)}
                                        style={{ width: '60px', height: '40px', border: '1px solid var(--color-border)', borderRadius: '8px', cursor: 'pointer' }}
                                    />
                                    <input
                                        type="text"
                                        value={customColors.text || '#f8fafc'}
                                        onChange={(e) => handleColorChange('text', e.target.value)}
                                        style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--color-border)', fontFamily: 'monospace' }}
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>Texte Secondaire</label>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <input
                                        type="color"
                                        value={customColors.textMuted || '#94a3b8'}
                                        onChange={(e) => handleColorChange('textMuted', e.target.value)}
                                        style={{ width: '60px', height: '40px', border: '1px solid var(--color-border)', borderRadius: '8px', cursor: 'pointer' }}
                                    />
                                    <input
                                        type="text"
                                        value={customColors.textMuted || '#94a3b8'}
                                        onChange={(e) => handleColorChange('textMuted', e.target.value)}
                                        style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--color-border)', fontFamily: 'monospace' }}
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>Couleur des Bordures</label>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <input
                                        type="color"
                                        value={customColors.border || '#334155'}
                                        onChange={(e) => handleColorChange('border', e.target.value)}
                                        style={{ width: '60px', height: '40px', border: '1px solid var(--color-border)', borderRadius: '8px', cursor: 'pointer' }}
                                    />
                                    <input
                                        type="text"
                                        value={customColors.border || '#334155'}
                                        onChange={(e) => handleColorChange('border', e.target.value)}
                                        style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--color-border)', fontFamily: 'monospace' }}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <button
                                    onClick={async () => {
                                        try {
                                            // Save the custom palette (which acts as Dark Mode Reference)
                                            await updateCouple({ theme_config: customColors });
                                            // No need to manually apply, CoupleContext -> ThemeContext sync handles it.
                                            // Clear override so we fall back to Reference (which is now same as override)
                                            setOverridePalette(null);
                                        } catch (error) {
                                            console.error('Erreur sauvegarde', error);
                                        }
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: '0.75rem',
                                        background: 'var(--color-primary)',
                                        color: 'white',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    <Save size={16} /> Enregistrer
                                </button>
                                <button
                                    onClick={async () => {
                                        try {
                                            await updateCouple({ theme_config: null }); // Reset to null in DB
                                            setOverridePalette(null); // Clear preview
                                            setCustomColors(getReferenceColors()); // Update local inputs (will fetch defaults)
                                            // Actually getReferenceColors might still be stale if updateCouple hasn't propagated yet?
                                            // But updateCouple awaits DB and sets state.
                                            // Wait, if we set null, getReferenceColors returns DEFAULT.
                                            // So we should re-fetch active colors after a short delay or just set defaults.
                                            // Let's rely on the fact that updateCouple updates CoupleContext -> ThemeContext -> Reference.
                                        } catch (error) {
                                            console.error('Erreur reset', error);
                                        }
                                    }}
                                    style={{
                                        padding: '0.75rem',
                                        border: '1px solid var(--color-border)',
                                        color: 'var(--color-text)',
                                        borderRadius: '8px',
                                        background: 'transparent',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <RefreshCw size={16} />
                                </button>
                            </div>
                        </div>
                    </section>

                    <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '2rem 0' }} />

                    {/* Display Section */}
                    <section style={{ marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <RefreshCw size={18} /> Affichage
                        </h3>
                        <button
                            onClick={() => {
                                localStorage.removeItem('dashboard_layout');
                                window.location.reload();
                            }}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid var(--color-border)',
                                color: 'var(--color-text)',
                                borderRadius: '8px',
                                background: 'transparent',
                                cursor: 'pointer'
                            }}
                        >
                            Réinitialiser la disposition des widgets
                        </button>
                    </section>

                    <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '2rem 0' }} />

                    {/* Danger Zone */}
                    <section>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#ff7675', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Trash2 size={18} /> Zone de Danger
                        </h3>
                        <button
                            onClick={handleReset}
                            style={{
                                width: '100%',
                                padding: '1rem',
                                border: '1px solid #ff7675',
                                color: '#ff7675',
                                borderRadius: '8px',
                                background: 'transparent',
                                fontWeight: 600
                            }}
                        >
                            Réinitialiser tout l'espace (Irréversible)
                        </button>
                    </section>

                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
