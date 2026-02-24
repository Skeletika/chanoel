import React, { useState, useEffect } from 'react';
import { Plus, X, Image as ImageIcon, Loader, FileDown, Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCouple } from '../../context/CoupleContext';
import { useRealtime } from '../../hooks/useRealtime';
import JSZip from 'jszip';

const GalleryModule = () => {
    const { coupleData } = useCouple();
    const [photos, setPhotos] = useState([]);
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [displayCount, setDisplayCount] = useState(5);
    const [isExporting, setIsExporting] = useState(false);
    const [showDownloadConfirm, setShowDownloadConfirm] = useState(false);
    const [coupleConfig, setCoupleConfig] = useState(null);
    const [showLimitAlert, setShowLimitAlert] = useState(false);
    const PHOTOS_PER_LOAD = 5;
    const PHOTO_LIMIT = 25;

    useRealtime('photos', () => {
        fetchPhotos();
    });

    // Fonction pour créer un thumbnail compressé côté client
    const createThumbnail = (file, maxWidth = 150, quality = 0.6) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ratio = img.height / img.width;
                    canvas.width = maxWidth;
                    canvas.height = maxWidth * ratio;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    
                    canvas.toBlob((blob) => {
                        resolve(blob || null);
                    }, 'image/jpeg', quality);
                };
                img.src = event.target.result;
            };
        });
    };

    useEffect(() => {
        if (coupleData?.couple?.id) {
            fetchPhotos();
            fetchCoupleConfig();
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

    const fetchCoupleConfig = async () => {
        try {
            const { data, error } = await supabase
                .from('couples')
                .select('unlimited_photos')
                .eq('id', coupleData.couple.id)
                .single();

            if (error) throw error;
            setCoupleConfig(data);
        } catch (error) {
            console.error('Error fetching couple config:', error);
            // Par défaut, on assume que unlimited_photos est false
            setCoupleConfig({ unlimited_photos: false });
        }
    };

    const handleAddPhoto = async (e) => {
        const file = e.target.files[0];
        if (!file || !coupleData?.couple?.id) return;

        // Vérifier la limite de photos
        if (!coupleConfig?.unlimited_photos && photos.length >= PHOTO_LIMIT) {
            setShowLimitAlert(true);
            return;
        }

        try {
            setUploading(true);

            // 1. Upload l'image originale compressée (JPEG)
            const fileExt = 'jpg';
            const fileName = `${Date.now()}-full.${fileExt}`;
            const filePath = `${coupleData.couple.id}/${fileName}`;

            // Compresser l'image originale
            const fullBlob = await createThumbnail(file, 2000, 0.75); // 2000px max, qualité 75%
            
            const { error: uploadError } = await supabase.storage
                .from('images')
                .upload(filePath, fullBlob || file);

            if (uploadError) throw uploadError;

            // 2. Créer et uploader le thumbnail compressé
            const thumbBlob = await createThumbnail(file, 150, 0.5);
            const thumbFileName = `${Date.now()}-thumb.jpg`;
            const thumbPath = `${coupleData.couple.id}/${thumbFileName}`;
            
            if (thumbBlob) {
                await supabase.storage
                    .from('images')
                    .upload(thumbPath, thumbBlob);
            }

            // 3. Get Public URLs
            const { data: { publicUrl: fullUrl } } = supabase.storage
                .from('images')
                .getPublicUrl(filePath);

            const { data: { publicUrl: thumbUrl } } = supabase.storage
                .from('images')
                .getPublicUrl(thumbPath);

            // 4. Insert into DB
            const { error: dbError } = await supabase
                .from('photos')
                .insert([{
                    couple_id: coupleData.couple.id,
                    url: fullUrl,
                    thumb_url: thumbUrl,
                    caption: '',
                }]);

            if (dbError) throw dbError;

        } catch (error) {
            console.error('Error uploading photo:', error);
            alert('Erreur lors de l\'upload');
        } finally {
            setUploading(false);
        }
    };

    const [confirmingDelete, setConfirmingDelete] = useState(null);

    const deletePhoto = async (photo) => {
        try {
            // 1. Delete from Storage (Extract path from URL)
            const urlParts = photo.url.split('/images/');
            if (urlParts.length > 1) {
                const storagePath = urlParts[1];
                const { error: storageError } = await supabase.storage
                    .from('images')
                    .remove([storagePath]);

                // Aussi supprimer le thumbnail
                const thumbPath = storagePath.replace('-full.', '-thumb.');
                await supabase.storage
                    .from('images')
                    .remove([thumbPath]);

                if (storageError) console.warn('Storage delete error:', storageError);
            }

            // 2. Delete from DB
            const { error } = await supabase
                .from('photos')
                .delete()
                .eq('id', photo.id);

            if (error) throw error;

            if (selectedPhoto && selectedPhoto.id === photo.id) setSelectedPhoto(null);
            setConfirmingDelete(null);
        } catch (error) {
            console.error('Error deleting photo:', error);
            alert('Erreur lors de la suppression');
        }
    };

    // Fonction pour charger plus de photos
    const loadMorePhotos = () => {
        setDisplayCount(prev => prev + PHOTOS_PER_LOAD);
    };

    // Fonction pour télécharger toutes les photos en ZIP
    const downloadPhotosAsZip = async () => {
        if (photos.length === 0) {
            alert('Aucune photo à télécharger');
            return;
        }

        setIsExporting(true);
        try {
            const zip = new JSZip();
            const folder = zip.folder('galerie_photos');

            for (let i = 0; i < photos.length; i++) {
                const photo = photos[i];
                try {
                    // Télécharger l'image originale (pas le thumbnail)
                    const response = await fetch(photo.url);
                    const blob = await response.blob();
                    
                    // Déterminer le nom du fichier
                    const date = new Date(photo.created_at).toLocaleDateString('fr-FR').replace(/\//g, '-');
                    const fileName = `photo_${i + 1}_${date}.jpg`;
                    
                    // Ajouter au ZIP
                    folder.file(fileName, blob);
                } catch (error) {
                    console.warn(`Erreur téléchargement photo ${i + 1}:`, error);
                }
            }

            // Générer et télécharger le ZIP
            const content = await folder.generateAsync({ type: 'blob' });
            const url = window.URL.createObjectURL(content);
            const link = document.createElement('a');
            link.href = url;
            link.download = `galerie_photos_${new Date().toLocaleDateString('fr-FR')}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            setShowDownloadConfirm(false);
        } catch (error) {
            console.error('Erreur ZIP:', error);
            alert('Erreur lors du téléchargement du ZIP');
        } finally {
            setIsExporting(false);
        }
    };

    const displayedPhotos = photos.slice(0, displayCount);
    const hasMore = displayCount < photos.length;

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><Loader className="animate-spin" /></div>;


    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Actions */}
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {photos.length > 0 && (
                        <>
                            <button
                                onClick={() => setShowDownloadConfirm(true)}
                                disabled={isExporting}
                                style={{
                                    cursor: isExporting ? 'wait' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    fontSize: '0.9rem',
                                    color: 'var(--color-primary)',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '20px',
                                    backgroundColor: 'rgba(0,0,0,0.05)',
                                    transition: 'background 0.2s',
                                    opacity: isExporting ? 0.7 : 1,
                                    border: 'none'
                                }}
                                title="Télécharger toutes les photos en ZIP"
                            >
                                {isExporting ? <Loader size={16} className="animate-spin" /> : <Download size={16} />}
                                {isExporting ? 'Téléchargement...' : 'Télécharger'}
                            </button>
                        </>
                    )}
                </div>
                
                <label style={{
                    cursor: uploading || (!coupleConfig?.unlimited_photos && photos.length >= PHOTO_LIMIT) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.9rem',
                    color: 'var(--color-primary)',
                    padding: '0.5rem 1rem',
                    borderRadius: '20px',
                    backgroundColor: 'rgba(0,0,0,0.05)',
                    transition: 'background 0.2s',
                    opacity: uploading || (!coupleConfig?.unlimited_photos && photos.length >= PHOTO_LIMIT) ? 0.5 : 1
                }}>
                    {uploading ? <Loader size={16} className="animate-spin" /> : <Plus size={16} />}
                    {uploading ? 'Envoi...' : 'Ajouter une photo'}
                    {!coupleConfig?.unlimited_photos && (
                        <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                            ({photos.length}/{PHOTO_LIMIT})
                        </span>
                    )}
                    <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleAddPhoto} 
                        disabled={uploading || (!coupleConfig?.unlimited_photos && photos.length >= PHOTO_LIMIT)} 
                        style={{ display: 'none' }} 
                    />
                </label>
            </div>

            {/* Modal alerte limite atteinte */}
            {showLimitAlert && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    zIndex: 999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }} onClick={() => setShowLimitAlert(false)}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        padding: '2rem',
                        maxWidth: '400px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        transform: 'translateY(0)',
                        opacity: 1,
                        transition: 'all 0.3s ease'
                    }} onClick={(e) => e.stopPropagation()}>
                        <h3 style={{ marginTop: 0, fontSize: '1.1rem', color: 'var(--color-text)' }}>
                            Limite de photos atteinte
                        </h3>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                            Vous avez atteint la limite de <strong>{PHOTO_LIMIT} photos</strong> pour ce couple.
                        </p>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                            📸 Supprimez des photos ou contactez un administrateur pour obtenir l'accès illimité.
                        </p>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setShowLimitAlert(false)}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '8px',
                                    border: '1px solid var(--color-border)',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem'
                                }}
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showDownloadConfirm && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    zIndex: 999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }} onClick={() => !isExporting && setShowDownloadConfirm(false)}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        padding: '2rem',
                        maxWidth: '400px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        transform: 'translateY(0)',
                        opacity: 1,
                        transition: 'all 0.3s ease'
                    }} onClick={(e) => e.stopPropagation()}>
                        <h3 style={{ marginTop: 0, fontSize: '1.1rem', color: 'var(--color-text)' }}>
                            Télécharger les photos
                        </h3>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                            Télécharger les {photos.length} photos au format ZIP?
                        </p>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                            📦 Les photos seront téléchargées dans un fichier ZIP avec leurs dates respectives.
                        </p>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setShowDownloadConfirm(false)}
                                disabled={isExporting}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '8px',
                                    border: '1px solid var(--color-border)',
                                    background: 'transparent',
                                    cursor: isExporting ? 'wait' : 'pointer',
                                    fontSize: '0.9rem'
                                }}
                            >
                                Annuler
                            </button>
                            <button
                                onClick={downloadPhotosAsZip}
                                disabled={isExporting}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: 'var(--color-primary)',
                                    color: 'white',
                                    cursor: isExporting ? 'wait' : 'pointer',
                                    fontSize: '0.9rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                {isExporting ? <Loader size={16} className="animate-spin" /> : <Download size={16} />}
                                Télécharger
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                    {displayedPhotos.map(photo => (
                        <div
                            key={photo.id}
                            onClick={() => setSelectedPhoto(photo)}
                            style={{
                                aspectRatio: '1',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                cursor: 'pointer',
                                position: 'relative',
                                border: '1px solid var(--color-border)',
                                group: 'thumbnail',
                                backgroundColor: '#f5f5f5'
                            }}
                            className="gallery-item"
                        >
                            <img
                                src={photo.thumb_url || photo.url}
                                alt="Souvenir"
                                loading="lazy"
                                style={{ 
                                    width: '100%', 
                                    height: '100%', 
                                    objectFit: 'cover', 
                                    transition: 'transform 0.3s',
                                    filter: 'var(--filter-none, none)'
                                }}
                                onLoad={(e) => {
                                    e.target.style.filter = 'none';
                                }}
                            />

                            {confirmingDelete === photo.id ? (
                                <div style={{
                                    position: 'absolute',
                                    top: 0, left: 0, right: 0, bottom: 0,
                                    background: 'rgba(0,0,0,0.8)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    zIndex: 10
                                }} onClick={e => e.stopPropagation()}>
                                    <span style={{ color: 'white', fontSize: '0.7rem' }}>Supprimer ?</span>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => deletePhoto(photo)}
                                            style={{ background: '#ff7675', border: 'none', borderRadius: '4px', padding: '2px 6px', color: 'white', fontSize: '0.7rem' }}
                                        >Oui</button>
                                        <button
                                            onClick={() => setConfirmingDelete(null)}
                                            style={{ background: 'white', border: 'none', borderRadius: '4px', padding: '2px 6px', color: 'black', fontSize: '0.7rem' }}
                                        >Non</button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setConfirmingDelete(photo.id);
                                    }}
                                    style={{
                                        position: 'absolute',
                                        top: '4px',
                                        right: '4px',
                                        background: 'rgba(0,0,0,0.6)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '50%',
                                        width: '24px',
                                        height: '24px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        opacity: 0,
                                        transition: 'opacity 0.2s'
                                    }}
                                    className="delete-btn"
                                >
                                    <X size={14} />
                                </button>
                            )}

                            <style>{`
                                .gallery-item:hover .delete-btn { opacity: 1 !important; }
                                .gallery-item:hover img { transform: scale(1.1); }
                            `}</style>
                        </div>
                    ))}

                    {/* Bouton charger plus - intégré dans la grille */}
                    {hasMore && (
                        <div
                            onClick={loadMorePhotos}
                            style={{
                                aspectRatio: '1',
                                borderRadius: '8px',
                                border: '2px dashed var(--color-border)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                backgroundColor: 'rgba(0,0,0,0.02)',
                                transition: 'all 0.2s'
                            }}
                            className="load-more-item"
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'var(--color-primary)';
                                e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'var(--color-border)';
                                e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.02)';
                            }}
                        >
                            <Plus size={40} style={{ color: 'var(--color-primary)' }} />
                        </div>
                    )}
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
                            padding: '0.5rem',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        <X size={32} />
                    </button>
                    <div 
                        style={{ 
                            position: 'relative', 
                            maxWidth: '100%', 
                            maxHeight: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center'
                        }} 
                        onClick={e => e.stopPropagation()}
                    >
                        <img
                            src={selectedPhoto.url}
                            alt="Image complète"
                            style={{ 
                                maxWidth: '100%', 
                                maxHeight: '85vh', 
                                borderRadius: '4px',
                                objectFit: 'contain'
                            }}
                        />
                        <button
                            onClick={() => deletePhoto(selectedPhoto)}
                            style={{
                                marginTop: '1rem',
                                color: '#ff7675',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.9rem'
                            }}
                        >
                            <X size={16} />
                            Supprimer
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GalleryModule;
