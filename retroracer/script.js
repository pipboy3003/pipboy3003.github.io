/* Timestamp: 2026-03-01 08:21:16 CET */
body {
    margin: 0;
    overflow: hidden; /* Verhindert Scrollbalken und Wischen auf Mobile */
    background-color: #87CEEB; /* Fallback Himmelsfarbe */
    font-family: sans-serif;
    touch-action: none; /* Verhindert Zoom und Scroll-Gesten auf Mobile */
}

#ui-container {
    position: absolute;
    top: 20px;
    left: 20px;
    color: white;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
    z-index: 10;
}

h1 {
    margin: 0 0 10px 0;
}

p {
    font-size: 24px;
    font-weight: bold;
    margin: 0;
}

button {
    margin-top: 20px;
    padding: 12px 30px;
    font-size: 18px;
    font-weight: bold;
    cursor: pointer;
    background-color: #e74c3c;
    color: white;
    border: 2px solid white;
    border-radius: 8px;
    transition: background-color 0.2s;
    box-shadow: 0 4px 6px rgba(0,0,0,0.3);
}

button:hover {
    background-color: #c0392b;
}

/* Touch-Hinweis Styling & Animation */
#touch-hint {
    position: absolute;
    bottom: 40px;
    width: 100%;
    text-align: center;
    color: rgba(255, 255, 255, 0.9);
    font-size: 18px;
    font-weight: bold;
    text-shadow: 1px 1px 4px rgba(0,0,0,0.8);
    pointer-events: none; /* Klicks gehen durch den Text hindurch */
    z-index: 10;
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% { opacity: 0.4; }
    50% { opacity: 1; }
    100% { opacity: 0.4; }
}
