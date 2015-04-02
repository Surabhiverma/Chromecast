var session = null;
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


function sessionListener(e) 
{
session = e;
console.log('New session');
if (session.media.length != 0) 
{
console.log('Found ' + session.media.length +'sessions.');
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
var mediaInfo = new chrome.cast.media.MediaInfo('http://i.imgur.com/IFD14.jpg');
mediaInfo.contentType = 'image/jpg';
var request = new chrome.cast.media.LoadRequest(mediaInfo);
request.autoplay = true;
session.loadMedia(request, onLoadSuccess, onLoadError);
}

function changeImage()
{
loadMedia();
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
