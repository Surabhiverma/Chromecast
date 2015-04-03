var session = null;
var currentMediaSession = null;
var progressFlag = 1;
var mediaCurrentTime = 0;
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

  
chrome.cast.initialize(apiConfig, onInitSuccess, onInitError);

}

function onError(e) 
{
console.log('Error' + e);
}

function sessionListener(e) 
{
session = e;
console.log('New session');
if (session.media.length != 0) 
{
console.log('Found ' + session.media.length + ' existing media sessions.');
onMediaDiscovered('onRequestSessionSuccess_', session.media[0]);
}
session.addMediaListener(onMediaDiscovered.bind(this, 'addMediaListener'));
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

function onInitError() 
{
console.log("Initialization failed");
}

function launchApp() 
{
console.log("Launching the Chromecast App...");
chrome.cast.requestSession(onRequestSessionSuccess, onLaunchError);
}

function onRequestSessionSuccess(e) 
{
console.log("Successfully created session: " + e.sessionId);
session = e;
session.addUpdateListener(sessionUpdateListener.bind(this));
session.addMediaListener(onMediaDiscovered.bind(this, 'addMediaListener'));
loadMedia();
}

function sessionUpdateListener(isAlive) 
{
var message = isAlive ? 'Session Updated' : 'Session Removed';
message += ': ' + session.sessionId;
console.log(message);
if (!isAlive) 
{
session = null;
}
}

function onMediaDiscovered(how, media) 
{
console.log("New media session ID:" + media.mediaSessionId + ' (' + how + ')');
currentMediaSession = media.mediaSessionId;
document.getElementById("playpauseresume").innerHTML = 'Pause';
media.addUpdateListener(onMediaStatusUpdate);
mediaCurrentTime = currentMediaSession.currentTime;
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
document.getElementById('progress').value = parseInt(100 *
currentMediaSession.currentTime /currentMediaSession.media.duration);
document.getElementById('progress_tick').innerHTML =
 currentMediaSession.currentTime;
document.getElementById('duration').innerHTML =
  currentMediaSession.media.duration;
progressFlag = 0;
}
document.getElementById('playpauseresume').innerHTML = 'Pause';
}
}
document.getElementById('playerstate').innerHTML =
      currentMediaSession.playerState;
}

function seekMedia(pos) 
{
progressFlag = 0;
var request = new chrome.cast.media.SeekRequest();
request.currentTime = pos * currentMediaSession.media.duration/100;
currentMediaSession.seek(request, onSeekSuccess.bind(this, 'media seek done'), onLoadError);
}

function onSeekSuccess(info) 
{
console.log(info);
setTimeout(function(){progressFlag = 1},1500);
}

function playMedia() 
{
if (!currentMediaSession) 
{
return;
}
var playpauseresume = document.getElementById('playpauseresume');
if (playpauseresume.innerHTML == 'Play') 
{
currentMediaSession.play(null,
mediaCommandSuccessCallback.bind(this, 'playing started for ' +
currentMediaSession.sessionId),onError);
playpauseresume.innerHTML = 'Pause';
appendMessage('play started');
timer = setInterval(updateCurrentTime.bind(this),
PROGRESS_BAR_UPDATE_DELAY);
}
else 
{
if (playpauseresume.innerHTML == 'Pause') 
{
currentMediaSession.pause(null,
mediaCommandSuccessCallback.bind(this, 'paused ' +
 currentMediaSession.sessionId),
onError);
playpauseresume.innerHTML = 'Resume';
appendMessage('paused');
}
    
else 
{
if (playpauseresume.innerHTML == 'Resume') 
{
currentMediaSession.play(null,mediaCommandSuccessCallback.bind(this, 'resumed ' +
currentMediaSession.sessionId),
onError);
playpauseresume.innerHTML = 'Pause';
appendMessage('resumed');
timer = setInterval(updateCurrentTime.bind(this),PROGRESS_BAR_UPDATE_DELAY);
}
}
}
}

function mediaCommandSuccessCallback()
{
console.log('Played/Paused');    
}

function changeImage()
{
loadMedia();
}

function onLaunchError() 
{
console.log("Error connecting to the Chromecast.");
}

function loadMedia() 
{
if (!session) 
{
console.log("No session.");
return;
}
var mediaInfo = new chrome.cast.media.MediaInfo('http://surabhiverma.github.io/Chromecast/OneRepublic - Counting Stars_2.mp4');
mediaInfo.contentType = 'video/mp4';
var request = new chrome.cast.media.LoadRequest(mediaInfo);
request.autoplay = true;
session.loadMedia(request, onLoadSuccess, onLoadError);
}

function onLoadSuccess() 
{
console.log('Successfully loaded image.');
}

function onLoadError() 
{
console.log('Failed to load image.');
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
}

function onStopAppSuccess() 
{
console.log('Successfully stopped app.');
}

function onStopAppError() 
{
console.log('Error stopping app.');
}
