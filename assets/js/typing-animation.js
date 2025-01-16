document.addEventListener('DOMContentLoaded', function() {
    const typingText = document.querySelector('.typing-text');
    const phrases = [
        "Lutong Pinoy, Puno ng Sarap at Pagmamahal",
        "Masarap na Pagkain, Masayang Pamilya",
        "Sa Lutong Pinoy, Busog ang Puso't Kaluluwa"
    ];
    
    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typingSpeed = 100; // Base typing speed
    let deletingSpeed = 50; // Faster deleting speed
    let pauseEnd = 2000; // Pause when phrase is complete
    let pauseStart = 1000; // Pause before starting new phrase

    function type() {
        const currentPhrase = phrases[phraseIndex];
        
        if (isDeleting) {
            // Deleting text
            charIndex--;
            typingText.textContent = currentPhrase.substring(0, charIndex);
            typingSpeed = deletingSpeed;
        } else {
            // Typing text
            charIndex++;
            typingText.textContent = currentPhrase.substring(0, charIndex);
            typingSpeed = 100;
        }

        // Add blinking cursor effect
        typingText.style.borderRight = '0.08em solid var(--accent-color)';

        // Handle phrase completion or deletion
        if (!isDeleting && charIndex === currentPhrase.length) {
            // Completed typing the phrase
            typingSpeed = pauseEnd;
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            // Completed deleting the phrase
            isDeleting = false;
            phraseIndex = (phraseIndex + 1) % phrases.length;
            typingSpeed = pauseStart;
        }

        // Schedule the next update
        setTimeout(type, typingSpeed);
    }

    // Start the typing animation
    type();
});