const circle = document.getElementById('circle');
let isWhite = false; // Current state of the background (starts black)

document.addEventListener('click', function (e) {
    // If already animating, ignore click to prevent glitches
    if (circle.classList.contains('expand')) return;

    // Position the circle at the click location
    // Subtract half the width/height to center it
    const x = e.clientX;
    const y = e.clientY;

    circle.style.left = `${x}px`;
    circle.style.top = `${y}px`;
    // We need to ensure transform-origin is center or just rely on top/left + transform
    // The current CSS has transform: scale(0) -> scale(200). 
    // Centering via top/left requires offsetting by radius.
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

    // Start animation
    circle.classList.add('expand');
});

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
});
