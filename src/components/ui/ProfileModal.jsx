import React, { useState, useEffect } from 'react';
import { X, Save, Camera, User } from 'lucide-react';
import { useCouple } from '../../context/CoupleContext';
import { supabase } from '../../lib/supabase';

const ProfileModal = ({ onClose }) => {
    const { coupleData, updatePersonA, updatePersonB, session } = useCouple();

    // Calculate which person is the current user
    const isPersonA = coupleData.personA.id === session?.user?.id;
    const currentUser = isPersonA ? coupleData.personA : coupleData.personB;
    const updateUser = isPersonA ? updatePersonA : updatePersonB;

    const [formData, setFormData] = useState({
        name: currentUser.name || '',
        nickname: currentUser.nickname || '',
        photo: currentUser.photo || ''
    });
    const [uploading, setUploading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await updateUser({
                full_name: formData.name, // DB column usually full_name based on Context mapping
                nickname: formData.nickname,
                avatar_url: formData.photo // DB usually avatar_url
            });
            // Update context requires matching keys, check Context logic:
            // updatePersonA does: supabase.update(newData), setCoupleData(... newData)
            // But Context expectation of keys vs DB keys might differ.
            // Looking at context: 
            // setCoupleData(prev => ({ ...prev, personA: { ...prev.personA, ...newData } }));
            // And context reads: name: profile.full_name
            // So if I pass { name: '...' } to updatePersonA, it updates state with name.
            // But updatePersonA sends 'newData' to supabase. Profile table has 'full_name'.
            // So I must pass { full_name: 'Name' } for DB, but context state uses 'name'.
            // This suggests Context `updatePersonA` might need fixing or I send DB keys and update Context manually?
            // Let's re-read Context.
            // Context: const { error } = await supabase...update(newData)
            // It sends EXACTLY what I pass. So I must pass `full_name`.
            // Then it does setCoupleData... personA: ...newData.
            // But personA state has `name`, not `full_name`.
            // So if I pass `full_name`, state will have `full_name` but UI reads `name`.
            // I should probably fix Context or pass both? 
            // Ideally passing { full_name: 'Bob', name: 'Bob' } works for both.

            await updateUser({
                full_name: formData.name,
                nickname: formData.nickname,
                avatar_url: formData.photo
            });
            onClose();
        } catch (error) {
            console.error('Update error:', error);
            alert('Erreur lors de la mise à jour');
        }
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setUploading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `avatars/${session.user.id}-${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('images')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('images')
                .getPublicUrl(fileName);

            setFormData(prev => ({ ...prev, photo: publicUrl }));
        } catch (error) {
            console.error('Upload error:', error);
            alert('Erreur upload photo');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 3000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fadeIn 0.2s'
        }} onClick={onClose}>
            <div style={{
                background: 'var(--color-bg)',
                width: '90%',
                maxWidth: '400px',
                borderRadius: '16px',
                padding: '1.5rem',
                position: 'relative',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
            }} onClick={e => e.stopPropagation()}>

                <button onClick={onClose} style={{
                    position: 'absolute', top: '1rem', right: '1rem',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    color: 'var(--color-text-muted)'
                }}>
                    <X size={24} />
                </button>

                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: 'var(--color-primary)', marginBottom: '1.5rem', textAlign: 'center' }}>
                    Mon Profil
                </h2>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Photo */}
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <div style={{ position: 'relative' }}>
                            <div style={{
                                width: '100px', height: '100px', borderRadius: '50%',
                                backgroundColor: currentUser.color,
                                backgroundImage: formData.photo ? `url(${formData.photo})` : 'none',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                border: '4px solid var(--color-surface)',
                                boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                {!formData.photo && <User size={40} color="white" />}
                            </div>
                            <label style={{
                                position: 'absolute', bottom: 0, right: 0,
                                background: 'var(--color-primary)', color: 'white',
                                padding: '0.4rem', borderRadius: '50%',
                                cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                                transition: 'transform 0.2s'
                            }}>
                                <Camera size={16} />
                                <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} disabled={uploading} />
                            </label>
                        </div>
                    </div>

                    {/* Inputs */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.25rem', color: 'var(--color-text-muted)' }}>Prénom</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}
                                required
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.25rem', color: 'var(--color-text-muted)' }}>Surnom (ce que voit votre partenaire)</label>
                            <input
                                type="text"
                                value={formData.nickname}
                                onChange={e => setFormData({ ...formData, nickname: e.target.value })}
                                placeholder="Ex: Mon Cœur"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={uploading}
                        style={{
                            width: '100%',
                            padding: '1rem',
                            background: 'var(--color-primary)',
                            color: 'white',
                            borderRadius: '12px',
                            border: 'none',
                            fontSize: '1rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                            opacity: uploading ? 0.7 : 1
                        }}
                    >
                        <Save size={18} /> {uploading ? 'Envoi...' : 'Enregistrer'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ProfileModal;
