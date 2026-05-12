// Smooth Page Transitions
document.addEventListener('DOMContentLoaded', () => {
    // Fade in on load
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
    
    // Using a short timeout ensures the browser renders the initial 0 opacity before transitioning
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 10);

    // Fade out on link click
    const links = document.querySelectorAll('a[href$=".html"]');
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            const target = link.href;
            
            // Only intercept if it's not opening in a new tab
            if (e.ctrlKey || e.metaKey || link.target === "_blank") return;

            e.preventDefault();
            document.body.style.opacity = '0';
            
            // Wait for transition before navigating
            setTimeout(() => {
                window.location.href = target;
            }, 500); 
        });
    });

    // Fix for browser back button showing a blank screen (bfcache)
    window.addEventListener('pageshow', (event) => {
        if (event.persisted || performance.getEntriesByType("navigation")[0].type === 'back_forward') {
            document.body.style.opacity = '1';
        }
    });
});
