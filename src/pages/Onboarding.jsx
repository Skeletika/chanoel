import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCouple } from '../context/CoupleContext';
import { User, Heart, Lock, ArrowRight, ArrowLeft, Camera, Copy, Check, LogOut } from 'lucide-react';

const Onboarding = () => {
    const navigate = useNavigate();
    const { session, coupleData, fetchCoupleData, logout } = useCouple();
    const [step, setStep] = useState(0); // 0: Choice, 1: Create/Join Form, 2: Profile Setup
    const [mode, setMode] = useState(null); // 'create' or 'join'
    const [loading, setLoading] = useState(false);

    // Form Data
    const [joinCode, setJoinCode] = useState('');
    const [coupleId, setCoupleId] = useState(null); // The ID of the created or joined couple
    const [profileData, setProfileData] = useState({
        fullName: '',
        nickname: '',
        color: '#e17055',
        avatar_url: null
    });
    const [coupleDataForm, setCoupleDataForm] = useState({
        name: 'Notre Espace',
        meetDate: '',
        pin: ''
    });

    useEffect(() => {
        if (session?.user?.user_metadata?.full_name) {
            setProfileData(prev => ({ ...prev, fullName: session.user.user_metadata.full_name }));
        }
    }, [session]);

    // Security Redirect
    useEffect(() => {
        if (!loading && !session) {
            navigate('/login');
        }
    }, [session, loading, navigate]);

    // Redirect if user already has a couple
    useEffect(() => {
        if (coupleData?.couple?.id && coupleData.isAuthenticated) {
            navigate('/dashboard', { replace: true });
        }
    }, [coupleData, navigate]);

    // Prevent rendering if user has a couple (avoid flicker/access)
    if (coupleData?.couple?.id && coupleData.isAuthenticated) {
        return null; // Or a loading spinner
    }

    const handleCreateCouple = async () => {
        setLoading(true);
        try {
            // 1. Create Couple
            const { data: newCouple, error: coupleError } = await supabase
                .from('couples')
                .insert([{
                    name: coupleDataForm.name,
                    meet_date: coupleDataForm.meetDate || null,
                    pin_code: coupleDataForm.pin || null
                }])
                .select()
                .single();

            if (coupleError) throw coupleError;
            setCoupleId(newCouple.id);
            setMode('create');
            setStep(2); // Go to profile setup
        } catch (error) {
            console.error('Error creating couple:', error);
            alert('Erreur lors de la création du couple');
        } finally {
            setLoading(false);
        }
    };

    const handleJoinCouple = async () => {
        setLoading(true);
        try {
            // 1. Verify Couple Exists (using ID for now, could be a shorter code later)
            const { data: couple, error } = await supabase
                .from('couples')
                .select('id, name')
                .eq('id', joinCode)
                .single();

            if (error || !couple) throw new Error("Espace introuvable. Vérifiez le code.");

            setCoupleId(couple.id);
            setMode('join');
            setStep(2); // Go to profile setup
        } catch (error) {
            console.error('Error joining couple:', error);
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProfile = async () => {
        if (!coupleId) {
            alert("Erreur: Aucun espace couple défini.");
            return;
        }
        if (!session?.user?.id) {
            alert("Erreur: Session expirée. Veuillez vous reconnecter.");
            navigate('/login');
            return;
        }

        setLoading(true);
        try {
            // 2. Create or Update Profile linked to Couple
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert([{
                    id: session.user.id,
                    couple_id: coupleId,
                    full_name: profileData.fullName,
                    nickname: profileData.nickname,
                    color: profileData.color,
                    avatar_url: profileData.avatar_url,
                    email: session.user.email,
                    username: session.user.user_metadata?.username
                }]);

            if (profileError) throw profileError;

            // 3. Refresh Context and Redirect
            await fetchCoupleData(session.user.id);
            navigate('/dashboard');
        } catch (error) {
            console.error('Error creating profile:', error);
            alert(`Erreur lors de la création du profil: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // --- UI Components ---

    const Stepper = ({ current }) => {
        const steps = ['Choix', 'Espace', 'Profil'];
        return (
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', marginBottom: '2rem', gap: '0.5rem', width: '100%' }}>
                {steps.map((label, i) => (
                    <React.Fragment key={i}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', zIndex: 1 }}>
                            <div style={{
                                width: '30px', height: '30px', borderRadius: '50%',
                                background: current >= i ? 'var(--color-primary)' : '#dfe6e9',
                                color: current >= i ? 'white' : '#636e72',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 'bold', fontSize: '0.8rem',
                                transition: 'background 0.3s'
                            }}>
                                {i + 1}
                            </div>
                            <span style={{
                                fontSize: '0.75rem',
                                color: current >= i ? 'var(--color-primary)' : '#b2bec3',
                                fontWeight: current >= i ? '600' : '400'
                            }}>
                                {label}
                            </span>
                        </div>
                        {i < 2 && (
                            <div style={{
                                flex: 1,
                                height: '2px',
                                background: current > i ? 'var(--color-primary)' : '#dfe6e9',
                                marginTop: '14px',
                                minWidth: '30px',
                                maxWidth: '60px'
                            }} />
                        )}
                    </React.Fragment>
                ))}
            </div>
        );
    };

    if (step === 0) {
        return (
            <div style={containerStyle}>
                <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        <div style={{ fontWeight: 'bold', color: 'var(--color-text)' }}>@{session?.user?.user_metadata?.username}</div>
                        <div>{session?.user?.email}</div>
                    </div>
                    <button onClick={logout} style={{ color: 'var(--color-text-muted)', padding: '0.5rem', borderRadius: '50%', border: '1px solid var(--color-border)' }} title="Se déconnecter">
                        <LogOut size={16} />
                    </button>
                </div>

                <Stepper current={0} />
                <h1 style={titleStyle}>Bienvenue !</h1>
                <p style={subtitleStyle}>Que souhaitez-vous faire ?</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
                    <button onClick={() => setStep(1)} style={primaryButtonStyle}>
                        <Heart size={20} /> Créer un nouvel espace couple
                    </button>
                    <button onClick={() => setStep(10)} style={secondaryButtonStyle}>
                        <User size={20} /> Rejoindre mon partenaire
                    </button>
                </div>
            </div>
        );
    }

    // Step 1: Create Space Details
    if (step === 1) {
        return (
            <div style={containerStyle}>
                <Stepper current={1} />
                <h2 style={titleStyle}>Créer votre espace</h2>
                <div style={{ width: '100%', textAlign: 'left' }}>
                    <label style={labelStyle}>Nom de votre espace</label>
                    <input
                        type="text"
                        value={coupleDataForm.name}
                        onChange={e => setCoupleDataForm({ ...coupleDataForm, name: e.target.value })}
                        style={inputStyle}
                    />

                    <label style={labelStyle}>Date de rencontre (optionnel)</label>
                    <input
                        type="date"
                        value={coupleDataForm.meetDate}
                        onChange={e => setCoupleDataForm({ ...coupleDataForm, meetDate: e.target.value })}
                        style={inputStyle}
                    />

                    <label style={labelStyle}>Code PIN (optionnel, pour l'accès)</label>
                    <input
                        type="text"
                        maxLength={6}
                        placeholder="Ex: 1234"
                        value={coupleDataForm.pin}
                        onChange={e => setCoupleDataForm({ ...coupleDataForm, pin: e.target.value })}
                        style={inputStyle}
                    />
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', width: '100%' }}>
                    <button onClick={() => setStep(0)} style={secondaryButtonStyle}>Retour</button>
                    <button onClick={handleCreateCouple} disabled={loading} style={primaryButtonStyle}>
                        {loading ? 'Création...' : 'Continuer'}
                    </button>
                </div>
            </div>
        );
    }

    // Step 10: Join Space Input
    if (step === 10) {
        return (
            <div style={containerStyle}>
                <Stepper current={1} />
                <h2 style={titleStyle}>Rejoindre un espace</h2>
                <p style={subtitleStyle}>Entrez le code que votre partenaire vous a donné.</p>

                <input
                    type="text"
                    placeholder="Code de l'espace (UUID)"
                    value={joinCode}
                    onChange={e => setJoinCode(e.target.value)}
                    style={inputStyle}
                />

                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', width: '100%' }}>
                    <button onClick={() => setStep(0)} style={secondaryButtonStyle}>Retour</button>
                    <button onClick={handleJoinCouple} disabled={loading} style={primaryButtonStyle}>
                        {loading ? 'Vérification...' : 'Rejoindre'}
                    </button>
                </div>
            </div>
        );
    }

    // Step 2: Profile Setup (Common)
    if (step === 2) {
        return (
            <div style={containerStyle}>
                <Stepper current={2} />
                <h2 style={titleStyle}>C'est presque fini !</h2>
                <p style={subtitleStyle}>Qui êtes-vous dans ce couple ?</p>

                {mode === 'create' && coupleId && (
                    <div style={{ background: 'rgba(129, 140, 248, 0.1)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', border: '1px solid var(--color-primary)' }}>
                        <strong style={{ color: 'var(--color-primary)' }}>Code à donner à votre partenaire :</strong>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', background: 'var(--color-bg)', padding: '0.5rem', borderRadius: '4px', border: '1px dashed var(--color-primary)' }}>
                            <code style={{ wordBreak: 'break-all', color: 'var(--color-text)' }}>{coupleId}</code>
                            <Copy size={16} style={{ cursor: 'pointer', color: 'var(--color-text-muted)' }} onClick={() => navigator.clipboard.writeText(coupleId)} />
                        </div>
                    </div>
                )}

                <div style={{ width: '100%', textAlign: 'left', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

                    {/* Avatar Upload - Centered & Modern */}
                    <div style={{ position: 'relative', marginBottom: '2rem' }}>
                        <label
                            htmlFor="avatar-upload"
                            style={{
                                cursor: 'pointer',
                                display: 'block',
                                position: 'relative',
                                transition: 'transform 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <div style={{
                                width: '120px',
                                height: '120px',
                                borderRadius: '50%',
                                backgroundColor: 'var(--color-bg)',
                                backgroundImage: profileData.avatar_url ? `url(${profileData.avatar_url})` : 'none',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                border: '4px solid var(--color-surface)',
                                boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {!profileData.avatar_url && <User size={48} color="white" opacity={0.8} />}
                            </div>
                            <div style={{
                                position: 'absolute',
                                bottom: '0',
                                right: '0',
                                background: 'var(--color-primary)',
                                color: 'white',
                                padding: '0.5rem',
                                borderRadius: '50%',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Camera size={18} />
                            </div>
                        </label>
                        <input
                            id="avatar-upload"
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                                const file = e.target.files[0];
                                if (!file) return;
                                try {
                                    setLoading(true);
                                    const fileExt = file.name.split('.').pop();
                                    const fileName = `${Math.random()}.${fileExt}`;
                                    const filePath = `avatars/${fileName}`;

                                    const { error: uploadError } = await supabase.storage
                                        .from('images')
                                        .upload(filePath, file);

                                    if (uploadError) throw uploadError;

                                    const { data: { publicUrl } } = supabase.storage
                                        .from('images')
                                        .getPublicUrl(filePath);

                                    setProfileData(prev => ({ ...prev, avatar_url: publicUrl }));
                                } catch (error) {
                                    console.error('Error uploading image:', error);
                                    alert('Erreur lors de l\'upload de l\'image');
                                } finally {
                                    setLoading(false);
                                }
                            }}
                            style={{ display: 'none' }}
                        />
                    </div>

                    <div style={{ width: '100%' }}>
                        <label style={labelStyle}>Votre Prénom</label>
                        <input
                            type="text"
                            value={profileData.fullName}
                            onChange={e => setProfileData({ ...profileData, fullName: e.target.value })}
                            style={inputStyle}
                            placeholder="Ex: Charline"
                        />

                        <label style={labelStyle}>Surnom (donné par votre partenaire)</label>
                        <input
                            type="text"
                            value={profileData.nickname}
                            onChange={e => setProfileData({ ...profileData, nickname: e.target.value })}
                            style={inputStyle}
                            placeholder="Ex: Ma femme idéale"
                        />



                        <label style={labelStyle}>Votre couleur préférée</label>
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem', justifyContent: 'center' }}>
                            {['#e17055', '#0984e3', '#00b894', '#6c5ce7', '#fdcb6e', '#e84393', '#2d3436'].map(color => (
                                <button
                                    key={color}
                                    onClick={() => setProfileData({ ...profileData, color })}
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        backgroundColor: color,
                                        border: profileData.color === color ? '3px solid var(--color-text)' : '2px solid transparent',
                                        cursor: 'pointer',
                                        transition: 'transform 0.2s',
                                        transform: profileData.color === color ? 'scale(1.1)' : 'scale(1)',
                                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                                    }}
                                    aria-label={`Choisir la couleur ${color}`}
                                />
                            ))}
                            {/* Custom Color Picker Hidden but accessible via a "+" button if needed, or just keep it simple */}
                            <div style={{ position: 'relative', width: '40px', height: '40px' }}>
                                <input
                                    type="color"
                                    value={profileData.color}
                                    onChange={e => setProfileData({ ...profileData, color: e.target.value })}
                                    style={{
                                        opacity: 0,
                                        position: 'absolute',
                                        top: 0, left: 0,
                                        width: '100%', height: '100%',
                                        cursor: 'pointer'
                                    }}
                                />
                                <div style={{
                                    width: '100%', height: '100%',
                                    borderRadius: '50%',
                                    background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)',
                                    border: '2px solid var(--color-border)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <span style={{ fontSize: '1.2rem', color: 'white', textShadow: '0 1px 2px black' }}>+</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <button onClick={handleCreateProfile} disabled={loading} style={{ ...primaryButtonStyle, marginTop: '2rem' }}>
                    {loading ? 'Finalisation...' : 'Entrer dans l\'espace'}
                </button>
            </div>
        );
    }

    return null;
};

// Styles
const containerStyle = {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    maxWidth: '500px',
    margin: '0 auto',
    textAlign: 'center'
};

const titleStyle = {
    fontFamily: 'var(--font-serif)',
    fontSize: '2rem',
    marginBottom: '1rem',
    color: 'var(--color-text)'
};

const subtitleStyle = {
    color: 'var(--color-text-muted)',
    marginBottom: '2rem'
};

const primaryButtonStyle = {
    background: 'var(--color-primary)',
    color: 'white',
    border: 'none',
    padding: '1rem',
    borderRadius: '12px',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem'
};

const secondaryButtonStyle = {
    background: 'var(--color-surface)',
    color: 'var(--color-text)',
    border: '1px solid var(--color-border)',
    padding: '1rem',
    borderRadius: '12px',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem'
};

const inputStyle = {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '8px',
    border: '1px solid var(--color-border)',
    background: 'var(--color-bg)',
    color: 'var(--color-text)',
    fontSize: '1rem',
    marginBottom: '1rem',
    outline: 'none'
};

const labelStyle = {
    display: 'block',
    marginBottom: '0.5rem',
    fontSize: '0.9rem',
    fontWeight: 500,
    color: 'var(--color-text)'
};

export default Onboarding;
