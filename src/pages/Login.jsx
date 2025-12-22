import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCouple } from '../context/CoupleContext';
import { Lock, Mail, User, ArrowRight, Heart } from 'lucide-react';

const Login = () => {
    const { login, signup } = useCouple();
    const [isSignUp, setIsSignUp] = useState(false);

    // Form States
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [fullName, setFullName] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            if (isSignUp) {
                if (!username || !fullName) {
                    throw new Error("Merci de remplir tous les champs pour continuer.");
                }
                // Step 1: Create Personal Account
                const data = await signup(email, password, username, fullName);

                if (data.session) {
                    // Auto-login successful -> Go to Step 2 (Onboarding)
                    navigate('/onboarding');
                } else if (data.user && !data.session) {
                    // Email verification required
                    setSuccess('Compte créé avec succès ! Veuillez vérifier vos emails pour valider votre inscription.');
                    setIsSignUp(false);
                }
            } else {
                // Login
                await login(email, password);
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.message || 'Une erreur est survenue');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--color-bg)',
            padding: '1rem',
            flexDirection: 'column'
        }}>
            {/* Steps Guide (Visible only on SignUp) */}
            {isSignUp && (
                <div style={{ marginBottom: '2rem', width: '100%', maxWidth: '600px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                        {/* Connecting Line */}
                        <div style={{ position: 'absolute', top: '15px', left: '0', right: '0', height: '2px', background: '#dfe6e9', zIndex: 0 }}></div>

                        {[
                            { label: 'Inscription', icon: '1' },
                            { label: 'Connexion', icon: '2' },
                            { label: 'Profil', icon: '3' },
                            { label: 'Dashboard', icon: '4' }
                        ].map((step, index) => (
                            <div key={index} style={{ position: 'relative', zIndex: 1, textAlign: 'center', background: 'var(--color-bg)', padding: '0 10px' }}>
                                <div style={{
                                    width: '30px', height: '30px', borderRadius: '50%',
                                    background: index === 0 ? 'var(--color-primary)' : '#b2bec3',
                                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    margin: '0 auto 0.5rem auto', fontWeight: 'bold'
                                }}>
                                    {step.icon}
                                </div>
                                <span style={{ fontSize: '0.8rem', color: index === 0 ? 'var(--color-primary)' : '#636e72', fontWeight: index === 0 ? 'bold' : 'normal' }}>
                                    {step.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div style={{
                background: 'var(--color-surface)',
                color: 'var(--color-text)',
                padding: '2.5rem',
                borderRadius: '24px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.05)',
                width: '100%',
                maxWidth: '450px'
            }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ display: 'inline-flex', padding: '1rem', borderRadius: '50%', background: 'rgba(225, 112, 85, 0.1)', marginBottom: '1rem', color: 'var(--color-primary)' }}>
                        {isSignUp ? <User size={32} /> : <Heart size={32} />}
                    </div>
                    <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', marginBottom: '0.5rem' }}>
                        {isSignUp ? 'Créer votre profil' : 'Bon retour'}
                    </h2>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                        {isSignUp
                            ? 'Commencez votre aventure à deux.'
                            : 'Connectez-vous pour accéder à votre espace.'}
                    </p>
                </div>

                {/* Success Message */}
                {success && (
                    <div style={{
                        backgroundColor: '#f0fff4',
                        color: '#2f855a',
                        padding: '1rem',
                        borderRadius: '12px',
                        marginBottom: '1.5rem',
                        fontSize: '0.9rem',
                        border: '1px solid #c6f6d5',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        <span>✅</span> {success}
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div style={{
                        backgroundColor: '#fff5f5',
                        color: '#e02424',
                        padding: '1rem',
                        borderRadius: '12px',
                        marginBottom: '1.5rem',
                        fontSize: '0.9rem',
                        border: '1px solid #fed7d7',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        <span>⚠️</span> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>

                    {isSignUp && (
                        <>
                            {/* Full Name */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text)' }}>
                                    Prénom
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="Ex: Camille"
                                        required
                                        style={inputStyle}
                                    />
                                </div>
                            </div>

                            {/* Username */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text)' }}>
                                    Nom d'utilisateur (Unique)
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', fontWeight: 'bold' }}>@</span>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                                        placeholder="camille_123"
                                        required
                                        style={inputStyle}
                                    />
                                </div>
                                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                                    Servira à vous identifier pour la connexion.
                                </p>
                            </div>
                        </>
                    )}

                    {/* Email */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text)' }}>
                            {isSignUp ? 'Adresse Email' : 'Email ou Nom d\'utilisateur'}
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                            <input
                                type="text"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={isSignUp ? "camille@exemple.com" : "Email ou @pseudo"}
                                required
                                style={inputStyle}
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text)' }}>
                            {isSignUp ? 'Créer un mot de passe' : 'Votre mot de passe'}
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={isSignUp ? "Minimum 6 caractères" : "••••••••"}
                                required
                                minLength={6}
                                style={inputStyle}
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            padding: '1rem',
                            backgroundColor: 'var(--color-primary)',
                            color: 'white',
                            borderRadius: '12px',
                            fontSize: '1rem',
                            fontWeight: 600,
                            border: 'none',
                            cursor: loading ? 'wait' : 'pointer',
                            marginTop: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            transition: 'opacity 0.2s'
                        }}
                    >
                        {loading ? 'Chargement...' : (isSignUp ? "Créer mon compte" : 'Se connecter')}
                        {!loading && <ArrowRight size={20} />}
                    </button>
                </form>

                {/* Toggle Mode */}
                <div style={{ marginTop: '2rem', textAlign: 'center', borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                        {isSignUp ? 'Vous avez déjà un compte ?' : "Nouveau sur l'application ?"}
                    </p>
                    <button
                        onClick={() => {
                            setIsSignUp(!isSignUp);
                            setError('');
                        }}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--color-primary)',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontSize: '1rem',
                            textDecoration: 'underline'
                        }}
                    >
                        {isSignUp ? 'Se connecter' : "Créer un compte"}
                    </button>
                </div>

                {/* Emergency Reset */}
                <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                    <button
                        onClick={() => { localStorage.clear(); window.location.reload(); }}
                        style={{ fontSize: '0.8rem', color: '#b2bec3', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                        Problème d'affichage ? Réinitialiser
                    </button>
                </div>
            </div>
        </div>
    );
};

const inputStyle = {
    width: '100%',
    padding: '1rem 1rem 1rem 3rem',
    fontSize: '1rem',
    borderRadius: '12px',
    border: '1px solid var(--color-border)',
    outline: 'none',
    transition: 'border-color 0.2s',
    backgroundColor: 'var(--color-bg)',
    color: 'var(--color-text)'
};

export default Login;
