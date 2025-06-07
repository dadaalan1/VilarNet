document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const audio = document.getElementById('radioStream');
    const playBtn = document.getElementById('playBtn');
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeIcon = document.getElementById('volumeIcon');
    const songInfo = document.getElementById('songInfo');
    const statusText = document.getElementById('statusText');
    const currentYear = document.getElementById('currentYear');
    const bars = document.querySelectorAll('.bar');


    // URL del stream de radio
    const streamUrl = "https://stream.codigosur.org/RadioVilardevoz.ogg";
    
    // Variables de estado
    let isPlaying = false;
    let audioContext, analyser, dataArray, source;
    
    // Inicialización
    currentYear.textContent = new Date().getFullYear();
    audio.volume = volumeSlider.value;
    
    // Configurar analizador de audio
    function setupAudioAnalyzer() {
        try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)({
            latencyHint: 'interactive',
            sampleRate: 44100
        });
        
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 512; // Aumentamos la resolución de frecuencia
        analyser.smoothingTimeConstant = 0.6; // Menor suavizado para más reactividad
            
            source = audioContext.createMediaElementSource(audio);
            source.connect(analyser);
            analyser.connect(audioContext.destination);
            
            dataArray = new Uint8Array(analyser.frequencyBinCount);
            
            // Manejar políticas de autoplay
            if (audioContext.state === 'suspended') {
                const resumeAudio = () => {
                    audioContext.resume().then(() => {
                        document.removeEventListener('click', resumeAudio);
                        console.log('AudioContext resumed');
                    });
                };
                document.addEventListener('click', resumeAudio);
            }
        } catch (error) {
            console.error('Error al configurar el analizador:', error);
            // Activar animación de fallback
            bars.forEach(bar => {
                bar.style.animation = 'equalize 1.5s infinite ease-in-out';
            });
        }
    }
    
// Nueva función updateEqualizer mejorada con getBandAverage:
function updateEqualizer() {
    if (!isPlaying || !analyser) return;
    
    analyser.getByteFrequencyData(dataArray);
    
    // Dividimos el espectro en 7 bandas no lineales para mejor distribución
    const frequencyBands = [
        { start: 0, end: 2 },    // Bajos profundos
        { start: 3, end: 10 },   // Bajos
        { start: 11, end: 25 },  // Bajos-medios
        { start: 26, end: 50 },  // Medios
        { start: 51, end: 100 }, // Medios-agudos
        { start: 101, end: 150 }, // Agudos
        { start: 151, end: 255 }  // Agudos brillantes
    ];
    
    bars.forEach((bar, i) => {
        const band = frequencyBands[i];
        const average = getBandAverage(analyser, dataArray, band);
        
        // Aplicamos escala logarítmica para mejor visualización
        const scaledValue = Math.log1p(average) * 15;
        const height = Math.max(10, Math.min(scaledValue, 100));
        
        // Suavizado más agresivo para movimiento fluido
        const currentHeight = parseFloat(bar.style.height || '20');
        const newHeight = currentHeight + (height - currentHeight) * 0.5; // Aumentamos el factor de suavizado
        
        bar.style.height = `${newHeight}%`;
        
        // Efecto de color dinámico
        const hue = 240 + (i * 15) - (average / 255 * 60);
        const saturation = 80 + (average / 255 * 20);
        bar.style.background = `linear-gradient(to top, 
            hsl(${hue}, ${saturation}%, 50%), 
            var(--accent)`;
    });
    
    requestAnimationFrame(updateEqualizer);
}

// Función para calcular el promedio de una banda de frecuencia (modificada para mayor dinamismo)
function getBandAverage(analyser, dataArray, band) {
    const start = band.start;
    const end = band.end;
    let sum = 0;
    let count = 0;
    
    for (let i = start; i <= end; i++) {
        // Aplicamos un pequeño ajuste para evitar valores demasiado bajos
        sum += Math.pow(dataArray[i] / 255, 0.7) * 255;
        count++;
    }
    
    const average = sum / count;
    
    // Aplicamos una transformación no lineal para exagerar los picos
    const dynamicValue = Math.pow(average / 255, 3) * 255;
    
    // Aseguramos que el valor esté dentro del rango válido
    return Math.min(255, Math.max(0, dynamicValue));
}
    
    // Control de reproducción
    function togglePlay() {
        if (isPlaying) {
            pauseRadio();
        } else {
            playRadio();
        }
    }
    
    function playRadio() {
        audio.play().then(() => {
            isPlaying = true;
            updatePlayButton();
            songInfo.textContent = "Transmitiendo en vivo";
            statusText.innerHTML = '<i class="fas fa-circle"></i> Reproduciendo';
            
            if (!audioContext) {
                setupAudioAnalyzer();
            }
            updateEqualizer();
        }).catch(error => {
            console.error('Error al reproducir:', error);
            songInfo.textContent = "Haz clic para iniciar";
            statusText.innerHTML = '<i class="fas fa-exclamation-circle"></i> Click para play';
            
            // Solución para políticas de autoplay
            alert('Por favor haz clic en el botón de play para iniciar la reproducción');
        });
    }
    
    function pauseRadio() {
        audio.pause();
        isPlaying = false;
        updatePlayButton();
        songInfo.textContent = "En pausa";
        statusText.innerHTML = '<i class="fas fa-circle"></i> En pausa';
    }
    
    function updatePlayButton() {
        playBtn.innerHTML = isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
    }
    
    // Control de volumen
    function updateVolume() {
        audio.volume = volumeSlider.value;
        
        // Actualizar icono de volumen
        if (audio.volume == 0) {
            volumeIcon.className = 'fas fa-volume-mute';
        } else if (audio.volume < 0.5) {
            volumeIcon.className = 'fas fa-volume-down';
        } else {
            volumeIcon.className = 'fas fa-volume-up';
        }
    }
    
    // Event listeners
    playBtn.addEventListener('click', togglePlay);
    volumeSlider.addEventListener('input', updateVolume);
    
    // Manejo de errores de red
    audio.addEventListener('error', function() {
        console.error('Error de audio:', audio.error);
        statusText.innerHTML = '<i class="fas fa-exclamation-circle"></i> Error de conexión';
        songInfo.textContent = "Error al conectar con la radio";
        
        // Intentar reconectar después de 5 segundos
        if (isPlaying) {
            setTimeout(() => {
                audio.src = audio.src; // Recargar fuente
                audio.play().catch(e => console.log('Reintento fallido:', e));
            }, 5000);
        }
    });
    
    // Detectar cambios en la conexión
    window.addEventListener('online', () => {
        statusText.innerHTML = '<i class="fas fa-circle"></i> En línea';
        if (isPlaying) audio.play().catch(e => console.log('Reanudación fallida:', e));
    });
    
    window.addEventListener('offline', () => {
        statusText.innerHTML = '<i class="fas fa-circle"></i> Sin conexión';
    });
    
    // Simular cambios de programa
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