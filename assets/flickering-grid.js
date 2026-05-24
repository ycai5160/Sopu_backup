// Flickering grid background for the Token card.
// Paints brand-mint squares on a coarse grid, each cell easing toward
// a randomized target opacity so the field shimmers.
(function initFlickeringGrid() {
    const canvas = document.querySelector('.what-you-get-content > .flickering-grid');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const SQUARE =8;           // cell size in CSS px
    const GAP = 8;             // gap between cells in CSS px
    const COLOR = [44, 225, 171]; // brand mint, r/g/b
    const MAX_ALPHA = 0.3;
    const FLICKER_CHANCE = 0.18;  // per second, per cell

    let cols = 0, rows = 0, alphas = null, targets = null;
    let dpr = Math.max(1, window.devicePixelRatio || 1);

    function resize() {
        const rect = canvas.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        dpr = Math.max(1, window.devicePixelRatio || 1);
        canvas.width = Math.floor(rect.width * dpr);
        canvas.height = Math.floor(rect.height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const step = SQUARE + GAP;
        cols = Math.ceil(rect.width / step);
        rows = Math.ceil(rect.height / step);
        const total = cols * rows;
        alphas = new Float32Array(total);
        targets = new Float32Array(total);
        for (let i = 0; i < total; i++) {
            alphas[i] = Math.random() * MAX_ALPHA;
            targets[i] = Math.random() * MAX_ALPHA;
        }
    }

    let lastT = performance.now();
    let rafId = 0;
    let running = false;

    function frame(now) {
        const dt = Math.min(0.1, (now - lastT) / 1000);
        lastT = now;
        if (!alphas) { rafId = requestAnimationFrame(frame); return; }

        const rect = canvas.getBoundingClientRect();
        ctx.clearRect(0, 0, rect.width, rect.height);
        const step = SQUARE + GAP;
        const chance = FLICKER_CHANCE * dt;

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const i = y * cols + x;
                if (Math.random() < chance) {
                    targets[i] = Math.random() * MAX_ALPHA;
                }
                alphas[i] += (targets[i] - alphas[i]) * Math.min(1, dt * 4);
                const a = alphas[i];
                if (a > 0.01) {
                    ctx.fillStyle = `rgba(${COLOR[0]},${COLOR[1]},${COLOR[2]},${a.toFixed(3)})`;
                    ctx.fillRect(x * step, y * step, SQUARE, SQUARE);
                }
            }
        }
        rafId = requestAnimationFrame(frame);
    }

    function start() {
        if (running) return;
        running = true;
        lastT = performance.now();
        rafId = requestAnimationFrame(frame);
    }
    function stop() {
        if (!running) return;
        running = false;
        cancelAnimationFrame(rafId);
    }

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    // Only run the rAF loop while the canvas is on screen.
    if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => entry.isIntersecting ? start() : stop());
        }, { rootMargin: '200px 0px' });
        io.observe(canvas);
    } else {
        start();
    }
})();
