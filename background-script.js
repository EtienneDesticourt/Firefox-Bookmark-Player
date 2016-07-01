var playlistFolder;
var currentLinkIndex = 0;
var playlistTab;
var lastCheckFailed = false;
var periodInMinutes = 0.166 / 2; //5 seconds, will wait 2*5s to go to next link on inaudible tab
var playing = false;

//LINK ITERATION LOGIC

function checkIfStillPlaying(alarm){
	if (!playing){
		return;
	}

	if (!playlistTab){
		turnOff();
		return;
	}
	browser.tabs.get(playlistTab.id, updatePlaylistTab);


	if (!playlistTab.audible){
		if (lastCheckFailed){
			playNextLink();
			lastCheckFailed = false;
		}
		else{
			lastCheckFailed = true;
		}
	}
}

function playNextLink(){
	if (!playlistTab || !playlistFolder || playlistFolder.children.length <= currentLinkIndex){
		turnOff();
		return;
	}
	var nextChildren = playlistFolder.children[currentLinkIndex];
	var nextLink = nextChildren.url;

	//Skip folders
	while (!nextLink && playlistFolder.children.length > currentLinkIndex){
		currentLinkIndex += 1;
		nextChildren = playlistFolder.children[currentLinkIndex];
		nextLink = nextChildren.url;
	}

	//If we ran out of links in the folder we turn off the playing
	if (!nextLink){
		turnOff();
		return;
	}

	//Change tab url to next link
	browser.tabs.update(playlistTab.id, {url: nextLink});	
	currentLinkIndex += 1;
}

//ON/OFF LOGIC

function turnOff(){
	browser.alarms.clearAll(function(e){});
	playing = false;
	currentLinkIndex = 0;
	chrome.browserAction.setIcon({path: "icons/icon.png"});
	chrome.browserAction.setTitle({title: "Play Bookmarks"});
}

function updatePlaylistTab(tab){	
	if (!tab){ //If tab was closed
		turnOff();
		return;
	}
	else{
		playlistTab = tab;
	}
}

function initActiveTab(tabs) {
	playlistTab = tabs[0];	
	playNextLink();
}

function turnOn(){
	playing = true;
	browser.tabs.query({active: true, currentWindow: true}, initActiveTab);
	chrome.alarms.create({periodInMinutes});
	chrome.browserAction.setIcon({path: "icons/icon-off.png"});
	chrome.browserAction.setTitle({title: "Stop Playing"});
}

//BOOKMARK SELECTION LOGIC
function getBookmarkFolderMenu(bookmarkRoot) {
	var children = bookmarkRoot[0].children;
	var folderMenu = children[0];
	if (folderMenu.title != "Bookmarks Menu"){
		alert("The add-on is outdated.");
	}
	return folderMenu;
}

function getFolderByName(folderName, bookmarkRoot) {
	var folderMenu = getBookmarkFolderMenu(bookmarkRoot);
	var folders = folderMenu.children;

	for (var i=0; i<folders.length; i++){
		var node = folders[i];
		if (!node.url && node.title == folderName){
			var folder = node;
			break;
		}
	}

	return folder;
}


function playAll(bookmarkRoot, folderName){
	var folder = getFolderByName(folderName, bookmarkRoot);

	if (folder){
		turnOff(); //stop if it was already running
		playlistFolder = folder;
		turnOn();
	}
}
//CONNECTION TO POPUP SCRIPT

function onFolderClicked(folderName){
	if (folderName == "STOP PLAYING THIS IS NOT A FOLDER"){ //If someone has a playlist folder with this name I'll just give up on life...
		turnOff();
		return;
	}
	chrome.bookmarks.getTree(function(bookmarkRoot){
		playAll(bookmarkRoot, folderName);
	});
}

chrome.runtime.onConnect.addListener(function(port) {
    if(port.name == "popupPort") {
        port.onMessage.addListener(onFolderClicked);
    }
});


browser.alarms.onAlarm.addListener(checkIfStillPlaying);
