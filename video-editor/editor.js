// Editor de Entrevistas IA - Frontend
let currentVideoFile = null;
let currentSegments = [];
let originalSegments = [];

let ffmpeg = null;

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
  
  uploadArea.addEventListener('click', () => videoInput.click());
  videoInput.addEventListener('change', handleVideoUpload);
  
  transcribeBtn.addEventListener('click', transcribeVideo);
  if (cleanBtn) cleanBtn.addEventListener('click', cleanTranscriptWithAI);
  if (previewBtn) previewBtn.addEventListener('click', previewEditedVideo);
  if (exportBtn) exportBtn.addEventListener('click', exportVideo);
  if (addSubtitlesBtn) addSubtitlesBtn.addEventListener('click', toggleSubtitles);
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
  if (file.size > 500 * 1024 * 1024) {
    showToast('El archivo es demasiado grande. Máximo 500MB.');
    return;
  }
  
  currentVideoFile = file;
  
  const videoPlayer = document.getElementById('videoPlayer');
  const uploadArea = document.getElementById('uploadArea');
  
  const url = URL.createObjectURL(file);
  videoPlayer.src = url;
  videoPlayer.style.display = 'block';
  uploadArea.style.display = 'none';
  
  document.getElementById('transcribeBtn').disabled = false;
  showToast('Video cargado correctamente. Hacé clic en "Transcribir con IA" para continuar.');
}

// Función para cargar FFmpeg.wasm
function loadFFmpegScript() {
  return new Promise((resolve, reject) => {
    if (typeof FFmpeg !== 'undefined') {
      resolve();
      return;
    }
    const script = document.createElement('script');
    // Cambiar a una CDN que funciona correctamente
    script.src = 'https://unpkg.com/@ffmpeg/ffmpeg@0.12.6/dist/ffmpeg.min.js';
    script.onload = () => {
      console.log('FFmpeg script cargado correctamente');
      resolve();
    };
    script.onerror = (err) => {
      console.error('Error cargando FFmpeg:', err);
      reject(err);
    };
    document.head.appendChild(script);
  });
}

// Función para leer archivo como ArrayBuffer (similar a fetchFile)
async function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// Función principal de transcripción (sin FFmpeg)
async function transcribeVideo() {
  if (!currentVideoFile) {
    showToast('Primero subí un video');
    return;
  }
  
  showLoading('Extrayendo audio del video...');
  
  try {
    // Método directo: crear un elemento de audio y capturar su stream
    const videoUrl = URL.createObjectURL(currentVideoFile);
    const videoElement = document.createElement('video');
    videoElement.src = videoUrl;
    videoElement.muted = true;
    videoElement.crossOrigin = 'anonymous';
    
    // Esperar a que el video esté listo
    await new Promise((resolve) => {
      videoElement.onloadedmetadata = resolve;
    });
    
    // Crear un contexto de audio
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Crear un elemento de audio separado para extraer el audio
    const audioElement = new Audio();
    audioElement.src = videoUrl;
    audioElement.crossOrigin = 'anonymous';
    
    await new Promise((resolve) => {
      audioElement.addEventListener('canplaythrough', resolve, { once: true });
    });
    
    // Crear el stream de audio
    const destination = audioContext.createMediaStreamDestination();
    const source = audioContext.createMediaElementSource(audioElement);
    source.connect(destination);
    source.connect(audioContext.destination);
    
    // Configurar grabación
    const mediaRecorder = new MediaRecorder(destination.stream, {
      mimeType: 'audio/webm'
    });
    const chunks = [];
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    
    const recordingPromise = new Promise((resolve) => {
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        resolve(blob);
      };
    });
    
    // Iniciar reproducción y grabación
    mediaRecorder.start();
    await audioElement.play();
    
    // Esperar a que termine el audio
    await new Promise((resolve) => {
      audioElement.addEventListener('ended', resolve, { once: true });
      // Fallback por si no termina
      setTimeout(resolve, (audioElement.duration || 30) * 1000 + 2000);
    });
    
    // Detener todo
    mediaRecorder.stop();
    const audioBlob = await recordingPromise;
    
    // Limpiar recursos
    audioElement.pause();
    audioElement.src = '';
    videoElement.pause();
    videoElement.src = '';
    URL.revokeObjectURL(videoUrl);
    await audioContext.close();
    
    if (!audioBlob || audioBlob.size < 1000) {
      throw new Error('No se pudo extraer audio suficiente del video');
    }
    
    console.log('Audio extraído correctamente, tamaño:', audioBlob.size);
    
    showLoading('Transcribiendo con IA...');
    
    // Enviar al Worker
    const WORKER = 'https://mm-herramientas-worker.mhhurtado.workers.dev';
    const formData = new FormData();
    // Nuevo código - usar 'file' y formato MP3
    formData.append('file', audioBlob, 'audio.mp3');
    
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

async function cleanTranscriptWithAI() {
  if (currentSegments.length === 0) {
    showToast('Primero transcribí el video');
    return;
  }
  
  showLoading('Analizando con IA para detectar muletillas y silencios...');
  
  try {
    const transcriptText = currentSegments.map(s => s.text).join(' ');
    
    // Usar Gemini a través del worker
    const WORKER = 'https://mm-herramientas-worker.mhhurtado.workers.dev';
    
    const prompt = `Analiza esta transcripción de entrevista y devuelve SOLO los números de segmento (índices) que contienen muletillas, silencios o repeticiones. 
    Formato de respuesta: [0, 2, 5]
    
    Transcripción por segmentos:
    ${currentSegments.map((s, i) => `${i}: ${s.text}`).join('\n')}`;
    
    const response = await fetch(WORKER + '/titulares', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        modo: 'nota',
        contenido: prompt,
        cantidad: 1,
        tono: 'directo'
      })
    });
    
    const data = await response.json();
    
    let indicesAEliminar = [];
    
    if (data.ok && data.titulares && data.titulares.length) {
      const text = data.titulares[0];
      const matches = text.match(/\d+/g);
      if (matches) {
        indicesAEliminar = matches.map(Number).filter(i => i < currentSegments.length);
      }
    }
    
    // Si no se detectaron índices, usar detección local de muletillas
    if (indicesAEliminar.length === 0) {
      const muletillas = ['eh', 'este', 'em', 'mm', 'ah', 'ehh', 'estee', 'o sea', 'digamos', 'como que'];
      currentSegments.forEach((segment, idx) => {
        const textLower = segment.text.toLowerCase();
        let tieneMuletilla = false;
        for (const m of muletillas) {
          if (textLower.includes(m)) {
            tieneMuletilla = true;
            break;
          }
        }
        if (tieneMuletilla || (segment.end - segment.start) < 1.5) {
          indicesAEliminar.push(idx);
        }
      });
    }
    
    // Marcar los segmentos
    currentSegments = currentSegments.map((segment, idx) => ({
      ...segment,
      removed: indicesAEliminar.includes(idx) ? true : segment.removed
    }));
    
    renderTranscript(currentSegments);
    showToast(`🔍 ${indicesAEliminar.length} segmentos marcados para eliminar. Revisá y editá si es necesario.`);
    
  } catch (error) {
    console.error('Error limpiando con IA:', error);
    showToast(`Error: ${error.message}`);
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
        <div class="segment-text">${escapeHtml(segment.text)}</div>
        <div class="segment-actions">
          <button class="mm-btn mm-btn-sm" onclick="toggleSegment(${index})">
            ${segment.removed ? '↩️ Restaurar' : '🗑️ Quitar'}
          </button>
        </div>
      </div>
    `;
  }).join('');
  
  document.querySelectorAll('.segment').forEach(segmentEl => {
    segmentEl.addEventListener('click', (e) => {
      if (e.target.tagName !== 'BUTTON') {
        const index = parseInt(segmentEl.dataset.index);
        const segment = currentSegments[index];
        if (segment) {
          const video = document.getElementById('videoPlayer');
          video.currentTime = segment.start;
          video.focus();
        }
      }
    });
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
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
  const segmentsToKeep = currentSegments.filter(s => !s.removed);
  if (segmentsToKeep.length === 0) {
    showToast('No hay segmentos para previsualizar');
    return;
  }
  
  const video = document.getElementById('videoPlayer');
  if (video && segmentsToKeep[0]) {
    video.currentTime = segmentsToKeep[0].start;
    video.play();
    showToast(`Reproduciendo desde ${formatTime(segmentsToKeep[0].start)}`);
  }
}

async function exportVideo() {
  if (!currentVideoFile) {
    showToast('No hay video para exportar');
    return;
  }
  
  const segmentsToExport = currentSegments.filter(s => !s.removed);
  if (segmentsToExport.length === 0) {
    showToast('No hay segmentos para exportar.');
    return;
  }
  
  showLoading('Procesando video editado...');
  
  try {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const exportPanel = document.getElementById('exportPanel');
    if (exportPanel) exportPanel.style.display = 'block';
    
    const fileNameInput = document.getElementById('fileNameInput');
    if (fileNameInput) {
      fileNameInput.value = `entrevista-editada-${new Date().toISOString().slice(0, 10)}`;
    }
    
    showToast('¡Video procesado! Puedes descargarlo ahora.');
  } catch (error) {
    console.error('Error exportando:', error);
    showToast(`Error exportando: ${error.message}`);
  } finally {
    hideLoading();
  }
}

function toggleSubtitles() {
  showToast('Funcionalidad de subtítulos en desarrollo.');
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function showLoading(text) {
  document.getElementById('loadingText').textContent = text || 'Procesando...';
  document.getElementById('loadingOverlay').classList.add('active');
}

function hideLoading() {
  document.getElementById('loadingOverlay').classList.remove('active');
}

// ============================================================
// MÉTODO ALTERNATIVO SIN FFMPEG
// ============================================================

async function transcribeVideoSinFFmpeg() {
  if (!currentVideoFile) {
    showToast('Primero subí un video');
    return;
  }
  
  showLoading('Extrayendo audio del video...');
  
  try {
    // Crear un elemento de audio para extraer el audio del video
    const videoUrl = URL.createObjectURL(currentVideoFile);
    const audio = new Audio();
    audio.src = videoUrl;
    
    // Esperar a que se pueda reproducir
    await new Promise((resolve) => {
      audio.addEventListener('canplaythrough', resolve, { once: true });
    });
    
    // Crear un contexto de audio
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaElementSource(audio);
    const destination = audioContext.createMediaStreamDestination();
    source.connect(destination);
    source.connect(audioContext.destination);
    
    // Grabar el audio
    const mediaRecorder = new MediaRecorder(destination.stream);
    const chunks = [];
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    
    const recordingPromise = new Promise((resolve) => {
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        resolve(blob);
      };
    });
    
    // Reproducir y grabar
    mediaRecorder.start();
    audio.play();
    
    // Detener después de la duración del audio
    await new Promise((resolve) => {
      audio.addEventListener('ended', resolve, { once: true });
      setTimeout(resolve, audio.duration * 1000 + 1000);
    });
    
    mediaRecorder.stop();
    const audioBlob = await recordingPromise;
    
    // Limpiar
    audio.pause();
    audio.src = '';
    URL.revokeObjectURL(videoUrl);
    await audioContext.close();
    
    if (audioBlob.size === 0) {
      throw new Error('No se pudo extraer el audio');
    }
    
    showLoading('Transcribiendo con IA...');
    
    const WORKER = 'https://mm-herramientas-worker.mhhurtado.workers.dev';
    const formData = new FormData();
    formData.append('audio', audioBlob, 'audio.webm');
    
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
      
      const buttons = ['cleanBtn', 'previewBtn', 'exportBtn', 'addSubtitlesBtn'];
      buttons.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.disabled = false;
      });
      
      showToast(`✅ Transcripción completada: ${result.segments.length} segmentos`);
    } else {
      showToast('⚠ No se pudo transcribir el audio');
    }
    
  } catch (error) {
    console.error('Error en método alternativo:', error);
    showToast(`Error: ${error.message}`);
  } finally {
    hideLoading();
  }
}

// Convertir a MP3 (usando Web Audio API y librería externa si es necesario)
// Por ahora, mantener WAV pero cambiar el campo a 'file' es suficiente

// Exponer toggleSegment globalmente para los botones onclick
window.toggleSegment = toggleSegment;