const circle = document.getElementById('circle');

// Set the title to the domain name or pathname
const pageTitle = window.location.hostname || window.location.pathname;
if (pageTitle) {
    document.title = pageTitle;
}

const SHOW_LETTERS = true; // Toggle to enable/disable letters
let isWhite = true; // Current state of the background (starts white)
let previousLetter = null;
let currentLetter = null;

let urlLetterIndex = 0;

function getNextUrlLetter() {
    // Extract only alphabetic characters
    const letters = pageTitle.replace(/[^a-zA-Z]/g, '');

    if (letters.length === 0) return '?'; // Fallback if no letters found

    const char = letters.charAt(urlLetterIndex % letters.length);
    urlLetterIndex++;
    return char;
}

function triggerAnimation(e, letter) {
    // If already animating, ignore click to prevent glitches
    if (circle.classList.contains('expand')) return;

    let x, y;

    if (e) {
        // Position the circle at the click location
        x = e.clientX;
        y = e.clientY;
    } else {
        // Default to center of the screen
        x = window.innerWidth / 2;
        y = window.innerHeight / 2;
    }

    // Subtract half the width/height to center it
    // The CSS says width: 10px, height: 10px. So offset by 5px.
    circle.style.left = `${x - 5}px`;
    circle.style.top = `${y - 5}px`;

    // Calculate dynamic scale
    // We want the final radius to be larger than the farthest corner.
    // But the user requested "250% larger than the largest dimension of the window".
    // Largest dimension:
    const maxDim = Math.max(window.innerWidth, window.innerHeight);
    // Target size = maxDim * 2.5
    // Initial size = 10px
    // Scale factor = Target size / Initial size
    const scale = (maxDim * 2.5) / 10;

    circle.style.setProperty('--target-scale', scale);

    // Set the circle color to the *target* color
    // If background is black (isWhite = false), circle should be white.
    // If background is white (isWhite = true), circle should be black.
    circle.style.backgroundColor = isWhite ? 'black' : 'white';

    // Create and position the letter
    // Promote the current letter to previous, so we can remove it later
    previousLetter = currentLetter;

    if (letter) {
        const letterEl = document.createElement('div');
        letterEl.classList.add('letter');
        letterEl.textContent = letter;
        letterEl.style.left = `${x}px`;
        letterEl.style.top = `${y}px`;
        // Letter color should be opposite of the circle color
        // Circle is (isWhite ? 'black' : 'white')
        // So Letter is (isWhite ? 'white' : 'black')
        letterEl.style.color = isWhite ? 'white' : 'black';

        document.body.appendChild(letterEl);
        currentLetter = letterEl;
    } else {
        currentLetter = null;
    }

    // Start animation
    circle.classList.add('expand');
}

document.addEventListener('click', (e) => triggerAnimation(e, getNextUrlLetter()));

// Trigger animation once on load
triggerAnimation();

circle.addEventListener('transitionend', function () {
    // 1. Swap background color
    isWhite = !isWhite;
    document.body.style.backgroundColor = isWhite ? 'white' : 'black';

    // 2. Reset circle instantly
    circle.classList.add('no-transition');
    circle.classList.remove('expand');

    // Force reflow to ensure the removal of 'expand' and addition of 'no-transition' applies instantly
    // before we remove 'no-transition'
    circle.offsetHeight;

    circle.classList.remove('no-transition');

    // 3. Remove the previous letter (from 2 clicks ago)
    if (previousLetter) {
        previousLetter.remove();
        previousLetter = null;
    }
});
