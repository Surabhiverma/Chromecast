var session = null;
var timer = null;
var currentMediaSession = null;
var mediaCurrentTime = 0;
var progressFlag = 1;
var PROGRESS_BAR_UPDATE_DELAY = 1000;
var currentVolume = 0.5;
var storedSession = null;
function readyApp()
{
if (!chrome.cast || !chrome.cast.isAvailable) 
{
console.log('Initialization delay...');
setTimeout(initializeCastApi, 1000);
}
}

function initializeCastApi() 
{
    
// request session
  
var sessionRequest = new chrome.cast.SessionRequest(chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID
);
  
var apiConfig = new chrome.cast.ApiConfig(sessionRequest,
    sessionListener,
    receiverListener);

  
chrome.cast.initialize(apiConfig, onInitSuccess, onError);

}


function sessionListener(e) 
{
session = e;
console.log('New session');
if (session.media.length != 0) 
{
console.log('Found ' + session.media.length +'sessions.');
onMediaDiscovered('sessionListener', session.media[0]);
}
session.addMediaListener(onMediaDiscovered.bind(this, 'addMediaListener'));
session.addUpdateListener(sessionUpdateListener.bind(this));
}

function sessionUpdateListener(isAlive) 
{
if (!isAlive) 
{
session = null;
var playpauseresume = document.getElementById('playpauseresume');
playpauseresume.innerHTML = 'Play';
if (timer) 
{
clearInterval(timer);
}
else 
{
timer = setInterval(updateCurrentTime.bind(this),PROGRESS_BAR_UPDATE_DELAY);
playpauseresume.innerHTML = 'Pause';
}
}
}

function receiverListener(e) 
{
if( e === 'available' ) 
{
console.log("Chromecast was found on the network.");
}
else 
{
console.log("There are no Chromecasts available.");
}
}

function onInitSuccess() 
{
console.log("Initialization succeeded");
}

function onError() 
{
console.log("Initialization failed");
}

function launchApp() 
{
console.log("Launching the Chromecast App...");
chrome.cast.requestSession(onRequestSessionSuccess, onLaunchError);
if (timer) 
{
clearInterval(timer);
}
}

function onRequestSessionSuccess(e) 
{
console.log("Successfully created session: " + e.sessionId);
saveSessionID(e.sessionId);
session = e;
session.addUpdateListener(sessionUpdateListener.bind(this));
if (session.media.length != 0) 
{
onMediaDiscovered('onRequestSession', session.media[0]);
}
session.addMediaListener(onMediaDiscovered.bind(this, 'addMediaListener'));
}


function onLaunchError() 
{
console.log("Error connecting to the Chromecast.");
}

function saveSessionID(sessionId) 
{
if (typeof(Storage) != 'undefined') 
{
var object = {id: sessionId, timestamp: new Date().getTime()};
localStorage.setItem('storedSession', JSON.stringify(object));
}
}

function loadMedia() 
{
if (!session) 
{
console.log("No session.");
return;
}
console.log('Loading ...');
var mediaInfo = new chrome.cast.media.MediaInfo('http://surabhiverma.github.io/Chromecast/OneRepublic - Counting Stars_2.mp4');
//mediaInfo.metadata = new chrome.cast.media.GenericMediaMetadata();
//mediaInfo.metadata.metadataType = chrome.cast.media.MetadataType.GENERIC;
mediaInfo.contentType = 'video/mp4';
var request = new chrome.cast.media.LoadRequest(mediaInfo);
request.autoplay = true;
request.currentTime = 0;
session.loadMedia(request, onMediaDiscovered.bind(this, 'loadMedia'), onMediaError);
}

function onMediaDiscovered(how, mediaSession) 
{
console.log('new media session ID:' + mediaSession.mediaSessionId + ' (' + how + ')');
currentMediaSession = mediaSession;
currentMediaSession.addUpdateListener(onMediaStatusUpdate);
mediaCurrentTime = currentMediaSession.currentTime;
playpauseresume.innerHTML = 'Play';
document.getElementById('playerstate').innerHTML = currentMediaSession.playerState;
if (!timer) 
{
timer = setInterval(updateCurrentTime.bind(this),PROGRESS_BAR_UPDATE_DELAY);
playpauseresume.innerHTML = 'Pause';
}
}

function onLoadSuccess() 
{
console.log('Successfully loaded image.');
}

function onMediaError() 
{
console.log('Failed to load the video.');
}

function getMediaStatus() 
{
if (!session || !currentMediaSession) 
{
return;
}
currentMediaSession.getStatus(null,mediaCommandSuccessCallback.bind(this, 'got media status'), onError);
}

function onMediaStatusUpdate(isAlive) 
{
if (!isAlive) 
{
currentMediaTime = 0;
}
else 
{
if (currentMediaSession.playerState == 'PLAYING') 
{
if (progressFlag) 
{
document.getElementById('progress').value = parseInt(100 *currentMediaSession.currentTime /currentMediaSession.media.duration);
document.getElementById('progress_tick').innerHTML =currentMediaSession.currentTime;
document.getElementById('duration').innerHTML =currentMediaSession.media.duration;
progressFlag = 0;
}
document.getElementById('playpauseresume').innerHTML = 'Pause';
}
}
document.getElementById('playerstate').innerHTML =currentMediaSession.playerState;
}

function updateCurrentTime() 
{
if (!session || !currentMediaSession) 
{
return;
}
if (currentMediaSession.media && currentMediaSession.media.duration != null) 
{
var cTime = currentMediaSession.getEstimatedTime();
document.getElementById('progress').value = parseInt(100 * cTime /currentMediaSession.media.duration);
document.getElementById('progress_tick').innerHTML = cTime;
}
else 
{
document.getElementById('progress').value = 0;
document.getElementById('progress_tick').innerHTML = 0;
if (timer) 
{
clearInterval(timer);
}
}
}

function playMedia() 
{
if (!currentMediaSession) 
{
return;
}
if (timer) 
{
clearInterval(timer);
}
var playpauseresume = document.getElementById('playpauseresume');
if (playpauseresume.innerHTML == 'Play') 
{
currentMediaSession.play(null, mediaCommandSuccessCallback.bind(this, 'playing started for ' + currentMediaSession.sessionId), onError);      
playpauseresume.innerHTML = 'Pause';
timer = setInterval(updateCurrentTime.bind(this), PROGRESS_BAR_UPDATE_DELAY);
}
else 
{
if (playpauseresume.innerHTML == 'Pause') 
{
currentMediaSession.pause(null, mediaCommandSuccessCallback.bind(this, 'paused ' + currentMediaSession.sessionId), onError);
playpauseresume.innerHTML = 'Resume';
}
else 
{
if (playpauseresume.innerHTML == 'Resume') 
{
currentMediaSession.play(null, mediaCommandSuccessCallback.bind(this, 'resumed ' + currentMediaSession.sessionId), onError);
playpauseresume.innerHTML = 'Pause';
timer = setInterval(updateCurrentTime.bind(this),PROGRESS_BAR_UPDATE_DELAY);
}
}
}
}

function setReceiverVolume(level, mute) 
{
if (!session)
return;
if (!mute) 
{
session.setReceiverVolumeLevel(level, mediaCommandSuccessCallback.bind(this, 'media set-volume done'), onError);
currentVolume = level;
}
else 
{
session.setReceiverMuted(true, mediaCommandSuccessCallback.bind(this, 'media set-volume done'), onError);
}
}

function muteMedia() 
{
if (!session || !currentMediaSession) 
{
return;
}
var muteunmute = document.getElementById('muteunmute');
if (muteunmute.innerHTML == 'Mute media') 
{
muteunmute.innerHTML = 'Unmute media';
setReceiverVolume(currentVolume, true);
} 
else 
{
muteunmute.innerHTML = 'Mute media';
setReceiverVolume(currentVolume, false);
}
}

function seekMedia(pos) 
{
console.log('Seeking ' + currentMediaSession.sessionId + ':' +currentMediaSession.mediaSessionId + ' to ' + pos + '%');
progressFlag = 0;
var request = new chrome.cast.media.SeekRequest();
request.currentTime = pos * currentMediaSession.media.duration / 100;
currentMediaSession.seek(request, onSeekSuccess.bind(this, 'media seek done'), onError);
}

function onSeekSuccess(info) 
{
console.log(info);
setTimeout(function() {progressFlag = 1},PROGRESS_BAR_UPDATE_DELAY);
}

function mediaCommandSuccessCallback(info) 
{
console.log(info);
}

function stopApp() 
{
if(session != null)
{
session.stop(onStopAppSuccess, onStopAppError);
}
else
{
console.log("No session exists");
}
if (timer) 
{
clearInterval(timer);
}
}

function onStopAppSuccess() 
{
console.log('Successfully stopped app.');
}

function onStopAppError() 
{
console.log('Error stopping app.');
}
