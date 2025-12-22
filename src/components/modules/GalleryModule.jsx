import React, { useState, useEffect } from 'react';
import { Plus, X, Image as ImageIcon, Loader } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCouple } from '../../context/CoupleContext';

const GalleryModule = () => {
    const { coupleData } = useCouple();
    const [photos, setPhotos] = useState([]);
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (coupleData?.couple?.id) {
            fetchPhotos();
        }
    }, [coupleData?.couple?.id]);

    const fetchPhotos = async () => {
        try {
            const { data, error } = await supabase
                .from('photos')
                .select('*')
                .eq('couple_id', coupleData.couple.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPhotos(data || []);
        } catch (error) {
            console.error('Error fetching photos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddPhoto = async (e) => {
        const file = e.target.files[0];
        if (!file || !coupleData?.couple?.id) return;

        try {
            setUploading(true);

            // 1. Upload to Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `${coupleData.couple.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('images')
                .getPublicUrl(filePath);

            // 3. Insert into DB
            const { data: newPhoto, error: dbError } = await supabase
                .from('photos')
                .insert([{
                    couple_id: coupleData.couple.id,
                    url: publicUrl,
                    caption: ''
                }])
                .select()
                .single();

            if (dbError) throw dbError;

            setPhotos([newPhoto, ...photos]);
        } catch (error) {
            console.error('Error uploading photo:', error);
            alert('Erreur lors de l\'upload');
        } finally {
            setUploading(false);
        }
    };

    const deletePhoto = async (id) => {
        try {
            const { error } = await supabase
                .from('photos')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setPhotos(photos.filter(p => p.id !== id));
            if (selectedPhoto && selectedPhoto.id === id) setSelectedPhoto(null);
        } catch (error) {
            console.error('Error deleting photo:', error);
            alert('Erreur lors de la suppression');
        }
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><Loader className="animate-spin" /></div>;

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Actions */}
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                <label style={{
                    cursor: uploading ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.9rem',
                    color: 'var(--color-primary)',
                    padding: '0.5rem 1rem',
                    borderRadius: '20px',
                    backgroundColor: 'rgba(0,0,0,0.05)',
                    transition: 'background 0.2s',
                    opacity: uploading ? 0.7 : 1
                }}>
                    {uploading ? <Loader size={16} className="animate-spin" /> : <Plus size={16} />}
                    {uploading ? 'Envoi...' : 'Ajouter une photo'}
                    <input type="file" accept="image/*" onChange={handleAddPhoto} disabled={uploading} style={{ display: 'none' }} />
                </label>
            </div>

            {/* Grid */}
            {photos.length === 0 ? (
                <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-text-muted)',
                    opacity: 0.7
                }}>
                    <ImageIcon size={48} strokeWidth={1} />
                    <p style={{ marginTop: '1rem' }}>Aucune photo pour le moment</p>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                    gap: '0.5rem',
                    overflow: 'auto',
                    paddingRight: '0.5rem'
                }}>
                    {photos.map(photo => (
                        <div
                            key={photo.id}
                            onClick={() => setSelectedPhoto(photo)}
                            style={{
                                aspectRatio: '1',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                cursor: 'pointer',
                                position: 'relative',
                                border: '1px solid var(--color-border)'
                            }}
                        >
                            <img
                                src={photo.url}
                                alt="Souvenir"
                                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
                                onMouseOver={(e) => e.target.style.transform = 'scale(1.1)'}
                                onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Lightbox Modal */}
            {selectedPhoto && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.9)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem'
                }} onClick={() => setSelectedPhoto(null)}>
                    <button
                        onClick={() => setSelectedPhoto(null)}
                        style={{
                            position: 'absolute',
                            top: '1rem',
                            right: '1rem',
                            color: 'white',
                            padding: '0.5rem'
                        }}
                    >
                        <X size={32} />
                    </button>
                    <div style={{ position: 'relative', maxWidth: '100%', maxHeight: '100%' }} onClick={e => e.stopPropagation()}>
                        <img
                            src={selectedPhoto.url}
                            alt="Full size"
                            style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: '4px' }}
                        />
                        <button
                            onClick={() => deletePhoto(selectedPhoto.id)}
                            style={{
                                position: 'absolute',
                                bottom: '-3rem',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                color: '#ff7675',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            Supprimer
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GalleryModule;
