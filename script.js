const jsmediatags = window.jsmediatags;
const audio = new Audio();
audio.volume = 0.05; 

let playlist = []; let currentIndex = 0; let showRemaining = false; let currentCover = "";
const numSegments = 60;
let vuSensitivity = 0.6;
let vuVisible = true;
let isRandom = false;
let repeatMode = 0; 
let abPointA = null;
let abPointB = null;
let bassLevel = 0;
let trebLevel = 0;
let volTimer, vuTimer, toneTimer, volRepeatInterval, vuRepeatInterval, toneRepeatInterval;

let scanInterval, holdTimer, isScanning = false;
let audioCtx, source, analyserL, analyserR, splitter, bassFilter, trebFilter, isAudioInit = false;

// Theme Logic
const bgColorBtn = document.getElementById('bg-color-btn');
const colorOverlay = document.getElementById('color-picker-overlay');
const bgColorInput = document.getElementById('bg-color-input');
const auraColorInput = document.getElementById('aura-color-input');
const resetThemeBtn = document.getElementById('reset-theme-btn');
const chassis = document.getElementById('main-chassis');

// Load saved theme
const savedBg = localStorage.getItem('technics-bg-color') || '#050505';
const savedAura = localStorage.getItem('technics-aura-color') || 'rgba(255, 255, 255, 0.7)';
document.body.style.backgroundColor = savedBg;
bgColorInput.value = savedBg;
document.documentElement.style.setProperty('--backlight-color', savedAura);
// Convert RGB/RGBA to Hex for input value
auraColorInput.value = savedAura.startsWith('rgba') ? '#ffffff' : savedAura;

bgColorBtn.onclick = () => colorOverlay.style.display = 'flex';
document.getElementById('close-color-picker').onclick = () => colorOverlay.style.display = 'none';

bgColorInput.oninput = (e) => {
    document.body.style.backgroundColor = e.target.value;
    localStorage.setItem('technics-bg-color', e.target.value);
};

auraColorInput.oninput = (e) => {
    const color = e.target.value;
    // Add 0.7 alpha to the hex color
    const rgba = color + 'b3'; 
    document.documentElement.style.setProperty('--backlight-color', rgba);
    localStorage.setItem('technics-aura-color', rgba);
};

resetThemeBtn.onclick = () => {
    document.body.style.backgroundColor = '#050505';
    document.documentElement.style.setProperty('--backlight-color', 'rgba(255, 255, 255, 0.7)');
    bgColorInput.value = '#050505';
    auraColorInput.value = '#ffffff';
    localStorage.removeItem('technics-bg-color');
    localStorage.removeItem('technics-aura-color');
};

// Media Session Setup
function updateMediaMetadata(title, artist, album, artworkUrl) {
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: title || 'Unknown Title',
            artist: artist || 'Unknown Artist',
            album: album || 'Unknown Album',
            artwork: artworkUrl ? [{ src: artworkUrl, sizes: '512x512', type: 'image/png' }] : []
        });
    }
}

if ('mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('play', () => { if (playlist.length > 0) { audio.play(); updateDisplay(); } });
    navigator.mediaSession.setActionHandler('pause', () => { audio.pause(); updateDisplay(); });
    navigator.mediaSession.setActionHandler('previoustrack', () => { prevTrack(); });
    navigator.mediaSession.setActionHandler('nexttrack', () => { nextTrack(); });
}

function initAudio() {
    if (isAudioInit) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    source = audioCtx.createMediaElementSource(audio);
    
    bassFilter = audioCtx.createBiquadFilter();
    bassFilter.type = "lowshelf";
    bassFilter.frequency.value = 200;
    bassFilter.gain.value = bassLevel;

    trebFilter = audioCtx.createBiquadFilter();
    trebFilter.type = "highshelf";
    trebFilter.frequency.value = 3000;
    trebFilter.gain.value = trebLevel;

    splitter = audioCtx.createChannelSplitter(2);
    analyserL = audioCtx.createAnalyser(); 
    analyserR = audioCtx.createAnalyser();
    analyserL.fftSize = 256; analyserR.fftSize = 256;

    source.connect(bassFilter);
    bassFilter.connect(trebFilter);
    trebFilter.connect(splitter);
    splitter.connect(analyserL, 0); 
    splitter.connect(analyserR, 1);
    trebFilter.connect(audioCtx.destination);
    isAudioInit = true;
}

const vuLeft = document.getElementById('vu-left');
const vuRight = document.getElementById('vu-right');
function createSegments(container) { for (let i = 0; i < numSegments; i++) { const seg = document.createElement('div'); seg.className = 'segment'; container.appendChild(seg); } }
createSegments(vuLeft); createSegments(vuRight);

function drawVU() {
    requestAnimationFrame(drawVU);
    if (!isAudioInit || audio.paused || !vuVisible || audio.muted) { 
        document.querySelectorAll('.segment').forEach(s => s.className = 'segment'); 
        return; 
    }
    const dataL = new Uint8Array(analyserL.frequencyBinCount); const dataR = new Uint8Array(analyserR.frequencyBinCount);
    analyserL.getByteFrequencyData(dataL); analyserR.getByteFrequencyData(dataR);
    const getLevel = (data) => { let sum = 0; for(let i=0; i<data.length; i++) sum += data[i]; return sum / data.length; };
    const updateBar = (container, avg) => {
        const level = Math.min(numSegments, Math.floor((avg / 100) * numSegments * vuSensitivity));
        const segments = container.children;
        for (let i = 0; i < numSegments; i++) {
            segments[i].className = 'segment';
            if (i < level) {
                if (i > numSegments - 10) segments[i].classList.add('active-red');
                else segments[i].classList.add('active-white');
            }
        }
    };
    updateBar(vuLeft, getLevel(dataL)); updateBar(vuRight, getLevel(dataR));
}
drawVU();

function clearCentralLCD() {
    document.getElementById('volume-display-lcd').style.display = 'none';
    document.getElementById('vu-display-lcd').style.display = 'none';
    document.getElementById('tone-display-lcd').style.display = 'none';
}

function showVolLCD() {
    if (document.getElementById('lcd-logo').style.display !== 'none' || audio.muted) return;
    clearCentralLCD();
    const display = document.getElementById('volume-display-lcd');
    display.textContent = `VOL ${Math.round(audio.volume * 100)}%`;
    display.style.display = 'block';
    clearTimeout(volTimer);
    volTimer = setTimeout(() => { display.style.display = 'none'; }, 1000);
}

function showVuLCD() {
    if (document.getElementById('lcd-logo').style.display !== 'none' || audio.muted) return;
    clearCentralLCD();
    const display = document.getElementById('vu-display-lcd');
    display.textContent = `VU SENS ${vuSensitivity.toFixed(2)}`;
    display.style.display = 'block';
    clearTimeout(vuTimer);
    vuTimer = setTimeout(() => { display.style.display = 'none'; }, 1000);
}

function showToneLCD(type, val) {
    if (document.getElementById('lcd-logo').style.display !== 'none' || audio.muted) return;
    clearCentralLCD();
    const display = document.getElementById('tone-display-lcd');
    const sign = val >= 0 ? "+" : "";
    display.textContent = `${type} ${sign}${val.toString().padStart(2, '0')}`;
    display.style.display = 'block';
    clearTimeout(toneTimer);
    toneTimer = setTimeout(() => { display.style.display = 'none'; }, 1000);
}

function changeVolume(delta) {
    audio.muted = false;
    audio.volume = Math.max(0, Math.min(1.0, audio.volume + delta));
    updateMuteDisplay();
    showVolLCD();
}

function setupVolButton(id, delta) {
    const btn = document.getElementById(id);
    const startRepeat = () => { changeVolume(delta); volRepeatInterval = setInterval(() => changeVolume(delta), 50); };
    const stopRepeat = () => { clearInterval(volRepeatInterval); };
    btn.onmousedown = (e) => { if(e.button === 0) startRepeat(); };
    btn.onmouseup = stopRepeat; btn.onmouseleave = stopRepeat;
    btn.ontouchstart = (e) => { e.preventDefault(); startRepeat(); };
    btn.ontouchend = stopRepeat;
    btn.onmouseenter = showVolLCD;
}
setupVolButton('vol-inc', 0.01); setupVolButton('vol-dec', -0.01);

function changeVUSensitivity(delta) {
    if(audio.muted) return;
    vuSensitivity = Math.max(0.2, Math.min(3.0, vuSensitivity + delta));
    showVuLCD();
}

function setupVUButton(id, delta) {
    const btn = document.getElementById(id);
    const startRepeat = () => { changeVUSensitivity(delta); vuRepeatInterval = setInterval(() => changeVUSensitivity(delta), 50); };
    const stopRepeat = () => { clearInterval(vuRepeatInterval); };
    btn.onmousedown = (e) => { if(e.button === 0) startRepeat(); };
    btn.onmouseup = stopRepeat; btn.onmouseleave = stopRepeat;
    btn.ontouchstart = (e) => { e.preventDefault(); startRepeat(); };
    btn.ontouchend = stopRepeat;
    btn.onmouseenter = showVuLCD;
}
setupVUButton('vu-inc', 0.05); setupVUButton('vu-dec', -0.05);

function changeTone(type, delta) {
    if(audio.muted) return;
    if (type === 'BASS') {
        bassLevel = Math.max(-10, Math.min(10, bassLevel + delta));
        if (bassFilter) bassFilter.gain.value = bassLevel;
        showToneLCD('BASS', bassLevel);
    } else {
        trebLevel = Math.max(-10, Math.min(10, trebLevel + delta));
        if (trebFilter) trebFilter.gain.value = trebLevel;
        showToneLCD('TREB', trebLevel);
    }
}

function setupToneButton(id, type, delta) {
    const btn = document.getElementById(id);
    const startRepeat = () => { changeTone(type, delta); toneRepeatInterval = setInterval(() => changeTone(type, delta), 150); };
    const stopRepeat = () => { clearInterval(toneRepeatInterval); };
    btn.onmousedown = (e) => { if(e.button === 0) startRepeat(); };
    btn.onmouseup = stopRepeat; btn.onmouseleave = stopRepeat;
    btn.ontouchstart = (e) => { e.preventDefault(); startRepeat(); };
    btn.ontouchend = stopRepeat;
    btn.onmouseenter = () => showToneLCD(type, type === 'BASS' ? bassLevel : trebLevel);
}
setupToneButton('bass-inc', 'BASS', 1); setupToneButton('bass-dec', 'BASS', -1);
setupToneButton('treb-inc', 'TREB', 1); setupToneButton('treb-dec', 'TREB', -1);

document.getElementById('mute-btn').onclick = () => {
    audio.muted = !audio.muted;
    updateMuteDisplay();
};

function updateMuteDisplay() {
    const isMuted = audio.muted;
    const btn = document.getElementById('mute-btn');
    const icon = document.getElementById('mute-icon');
    const lcd = document.getElementById('mute-status-lcd');
    btn.classList.toggle('btn-mini-active', isMuted);
    lcd.style.display = isMuted ? 'block' : 'none';
    if (isMuted) {
        icon.className = 'fa-solid fa-volume-xmark';
        clearCentralLCD();
    } else {
        icon.className = 'fa-solid fa-volume-high';
    }
}

document.getElementById('random-btn').onclick = () => {
    isRandom = !isRandom;
    document.getElementById('random-btn').classList.toggle('btn-mini-active', isRandom);
    document.getElementById('random-status-lcd').style.display = isRandom ? 'block' : 'none';
};

document.getElementById('repeat-btn').onclick = () => {
    repeatMode = (repeatMode + 1) % 3;
    const btn = document.getElementById('repeat-btn');
    const lcd = document.getElementById('repeat-status-lcd');
    if (repeatMode === 1) { btn.classList.add('btn-mini-active'); lcd.style.display = 'block'; lcd.textContent = 'REPEAT 1'; }
    else if (repeatMode === 2) { btn.classList.add('btn-mini-active'); lcd.style.display = 'block'; lcd.textContent = 'REPEAT ALL'; }
    else { btn.classList.remove('btn-mini-active'); lcd.style.display = 'none'; }
};

const abBtn = document.getElementById('ab-repeat-btn');
const abLcd = document.getElementById('ab-status-lcd');

function resetAB() {
    abPointA = null; abPointB = null;
    abBtn.classList.remove('btn-mini-active');
    abBtn.textContent = "A-B";
    abLcd.style.display = 'none';
    abLcd.classList.remove('ab-blinking');
}

abBtn.onclick = () => {
    if (playlist.length === 0) return;
    if (abPointA === null) {
        abPointA = audio.currentTime; 
        abBtn.classList.add('btn-mini-active'); 
        abBtn.textContent = "A-";
        abLcd.style.display = 'block';
        abLcd.classList.add('ab-blinking');
    } else if (abPointB === null) {
        if (audio.currentTime > abPointA) { 
            abPointB = audio.currentTime; 
            abBtn.textContent = "A-B";
            abLcd.classList.remove('ab-blinking');
        } else { resetAB(); }
    } else { resetAB(); }
};

document.getElementById('vu-mode-btn').onclick = () => {
    vuVisible = !vuVisible;
    document.getElementById('vu-area').style.display = (vuVisible && playlist.length > 0) ? 'flex' : 'none';
    document.getElementById('vu-mode-btn').classList.toggle('btn-mini-active', vuVisible);
};

function updateDisplay() {
    if (playlist.length > 0) {
        document.getElementById('lcd-logo').style.display = 'none'; 
        document.getElementById('track-info-block').style.display = 'flex'; 
        if(vuVisible) { document.getElementById('vu-area').style.display = 'flex'; document.getElementById('vu-mode-btn').classList.add('btn-mini-active'); }
        document.getElementById('time-container').style.opacity = "1"; 
        document.getElementById('playlist-container').style.opacity = "1";
        document.getElementById('playlist-status').textContent = `${(currentIndex + 1).toString().padStart(2,'0')}/${playlist.length.toString().padStart(2,'0')}`;
        
        const file = playlist[currentIndex];
        const title = file.name.replace(/\.[^/.]+$/, "");
        document.getElementById('track-title').textContent = title;
        const formatBadge = document.getElementById('file-format-badge');
        formatBadge.textContent = file.name.split('.').pop().toUpperCase();
        formatBadge.style.display = 'inline-block';

        jsmediatags.read(file, {
            onSuccess: (tag) => {
                const t = tag.tags;
                const artist = t.artist || "UNKNOWN";
                const album = t.album || "UNKNOWN";
                document.getElementById('track-meta').textContent = `${artist} - ${album}`;
                const artworkLcd = document.getElementById('lcd-artwork');
                if (t.picture) {
                    const { data, format } = t.picture; let base = "";
                    for (let i = 0; i < data.length; i++) base += String.fromCharCode(data[i]);
                    currentCover = `data:${format};base64,${window.btoa(base)}`;
                    artworkLcd.src = currentCover;
                } else { 
                    currentCover = "img/Technics_cover.png"; 
                    artworkLcd.src = currentCover;
                }
                artworkLcd.style.display = 'block';
                updateMediaMetadata(title, artist, album, currentCover);
            },
            onError: () => {
                currentCover = "img/Technics_cover.png";
                const artworkLcd = document.getElementById('lcd-artwork');
                artworkLcd.src = currentCover;
                artworkLcd.style.display = 'block';
                updateMediaMetadata(title, "UNKNOWN", "UNKNOWN", currentCover);
            }
        });
        const playBtn = document.getElementById('play-btn');
        if (audio.paused) playBtn.classList.add('paused-blink'); else playBtn.classList.remove('paused-blink');
        playBtn.style.color = audio.paused ? "#777" : "var(--pure-white)";
    }
}

document.getElementById('time-container').onclick = () => { showRemaining = !showRemaining; updateTime(); };
document.getElementById('track-title').onclick = () => { if(currentCover) { document.getElementById('album-cover').src = currentCover; document.getElementById('artwork-overlay').style.display = 'flex'; } };
document.getElementById('playlist-container').onclick = () => {
    const container = document.getElementById('playlist-items'); container.innerHTML = '';
    playlist.forEach((f, i) => {
        const item = document.createElement('div'); item.className = `playlist-item ${i === currentIndex ? 'active' : ''}`;
        item.textContent = `${(i+1).toString().padStart(2,'0')}. ${f.name.replace(/\.[^/.]+$/, "")}`;
        item.onclick = () => { playTrack(i); document.getElementById('playlist-overlay').style.display = 'none'; };
        container.appendChild(item);
    });
    document.getElementById('playlist-overlay').style.display = 'flex';
};

document.getElementById('play-btn').onclick = () => { if (playlist.length > 0) { initAudio(); if (audio.paused) audio.play(); else audio.pause(); updateDisplay(); } };
document.getElementById('eject-btn').onclick = () => { document.getElementById('drawer-area').classList.toggle('open'); if(document.getElementById('drawer-area').classList.contains('open')) setTimeout(() => document.getElementById('file-input').click(), 600); };
document.getElementById('file-input').onchange = (e) => { if (e.target.files.length > 0) { playlist = Array.from(e.target.files); document.getElementById('drawer-area').classList.remove('open'); playTrack(0); } };

function playTrack(index) { resetAB(); initAudio(); currentIndex = index; audio.src = URL.createObjectURL(playlist[currentIndex]); audio.play().then(() => updateDisplay()); }

function nextTrack() {
    if (repeatMode === 1) { playTrack(currentIndex); return; }
    if (isRandom && playlist.length > 1) {
        let nextIdx; do { nextIdx = Math.floor(Math.random() * playlist.length); } while (nextIdx === currentIndex);
        playTrack(nextIdx);
    } else if (currentIndex < playlist.length - 1) { playTrack(currentIndex + 1); }
    else if (repeatMode === 2) { playTrack(0); }
    else { updateDisplay(); }
}

function prevTrack() {
    if (currentIndex > 0) playTrack(currentIndex - 1);
    else if (repeatMode === 2) playTrack(playlist.length - 1);
}

audio.onended = nextTrack;

function startScan(direction) { isScanning = true; scanInterval = setInterval(() => { audio.currentTime += (direction * 2); }, 100); }
function stopScan() { clearInterval(scanInterval); isScanning = false; }

function setupScanButton(id, direction, action) {
    const btn = document.getElementById(id);
    btn.onmousedown = () => { if (playlist.length === 0) return; holdTimer = setTimeout(() => startScan(direction), 500); };
    btn.onmouseup = () => { clearTimeout(holdTimer); if (isScanning) stopScan(); else action(); };
    btn.onmouseleave = () => { clearTimeout(holdTimer); if (isScanning) stopScan(); };
    btn.ontouchstart = (e) => { e.preventDefault(); if (playlist.length === 0) return; holdTimer = setTimeout(() => startScan(direction), 500); };
    btn.ontouchend = () => { clearTimeout(holdTimer); if (isScanning) stopScan(); else action(); };
}

setupScanButton('next-btn', 1, nextTrack);
setupScanButton('prev-btn', -1, prevTrack);

document.getElementById('power-toggle').onclick = () => location.reload();

function updateTime() {
    const time = showRemaining ? (audio.duration - audio.currentTime) : audio.currentTime;
    if (isNaN(time)) return;
    const sign = (showRemaining && time > 0) ? "-" : "";
    document.getElementById('time-display').textContent = sign + new Date(time * 1000).toISOString().substr(14, 5);
    if (abPointA !== null && abPointB !== null) {
        if (audio.currentTime >= abPointB) audio.currentTime = abPointA;
    }
}

audio.addEventListener('timeupdate', updateTime);

window.onclick = (event) => {
    if (event.target == colorOverlay) colorOverlay.style.display = 'none';
    if (event.target == document.getElementById('artwork-overlay')) document.getElementById('artwork-overlay').style.display = 'none';
    if (event.target == document.getElementById('playlist-overlay')) document.getElementById('playlist-overlay').style.display = 'none';
};
document.getElementById('close-artwork').onclick = () => document.getElementById('artwork-overlay').style.display = 'none';
document.getElementById('close-playlist').onclick = () => document.getElementById('playlist-overlay').style.display = 'none';
document.getElementById('menu-btn').onclick = () => { document.getElementById('logo-slot').classList.toggle('open'); document.getElementById('menu-btn').classList.toggle('btn-active'); };

// Logique de sélection numérique
let inputBuffer = "";
let inputTimer = null;

function pressNum(num) {
    clearTimeout(inputTimer);
    inputBuffer += num.toString();
    
    const display = document.getElementById('volume-display-lcd');
    display.textContent = `SELECT: ${inputBuffer}`;
    display.style.display = 'block';

    inputTimer = setTimeout(() => {
        const idx = parseInt(inputBuffer) - 1;
        if (playlist && playlist[idx]) {
            playTrack(idx);
        } else {
            display.textContent = "INVALID";
        }
        inputBuffer = "";
        setTimeout(() => { if(inputBuffer === "") display.style.display = 'none'; }, 1000);
    }, 1000);
}

// Reculer de 10 secondes
document.getElementById('minus-10-btn').onclick = () => {
    if (audio.src) {
        audio.currentTime = Math.max(0, audio.currentTime - 10);
    }
};

// Avancer de 10 secondes
document.getElementById('plus-10-btn').onclick = () => {
    if (audio.src) {
        audio.currentTime = Math.min(audio.duration, audio.currentTime + 10);
    }
};