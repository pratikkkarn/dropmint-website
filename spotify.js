document.addEventListener('DOMContentLoaded', () => {
    console.log("Welcome to the combined Music Player!");

    // --- CSS Injection for Toast Notifications & UI Enhancements ---
    const style = document.createElement('style');
    style.innerHTML = `
        #toast-container {
            position: fixed;
            bottom: 110px; /* Position above the player */
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
        #repeat.active-icon {
            position: relative;
        }
        #repeat.repeat-one-indicator::after {
            content: '1';
            position: absolute;
            top: -2px;
            right: -4px;
            background-color: var(--glow-color, #a855f7);
            color: white;
            border-radius: 50%;
            width: 12px;
            height: 12px;
            font-size: 9px;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
            line-height: 1;
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

    // --- NEW: Media Session API Function for Lock Screen Controls ---
    const updateMediaSession = () => {
        if ('mediaSession' in navigator) {
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
        }
    };
    // --- END of NEW CODE ---

    // --- CORE PLAYER FUNCTIONS ---
    const loadSong = (index, autoPlay = true) => {
        songIndex = index;
        const song = songs[songIndex];
        audioElement.src = song.filePath;
        masterSongName && (masterSongName.innerText = song.songName);
        if (masterArtistName) masterArtistName.innerText = song.artistName;
        if (currentCoverArt) currentCoverArt.src = song.coverPath;
        audioElement.currentTime = 0;

        // reset progress UI
        if (myProgressBar) {
            // ensure we use 100 as the normalized max for percent computations
            myProgressBar.max = 100;
            myProgressBar.value = 0;
            myProgressBar.style.background = `linear-gradient(to right, var(--spotify-green) 0%, rgba(255, 255, 255, 0.2) 0%)`;
        }

        // --- NEW: Update lock screen info when a new song is loaded ---
        updateMediaSession();
        // --- END of NEW CODE ---

        if (autoPlay) {
            showToast(`Playing: ${song.songName}`);
            playSong();
        } else {
            // update duration UI once metadata loads
            audioElement.addEventListener('loadedmetadata', () => {
                totalDurationSpan && (totalDurationSpan.innerText = formatTime(audioElement.duration));
                if (myProgressBar) {
                    myProgressBar.value = 0;
                    myProgressBar.style.background = `linear-gradient(to right, var(--spotify-green) 0%, rgba(255, 255, 255, 0.2) 0%)`;
                }
            }, { once: true });
            updateUI();
        }
    };

    const playSong = () => {
        audioElement.play().catch(error => {
            console.error("Playback failed:", error);
            updateUI();
        });
        updateUI();
        // --- NEW: Update media session playback state for lock screen ---
        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'playing';
        }
        // --- END of NEW CODE ---
    };

    const pauseSong = () => {
        audioElement.pause();
        updateUI();
        // --- NEW: Update media session playback state for lock screen ---
        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'paused';
        }
        // --- END of NEW CODE ---
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
        songIndex = (songIndex - 1 + songs.length) % songs.length;
        loadSong(songIndex);
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
            toast.addEventListener('transitionend', () => { toast.remove(); });
        }, 3000);
    };

    const formatTime = (seconds) => {
        if (isNaN(seconds) || seconds < 0) return "00:00";
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const updateUI = () => {
        const isPlaying = !audioElement.paused && !audioElement.ended;
        if (masterPlay) {
            masterPlay.classList.toggle('fa-circle-pause', isPlaying);
            masterPlay.classList.toggle('fa-circle-play', !isPlaying);
        }
        if (gif) gif.style.opacity = isPlaying ? "1" : "0";
        document.querySelectorAll('.songItemPlay').forEach((icon, index) => {
            const isCurrentSong = (index === songIndex);
            icon.classList.toggle('fa-circle-pause', isCurrentSong && isPlaying);
            icon.classList.toggle('fa-circle-play', !isCurrentSong || !isPlaying);
        });
        if (shuffleBtn) shuffleBtn.classList.toggle('active-icon', isShuffled);
        if (repeatBtn) {
            repeatBtn.classList.toggle('active-icon', repeatMode !== 0);
            repeatBtn.classList.toggle('repeat-one-indicator', repeatMode === 2);
        }
    };

    const populateSongList = () => {
        if (!songItemContainer) return;
        songItemContainer.innerHTML = '';
        songs.forEach((song, i) => {
            songItemContainer.innerHTML += `
                <div class="songItem" data-index="${i}">
                    <img src="${song.coverPath}" alt="${song.songName}">
                    <span class="songName">${song.songName}</span>
                    <span class="song-duration" id="duration-${i}">00:00</span>
                    <span class="songlistplay">
                        <i class="fa-regular songItemPlay fa-circle-play"></i>
                    </span>
                </div>`;
        });
    };

    const fetchAndDisplayDurations = () => {
        songs.forEach((song, i) => {
            const tempAudio = new Audio();
            // try to avoid downloading full audio immediately; set preload metadata
            tempAudio.preload = 'metadata';
            tempAudio.src = song.filePath;
            tempAudio.addEventListener('loadedmetadata', () => {
                const durationSpan = document.getElementById(`duration-${i}`);
                if (durationSpan) {
                    durationSpan.innerText = formatTime(tempAudio.duration);
                }
                // release reference
                try { tempAudio.src = ''; } catch (err) {}
            }, { once: true });
        });
    };

    // --- PROGRESS BAR FIXES ---
    // Ensure progress bar exists & normalized max
    if (myProgressBar) {
        myProgressBar.max = 100; // normalize to percentage-based interactions
    }
    let isSeeking = false;

    // pointer events capture mouse + touch -> set seeking flags
    if (myProgressBar) {
        myProgressBar.addEventListener('pointerdown', () => { isSeeking = true; });
        myProgressBar.addEventListener('pointerup', () => { isSeeking = false; });
        myProgressBar.addEventListener('pointercancel', () => { isSeeking = false; });
        // if pointer leaves window while dragging, end seeking on document pointerup
        document.addEventListener('pointerup', () => { isSeeking = false; });
    }

    // --- EVENT LISTENERS ---
    if (masterPlay) {
        masterPlay.addEventListener('click', () => {
            if (audioElement.paused || audioElement.currentTime <= 0) playSong();
            else pauseSong();
        });
    }

    // timeupdate: do not write slider while user is seeking
    audioElement.addEventListener('timeupdate', () => {
        if (!audioElement.duration) return;

        // Update current time text
        currentTimeSpan && (currentTimeSpan.innerText = formatTime(audioElement.currentTime));

        if (!myProgressBar) return;
        if (isSeeking) return; // don't override while user drags

        // Use normalized max
        const max = Number(myProgressBar.max) || 100;
        const progressValue = (audioElement.currentTime / audioElement.duration) * max;
        myProgressBar.value = progressValue;

        const percent = (progressValue / max) * 100;
        myProgressBar.style.background = `linear-gradient(to right, var(--spotify-green) ${percent}%, rgba(255, 255, 255, 0.2) ${percent}%)`;
    });

    audioElement.addEventListener('loadedmetadata', () => {
        totalDurationSpan && (totalDurationSpan.innerText = formatTime(audioElement.duration));
    });

    // handle user seeking (live)
    if (myProgressBar) {
        myProgressBar.addEventListener('input', () => {
            if (!audioElement.duration) return;
            const max = Number(myProgressBar.max) || 100;
            const value = Number(myProgressBar.value);
            // live update current time (for immediate seeking)
            audioElement.currentTime = (value / max) * audioElement.duration;

            // update background while dragging
            const percent = (value / max) * 100;
            myProgressBar.style.background = `linear-gradient(to right, var(--spotify-green) ${percent}%, rgba(255, 255, 255, 0.2) ${percent}%)`;

            // update currentTime display immediately
            currentTimeSpan && (currentTimeSpan.innerText = formatTime(audioElement.currentTime));
        });
    }

    audioElement.addEventListener('ended', () => {
        if (repeatMode === 2) {
            loadSong(songIndex);
        } else if (repeatMode === 1 || isShuffled) {
            nextSong();
        } else if (songIndex < songs.length - 1) {
            nextSong();
        } else {
            pauseSong();
        }
    });

    nextBtn && nextBtn.addEventListener('click', nextSong);
    prevBtn && prevBtn.addEventListener('click', prevSong);

    shuffleBtn && shuffleBtn.addEventListener('click', () => {
        isShuffled = !isShuffled;
        showToast(isShuffled ? "Shuffle On" : "Shuffle Off");
        updateUI();
    });

    repeatBtn && repeatBtn.addEventListener('click', () => {
        repeatMode = (repeatMode + 1) % 3;
        switch (repeatMode) {
            case 0: showToast("Repeat Off"); break;
            case 1: showToast("Repeat Playlist"); break;
            case 2: showToast("Repeat Song"); break;
        }
        updateUI();
    });

    songItemContainer && songItemContainer.addEventListener('click', (e) => {
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

    // volume controls (safe guards added)
    if (volumeSlider) {
        volumeSlider.addEventListener('input', (e) => {
            const val = Number(e.target.value);
            audioElement.volume = val;
            const volumePercentage = val * 100;
            volumeSlider.style.background = `linear-gradient(to right, var(--spotify-green) ${volumePercentage}%, rgba(255, 255, 255, 0.2) ${volumePercentage}%)`;
            if (volumeIcon) {
                if (val > 0.5) volumeIcon.className = "fa-solid fa-volume-high";
                else if (val > 0) volumeIcon.className = "fa-solid fa-volume-low";
                else volumeIcon.className = "fa-solid fa-volume-xmark";
            }
        });
    }

    if (volumeIcon) {
        volumeIcon.addEventListener('click', () => {
            if (audioElement.volume > 0) {
                lastVolume = audioElement.volume;
                audioElement.volume = 0;
                if (volumeSlider) {
                    volumeSlider.value = 0;
                    volumeSlider.style.background = `linear-gradient(to right, var(--spotify-green) 0%, rgba(255, 255, 255, 0.2) 0%)`;
                }
                volumeIcon.className = "fa-solid fa-volume-xmark";
            } else {
                audioElement.volume = lastVolume;
                if (volumeSlider) {
                    volumeSlider.value = lastVolume;
                    volumeSlider.style.background = `linear-gradient(to right, var(--spotify-green) ${lastVolume * 100}%, rgba(255, 255, 255, 0.2) ${lastVolume * 100}%)`;
                }
                volumeIcon.className = lastVolume > 0.5 ? "fa-solid fa-volume-high" : "fa-solid fa-volume-low";
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT') return;
        if (e.code === 'Space') { e.preventDefault(); masterPlay && masterPlay.click(); }
        else if (e.code === 'ArrowRight') { nextSong(); }
        else if (e.code === 'ArrowLeft') { prevSong(); }
    });

    // --- INITIALIZATION ---
    populateSongList();
    fetchAndDisplayDurations();
    loadSong(0, false);

    // --- NEW: Setup Media Session Action Handlers for Lock Screen ---
    if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', playSong);
        navigator.mediaSession.setActionHandler('pause', pauseSong);
        navigator.mediaSession.setActionHandler('previoustrack', prevSong);
        navigator.mediaSession.setActionHandler('nexttrack', nextSong);
    }
    // --- END of NEW CODE ---

    // set initial volume from slider if available
    if (volumeSlider) {
        audioElement.volume = Number(volumeSlider.value);
        const pct = (Number(volumeSlider.value) || 0) * 100;
        volumeSlider.style.background = `linear-gradient(to right, var(--spotify-green) ${pct}%, rgba(255, 255, 255, 0.2) ${pct}%)`;
    } else {
        audioElement.volume = 1;
    }
});
