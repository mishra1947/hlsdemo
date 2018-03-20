'use strict';
var hls, bufferTimer,
    video = document.getElementById('video');


// This function is responsible for updating custom volume controls
function updateVolume() {
    var volumeControl = document.getElementById('volControl'),
            volumeIcon = document.getElementById('volumeIcon');
    if (video.muted) {
        volumeControl.value = 0;
        volumeIcon.innerHTML = '<span class="glyphicon glyphicon-volume-off" title="Unmute"></span>';
    } else {
        volumeControl.value = video.volume * 100;
        volumeIcon.innerHTML = '<span class="glyphicon glyphicon-volume-up" title="Mute"></span>';
    }
}


//show hide element by ID
function toggleShowHide(id, flag) {
    var element = document.getElementById(id);
    element.style.display = flag ? 'block' : 'none';
}

//buffer show hide
function toggleCanvas(flag) {
    flag = flag != undefined ? flag : false;
    toggleShowHide('bufferedCanvas', flag);
}

//toggle other custome controls
function toggleCustomControls(flag) {
    flag = flag ? flag : false;
    toggleShowHide('QualityLevelControl', flag);
    toggleShowHide('PlaybackControl', flag);
}

//Create Level buttons
function updateLevelInfo() {
    if (hls.levels && hls.levels.length) {
        var template = '',
                className = hls.autoLevelEnabled ? 'btn-primary' : 'btn-success';
        template += '<button type="button" class="btn btn-sm ' + className + '" onclick="hls.nextLevel=-1"> Auto </button>';
        hls.levels.forEach(function (level, i){
           className = hls.nextLevel === i ? 'btn-primary' : 'btn-success';
            var levelName = level.name + "p";
           template += '<button type="button" class="btn btn-sm ' + className + '" onclick="hls.nextLevel='+ i +'"> '+ levelName +' </button>';
        });
        document.getElementById('levelControl').innerHTML = template;
    }
}

//this function will on on page load 
function loadVideo(url) {
    video.volume = 0.5;
    updateVolume();
    toggleCustomControls(false);
    toggleCanvas(false);

    if (!Hls.isSupported()) {
        return false;
    }
    //Optional code, used when video url is dynamically updated.
    if (hls) {
        hls.destroy();
        if (bufferTimer) {
            clearInterval(bufferTimer);
            bufferTimer = undefined;
        }
        hls = null;
    }
    hls = new Hls();
    hls.attachMedia(video);

    hls.on(Hls.Events.MEDIA_ATTACHED, function () {
        hls.loadSource(url);
        hls.autoLevelCapping = -1;
        video.play();
    });

    hls.on(Hls.Events.FRAG_PARSING_INIT_SEGMENT, function (event, data) {
        toggleCanvas(true);
        toggleCustomControls(true);
    });

    hls.on(Hls.Events.FRAG_BUFFERED, function (event, data) {
        if (bufferTimer === undefined) {
            bufferTimer = window.setInterval(checkBuffer, 100);
        }
        updateLevelInfo();
    });

    hls.on(Hls.Events.ERROR, function (event, data) {
        if (data.fatal) {
            switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                    console.log("fatal network error encountered, try to recover");
                    hls.startLoad();
                    break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                    console.log("fatal media error encountered, try to recover");
                    hls.recoverMediaError();
                    hls.swapAudioCodec();
                    break;
                default:
                    // cannot recover
                    hls.destroy();
                    break;
            }
        }
    });

    video.addEventListener('pause', handleVideoEvent);
    video.addEventListener('play', handleVideoEvent);
    video.addEventListener('volumechange', handleVideoEvent);
}

loadVideo('https://video-dev.github.io/streams/x36xhzz/x36xhzz.m3u8');

function handleVideoEvent(evt) {
    var playButton = document.getElementById('playPauseBtn');
    switch (evt.type) {
        case 'play':
            playButton.innerHTML = "Pause";
            break;
        case 'pause':
            playButton.innerHTML = "Play";
            break;
        case 'volumechange':
            updateVolume();
            break;
        default:
            break;
    }
}

function checkBuffer() {
    var canvas = document.getElementById('bufferedCanvas'),
            ctx = canvas.getContext('2d'),
            buffered = video.buffered,
            bufferLen = buffered.length,
            cWidth = canvas.width,
            cHeight = canvas.height,
            vDuration = video.duration, bStart, bEnd;
    if (!canvas.width || canvas.width !== video.clientWidth) {
        canvas.width = video.clientWidth;
    }
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, cWidth, cHeight);
    ctx.fillStyle = '#31b0d5';

    while (bufferLen--) {
        bStart = (buffered.start(bufferLen) / vDuration) * cWidth;
        bEnd = (buffered.end(bufferLen) / vDuration) * cWidth;
        ctx.fillRect(bStart, 0, bEnd - bStart, cHeight);
    }

    ctx.fillStyle = '#fff';
    bStart = (video.currentTime / vDuration) * cWidth;
    
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText(video.currentTime.toFixed(1), 4, 4);
    ctx.textAlign = 'right';
    ctx.fillText(vDuration.toFixed(1), cWidth - 4, 4);

    ctx.beginPath();
    ctx.arc(bStart, cHeight * 0.5, 7, 0, 2 * Math.PI);
    ctx.fill();
}

function togglePlayVideo() {
    var playButton = document.getElementById('playPauseBtn');
    if (video.paused == true) {
        video.play();
        playButton.innerHTML = "Pause";
    } else {
        video.pause();
        playButton.innerHTML = "Play";
    }
}

//set volume 
function SetVolume(val) {
    video.volume = val / 100;
}


//mute unmute
function toggleMute() {
    var volumeControl = document.getElementById('volControl'),
            volumeIcon = document.getElementById('volumeIcon');
    if (video.muted) {
        video.muted = false;
        volumeControl.value = video.volume * 100;
        volumeIcon.innerHTML = '<span class="glyphicon glyphicon-volume-up" title="Mute"></span>';
    } else {
        video.muted = true;
        volumeControl.value = 0;
        volumeIcon.innerHTML = '<span class="glyphicon glyphicon-volume-off" title="Unmute"></span>';
    }
}

//full Screen

function requestFullScreen() {
    if (video.requestFullscreen) {
        video.requestFullscreen();
    } else if (video.mozRequestFullScreen) {
        video.mozRequestFullScreen(); // Firefox
    } else if (video.webkitRequestFullscreen) {
        video.webkitRequestFullscreen(); // Chrome and Safari
    }
}


//updating buffered seek
function updateBufferedSeek(event) {
    var canvas = document.getElementById('bufferedCanvas');
    
    video.currentTime = ((event.clientX - canvas.offsetLeft) / canvas.width) * video.duration;
}

//seek video manually
function seekTo() {
    video.currentTime = document.getElementById('seekPos').value;
}
