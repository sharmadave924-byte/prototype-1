// Premium Animations for Concept Pages
document.addEventListener('DOMContentLoaded', () => {
    // Parallax effect for the hero image - optimized for mobile
    const heroImage = document.querySelector('.absolute.inset-0.z-0 img');
    const isMobile = () => window.innerWidth <= 768 || window.matchMedia("(max-width: 768px)").matches;
    
    // Throttled parallax handler
    let lastParallaxUpdate = 0;
    const handleParallax = () => {
        const now = performance.now();
        const updateThreshold = isMobile() ? 100 : 50; // Reduce frequency on mobile
        
        if (now - lastParallaxUpdate >= updateThreshold) {
            const scrolled = window.pageYOffset;
            if (heroImage) {
                // Reduce parallax intensity on mobile
                const parallaxIntensity = isMobile() ? 0.2 : 0.4;
                const scaleIntensity = isMobile() ? 0.0002 : 0.0005;
                heroImage.style.transform = `translateY(${scrolled * parallaxIntensity}px) scale(${1 + scrolled * scaleIntensity})`;
            }
            lastParallaxUpdate = now;
        }
    };

    window.addEventListener('scroll', handleParallax, { passive: true });

    // Reveal elements on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.reveal-on-scroll').forEach(el => {
        revealObserver.observe(el);
    });
});
