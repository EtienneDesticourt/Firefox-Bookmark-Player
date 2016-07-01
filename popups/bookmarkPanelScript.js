function onFolderClicked(event) {
	var t = event.target;
	port.postMessage(t.innerHTML);
	window.close();
}

function clearPopup(){
	var ul = document.getElementById("list");
	ul.innerHTML = '';
}

function addFolder(name){
	var ul = document.getElementById("list");
	var li = document.createElement("li");
	li.appendChild(document.createTextNode(name));	
	li.addEventListener('click', onFolderClicked);
	ul.appendChild(li);	
}

function getBookmarkFolderMenu(bookmarkRoot){
	var children = bookmarkRoot[0].children;
	var folderMenu = children[0];
	if (folderMenu.title != "Bookmarks Menu"){
		alert("The add-on is outdated.");
	}
	return folderMenu;
}

function displayFolders(bookmarkRoot){
	clearPopup();
	var folderMenu = getBookmarkFolderMenu(bookmarkRoot);
	var folders = folderMenu.children;

	for (var i=0; i<folders.length; i++){
		var node = folders[i];
		if (!node.url){ //menus don't have urls
			addFolder(node.title);
		}
	}
}

browser.bookmarks.getTree(displayFolders);
var port = chrome.runtime.connect({name: "popupPort"});
