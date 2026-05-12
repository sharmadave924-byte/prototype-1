const canvas = document.getElementById('scroll-canvas');
const context = canvas.getContext('2d');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const loader = document.getElementById('loader');

// Cache overlay & nav elements
const heroOverlay = document.getElementById('hero-overlay');
const mainNav = document.getElementById('main-nav');
const mobileNav = document.getElementById('mobile-nav');

// Mobile detection
const isMobile = () => window.innerWidth <= 768 || window.matchMedia("(max-width: 768px)").matches;
let currentIsMobile = isMobile();

// Update mobile flag on resize
window.addEventListener('resize', () => {
    currentIsMobile = isMobile();
}, { passive: true });
document.addEventListener('DOMContentLoaded', () => {
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenuClose = document.getElementById('mobile-menu-close');
    const mobileLinks = document.querySelectorAll('.mobile-nav-link');

    const toggleMenu = (show) => {
        if (!mobileMenu) return;
        if (show) {
            mobileMenu.classList.add('active');
            document.body.classList.add('no-scroll');
        } else {
            mobileMenu.classList.remove('active');
            document.body.classList.remove('no-scroll');
        }
    };

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleMenu(true);
        });
    }
    if (mobileMenuClose) {
        mobileMenuClose.addEventListener('click', (e) => {
            e.preventDefault();
            toggleMenu(false);
        });
    }
    mobileLinks.forEach(link => {
        link.addEventListener('click', () => toggleMenu(false));
    });
});

const frameCount = 178;
const currentFrame = index => (
    `public/frames/ezgif-frame-${index.toString().padStart(3, '0')}.jpg`
);

const images = [];
let currentFrameIndex = 0;
let nextFrameIndex = 1;
let lastFrameTime = 0;
const fps = 48;
const frameDuration = 1000 / fps;
let blendProgress = 0;

// Preload images
const preloadImages = () => {
    let loadedCount = 0;

    for (let i = 1; i <= frameCount; i++) {
        const img = new Image();
        img.src = currentFrame(i);
        img.onload = () => {
            loadedCount++;
            const progress = Math.floor((loadedCount / frameCount) * 100);
            progressFill.style.width = `${progress}%`;
            progressText.innerText = `${progress}%`;
            if (loadedCount === frameCount) {
                initAnimation();
            }
        };
        img.onerror = () => {
            loadedCount++;
            const progress = Math.floor((loadedCount / frameCount) * 100);
            progressFill.style.width = `${progress}%`;
            progressText.innerText = `${progress}%`;
            if (loadedCount === frameCount) {
                initAnimation();
            }
        };
        images.push(img);
    }
};

const initAnimation = () => {
    // Hide loader
    loader.classList.add('hidden');

    // Set initial canvas size
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas, { passive: true });

    // Start the auto-playing video loop
    lastFrameTime = performance.now();
    requestAnimationFrame(playLoop);

    // Trigger initial state
    updateOverlays(0, 0);

    // Intersection Observer for Reveal Animations
    const revealOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal-visible');
            } else {
                entry.target.classList.remove('reveal-visible');
            }
        });
    }, revealOptions);

    const revealElements = document.querySelectorAll('.reveal-left, .reveal-right');
    revealElements.forEach(el => revealObserver.observe(el));

    // Throttled scroll listener with passive flag for mobile optimization
    let lastScrollUpdate = 0;
    const handleScroll = () => {
        const now = performance.now();
        const scrollTop = document.documentElement.scrollTop;
        const maxScrollTop = document.documentElement.scrollHeight - window.innerHeight;
        
        // On mobile, reduce scroll update frequency to improve performance
        const updateThreshold = currentIsMobile ? 100 : 50; // ms
        
        if (now - lastScrollUpdate >= updateThreshold && maxScrollTop > 0) {
            const scrollFraction = scrollTop / maxScrollTop;
            updateOverlays(scrollFraction, scrollTop);
            lastScrollUpdate = now;
        }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
};

const resizeCanvas = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    renderBlendedFrame(currentFrameIndex, nextFrameIndex, blendProgress);
};

// Draw a single image covering the canvas
const drawCover = (img, alpha) => {
    if (!img || !img.complete || img.naturalWidth === 0) return;
    const canvasRatio = canvas.width / canvas.height;
    const imgRatio = img.naturalWidth / img.naturalHeight;
    if (!imgRatio || !isFinite(imgRatio)) return;

    let drawWidth, drawHeight, offsetX, offsetY;
    if (canvasRatio > imgRatio) {
        drawWidth = canvas.width;
        drawHeight = canvas.width / imgRatio;
        offsetX = 0;
        offsetY = (canvas.height - drawHeight) / 2;
    } else {
        drawWidth = canvas.height * imgRatio;
        drawHeight = canvas.height;
        offsetX = (canvas.width - drawWidth) / 2;
        offsetY = 0;
    }

    context.globalAlpha = alpha;
    context.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    context.globalAlpha = 1;
};

// Blend two frames for smooth transitions
const renderBlendedFrame = (fromIndex, toIndex, progress) => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    drawCover(images[fromIndex], 1);
    if (progress > 0) {
        drawCover(images[toIndex], progress);
    }
};

const updateOverlays = (fraction, scrollTop) => {
    // Hero Text Visibility & Scroll Blur
    const heroFadeStart = window.innerHeight * 0.8;
    const heroFadeEnd = window.innerHeight * 2.2;

    if (fraction > 0.03 && scrollTop < heroFadeEnd) {
        heroOverlay.classList.add('visible');
        
        if (scrollTop > heroFadeStart) {
            const heroProgress = (scrollTop - heroFadeStart) / (heroFadeEnd - heroFadeStart);
            const heroBlur = heroProgress * 20;
            const heroOpacity = 1 - heroProgress;
            heroOverlay.style.filter = `blur(${heroBlur}px)`;
            heroOverlay.style.opacity = heroOpacity;
        } else {
            heroOverlay.style.filter = `blur(0px)`;
            heroOverlay.style.opacity = '';
        }
    } else {
        heroOverlay.classList.remove('visible');
        heroOverlay.style.filter = `blur(0px)`;
        heroOverlay.style.opacity = '';
    }

    // Optimize canvas filters for mobile - reduce blur intensity for better performance
    let maxBlur = currentIsMobile ? 6 : 15; // Significantly reduced blur on mobile
    const blurAmount = Math.min((scrollTop / window.innerHeight) * maxBlur, maxBlur);
    const darkness = Math.max(1 - (blurAmount / maxBlur) * 0.6, 0.4);
    canvas.style.filter = `blur(${blurAmount}px) brightness(${darkness})`;

    // Navigation stays clean and visible to blend with hero
    if (scrollTop > 50) {
        mainNav.classList.add('backdrop-blur-sm', 'bg-background/20');
        mobileNav.classList.add('backdrop-blur-sm', 'bg-background/20');
    } else {
        mainNav.classList.remove('backdrop-blur-sm', 'bg-background/20');
        mobileNav.classList.remove('backdrop-blur-sm', 'bg-background/20');
    }
};

// Start preloading
preloadImages();
