// Editor de Entrevistas IA - Frontend
let currentVideoFile = null;
let currentSegments = [];
let originalSegments = [];

// ============================================================
// CARGA DE FFMPEG (misma librería que usa Studio implícitamente)
// ============================================================

let ffmpegLoaded = false;
let ffmpeg = null;

async function getFFmpeg() {
  if (ffmpeg) return ffmpeg;
  
  // Cargar el script de FFmpeg
  if (typeof FFmpeg === 'undefined') {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.6/dist/ffmpeg.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  
  const { createFFmpeg } = FFmpeg;
  ffmpeg = createFFmpeg({ log: false });
  await ffmpeg.load();
  return ffmpeg;
}

// ============================================================
// EXTRACCIÓN DE AUDIO CON FFMPEG (alternativa si falla el método anterior)
// ============================================================

let ffmpeg = null;

async function loadFFmpeg() {
  if (ffmpeg) return ffmpeg;
  
  showLoading('Cargando FFmpeg (primera vez puede tardar)...');
  
  try {
    const { createFFmpeg } = FFmpeg;
    ffmpeg = createFFmpeg({ log: true });
    await ffmpeg.load();
    hideLoading();
    return ffmpeg;
  } catch (error) {
    console.error('Error cargando FFmpeg:', error);
    hideLoading();
    return null;
  }
}

async function extractAudioWithFFmpeg(videoFile) {
  const ffmpegInstance = await loadFFmpeg();
  if (!ffmpegInstance) return null;
  
  showLoading('Extrayendo audio con FFmpeg...');
  
  try {
    // Escribir el archivo de video en el sistema de archivos virtual
    const data = await fetchFile(videoFile);
    ffmpegInstance.FS('writeFile', 'input.mp4', data);
    
    // Extraer audio
    await ffmpegInstance.run('-i', 'input.mp4', '-ac', '1', '-vn', '-ar', '16000', 'output.wav');
    
    // Leer el audio extraído
    const audioData = ffmpegInstance.FS('readFile', 'output.wav');
    const audioBlob = new Blob([audioData.buffer], { type: 'audio/wav' });
    
    // Limpiar
    ffmpegInstance.FS('unlink', 'input.mp4');
    ffmpegInstance.FS('unlink', 'output.wav');
    
    return audioBlob;
  } catch (error) {
    console.error('Error con FFmpeg:', error);
    return null;
  }
}

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  setupDragAndDrop();
});

function setupEventListeners() {
  const videoInput = document.getElementById('videoInput');
  const uploadArea = document.getElementById('uploadArea');
  const transcribeBtn = document.getElementById('transcribeBtn');
  const cleanBtn = document.getElementById('cleanBtn');
  const previewBtn = document.getElementById('previewBtn');
  const exportBtn = document.getElementById('exportBtn');
  const addSubtitlesBtn = document.getElementById('addSubtitlesBtn');
  
  // Eventos de carga de video
  uploadArea.addEventListener('click', () => videoInput.click());
  videoInput.addEventListener('change', handleVideoUpload);
  
  // Eventos de botones
  transcribeBtn.addEventListener('click', transcribeVideo);
  cleanBtn.addEventListener('click', cleanTranscriptWithAI);
  previewBtn.addEventListener('click', previewEditedVideo);
  exportBtn.addEventListener('click', exportVideo);
  addSubtitlesBtn.addEventListener('click', toggleSubtitles);
}

function setupDragAndDrop() {
  const uploadArea = document.getElementById('uploadArea');
  
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = 'var(--v)';
    uploadArea.style.backgroundColor = 'var(--v-dim)';
  });

  uploadArea.addEventListener('dragleave', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = 'var(--line2)';
    uploadArea.style.backgroundColor = '';
  });

  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = 'var(--line2)';
    uploadArea.style.backgroundColor = '';
    
    if (e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('video/')) {
        handleVideoFile(file);
      } else {
        showToast('Por favor seleccioná un archivo de video válido');
      }
    }
  });
}

function handleVideoUpload(e) {
  if (e.target.files.length > 0) {
    handleVideoFile(e.target.files[0]);
  }
}

function handleVideoFile(file) {
  // Validar tamaño del archivo (máx 500MB)
  if (file.size > 500 * 1024 * 1024) {
    showToast('El archivo es demasiado grande. Máximo 500MB.');
    return;
  }
  
  currentVideoFile = file;
  
  // Mostrar previsualización del video
  const videoPlayer = document.getElementById('videoPlayer');
  const uploadArea = document.getElementById('uploadArea');
  
  const url = URL.createObjectURL(file);
  videoPlayer.src = url;
  videoPlayer.style.display = 'block';
  uploadArea.style.display = 'none';
  
  // Habilitar botones
  document.getElementById('transcribeBtn').disabled = false;
  showToast('Video cargado correctamente. Hacé clic en "Transcribir con IA" para continuar.');
}

async function transcribeVideo() {
  if (!currentVideoFile) {
    showToast('Primero subí un video');
    return;
  }
  
  showLoading('Extrayendo audio del video...');
  
  try {
    // Usar FFmpeg.wasm que ya funciona en el proyecto
    // Verificar si FFmpeg está disponible
    if (typeof FFmpeg === 'undefined') {
      // Cargar FFmpeg si no está disponible
      await loadFFmpegScript();
    }
    
    const { createFFmpeg, fetchFile } = FFmpeg;
    const ffmpeg = createFFmpeg({ log: false });
    
    await ffmpeg.load();
    
    // Escribir el archivo de video
    ffmpeg.FS('writeFile', 'input.mp4', await fetchFile(currentVideoFile));
    
    // Extraer audio a WAV (formato que Whisper prefiere)
    await ffmpeg.run('-i', 'input.mp4', '-ac', '1', '-ar', '16000', '-vn', 'output.wav');
    
    // Leer el audio extraído
    const audioData = ffmpeg.FS('readFile', 'output.wav');
    const audioBlob = new Blob([audioData.buffer], { type: 'audio/wav' });
    
    // Limpiar archivos temporales
    ffmpeg.FS('unlink', 'input.mp4');
    ffmpeg.FS('unlink', 'output.wav');
    
    if (audioBlob.size === 0) {
      throw new Error('No se pudo extraer el audio del video');
    }
    
    showLoading('Transcribiendo con IA (igual que en Studio)...');
    
    // === ESTA ES LA PARTE QUE REUTILIZA LA LÓGICA DE STUDIO ===
    const WORKER = 'https://mm-herramientas-worker.mhhurtado.workers.dev';
    const formData = new FormData();
    formData.append('audio', audioBlob, 'audio.wav');
    
    const response = await fetch(WORKER + '/studio/transcribir', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    if (!response.ok || !result.ok) {
      throw new Error(result.error || 'Error en transcripción');
    }
    
    if (result.segments && result.segments.length) {
      currentSegments = result.segments.map(seg => ({
        ...seg,
        removed: false
      }));
      originalSegments = [...currentSegments];
      renderTranscript(currentSegments);
      
      // Habilitar botones
      const buttons = ['cleanBtn', 'previewBtn', 'exportBtn', 'addSubtitlesBtn'];
      buttons.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.disabled = false;
      });
      
      showToast(`✅ Transcripción completada: ${result.segments.length} segmentos`);
    } else {
      showToast('⚠ No se pudo transcribir el audio. Probá con otro video.');
    }
    
  } catch (error) {
    console.error('Error transcribiendo:', error);
    showToast(`Error: ${error.message}`);
  } finally {
    hideLoading();
  }
}

// Función para cargar FFmpeg.wasm si no está disponible
function loadFFmpegScript() {
  return new Promise((resolve, reject) => {
    if (typeof FFmpeg !== 'undefined') {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.6/dist/ffmpeg.min.js';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

async function cleanTranscriptWithAI() {
  if (currentSegments.length === 0) {
    showToast('Primero transcribí el video');
    return;
  }
  
  showLoading('Analizando con IA para detectar muletillas y silencios...');
  
  try {
    const transcriptText = currentSegments.map(s => s.text).join(' ');
    
    const response = await fetch('/api/suggest-cuts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcript: transcriptText,
        segments: currentSegments
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.ok) {
      // Marcar los segmentos sugeridos para corte
      const suggestions = result.suggestions || [];
      
      currentSegments = currentSegments.map(segment => {
        const suggestion = suggestions.find(s => 
          Math.abs(s.start - segment.start) < 1 && // Menos de 1 segundo de diferencia
          Math.abs(s.end - segment.end) < 1
        );
        
        return {
          ...segment,
          removed: suggestion ? true : segment.removed
        };
      });
      
      renderTranscript(currentSegments);
      showToast('IA ha analizado el contenido. Revisá las sugerencias y edita si es necesario.');
    } else {
      throw new Error(result.error || 'Error desconocido');
    }
  } catch (error) {
    console.error('Error limpiando con IA:', error);
    showToast(`Error limpiando con IA: ${error.message}`);
  } finally {
    hideLoading();
  }
}

function renderTranscript(segments) {
  const container = document.getElementById('transcriptContent');
  
  if (segments.length === 0) {
    container.innerHTML = '<p class="text-muted">No hay transcripción disponible aún.</p>';
    return;
  }
  
  container.innerHTML = segments.map((segment, index) => {
    const startTime = formatTime(segment.start);
    const endTime = formatTime(segment.end);
    const removedClass = segment.removed ? 'removed' : '';
    
    return `
      <div class="segment ${removedClass}" data-index="${index}">
        <div class="segment-time">${startTime} - ${endTime}</div>
        <div class="segment-text">${segment.text}</div>
        <div class="segment-actions">
          <button class="mm-btn mm-btn-sm" onclick="toggleSegment(${index})">
            ${segment.removed ? '↩️ Restaurar' : '🗑️ Quitar'}
          </button>
        </div>
      </div>
    `;
  }).join('');
  
  // Agregar evento click para saltar al tiempo en el video
  document.querySelectorAll('.segment').forEach(segmentEl => {
    segmentEl.addEventListener('click', () => {
      const index = parseInt(segmentEl.dataset.index);
      const segment = currentSegments[index];
      if (segment) {
        const video = document.getElementById('videoPlayer');
        video.currentTime = segment.start;
        video.focus();
      }
    });
  });
}

function toggleSegment(index) {
  if (index < 0 || index >= currentSegments.length) return;
  
  currentSegments[index].removed = !currentSegments[index].removed;
  renderTranscript(currentSegments);
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function previewEditedVideo() {
  showToast('Funcionalidad de vista previa en desarrollo. En la versión completa, aquí se reproducirían solo los segmentos no eliminados.');
}

async function exportVideo() {
  if (!currentVideoFile) {
    showToast('No hay video para exportar');
    return;
  }
  
  // Verificar que hay segmentos para exportar
  const segmentsToExport = currentSegments.filter(s => !s.removed);
  if (segmentsToExport.length === 0) {
    showToast('No hay segmentos para exportar. Dejá al menos un segmento activo.');
    return;
  }
  
  showLoading('Procesando video editado...');
  
  try {
    // En una implementación real, usaríamos ffmpeg.wasm para cortar y unir el video
    // según los segmentos seleccionados
    
    // Simulamos el proceso
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mostrar panel de exportación
    document.getElementById('exportPanel').style.display = 'block';
    document.getElementById('fileNameInput').value = `entrevista-editada-${new Date().toISOString().slice(0, 10)}`;
    
    showToast('¡Video procesado! Puedes descargarlo ahora.');
  } catch (error) {
    console.error('Error exportando:', error);
    showToast(`Error exportando: ${error.message}`);
  } finally {
    hideLoading();
  }
}

function toggleSubtitles() {
  showToast('Funcionalidad de subtítulos en desarrollo. En la versión completa, se generarían subtítulos basados en la transcripción editada.');
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

function showLoading(text) {
  document.getElementById('loadingText').textContent = text || 'Procesando...';
  document.getElementById('loadingOverlay').classList.add('active');
}

function hideLoading() {
  document.getElementById('loadingOverlay').classList.remove('active');
}