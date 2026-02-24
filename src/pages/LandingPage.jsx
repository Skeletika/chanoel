import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)',
            textAlign: 'center',
            padding: '2rem'
        }}>
            <div style={{ marginBottom: '2rem', color: 'var(--color-accent)' }}>
                <Heart size={64} strokeWidth={1} fill="currentColor" style={{ opacity: 0.8 }} />
            </div>

            <h1 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '3rem',
                marginBottom: '1rem',
                color: 'var(--color-primary)'
            }}>
                Notre Espace
            </h1>

            <p style={{
                maxWidth: '400px',
                marginBottom: '3rem',
                color: 'var(--color-text-muted)',
                fontSize: '1.1rem'
            }}>
                Un sanctuaire numérique pour vos souvenirs, vos projets et votre histoire commune.
            </p>

            <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                    onClick={() => navigate('/onboarding')}
                    style={{
                        padding: '1rem 2rem',
                        backgroundColor: 'var(--color-primary)',
                        color: 'white',
                        borderRadius: '50px',
                        fontSize: '1rem',
                        transition: 'transform 0.2s ease',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    Créer notre espace
                </button>

                <button
                    onClick={() => navigate('/login')}
                    style={{
                        padding: '1rem 2rem',
                        backgroundColor: 'transparent',
                        color: 'var(--color-primary)',
                        border: '1px solid var(--color-primary)',
                        borderRadius: '50px',
                        fontSize: '1rem',
                        transition: 'background 0.2s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                    Se connecter
                </button>
            </div>
        </div>
    );
};

export default LandingPage;
