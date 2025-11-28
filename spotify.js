document.addEventListener('DOMContentLoaded', () => {
    console.log("Welcome to the combined Music Player!");

    // --- CSS Injection for Toast Notifications & UI Enhancements ---
    const style = document.createElement('style');
    style.innerHTML = `
        #toast-container {
            position: fixed;
            bottom: 110px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 9999;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
        }
        .toast {
            background-color: rgba(18, 18, 18, 0.8);
            color: #fff;
            padding: 12px 24px;
            border-radius: 25px;
            font-size: 0.9rem;
            border: 1px solid rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.4s ease, transform 0.4s ease;
        }
        .toast.show {
            opacity: 1;
            transform: translateY(0);
        }
        #repeat.active-icon, #popupRepeat.active-icon,
        #shuffle.active-icon, #popupShuffle.active-icon {
            color: var(--glow-color, #a855f7) !important;
            text-shadow: 0 0 10px var(--glow-color, #a855f7);
            position: relative;
        }
        .repeat-one-indicator::after {
            content: '1';
            position: absolute;
            top: -5px;
            right: -6px;
            background-color: var(--glow-color, #a855f7);
            color: white;
            border-radius: 50%;
            width: 14px;
            height: 14px;
            font-size: 9px;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
            line-height: 1;
            box-shadow: 0 2px 5px rgba(0,0,0,0.5);
        }
    `;
    document.head.appendChild(style);

    const toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    document.body.appendChild(toastContainer);

    // --- STATE & VARIABLES ---
    let songIndex = 0;
    let isShuffled = false;
    let repeatMode = 0; 
    let lastVolume = 1;
    let audioElement = new Audio();
    let isSeeking = false;

    // --- DOM ELEMENTS ---
    const masterPlay = document.getElementById('masterPlay');
    const myProgressBar = document.getElementById('myProgressBar');
    const nextBtn = document.getElementById('next');
    const prevBtn = document.getElementById('previous');
    const shuffleBtn = document.getElementById('shuffle');
    const repeatBtn = document.getElementById('repeat');
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeIcon = document.getElementById('volumeIcon');
    
    const masterSongName = document.getElementById('masterSongName');
    const masterArtistName = document.getElementById('masterArtistName');
    const currentCoverArt = document.getElementById('currentCoverArt');
    const currentTimeSpan = document.getElementById('currentTime');
    const totalDurationSpan = document.getElementById('totalDuration');
    const songItemContainer = document.querySelector('.songItemContainer');

    // --- POPUP ELEMENTS ---
    const miniPlayer = document.getElementById('miniPlayer');
    const mobilePopup = document.getElementById('mobilePopup');
    const closePopupBtn = document.getElementById('closePopupBtn');
    const popupCoverArt = document.getElementById('popupCoverArt');
    const popupSongName = document.getElementById('popupSongName');
    const popupArtistName = document.getElementById('popupArtistName');
    const popupProgressBar = document.getElementById('popupProgressBar');
    const popupCurrentTime = document.getElementById('popupCurrentTime');
    const popupTotalDuration = document.getElementById('popupTotalDuration');
    const popupPlay = document.getElementById('popupPlay');
    const popupPrev = document.getElementById('popupPrev');
    const popupNext = document.getElementById('popupNext');
    const popupShuffle = document.getElementById('popupShuffle');
    const popupRepeat = document.getElementById('popupRepeat');

    const dynamicBackground = document.querySelector('.dynamic-background');
    const bannerCoverArt = document.getElementById('bannerCoverArt');
    const bannerSongName = document.getElementById('bannerSongName');
    const bannerArtistName = document.getElementById('bannerArtistName');

    // --- SHARE ELEMENTS ---
    const openShareBtn = document.getElementById('openShareBtn');
    const closeShareBtn = document.getElementById('closeShareBtn');
    const shareOverlay = document.getElementById('shareOverlay');
    const shareArt = document.getElementById('shareArt');
    const shareSong = document.getElementById('shareSong');
    const shareArtist = document.getElementById('shareArtist');
    const shareWhatsapp = document.getElementById('shareWhatsapp');
    const shareInsta = document.getElementById('shareInsta');
    const shareSnap = document.getElementById('shareSnap');
    const shareCopy = document.getElementById('shareCopy');
    const shareCanvas = document.getElementById('shareCanvas');

    // --- CRITICAL FIX: MOBILE CANVAS VISIBILITY ---
    // Mobile browsers (Safari/Chrome) REFUSE to draw on "display: none" elements.
    // We must make it block, but push it off-screen so the user doesn't see it.
    if (shareCanvas) {
        shareCanvas.style.display = 'block';
        shareCanvas.style.position = 'fixed';
        shareCanvas.style.left = '-9999px';
        shareCanvas.style.top = '-9999px';
        shareCanvas.style.visibility = 'hidden'; // 'hidden' usually works, unlike 'display: none'
    }

    // --- SONG DATA ---
    const songs = [
      { songName: "Bewafa", artistName: "Pratik karn", filePath: "song/1.mp3", coverPath: "covers/1.jpg" },
      { songName: "Yaadein Teri", artistName: "Pratik karn", filePath: "song/2.mp3", coverPath: "covers/2.jpg" },
      { songName: "DEAF KEV", artistName: "Invincible", filePath: "song/3.mp3", coverPath: "covers/3.jpg" },
      { songName: "Different Heaven", artistName: "My Heart", filePath: "song/4.mp3", coverPath: "covers/4.jpg" },
      { songName: "Janji-Heroes", artistName: "Tonight", filePath: "song/5.mp3", coverPath: "covers/5.jpg" },
      { songName: "Rabba", artistName: "Ehsaan", filePath: "song/6.mp3", coverPath: "covers/6.jpg" },
      { songName: "Sakhiyaan", artistName: "Maninder Buttar", filePath: "song/7.mp3", coverPath: "covers/7.jpg" },
      { songName: "Bhula Dena", artistName: "Mustafa Zahid", filePath: "song/8.mp3", coverPath: "covers/8.jpg" },
    ];

    // --- MEDIA SESSION ---
    const updateMediaSession = () => {
        if ('mediaSession' in navigator) {
            const song = songs[songIndex];
            navigator.mediaSession.metadata = new MediaMetadata({
                title: song.songName,
                artist: song.artistName,
                album: 'Mint Music Player',
                artwork: [{ src: new URL(song.coverPath, document.baseURI).href, sizes: '512x512', type: 'image/jpeg' }]
            });
            updatePositionState();
        }
    };

    const updatePositionState = () => {
        if ('mediaSession' in navigator && audioElement.duration && !isNaN(audioElement.duration)) {
            try {
                navigator.mediaSession.setPositionState({
                    duration: audioElement.duration,
                    playbackRate: audioElement.playbackRate,
                    position: audioElement.currentTime
                });
            } catch (error) { console.error("Position state error:", error); }
        }
    };

    // --- LOAD & PLAY ---
    const loadSong = (index, autoPlay = true) => {
        songIndex = index;
        const song = songs[songIndex];
        audioElement.src = song.filePath;

        if(masterSongName) masterSongName.innerText = song.songName;
        if(masterArtistName) masterArtistName.innerText = song.artistName;
        if(currentCoverArt) currentCoverArt.src = song.coverPath;
        if(bannerSongName) bannerSongName.innerText = song.songName;
        if(bannerArtistName) bannerArtistName.innerText = song.artistName;
        if(bannerCoverArt) bannerCoverArt.src = song.coverPath;
        if(dynamicBackground) dynamicBackground.style.backgroundImage = `url(${song.coverPath})`;
        if(popupSongName) popupSongName.innerText = song.songName;
        if(popupArtistName) popupArtistName.innerText = song.artistName;
        if(popupCoverArt) popupCoverArt.src = song.coverPath;
        if(shareSong) shareSong.innerText = song.songName;
        if(shareArtist) shareArtist.innerText = song.artistName;
        if(shareArt) shareArt.src = song.coverPath;

        const snapButton = document.querySelector('.snapchat-creative-kit-share');
        if(snapButton) snapButton.dataset.shareUrl = `https://dropmint.online?song=${index}`;

        audioElement.currentTime = 0;
        [myProgressBar, popupProgressBar].forEach(bar => {
            if(bar) {
                bar.max = 100;
                bar.value = 0;
                bar.style.background = `linear-gradient(to right, var(--spotify-green) 0%, rgba(255, 255, 255, 0.2) 0%)`;
            }
        });

        updateMediaSession();

        if (autoPlay) {
            showToast(`Playing: ${song.songName}`);
            playSong();
        } else {
            audioElement.addEventListener('loadedmetadata', () => {
                const dur = formatTime(audioElement.duration);
                if(totalDurationSpan) totalDurationSpan.innerText = dur;
                if(popupTotalDuration) popupTotalDuration.innerText = dur;
                updatePositionState();
            }, { once: true });
            updateUI();
        }
    };

    const playSong = () => {
        audioElement.play().then(() => {
            document.body.classList.add('now-playing-active');
            updatePositionState();
            if(window.innerWidth <= 900) openMobilePopup();
        }).catch(error => { console.error("Playback failed:", error); updateUI(); });
        
        updateUI();
        if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
    };

    const pauseSong = () => {
        audioElement.pause();
        document.body.classList.remove('now-playing-active');
        updateUI();
        updatePositionState();
        if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
    };

    const togglePlay = () => audioElement.paused ? playSong() : pauseSong();

    const nextSong = () => {
        if (isShuffled) {
            let nextIndex;
            do { nextIndex = Math.floor(Math.random() * songs.length); } while (songs.length > 1 && nextIndex === songIndex);
            songIndex = nextIndex;
        } else {
            songIndex = (songIndex + 1) % songs.length;
        }
        loadSong(songIndex);
    };

    const prevSong = () => {
        songIndex = (songIndex - 1 + songs.length) % songs.length;
        loadSong(songIndex);
    };

    const updateUI = () => {
        const isPlaying = !audioElement.paused && !audioElement.ended;
        if (masterPlay) masterPlay.className = isPlaying ? 'fa-regular fa-circle-pause' : 'fa-regular fa-circle-play';
        if (popupPlay) popupPlay.className = isPlaying ? 'fa-solid fa-circle-pause main-play-btn' : 'fa-solid fa-circle-play main-play-btn';
        document.querySelectorAll('.songItemPlay').forEach((icon, index) => {
            icon.className = (index === songIndex && isPlaying) ? 'fa-regular fa-circle-pause songItemPlay' : 'fa-regular fa-circle-play songItemPlay';
        });
        [shuffleBtn, popupShuffle].forEach(btn => { if(btn) btn.classList.toggle('active-icon', isShuffled); });
        [repeatBtn, popupRepeat].forEach(btn => {
            if(btn) {
                btn.classList.toggle('active-icon', repeatMode !== 0);
                btn.classList.toggle('repeat-one-indicator', repeatMode === 2);
            }
        });
    };

    const openMobilePopup = () => {
        if(mobilePopup && window.innerWidth <= 900) {
            mobilePopup.classList.add('active');
            if(miniPlayer) miniPlayer.classList.add('hidden-mini');
        }
    };
    const closeMobilePopup = () => {
        if(mobilePopup) {
            mobilePopup.classList.remove('active');
            if(miniPlayer) miniPlayer.classList.remove('hidden-mini');
        }
    };

    // --- SHARE LOGIC: MOBILE CANVAS FIX ---
    const drawShareImage = (song, callback) => {
        if(!shareCanvas) return;
        
        // Ensure canvas is visible (off-screen) before drawing
        // This redundancy ensures even dynamic updates don't hide it
        shareCanvas.style.display = 'block'; 
        
        const ctx = shareCanvas.getContext('2d');
        const img = new Image();
        
        // IMPORTANT: For local files (file://) or relative paths on same domain, 
        // crossOrigin is NOT needed and can cause errors.
        // img.crossOrigin = "anonymous"; 
        
        img.src = song.coverPath;
        
        img.onload = () => {
            // FORCE SMALL SIZE: 300x533 (Mobile Safe)
            const w = 300;
            const h = 533;
            
            shareCanvas.width = w;
            shareCanvas.height = h;
            
            // Draw
            const scale = w / 1080;
            ctx.scale(scale, scale);

            // 1. Background
            const grd = ctx.createLinearGradient(0, 0, 0, 1920);
            grd.addColorStop(0, "#2b2b2b"); 
            grd.addColorStop(1, "#000000");
            ctx.fillStyle = grd;
            ctx.fillRect(0, 0, 1080, 1920);

            // 2. Blurry Background
            ctx.save();
            ctx.filter = 'blur(40px) brightness(0.6)';
            ctx.drawImage(img, -200, -200, 1480, 2320); 
            ctx.restore();

            // 3. Card Container
            const cardX = 140, cardY = 400, cardW = 800, cardH = 1100;
            ctx.fillStyle = "rgba(30, 30, 30, 0.9)";
            ctx.beginPath();
            ctx.roundRect(cardX, cardY, cardW, cardH, 40);
            ctx.fill();

            // 4. Album Art
            const artSize = 700;
            ctx.drawImage(img, cardX + 50, cardY + 50, artSize, artSize);

            // 5. Text
            ctx.fillStyle = "white";
            ctx.font = "bold 60px Ubuntu";
            ctx.fillText(song.songName, cardX + 50, cardY + artSize + 120);
            
            ctx.fillStyle = "#b3b3b3";
            ctx.font = "40px Varela Round";
            ctx.fillText(song.artistName, cardX + 50, cardY + artSize + 200);

            // 6. Logo
            ctx.fillStyle = "#1DB954";
            ctx.font = "bold 30px Ubuntu";
            ctx.fillText("Mint Music", cardX + 50, cardY + cardH - 50);

            // EXPORT: Tiny delay to ensure rendering buffer is ready
            setTimeout(() => {
                try {
                    const dataUrl = shareCanvas.toDataURL('image/jpeg', 0.5);
                    callback(dataUrl);
                } catch(e) {
                    console.error("Canvas export failed:", e);
                    showToast("Error creating snap sticker.");
                }
            }, 50);
        };
        
        img.onerror = () => { showToast("Error loading cover art."); };
    };

    const handleShare = (platform) => {
        const currentSong = songs[songIndex];
        const deepLink = `https://dropmint.online?song=${songIndex}`;
        
        if (platform === 'snapchat') {
            showToast("Opening Snapchat...");
            drawShareImage(currentSong, (dataUrl) => {
                if (window.snap && window.snap.creativekit) {
                    snap.creativekit.share({
                      shareData: {
                        sticker: {
                          src: dataUrl,
                          metadata: { type: "SNAP_IMAGE", position: "center", scale: 1 }
                        },
                        attachmentUrl: deepLink
                      }
                    });
                    if(shareOverlay) shareOverlay.classList.remove('active');
                } else {
                    showToast("Snapchat SDK not ready.");
                }
            });
        } 
        else if (platform === 'whatsapp') {
            window.location.href = `https://wa.me/?text=${encodeURIComponent("Listen to " + currentSong.songName + " " + deepLink)}`;
            if(shareOverlay) shareOverlay.classList.remove('active');
        }
        else if (platform === 'copy') {
            navigator.clipboard.writeText(deepLink).then(() => showToast("Link Copied!"));
            if(shareOverlay) shareOverlay.classList.remove('active');
        }
        else if (platform === 'instagram') {
             navigator.clipboard.writeText(deepLink).then(() => showToast("Link Copied for Instagram!"));
             window.location.href = "instagram://story-camera"; 
        }
    };

    // --- EVENT LISTENERS ---
    masterPlay && masterPlay.addEventListener('click', togglePlay);
    popupPlay && popupPlay.addEventListener('click', togglePlay);
    nextBtn && nextBtn.addEventListener('click', nextSong);
    popupNext && popupNext.addEventListener('click', nextSong);
    prevBtn && prevBtn.addEventListener('click', prevSong);
    popupPrev && popupPrev.addEventListener('click', prevSong);

    const toggleShuffle = () => {
        isShuffled = !isShuffled;
        showToast(isShuffled ? "Shuffle On" : "Shuffle Off");
        updateUI();
    };
    shuffleBtn && shuffleBtn.addEventListener('click', toggleShuffle);
    popupShuffle && popupShuffle.addEventListener('click', toggleShuffle);

    const toggleRepeat = () => {
        repeatMode = (repeatMode + 1) % 3;
        const modes = ["Repeat Off", "Repeat Playlist", "Repeat Song"];
        showToast(modes[repeatMode]);
        updateUI();
    };
    repeatBtn && repeatBtn.addEventListener('click', toggleRepeat);
    popupRepeat && popupRepeat.addEventListener('click', toggleRepeat);

    if(closePopupBtn) closePopupBtn.addEventListener('click', closeMobilePopup);
    if(miniPlayer) {
        miniPlayer.addEventListener('click', (e) => {
            if(!e.target.closest('.icons')) openMobilePopup();
        });
    }

    if(openShareBtn) openShareBtn.addEventListener('click', () => shareOverlay.classList.add('active'));
    if(closeShareBtn) closeShareBtn.addEventListener('click', () => shareOverlay.classList.remove('active'));
    if(shareOverlay) {
        shareOverlay.addEventListener('click', (e) => {
            if(e.target === shareOverlay) shareOverlay.classList.remove('active');
        });
    }

    if(shareSnap) shareSnap.addEventListener('click', () => handleShare('snapchat'));
    if(shareWhatsapp) shareWhatsapp.addEventListener('click', () => handleShare('whatsapp'));
    if(shareCopy) shareCopy.addEventListener('click', () => handleShare('copy'));
    if(shareInsta) shareInsta.addEventListener('click', () => handleShare('instagram'));

    const handleSeekStart = () => { isSeeking = true; };
    const handleSeekEnd = () => { isSeeking = false; };

    [myProgressBar, popupProgressBar].forEach(bar => {
        if(bar) {
            bar.addEventListener('pointerdown', handleSeekStart);
            bar.addEventListener('pointerup', handleSeekEnd);
            bar.addEventListener('input', (e) => {
                if (!audioElement.duration) return;
                const val = Number(e.target.value);
                audioElement.currentTime = (val / 100) * audioElement.duration;
                const percent = val;
                const color = `linear-gradient(to right, var(--spotify-green) ${percent}%, rgba(255, 255, 255, 0.2) ${percent}%)`;
                if(myProgressBar) { myProgressBar.value = val; myProgressBar.style.background = color; }
                if(popupProgressBar) { popupProgressBar.value = val; popupProgressBar.style.background = color; }
                if(currentTimeSpan) currentTimeSpan.innerText = formatTime(audioElement.currentTime);
                if(popupCurrentTime) popupCurrentTime.innerText = formatTime(audioElement.currentTime);
            });
        }
    });
    document.addEventListener('pointerup', handleSeekEnd);

    audioElement.addEventListener('timeupdate', () => {
        if (!audioElement.duration) return;
        const curTime = formatTime(audioElement.currentTime);
        if(currentTimeSpan) currentTimeSpan.innerText = curTime;
        if(popupCurrentTime) popupCurrentTime.innerText = curTime;
        if (!isSeeking) {
            const progressValue = (audioElement.currentTime / audioElement.duration) * 100;
            const color = `linear-gradient(to right, var(--spotify-green) ${progressValue}%, rgba(255, 255, 255, 0.2) ${progressValue}%)`;
            if(myProgressBar) { myProgressBar.value = progressValue; myProgressBar.style.background = color; }
            if(popupProgressBar) { popupProgressBar.value = progressValue; popupProgressBar.style.background = color; }
        }
    });

    audioElement.addEventListener('ended', () => {
        if (repeatMode === 2) loadSong(songIndex);
        else if (repeatMode === 1 || isShuffled) nextSong();
        else if (songIndex < songs.length - 1) nextSong();
        else pauseSong();
    });

    songItemContainer && songItemContainer.addEventListener('click', (e) => {
        const targetItem = e.target.closest('.songItem');
        if (targetItem) {
            const index = parseInt(targetItem.dataset.index, 10);
            if (songIndex === index && !audioElement.paused) pauseSong();
            else loadSong(index);
        }
    });

    if (volumeSlider) {
        volumeSlider.addEventListener('input', (e) => {
            audioElement.volume = Number(e.target.value);
            const pct = audioElement.volume * 100;
            volumeSlider.style.background = `linear-gradient(to right, var(--spotify-green) ${pct}%, rgba(255, 255, 255, 0.2) ${pct}%)`;
            if (volumeIcon) {
                if (audioElement.volume > 0.5) volumeIcon.className = "fa-solid fa-volume-high";
                else if (audioElement.volume > 0) volumeIcon.className = "fa-solid fa-volume-low";
                else volumeIcon.className = "fa-solid fa-volume-xmark";
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT') return;
        if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
        else if (e.code === 'ArrowRight') nextSong();
        else if (e.code === 'ArrowLeft') prevSong();
    });

    const populateSongList = () => {
        if (!songItemContainer) return;
        songItemContainer.innerHTML = '';
        songs.forEach((song, i) => {
            songItemContainer.innerHTML += `
                <div class="songItem" data-index="${i}">
                    <img src="${song.coverPath}" alt="${song.songName}">
                    <span class="songName">${song.songName}</span>
                    <span class="song-duration" id="duration-${i}">00:00</span>
                    <span class="songlistplay"><i class="fa-regular songItemPlay fa-circle-play"></i></span>
                </div>`;
        });
    };

    const fetchDurations = () => {
        songs.forEach((song, i) => {
            const temp = new Audio(song.filePath);
            temp.preload = 'metadata';
            temp.addEventListener('loadedmetadata', () => {
                const el = document.getElementById(`duration-${i}`);
                if(el) el.innerText = formatTime(temp.duration);
            });
        });
    };

    const formatTime = (seconds) => {
        if (isNaN(seconds) || seconds < 0) return "00:00";
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const showToast = (msg) => {
        const t = document.createElement('div');
        t.className = 'toast';
        t.textContent = msg;
        toastContainer.appendChild(t);
        setTimeout(() => t.classList.add('show'), 10);
        setTimeout(() => {
            t.classList.remove('show');
            t.addEventListener('transitionend', () => t.remove());
        }, 3000);
    };

    populateSongList();
    fetchDurations();

    const urlParams = new URLSearchParams(window.location.search);
    const songParam = urlParams.get('song');
    if(songParam !== null && !isNaN(songParam) && songs[songParam]) {
        loadSong(parseInt(songParam), true);
    } else {
        loadSong(0, false);
    }

    if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', playSong);
        navigator.mediaSession.setActionHandler('pause', pauseSong);
        navigator.mediaSession.setActionHandler('previoustrack', prevSong);
        navigator.mediaSession.setActionHandler('nexttrack', nextSong);
    }
});
