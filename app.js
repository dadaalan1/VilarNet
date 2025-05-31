document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const audio = document.getElementById('radioStream');
    const playBtn = document.getElementById('playBtn');
    const volumeSlider = document.getElementById('volumeSlider');
    const songInfo = document.getElementById('songInfo');
    const statusText = document.getElementById('statusText');
    const currentYear = document.getElementById('currentYear');
    const visualizerContainer = document.querySelector('.visualizer-container');
    const soundBars = document.querySelector('.sound-bars');
    // const logo = document.querySelector('.logo-image img');
    
    // URL del stream de radio
    const streamUrl = "https://stream.codigosur.org/RadioVilardevoz.ogg";
    
    // Configuración inicial
    let isPlaying = false;
    audio.src = streamUrl;
    audio.volume = volumeSlider.value;
    currentYear.textContent = new Date().getFullYear();
    
    // Event listeners
    playBtn.addEventListener('click', togglePlay);
    volumeSlider.addEventListener('input', updateVolume);
    
    // Funciones
    function togglePlay() {
        if (isPlaying) {
            pauseRadio();
        } else {
            playRadio();
        }
    }
    
    function playRadio() {
        audio.play()
            .then(() => {
                isPlaying = true;
                updatePlayButton();
                visualizerContainer.classList.add('playing');
                visualizerContainer.classList.remove('paused');
                songInfo.textContent = "Transmitiendo en vivo";
                statusText.textContent = "Reproduciendo";
            })
            .catch(error => {
                console.error("Error al reproducir:", error);
                songInfo.textContent = "Error de conexión";
                statusText.textContent = "Error";
                statusText.innerHTML = '<i class="fas fa-exclamation-circle"></i> Error de conexión';
                
                // Reintentar después de 5 segundos
                setTimeout(() => {
                    if (isPlaying) {
                        playRadio();
                    }
                }, 5000);
            });
    }
    
    function pauseRadio() {
        audio.pause();
        isPlaying = false;
        updatePlayButton();
        visualizerContainer.classList.remove('playing');
        visualizerContainer.classList.add('paused');
        songInfo.textContent = "En pausa";
        statusText.textContent = "En pausa";
    }
    
    function updatePlayButton() {
        if (isPlaying) {
            playBtn.innerHTML = '<i class="fas fa-pause"></i>';
            playBtn.classList.add('playing');
        } else {
            playBtn.innerHTML = '<i class="fas fa-play"></i>';
            playBtn.classList.remove('playing');
        }
    }
    
    function updateVolume() {
        audio.volume = volumeSlider.value;
        
        // Cambiar icono de volumen según el nivel
        const volumeIcon = document.querySelector('.volume-control i');
        if (audio.volume == 0) {
            volumeIcon.className = 'fas fa-volume-mute';
        } else if (audio.volume < 0.5) {
            volumeIcon.className = 'fas fa-volume-down';
        } else {
            volumeIcon.className = 'fas fa-volume-up';
        }
    }
    
    // Efecto visual al hacer hover en las barras de sonido
    soundBars.addEventListener('mouseover', () => {
        if (isPlaying) {
            soundBars.classList.add('animated');
            setTimeout(() => {
                soundBars.classList.remove('animated');
            }, 1000);
        }
    });
    
    // Detectar cambios en la conexión
    window.addEventListener('online', () => {
        statusText.innerHTML = '<i class="fas fa-circle"></i> En línea';
        if (isPlaying) {
            playRadio();
        }
    });
    
    window.addEventListener('offline', () => {
        statusText.innerHTML = '<i class="fas fa-circle"></i> Sin conexión';
        if (isPlaying) {
            songInfo.textContent = "Intentando reconectar...";
        }
    });
    
    // Simular cambio de "canción" (programa) cada 30 segundos
    setInterval(() => {
        if (isPlaying) {
            const programs = [
                "Cantores en vivo",
                "Artistas invitados",
                "Programas en vivo",
                "Entrevistas especiales",
                "Fonoplatea abierta"
            ];
            const randomProgram = programs[Math.floor(Math.random() * programs.length)];
            songInfo.textContent = randomProgram;
        }
    }, 30000);
});