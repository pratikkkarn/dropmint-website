document.addEventListener('DOMContentLoaded', () => {
    console.log("Welcome to the Expanded Music Player!");

    // --- CSS Injection for UI ---
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
            background-color: rgba(18, 18, 18, 0.85);
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
        .toast.show { opacity: 1; transform: translateY(0); }
        #repeat.active-icon { position: relative; }
        #repeat.repeat-one-indicator::after {
            content: '1'; position: absolute; top: -2px; right: -4px;
            background-color: var(--glow-color, #a855f7); color: white;
            border-radius: 50%; width: 12px; height: 12px; font-size: 9px;
            font-weight: bold; display: flex; align-items: center;
            justify-content: center; line-height: 1;
        }
    `;
    document.head.appendChild(style);
    
    const toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    document.body.appendChild(toastContainer);

    // --- STATE & VARIABLES ---
    let songIndex = 0;
    let isShuffled = false;
    let repeatMode = 0; // 0: no repeat, 1: repeat playlist, 2: repeat one
    let lastVolume = 1;
    let audioElement = new Audio();

    // --- DOM ELEMENTS ---
    const masterPlay = document.getElementById('masterPlay');
    const myProgressBar = document.getElementById('myProgressBar');
    const nextBtn = document.getElementById('next');
    const prevBtn = document.getElementById('previous');
    const shuffleBtn = document.getElementById('shuffle');
    const repeatBtn = document.getElementById('repeat');
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeIcon = document.getElementById('volumeIcon');
    const gif = document.getElementById('gif'); 
    const masterSongName = document.getElementById('masterSongName');
    const masterArtistName = document.getElementById('masterArtistName');
    const currentCoverArt = document.getElementById('currentCoverArt');
    const currentTimeSpan = document.getElementById('currentTime');
    const totalDurationSpan = document.getElementById('totalDuration');
    const songItemContainer = document.querySelector('.songItemContainer');

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
    
    // --- MEDIA SESSION API FUNCTIONS ---
    const updateMediaSessionMetadata = () => {
        if (!('mediaSession' in navigator)) return;
        const song = songs[songIndex];
        navigator.mediaSession.metadata = new MediaMetadata({
            title: song.songName,
            artist: song.artistName,
            album: 'Mint Music Player',
            artwork: [
                { src: song.coverPath, sizes: '96x96', type: 'image/jpeg' },
                { src: song.coverPath, sizes: '128x128', type: 'image/jpeg' },
                { src: song.coverPath, sizes: '192x192', type: 'image/jpeg' },
                { src: song.coverPath, sizes: '256x256', type: 'image/jpeg' },
                { src: song.coverPath, sizes: '384x384', type: 'image/jpeg' },
                { src: song.coverPath, sizes: '512x512', type: 'image/jpeg' },
            ]
        });
    };

    // --- EXPANDED: Update the position state for the lock screen progress bar
    const updatePositionState = () => {
        if ('mediaSession' in navigator && audioElement.duration) {
            navigator.mediaSession.setPositionState({
                duration: audioElement.duration,
                playbackRate: audioElement.playbackRate,
                position: audioElement.currentTime,
            });
        }
    };

    // --- CORE PLAYER FUNCTIONS ---
    const loadSong = (index, autoPlay = true) => {
        songIndex = index;
        const song = songs[songIndex];
        audioElement.src = song.filePath;
        masterSongName.innerText = song.songName;
        if (masterArtistName) masterArtistName.innerText = song.artistName;
        if (currentCoverArt) currentCoverArt.src = song.coverPath;
        audioElement.currentTime = 0;
        
        updateMediaSessionMetadata();

        if (autoPlay) {
            playSong();
        } else {
            // Pre-load duration for the UI without playing
            audioElement.addEventListener('loadedmetadata', () => {
                totalDurationSpan.innerText = formatTime(audioElement.duration);
                myProgressBar.value = 0;
                myProgressBar.style.background = `linear-gradient(to right, #1DB954 0%, rgba(255, 255, 255, 0.2) 0%)`;
                updatePositionState(); // Set initial position state
            }, { once: true });
            updateUI();
        }
    };

    const playSong = () => {
        const playPromise = audioElement.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                updateUI();
                if ('mediaSession' in navigator) {
                    navigator.mediaSession.playbackState = 'playing';
                }
                showToast(`Playing: ${songs[songIndex].songName}`);
            }).catch(error => {
                console.error("Playback failed:", error);
                showToast("Playback failed. Please interact with the page first.");
                updateUI(); // Ensure UI reflects paused state on failure
            });
        }
    };

    const pauseSong = () => {
        audioElement.pause();
        updateUI();
        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'paused';
        }
    };

    const nextSong = () => {
        if (isShuffled) {
            let nextIndex;
            do {
                nextIndex = Math.floor(Math.random() * songs.length);
            } while (songs.length > 1 && nextIndex === songIndex);
            songIndex = nextIndex;
        } else {
            songIndex = (songIndex + 1) % songs.length;
        }
        loadSong(songIndex);
    };

    const prevSong = () => {
        // If the song has been playing for more than 3 seconds, restart it. Otherwise, go to the previous track.
        if (audioElement.currentTime > 3) {
            audioElement.currentTime = 0;
        } else {
            songIndex = (songIndex - 1 + songs.length) % songs.length;
            loadSong(songIndex);
        }
    };
    
    // --- NEW: Seeking function for lock screen controls
    const seekTime = (seconds) => {
        audioElement.currentTime = Math.max(0, Math.min(audioElement.duration, audioElement.currentTime + seconds));
        updatePositionState(); // Update lock screen immediately
    };

    // --- UI & UTILITY FUNCTIONS ---
    const showToast = (message) => {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        toastContainer.appendChild(toast);
        setTimeout(() => { toast.classList.add('show'); }, 10);
        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => toast.remove());
        }, 3000);
    };

    const formatTime = (seconds) => {
        if (isNaN(seconds) || seconds < 0) return "00:00";
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const updateUI = () => {
        const isPlaying = !audioElement.paused && audioElement.readyState > 2;
        masterPlay.classList.toggle('fa-circle-pause', isPlaying);
        masterPlay.classList.toggle('fa-circle-play', !isPlaying);
        if (gif) gif.style.opacity = isPlaying ? "1" : "0";
        document.querySelectorAll('.songItemPlay').forEach((icon, index) => {
            const isCurrentSong = (index === songIndex);
            icon.classList.toggle('fa-circle-pause', isCurrentSong && isPlaying);
            icon.classList.toggle('fa-circle-play', !isCurrentSong || !isPlaying);
        });
        shuffleBtn.classList.toggle('active-icon', isShuffled);
        repeatBtn.classList.toggle('active-icon', repeatMode !== 0);
        repeatBtn.classList.toggle('repeat-one-indicator', repeatMode === 2);
    };
    
    const populateSongList = () => {
        if (!songItemContainer) return;
        songItemContainer.innerHTML = '';
        songs.forEach((song, i) => {
            songItemContainer.innerHTML += `
                <div class="songItem" data-index="${i}">
                    <img src="${song.coverPath}" alt="${song.songName}" onerror="this.src='covers/default.jpg';">
                    <span class="songName">${song.songName}</span>
                    <span class="song-duration" id="duration-${i}">--:--</span>
                    <span class="songlistplay"><i class="fa-regular songItemPlay fa-circle-play"></i></span>
                </div>`;
        });
    };

    const fetchAndDisplayDurations = () => {
        songs.forEach((song, i) => {
            const tempAudio = new Audio(song.filePath);
            tempAudio.addEventListener('loadedmetadata', () => {
                const durationSpan = document.getElementById(`duration-${i}`);
                if (durationSpan) {
                    durationSpan.innerText = formatTime(tempAudio.duration);
                }
            });
        });
    };

    // --- EVENT LISTENERS ---
    if (masterPlay) masterPlay.addEventListener('click', () => {
        if (audioElement.paused || audioElement.currentTime <= 0) playSong();
        else pauseSong();
    });

    audioElement.addEventListener('timeupdate', () => {
        if (audioElement.duration) {
            currentTimeSpan.innerText = formatTime(audioElement.currentTime);
            const progress = (audioElement.currentTime / audioElement.duration) * 100;
            myProgressBar.value = progress;
            myProgressBar.style.background = `linear-gradient(to right, #1DB954 ${progress}%, rgba(255, 255, 255, 0.2) ${progress}%)`;
            updatePositionState(); // --- EXPANDED: Keep lock screen bar in sync
        }
    });
    
    audioElement.addEventListener('loadedmetadata', () => {
        totalDurationSpan.innerText = formatTime(audioElement.duration);
        updatePositionState();
    });
    
    if (myProgressBar) myProgressBar.addEventListener('input', () => {
        if (audioElement.duration) {
            audioElement.currentTime = (myProgressBar.value * audioElement.duration) / 100;
            updatePositionState(); // --- EXPANDED: Update lock screen on manual seek
        }
    });

    audioElement.addEventListener('ended', () => {
        if (repeatMode === 2) { loadSong(songIndex); } 
        else if (repeatMode === 1 || isShuffled) { nextSong(); } 
        else if (songIndex < songs.length - 1) { nextSong(); } 
        else { pauseSong(); }
    });

    if (nextBtn) nextBtn.addEventListener('click', nextSong);
    if (prevBtn) prevBtn.addEventListener('click', prevSong);
    
    if (shuffleBtn) shuffleBtn.addEventListener('click', () => {
        isShuffled = !isShuffled;
        showToast(isShuffled ? "Shuffle On" : "Shuffle Off");
        updateUI();
    });

    if (repeatBtn) repeatBtn.addEventListener('click', () => {
        repeatMode = (repeatMode + 1) % 3;
        const messages = ["Repeat Off", "Repeat Playlist", "Repeat Song"];
        showToast(messages[repeatMode]);
        updateUI();
    });

    if (songItemContainer) songItemContainer.addEventListener('click', (e) => {
        const targetItem = e.target.closest('.songItem');
        if (targetItem) {
            const index = parseInt(targetItem.dataset.index, 10);
            if (songIndex === index && !audioElement.paused) {
                pauseSong();
            } else {
                loadSong(index);
            }
        }
    });
    
    // Simplified Volume Logic
    if (volumeSlider) volumeSlider.addEventListener('input', (e) => {
        audioElement.volume = e.target.value;
    });

    audioElement.addEventListener('volumechange', () => {
        if (!volumeSlider) return;
        const volume = audioElement.volume;
        volumeSlider.value = volume;
        const volPercent = volume * 100;
        volumeSlider.style.background = `linear-gradient(to right, #1DB954 ${volPercent}%, rgba(255, 255, 255, 0.2) ${volPercent}%)`;
        
        if (volume > 0.5) volumeIcon.className = "fa-solid fa-volume-high";
        else if (volume > 0) volumeIcon.className = "fa-solid fa-volume-low";
        else volumeIcon.className = "fa-solid fa-volume-xmark";
    });

    if (volumeIcon) volumeIcon.addEventListener('click', () => {
        if (audioElement.volume > 0) {
            lastVolume = audioElement.volume;
            audioElement.volume = 0;
        } else {
            audioElement.volume = lastVolume;
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT') return;
        const keyMap = {
            'Space': () => masterPlay.click(),
            'ArrowRight': nextSong,
            'ArrowLeft': prevSong,
        };
        if (keyMap[e.code]) {
            e.preventDefault();
            keyMap[e.code]();
        }
    });

    // --- INITIALIZATION ---
    const initializePlayer = () => {
        populateSongList();
        fetchAndDisplayDurations();
        loadSong(0, false); // Load the first song but don't play it
        
        // --- EXPANDED: Setup Media Session Action Handlers ---
        if ('mediaSession' in navigator) {
            navigator.mediaSession.setActionHandler('play', playSong);
            navigator.mediaSession.setActionHandler('pause', pauseSong);
            navigator.mediaSession.setActionHandler('previoustrack', prevSong);
            navigator.mediaSession.setActionHandler('nexttrack', nextSong);
            // --- NEW: Add seeking handlers ---
            navigator.mediaSession.setActionHandler('seekbackward', () => seekTime(-10)); // Rewind 10s
            navigator.mediaSession.setActionHandler('seekforward', () => seekTime(10));  // Forward 10s
        }
        
        // Set initial volume from slider
        if (volumeSlider) {
           audioElement.volume = volumeSlider.value;
        }
    };
    
    initializePlayer();
});
