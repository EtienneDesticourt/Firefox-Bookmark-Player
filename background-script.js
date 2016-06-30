var playlistFolder;
var currentLinkIndex = 0;
var playlistTab;
var lastCheckFailed = false;
var periodInMinutes = 0.166;
var playing = false;

function turnOff(){
	browser.alarms.clearAll(function(e){});
	playing = false;
	currentLinkIndex = 0;
}

function playNextLink(){
	if (!playlistTab || !playlistFolder || playlistFolder.children.length <= currentLinkIndex){
		turnOff();
		return;
	}
	var nextChildren = playlistFolder.children[currentLinkIndex];
	var nextLink = nextChildren.url;

	while (!nextLink && playlistFolder.children.length > currentLinkIndex){
		currentLinkIndex += 1;
		nextChildren = playlistFolder.children[currentLinkIndex];
		nextLink = nextChildren.url;
	}


	if (nextLink){
		browser.tabs.update(playlistTab.id, {url: nextLink});
	}
	else{
		turnOff();
	}
	currentLinkIndex += 1;
}

function checkIfStillPlaying(alarm){
	if (!playing){
		return;
	}

	if (!playlistTab){
		turnOff();
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

function getBookmarkFolderMenu(bookmarkRoot){
	var children = bookmarkRoot[0].children;
	var folderMenu = children[0];
	if (folderMenu.title != "Bookmarks Menu"){
		alert("The add-on is outdated.");
	}
	return folderMenu;
}

function updatePlaylistTab(tabs){
	if (tabs.length){
		playlistTab = tabs[0];
	}
	else{
		playlistTab = tabs;
	}
	playing = true;
}

function playAll(bookmarkRoot, folderName){
	var folderMenu = getBookmarkFolderMenu(bookmarkRoot);
	var folders = folderMenu.children;
	var folder = null;
	playlistFolder = null;

	for (var i=0; i<folders.length; i++){
		var node = folders[i];
		if (!node.url && node.title == folderName){
			folder = node;
			break;
		}
	}


	if (folder){
		turnOff(); //stop if it was already running
		browser.tabs.query({active: true, currentWindow: true}, updatePlaylistTab);
		playlistFolder = folder;
		playNextLink();
		chrome.alarms.create({
		  periodInMinutes
		});
	}
}



function onFolderClicked(folderName){
	chrome.bookmarks.getTree(function(bookmarkRoot){
		playAll(bookmarkRoot, folderName);
	});
}
// Add a listener for port connections
chrome.runtime.onConnect.addListener(function(port) {
    if(port.name == "popupPort") {
        port.onMessage.addListener(onFolderClicked);
    }
});
browser.alarms.onAlarm.addListener(checkIfStillPlaying);
