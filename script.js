// Set the title to the domain name or pathname
const urlParams = new URLSearchParams(window.location.search);
const pageTitle = urlParams.get('text') || window.location.hostname || window.location.pathname;
if (pageTitle) {
    document.title = pageTitle;
}

const SHOW_LETTERS = true; // Toggle to enable/disable letters
let isWhite = true; // Current state of the background (starts white)

let urlLetterIndex = 0;

// Track active elements for collision detection
const activeCircles = new Set();
const activeLetters = new Set();

let globalSequence = 0;

let lastX = null;
let lastY = null;

function getNextUrlLetter() {
    // Extract only alphabetic characters
    const letters = pageTitle.replace(/[^a-zA-Z.-]/g, '');

    if (letters.length === 0) return '?'; // Fallback if no letters found

    const char = letters.charAt(urlLetterIndex % letters.length);
    urlLetterIndex++;
    return char;
}

function triggerAnimation(e, letter) {
    globalSequence++;
    const currentSequence = globalSequence;

    // Create a new circle element for this click
    const circle = document.createElement('div');
    circle.classList.add('circle');

    let x, y;

    if (e) {
        // Position the circle at the click location
        x = e.clientX;
        y = e.clientY;
        lastX = x;
        lastY = y;
    } else {
        // Use previous position if available, otherwise default to center
        if (lastX !== null && lastY !== null) {
            x = lastX;
            y = lastY;
        } else {
            x = window.innerWidth / 2;
            y = window.innerHeight / 2;
        }
    }

    // Subtract half the width/height to center it
    // The CSS says width: 10px, height: 10px. So offset by 5px.
    circle.style.left = `${x - 5}px`;
    circle.style.top = `${y - 5}px`;

    // Calculate dynamic scale
    const maxDim = Math.max(window.innerWidth, window.innerHeight);
    const scale = (maxDim * 2.5) / 10;

    circle.style.setProperty('--target-scale', scale);

    // Determine color for this circle
    // If background is black (isWhite = false), circle should be white.
    // If background is white (isWhite = true), circle should be black.
    const circleColor = isWhite ? 'black' : 'white';
    circle.style.backgroundColor = circleColor;

    // Toggle state for the NEXT click immediately
    isWhite = !isWhite;

    // Track circle for collision detection
    const circleData = {
        element: circle,
        x: x,
        y: y,
        color: circleColor,
        id: currentSequence,
        startTime: Date.now()
    };
    activeCircles.add(circleData);

    if (letter) {
        const letterEl = document.createElement('div');
        letterEl.classList.add('letter');
        letterEl.textContent = letter;
        letterEl.style.left = `${x}px`;
        letterEl.style.top = `${y}px`;
        // Letter color should be opposite of the circle color
        // This is the color of the letter being ADDED.
        // It should match the background it sits on (which is the PREVIOUS color).
        // Wait, the logic in original code was:
        // letterEl.style.color = circleColor === 'black' ? 'white' : 'black';
        // If circle is black, letter is white.
        letterEl.style.color = circleColor === 'black' ? 'white' : 'black';

        document.body.appendChild(letterEl);

        // Track letter for collision detection
        activeLetters.add({
            element: letterEl,
            x: x,
            y: y,
            color: letterEl.style.color,
            id: currentSequence
        });
    }

    // Append circle to body
    document.body.appendChild(circle);

    // Force reflow to ensure initial state is rendered before adding 'expand'
    circle.offsetHeight;

    // Start animation
    circle.classList.add('expand');

    // Handle Animation End
    circle.addEventListener('transitionend', function () {
        // 1. Update body background to match this circle's color
        document.body.style.backgroundColor = circleColor;

        // 2. Remove this circle (it's now the background)
        circle.remove();
        activeCircles.delete(circleData);
    });

    resetIdleTimer();
}

let idleTimer;
function resetIdleTimer() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
        triggerAnimation(null, getNextUrlLetter());
    }, 3300);
}

window.addEventListener('blur', () => {
    clearTimeout(idleTimer);
});

window.addEventListener('focus', () => {
    resetIdleTimer();
});

// Collision Detection Loop
function checkCollisions() {
    if (activeCircles.size > 0 && activeLetters.size > 0) {
        activeCircles.forEach(circleData => {
            // Get current radius of the expanding circle
            // We can approximate it by reading the computed transform
            // Or we can calculate it based on time if we know the easing, but reading computed style is safer for sync
            const computedStyle = window.getComputedStyle(circleData.element);
            const transform = computedStyle.transform;

            let currentScale = 0;
            if (transform && transform !== 'none') {
                // matrix(scaleX, skewY, skewX, scaleY, translateX, translateY)
                const values = transform.split('(')[1].split(')')[0].split(',');
                // Assuming uniform scale, we can take the first value (a)
                currentScale = parseFloat(values[0]);
            }

            // The circle's base radius is 5px (width 10px / 2)
            const currentRadius = 5 * currentScale;

            activeLetters.forEach(letterData => {
                // Only remove if the letter color is the SAME as the circle color
                // AND the circle is NEWER than the letter (to avoid old circles removing new letters)
                if (letterData.color === circleData.color && circleData.id > letterData.id) {
                    const dx = circleData.x - letterData.x;
                    const dy = circleData.y - letterData.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    // Check if letter is inside the circle
                    // We can add a small buffer or use exact radius
                    if (distance < currentRadius) {
                        // Remove from active set immediately so we don't process it again
                        activeLetters.delete(letterData);

                        letterData.element.remove();
                    }
                }
            });
        });
    }

    requestAnimationFrame(checkCollisions);
}

// Start the loop
requestAnimationFrame(checkCollisions);

document.addEventListener('click', (e) => {
    triggerAnimation(e, getNextUrlLetter());
});

// Trigger animation once on load
triggerAnimation();

// Screen Wake Lock API
let wakeLock = null;

const requestWakeLock = async () => {
    try {
        wakeLock = await navigator.wakeLock.request('screen');
        console.log('Wake Lock is active!');
        wakeLock.addEventListener('release', () => {
            console.log('Wake Lock has been released');
        });
    } catch (err) {
        console.error(`${err.name}, ${err.message}`);
    }
};

// Request a wake lock
requestWakeLock();

// Re-acquire the wake lock when the document becomes visible
document.addEventListener('visibilitychange', async () => {
    if (wakeLock !== null && document.visibilityState === 'visible') {
        await requestWakeLock();
    }
});
