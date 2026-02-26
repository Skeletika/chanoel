import React, { useEffect, useRef } from 'react';

const AdBanner = ({ client, slot, format = 'auto', responsive = 'true', style }) => {
    const adRef = useRef(null);

    useEffect(() => {
        try {
            // Empêcher de push plusieurs fois sur le même élément si React re-render stricte (dev mode) ou navigation
            if (adRef.current && !adRef.current.hasChildNodes()) {
                (window.adsbygoogle = window.adsbygoogle || []).push({});
            }
        } catch (error) {
            console.error('Erreur AdSense:', error);
        }
    }, []);

    return (
        <ins
            ref={adRef}
            className="adsbygoogle"
            style={style || { display: 'block' }}
            data-ad-client={client}
            data-ad-slot={slot}
            data-ad-format={format}
            data-full-width-responsive={responsive}
        />
    );
};

export default AdBanner;
