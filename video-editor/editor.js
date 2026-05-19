// Editor de Entrevistas IA - Frontend
let currentVideoFile = null;
let currentSegments = [];
let originalSegments = [];

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
  
  showLoading('Transcribiendo video con IA...');
  
  try {
    // Extraer audio del video (simulado, en realidad se haría con ffmpeg)
    // En una implementación real, convertiríamos el video a audio aquí
    
    // Enviar archivo de audio al worker para transcribir
    const WORKER = 'https://mm-herramientas-worker.mhhurtado.workers.dev';

    const formData = new FormData();
    // En este paso usamos el mismo archivo; el Worker acepta el campo 'audio'
    // Si tenés audio separado, podés enviar ese blob en su lugar.
    formData.append('audio', currentVideoFile, currentVideoFile.name);

    const response = await fetch(WORKER + '/studio/transcribir', {
      method: 'POST',
      body: formData
    });

    let resultText = null;
    try {
      resultText = await response.text();
    } catch (e) {
      resultText = null;
    }

    if (!response.ok) {
      let errMsg = `HTTP ${response.status}`;
      try {
        const parsed = resultText ? JSON.parse(resultText) : null;
        if (parsed && parsed.error) errMsg = parsed.error;
      } catch (e) {}
      throw new Error(errMsg + (resultText ? ` — ${resultText}` : ''));
    }

    const result = resultText ? JSON.parse(resultText) : {};
    
    if (result.ok) {
      currentSegments = [...result.segments];
      originalSegments = [...result.segments];
      renderTranscript(result.segments);
      
      // Habilitar botones
      document.getElementById('cleanBtn').disabled = false;
      document.getElementById('previewBtn').disabled = false;
      document.getElementById('exportBtn').disabled = false;
      document.getElementById('addSubtitlesBtn').disabled = false;
      
      showToast('Transcripción completada. Editá el texto para marcar partes a eliminar.');
    } else {
      throw new Error(result.error || 'Error desconocido');
    }
  } catch (error) {
    console.error('Error transcribiendo:', error);
    showToast(`Error transcribiendo: ${error.message}`);
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