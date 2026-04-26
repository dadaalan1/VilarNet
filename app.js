document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const audio = document.getElementById('radioStream');
    const playBtn = document.getElementById('playBtn');
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeIcon = document.getElementById('volumeIcon');
    const songInfo = document.getElementById('songInfo');
    const statusText = document.getElementById('statusText');
    const currentYear = document.getElementById('currentYear');
    const waveRows = document.querySelectorAll('.wave-row');
    
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
            waveRows.forEach(row => {
                row.querySelectorAll('.wave-bar').forEach(bar => {
                    bar.style.animation = 'wavePulse 1.5s infinite ease-in-out';
                });
            });
        }
    }
    
// Ecualizador con bandas distribuidas de forma logaritmica.
function updateEqualizer() {
    if (!isPlaying || !analyser) return;

    analyser.getByteFrequencyData(dataArray);
    const totalBars = waveRows.length;
    const totalBins = dataArray.length;
    waveRows.forEach((row, i) => {
        const band = getBandRange(i, totalBars, totalBins);
        const average = getBandAverage(dataArray, band);
        const normalized = Math.min(1, average / 255);
        const shaped = Math.pow(normalized, 0.65);
        const level = 0.08 + shaped * 0.92;

        row.style.setProperty('--level', level.toFixed(3));
    });

    requestAnimationFrame(updateEqualizer);
}

function getBandRange(index, totalBars, totalBins) {
    const minIndex = 2;
    const maxIndex = Math.max(minIndex + 1, totalBins - 1);
    const start = Math.floor(minIndex * Math.pow(maxIndex / minIndex, index / totalBars));
    const end = Math.floor(minIndex * Math.pow(maxIndex / minIndex, (index + 1) / totalBars)) - 1;

    return {
        start: Math.max(minIndex, start),
        end: Math.max(start, end)
    };
}

function getBandAverage(dataArray, band) {
    let sum = 0;
    let count = 0;

    for (let i = band.start; i <= band.end; i++) {
        sum += dataArray[i];
        count++;
    }

    return count ? sum / count : 0;
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

    // Cambiar color del ecualizador aleatoriamente
    const colors = [
        { main: '#ff0000', shadow: 'rgba(255, 0, 0, 0.6)', trans: 'rgba(255, 0, 0, 0.2)' }, // Rojo
        { main: '#00ff00', shadow: 'rgba(0, 255, 0, 0.6)', trans: 'rgba(0, 255, 0, 0.2)' }, // Verde
        { main: '#00FFFF', shadow: 'rgba(0, 255, 255, 0.6)', trans: 'rgba(0, 255, 255, 0.2)' }, // Cian
        { main: '#FFD700', shadow: 'rgba(255, 215, 0, 0.6)', trans: 'rgba(255, 215, 0, 0.2)' }, // Amarillo Fuerte (Gold)
        { main: '#FFFFFF', shadow: 'rgba(255, 255, 255, 0.6)', trans: 'rgba(255, 255, 255, 0.2)' },  // Blanco
        { main: '#CC5500', shadow: 'rgba(204, 85, 0, 0.6)', trans: 'rgba(204, 85, 0, 0.2)' }  // Naranja Oscuro
    ];
    let currentColorIndex = 0;

    function changeEqualizerColor() {
        const color = colors[currentColorIndex];
        document.documentElement.style.setProperty('--equalizer-color', color.main);
        document.documentElement.style.setProperty('--equalizer-color-shadow', color.shadow);
        document.documentElement.style.setProperty('--equalizer-color-trans', color.trans);
        
        currentColorIndex = (currentColorIndex + 1) % colors.length;
    }

    setInterval(changeEqualizerColor, 10000); // Cambia de color cada 10 segundos
    changeEqualizerColor(); // Establece un color inicial
});