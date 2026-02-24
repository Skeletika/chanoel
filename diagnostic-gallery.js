// 📊 Script de Diagnostic Galerie Photo
// À exécuter dans la console du navigateur (F12)

console.log('🔍 Diagnostic Galerie Photo Optimisée\n');

// 1. Analyser les images affichées
const thumbnails = document.querySelectorAll('[alt="Souvenir"]');
console.log(`✅ Nombre de thumbnails affichés: ${thumbnails.length}\n`);

// 2. Analyser les tailles
let stats = {
    totalImages: 0,
    totalSize: 0,
    avgSize: 0,
    sizes: []
};

thumbnails.forEach((img, index) => {
    const width = img.naturalWidth;
    const height = img.naturalHeight;
    const size = width * height;
    
    stats.totalImages++;
    stats.totalSize += size;
    stats.sizes.push(size);
    
    console.log(`📷 Image ${index + 1}:`);
    console.log(`   Dimensions: ${width}x${height}px`);
    console.log(`   Taille: ${(size / 1000000).toFixed(2)}MP`);
    console.log(`   Src: ${img.src.substring(0, 80)}...`);
    console.log('');
});

if (stats.totalImages > 0) {
    stats.avgSize = stats.totalSize / stats.totalImages;
    console.log(`📊 STATISTIQUES:`);
    console.log(`   Total images: ${stats.totalImages}`);
    console.log(`   Taille moyenne: ${(stats.avgSize / 1000).toFixed(2)}MP`);
    console.log(`   Taille totale mémoire: ~${(stats.totalSize / 1000000).toFixed(2)}MP`);
}

// 3. Checker les types MIME et formats
console.log(`\n🎨 FORMATS DÉTECTÉS:`);
const imageTypes = new Set();
thumbnails.forEach(img => {
    const src = img.src;
    if (src.includes('webp')) imageTypes.add('WebP');
    if (src.includes('.jpg') || src.includes('.jpeg')) imageTypes.add('JPEG');
    if (src.includes('.png')) imageTypes.add('PNG');
    if (src.includes('format=')) {
        const match = src.match(/format=(\w+)/);
        if (match) imageTypes.add(match[1]);
    }
});

if (imageTypes.size === 0) {
    const sampleImg = thumbnails[0];
    if (sampleImg) {
        const ext = sampleImg.src.split('.').pop().split('?')[0];
        imageTypes.add(ext.toUpperCase());
    }
}

imageTypes.forEach(type => console.log(`   ✅ ${type}`));

// 4. Checker le lazy loading
console.log(`\n⚡ LAZY LOADING:`);
let lazyLoadCount = 0;
thumbnails.forEach(img => {
    if (img.loading === 'lazy') {
        lazyLoadCount++;
    }
});
console.log(`   Images avec lazy loading: ${lazyLoadCount}/${stats.totalImages}`);
if (lazyLoadCount === stats.totalImages) {
    console.log(`   ✅ Tous les thumbnails utilisent lazy loading!`);
} else if (lazyLoadCount === 0) {
    console.log(`   ⚠️  Aucun lazy loading détecté`);
}

// 5. Analyser les URLs thumb
console.log(`\n🖼️  THUMBS DETECTÉS:`);
let thumbCount = 0;
thumbnails.forEach(img => {
    if (img.src.includes('-thumb')) {
        thumbCount++;
    }
});
console.log(`   Thumbnails: ${thumbCount}/${stats.totalImages}`);
if (thumbCount > 0) {
    console.log(`   ✅ Système de thumbnails en place!`);
}

// 6. Performance timing
console.log(`\n⏱️  TIMINGS:`);
if (performance.timing) {
    const pageLoadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
    const domContentLoaded = performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart;
    console.log(`   Page load: ${pageLoadTime}ms`);
    console.log(`   DOM Ready: ${domContentLoaded}ms`);
}

// 7. Recommendations
console.log(`\n💡 RECOMMENDATIONS:`);
if (lazyLoadCount === stats.totalImages) {
    console.log(`   ✅ Lazy loading optimal`);
} else {
    console.log(`   🔧 Ajouter loading="lazy" aux images`);
}

if (thumbCount > 0) {
    console.log(`   ✅ Système thumbnail détecté`);
} else {
    console.log(`   🔧 Migrer vers le système thumbnail`);
}

if (stats.avgSize < 22500) { // 150x150 = 22500px
    console.log(`   ✅ Taille thumbnails optimale (< 150x150px)`);
} else {
    console.log(`   🔧 Réduire la taille des thumbnails`);
}

console.log(`\n✨ Diagnostic terminé!`);

// Fonction pour checker une image spécifique
window.checkImage = function(index) {
    const img = thumbnails[index - 1];
    if (!img) {
        console.log(`❌ Image ${index} non trouvée`);
        return;
    }
    console.log(`\n📸 Détails Image ${index}:`);
    console.log(`URL: ${img.src}`);
    console.log(`Dimensions affichées: ${img.width}x${img.height}px`);
    console.log(`Dimensions natives: ${img.naturalWidth}x${img.naturalHeight}px`);
    console.log(`Loading: ${img.loading}`);
    console.log(`Complete: ${img.complete}`);
    console.log(`Taille en mémoire: ~${((img.naturalWidth * img.naturalHeight * 4) / 1024 / 1024).toFixed(2)}MB`);
};

console.log(`\n💻 Utilisez checkImage(N) pour détails d'une image spécifique`);
console.log(`Exemple: checkImage(1)`);
