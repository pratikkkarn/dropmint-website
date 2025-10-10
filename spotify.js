document.addEventListener('DOMContentLoaded', () => {
    console.log("Welcome to the combined Music Player!");

    // --- STATE & VARIABLES ---
    let songIndex = 0;
    let isShuffled = false;
    let repeatMode = 0; // 0: no repeat, 1: repeat playlist, 2: repeat one
    let lastVolume = 1;
    let audioElement = new Audio();
    let animationFrameId; // To control the smooth animation loop

    // --- DOM ELEMENTS ---
    const masterPlay = document.getElementById('masterPlay');
    const myProgressBar = document.getElementById('myProgressBar');
    const nextBtn = document.getElementById('next');
    const prevBtn = document.getElementById('previous');
    const shuffleBtn = document.getElementById('shuffle');
    const repeatBtn = document.getElementById('repeat');
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeIcon = document.getElementById('volumeIcon');
    const gif = document.getElementById('gif'); // Assumes an element with id="gif" exists
    const masterSongName = document.getElementById('masterSongName');
    const masterArtistName = document.getElementById('masterArtistName');
    const currentCoverArt = document.getElementById('currentCoverArt');
    const currentTimeSpan = document.getElementById('currentTime');
    const totalDurationSpan = document.getElementById('totalDuration');
    const songItemContainer = document.querySelector('.songItemContainer');

    // --- SONG DATA ---
    const songs = [
      { songName: "Bewafa", artistName: "Pratik Karn", filePath: "song/1.mp3", coverPath: "covers/1.jpg" },
      { songName: "Cielo", artistName: "Huma-Huma", filePath: "song/2.mp3", coverPath: "covers/2.jpg" },
      { songName: "DEAF KEV", artistName: "Invincible", filePath: "song/3.mp3", coverPath: "covers/3.jpg" },
      { songName: "Different Heaven", artistName: "My Heart", filePath: "song/4.mp3", coverPath: "covers/4.jpg" },
      { songName: "Janji-Heroes", artistName: "Tonight", filePath: "song/5.mp3", coverPath: "covers/5.jpg" },
      { songName: "Rabba", artistName: "Ehsaan", filePath: "song/6.mp3", coverPath: "covers/6.jpg" },
      { songName: "Sakhiyaan", artistName: "Maninder Buttar", filePath: "song/7.mp3", coverPath: "covers/7.jpg" },
      { songName: "Bhula Dena", artistName: "Mustafa Zahid", filePath: "song/8.mp3", coverPath: "covers/8.jpg" },
    ];

    // Function for smooth progress bar animation
    const smoothProgressBarUpdate = () => {
        if (audioElement.duration && !audioElement.paused) {
            const progress = (audioElement.currentTime / audioElement.duration) * 100;
            myProgressBar.value = progress;
            // Update background gradient for visual fill
            myProgressBar.style.background = `linear-gradient(to right, var(--spotify-green) ${progress}%, rgba(255, 255, 255, 0.2) ${progress}%)`;
            animationFrameId = requestAnimationFrame(smoothProgressBarUpdate);
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

        if (autoPlay) {
            playSong();
        } else {
            audioElement.addEventListener('loadedmetadata', () => {
                 totalDurationSpan.innerText = formatTime(audioElement.duration);
                 // Reset progress bar visual state on new song load (when not autoplaying)
                 myProgressBar.value = 0;
                 myProgressBar.style.background = `linear-gradient(to right, var(--spotify-green) 0%, rgba(255, 255, 255, 0.2) 0%)`;
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
        requestAnimationFrame(smoothProgressBarUpdate); // Start the smooth animation loop
    };

    const pauseSong = () => {
        audioElement.pause();
        updateUI();
        cancelAnimationFrame(animationFrameId); // Stop the smooth animation loop
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

    const formatTime = (seconds) => {
        if (isNaN(seconds) || seconds < 0) return "00:00";
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const updateUI = () => {
        const isPlaying = !audioElement.paused;

        masterPlay.classList.toggle('fa-circle-pause', isPlaying);
        masterPlay.classList.toggle('fa-circle-play', !isPlaying);

        if (gif) gif.style.opacity = isPlaying ? "1" : "0";

        document.querySelectorAll('.songItemPlay').forEach((icon, index) => {
            const isCurrentSong = (index === songIndex);
            icon.classList.toggle('fa-circle-pause', isCurrentSong && isPlaying);
            icon.classList.toggle('fa-circle-play', !isCurrentSong || !isPlaying);
        });

        shuffleBtn.classList.toggle('active-icon', isShuffled);
        
        repeatBtn.classList.remove('active-icon');
        if (repeatMode === 1) {
            repeatBtn.classList.add('active-icon');
        } else if (repeatMode === 2) {
            repeatBtn.classList.add('active-icon');
        }
    };
    
    const populateSongList = () => {
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

    masterPlay.addEventListener('click', () => {
        if (audioElement.paused || audioElement.currentTime <= 0) playSong();
        else pauseSong();
    });

    audioElement.addEventListener('timeupdate', () => {
        if (audioElement.duration) {
            currentTimeSpan.innerText = formatTime(audioElement.currentTime);
        }
    });
    
    audioElement.addEventListener('loadedmetadata', () => {
        totalDurationSpan.innerText = formatTime(audioElement.duration);
    });

    myProgressBar.addEventListener('input', () => {
        if (audioElement.duration) {
            audioElement.currentTime = (myProgressBar.value * audioElement.duration) / 100;
            // Update the gradient background instantly while dragging for better UX
            const progress = myProgressBar.value;
            myProgressBar.style.background = `linear-gradient(to right, var(--spotify-green) ${progress}%, rgba(255, 255, 255, 0.2) ${progress}%)`;
            
            // If dragging, pause the requestAnimationFrame loop to avoid conflicts
            cancelAnimationFrame(animationFrameId); 
        }
    });

    // When user releases the progress bar
    myProgressBar.addEventListener('change', () => {
        if (!audioElement.paused) {
            requestAnimationFrame(smoothProgressBarUpdate); // Restart if it was playing
        }
    });

    audioElement.addEventListener('ended', () => {
        cancelAnimationFrame(animationFrameId); // Stop animation on end
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

    nextBtn.addEventListener('click', nextSong);
    prevBtn.addEventListener('click', prevSong);
    
    shuffleBtn.addEventListener('click', () => {
        isShuffled = !isShuffled;
        updateUI();
    });

    repeatBtn.addEventListener('click', () => {
        repeatMode = (repeatMode + 1) % 3;
        updateUI();
    });

    songItemContainer.addEventListener('click', (e) => {
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

    volumeSlider.addEventListener('input', (e) => {
        audioElement.volume = e.target.value;
        const volumePercentage = e.target.value * 100;
        // Update volume bar gradient
        volumeSlider.style.background = `linear-gradient(to right, var(--spotify-green) ${volumePercentage}%, rgba(255, 255, 255, 0.2) ${volumePercentage}%)`;

        if (e.target.value > 0.5) volumeIcon.className = "fa-solid fa-volume-high";
        else if (e.target.value > 0) volumeIcon.className = "fa-solid fa-volume-low";
        else volumeIcon.className = "fa-solid fa-volume-xmark";
    });

    volumeIcon.addEventListener('click', () => {
        if (audioElement.volume > 0) {
            lastVolume = audioElement.volume;
            audioElement.volume = 0;
            volumeSlider.value = 0;
            volumeIcon.className = "fa-solid fa-volume-xmark";
            volumeSlider.style.background = `linear-gradient(to right, var(--spotify-green) 0%, rgba(255, 255, 255, 0.2) 0%)`; // Update gradient
        } else {
            audioElement.volume = lastVolume;
            volumeSlider.value = lastVolume;
            volumeIcon.className = lastVolume > 0.5 ? "fa-solid fa-volume-high" : "fa-solid fa-volume-low";
            volumeSlider.style.background = `linear-gradient(to right, var(--spotify-green) ${lastVolume * 100}%, rgba(255, 255, 255, 0.2) ${lastVolume * 100}%)`; // Update gradient
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT') return;
        if (e.code === 'Space') {
            e.preventDefault();
            masterPlay.click();
        } else if (e.code === 'ArrowRight') {
            nextSong();
        } else if (e.code === 'ArrowLeft') {
            prevSong();
        }
    });

    // --- INITIALIZATION ---
    populateSongList();
    fetchAndDisplayDurations();
    loadSong(0, false);
    
    // Initialize volume slider background
    audioElement.volume = volumeSlider.value; // Ensure audio volume matches slider's initial value
    volumeSlider.style.background = `linear-gradient(to right, var(--spotify-green) ${volumeSlider.value * 100}%, rgba(255, 255, 255, 0.2) ${volumeSlider.value * 100}%)`;
});

