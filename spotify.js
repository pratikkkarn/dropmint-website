console.log("Welcome to Spotify")

// Initial the variables
let songIndex = 0;
let audioElement = new Audio('song/1.mp3');
let masterPlay = document.getElementById('masterPlay');
let myProgressBar = document.getElementById('myProgressBar');
let gif = document.getElementById('gif');
let masterSongName = document.getElementById('masterSongName');
let songItems = Array.from(document.getElementsByClassName('songItem'));
let volumeControl = document.getElementById('volumeControl');

let song = [
    {songName: "Farra", filePath: "song/1.mp3",coverPath:"covers/1.jpg"},
    {songName: "Cielo", filePath: "song/2.mp3",coverPath:"covers/2.jpg"},
    {songName: "Kiev", filePath: "song/3.mp3",coverPath:"covers/3.jpg"},
    {songName: "Different Heaven", filePath: "song/4.mp3",coverPath:"covers/4.jpg"},
    {songName: "Soorma", filePath: "song/5.mp3",coverPath:"covers/5.jpg"},
    {songName: "BlueEyes", filePath: "song/6.mp3",coverPath:"covers/6.jpg"},
    {songName: "Maniac", filePath: "song/7.mp3",coverPath:"covers/7.jpg"},
    {songName: "Millionaire", filePath: "song/8.mp3",coverPath:"covers/8.jpg"},
]

songItems.forEach((element, i) => {
    element.getElementsByTagName("img")[0].src = song[i].coverPath;
    const songNameElement = element.getElementsByClassName("songName")[0];
    const timestampElement = element.querySelector(".timestamp");

    if (songNameElement) {
        songNameElement.innerText = song[i].songName;
    }

    // Create a temporary audio element
    let tempAudio = new Audio();
    tempAudio.src = song[i].filePath;

    // Load metadata and update duration
    tempAudio.addEventListener("loadedmetadata", () => {
        let minutes = Math.floor(tempAudio.duration / 60);
        let seconds = Math.floor(tempAudio.duration % 60);
        let formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

        if (timestampElement) {
            timestampElement.childNodes[0].nodeValue = formattedTime + " ";
        }
    });

    // Force load the metadata
    tempAudio.load();
});

// audioElement.play();

// Handle play/pause click
masterPlay.addEventListener('click', () => {
    if (audioElement.paused) {
        audioElement.play();
        updatePlayPause(true);
    } else {
        audioElement.pause();
        updatePlayPause(false);
    }
});

const updatePlayPause = (isPlaying) => {
    masterPlay.classList.toggle('fa-play-circle', !isPlaying);
    masterPlay.classList.toggle('fa-pause-circle', isPlaying);
    gif.style.opacity = isPlaying ? "1" : "0";

    let currentSongBtn = document.getElementById((songIndex + 1).toString());
    if (currentSongBtn) {
        currentSongBtn.classList.toggle('fa-circle-play', !isPlaying);
        currentSongBtn.classList.toggle('fa-circle-pause', isPlaying);
    }
};

//Listen to Events
audioElement.addEventListener('timeupdate', ()=>{
    // update seekbar
    progress = parseInt((audioElement.currentTime/audioElement.duration)* 100)
    myProgressBar.value =progress;
})

audioElement.addEventListener('ended', () => {
    songIndex = (songIndex + 1) % song.length;
    songIndex === 0 ? audioElement.pause() : playSelectedSong();
});

myProgressBar.addEventListener('change', ()=>{
    audioElement.currentTime = myProgressBar.value * audioElement.duration/100;
})

const makeAllPlays = ()=>{
Array.from(document.getElementsByClassName('songItemPlay')).forEach((element)=>{
    element.classList.remove('fa-circle-pause')
    element.classList.add('fa-circle-play');
})
}
Array.from(document.getElementsByClassName('songItemPlay')).forEach((element) => {
    element.addEventListener('click', (e) => {  
        let clickedIndex = parseInt(e.target.id) - 1;

        if (songIndex === clickedIndex && !audioElement.paused) {
            // Pause the currently playing song
            audioElement.pause();
            e.target.classList.remove('fa-circle-pause');
            e.target.classList.add('fa-circle-play');
            masterPlay.classList.remove('fa-pause-circle');
            masterPlay.classList.add('fa-play-circle');
            gif.style.opacity = "0"; 
        } else {
            // Play a new song
            makeAllPlays();  // Reset all icons
            songIndex = clickedIndex;
            e.target.classList.remove('fa-circle-play');
            e.target.classList.add('fa-circle-pause');
            audioElement.src = song[songIndex].filePath;
            masterSongName.innerText = song[songIndex].songName;
            audioElement.currentTime = 0;
            audioElement.play();
            masterPlay.classList.remove('fa-play-circle');
            masterPlay.classList.add('fa-pause-circle');
            gif.style.opacity = "1"; 
        }
    });
});


const updateIcons = () => {
    if (audioElement.paused) {
        masterPlay.classList.remove('fa-pause-circle');
        masterPlay.classList.add('fa-play-circle');
    } else {
        masterPlay.classList.remove('fa-play-circle');
        masterPlay.classList.add('fa-pause-circle');
    }
};

document.getElementById('next').addEventListener('click', () => {
    songIndex = (songIndex + 1) % song.length;
    playSelectedSong();
});

document.getElementById('previous').addEventListener('click', () => {
    songIndex = (songIndex - 1 + song.length) % song.length;
    playSelectedSong();
});

const playSelectedSong = () => {
    makeAllPlays(); // Reset all icons
    audioElement.src = song[songIndex].filePath;
    masterSongName.innerText = song[songIndex].songName;
    audioElement.currentTime = 0;
    audioElement.play();
    
    masterPlay.classList.remove('fa-play-circle');
    masterPlay.classList.add('fa-pause-circle');
    gif.style.opacity = "1";

    // Update the correct song item icon
    let currentSongBtn = document.getElementById((songIndex + 1).toString());
    if (currentSongBtn) {
        currentSongBtn.classList.remove('fa-circle-play');
        currentSongBtn.classList.add('fa-circle-pause');
    }
};


document.getElementById('previous').addEventListener('click', () =>{
    if(songIndex<=0){
        songIndex = 0
    }
    else
        songIndex -= 1;
    if (masterSongName) masterSongName.innerText = song[songIndex].songName;
        masterSongName.innerText = song[songIndex].songName
        audioElement.currentTime = 0;
        audioElement.play();
        masterPlay.classList.remove('fa-play-circle');
        masterPlay.classList.add('fa-pause-circle');
})

document.querySelector('.volumeControl input').addEventListener('input', (e) => {
    audioElement.volume = e.target.value;
    if (volumeSlider.value == 0) {
        volumeIcon.innerText = "🔇"; // Muted
    } else if (volumeSlider.value < 0.8) {
        volumeIcon.innerText = "🔉"; // Low volume
    } else {
        volumeIcon.innerText = "🔊"; // High volume
    }
});

let lastVolume = 1;  
volumeIcon.addEventListener('click', () => {  
    if (audioElement.volume) {  
        lastVolume = audioElement.volume;  
        audioElement.volume = 0;  
        volumeIcon.innerText = "🔇";  
    } else {  
        audioElement.volume = lastVolume;  
        volumeIcon.innerText = "🔊";  
    }  
});  

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        
        if (audioElement.paused) {
            if (songIndex === song.length - 1 && audioElement.currentTime === audioElement.duration) {
                // If last song has ended, reset and do not play again
                audioElement.currentTime = 0;
                updatePlayPause(false);
            } else {
                audioElement.play();
                updatePlayPause(true);
            }
        } else {
            audioElement.pause();
            updatePlayPause(false);
        }
    } else if (e.code === 'ArrowRight') {
        if (songIndex < song.length - 1) {
            songIndex++;
            playSelectedSong();
        }
    } else if (e.code === 'ArrowLeft') {
        if (songIndex > 0) {
            songIndex--;
            playSelectedSong();
        }
    }
});

audioElement.addEventListener('ended', () => {
    if (songIndex === song.length - 1) {
        audioElement.pause();
        updatePlayPause(false);
    } else {
        songIndex++;
        playSelectedSong();
    }
});
