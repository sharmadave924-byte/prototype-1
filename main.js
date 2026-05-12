const canvas = document.getElementById('scroll-canvas');
const context = canvas.getContext('2d');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const loader = document.getElementById('loader');

// Cache overlay & nav elements
const heroOverlay = document.getElementById('hero-overlay');
const mainNav = document.getElementById('main-nav');
const mobileNav = document.getElementById('mobile-nav');
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
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
const fps = isMobile ? 24 : 30; // Lower FPS for a more meditative, cinematic feel and better performance
const frameDuration = 1000 / fps;
let blendProgress = 0;

// Preload images with priority
const preloadImages = () => {
    let loadedCount = 0;
    // Actually, skipping frames might make it jittery. Let's load all but optimize the loop.

    for (let i = 1; i <= frameCount; i++) {
        const img = new Image();
        img.src = currentFrame(i);
        img.onload = () => {
            loadedCount++;
            updateLoadingProgress(loadedCount);
        };
        img.onerror = () => {
            loadedCount++;
            updateLoadingProgress(loadedCount);
        };
        images.push(img);
    }
};

const updateLoadingProgress = (loadedCount) => {
    const progress = Math.floor((loadedCount / frameCount) * 100);
    if (progressFill) progressFill.style.width = `${progress}%`;
    if (progressText) progressText.innerText = `${progress}%`;
    if (loadedCount === frameCount) {
        initAnimation();
    }
};

const initAnimation = () => {
    // Hide loader
    loader.classList.add('hidden');

    // Initialize Lenis
    const lenis = new Lenis({
        duration: 1.5,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: false,
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Set initial canvas size
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Start the auto-playing video loop
    lastFrameTime = performance.now();
    requestAnimationFrame(playLoop);

    // Scroll listener — controls hero text overlay and nav visibility
    lenis.on('scroll', ({ scroll, limit, velocity, progress }) => {
        updateOverlays(progress, scroll);
    });

    // Trigger initial state
    updateOverlays(0, 0);

    // Simple mouse parallax for "passive observer" depth
    document.addEventListener('mousemove', (e) => {
        const moveX = (e.clientX - window.innerWidth / 2) * 0.01;
        const moveY = (e.clientY - window.innerHeight / 2) * 0.01;
        if (heroOverlay) {
            heroOverlay.style.transform = `translate(${moveX}px, ${moveY}px)`;
        }
    });

    // Intersection Observer for Reveal Animations
    const revealOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal-visible');
                // revealObserver.unobserve(entry.target); // Keep if you want it to only reveal once
            } else {
                // Remove class if you want it to animate every time you scroll back up
                entry.target.classList.remove('reveal-visible');
            }
        });
    }, revealOptions);

    const revealElements = document.querySelectorAll('.reveal-left, .reveal-right');
    revealElements.forEach(el => revealObserver.observe(el));
};

// Auto-play frames in a loop (ping-pong to avoid cuts)
const playLoop = (timestamp) => {
    const elapsed = timestamp - lastFrameTime;
    blendProgress = Math.min(elapsed / frameDuration, 1);

    if (elapsed >= frameDuration) {
        lastFrameTime = timestamp;
        currentFrameIndex = nextFrameIndex;
        nextFrameIndex = (currentFrameIndex + 1) % frameCount;
        blendProgress = 0;
    }

    renderBlendedFrame(currentFrameIndex, nextFrameIndex, blendProgress);
    requestAnimationFrame(playLoop);
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
    // Avoid clearRect to prevent flickering, just draw over
    drawCover(images[fromIndex], 1);
    if (progress > 0.05) { // Only blend if there's significant progress
        drawCover(images[toIndex], progress);
    }
};

const updateOverlays = (fraction, scrollTop) => {
    // Hero Text Visibility & Scroll Blur
    const heroFadeStart = window.innerHeight * 0.4;
    const heroFadeEnd = window.innerHeight * 1.5;

    if (scrollTop < heroFadeEnd) {
        heroOverlay.classList.add('visible');
        
        const fadeRange = heroFadeEnd - heroFadeStart;
        if (scrollTop > heroFadeStart) {
            const heroProgress = (scrollTop - heroFadeStart) / fadeRange;
            const heroBlur = heroProgress * 10;
            const heroOpacity = 1 - heroProgress;
            heroOverlay.style.filter = `blur(${heroBlur}px)`;
            heroOverlay.style.opacity = heroOpacity;
            heroOverlay.style.transform = `translateY(${-heroProgress * 50}px)`;
        } else {
            heroOverlay.style.filter = `blur(0px)`;
            heroOverlay.style.opacity = '1';
            heroOverlay.style.transform = `translateY(0px)`;
        }
    } else {
        heroOverlay.classList.remove('visible');
    }

    // Dynamic Blur & Dim for Canvas Background - more subtle for meditative tone
    const maxBlur = 8;
    const blurAmount = Math.min((scrollTop / window.innerHeight) * maxBlur, maxBlur);
    const darkness = Math.max(1 - (blurAmount / maxBlur) * 0.4, 0.6);
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
