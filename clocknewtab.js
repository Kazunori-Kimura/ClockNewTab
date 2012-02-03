/*
 * clocknewtab.js
 * @author Kazunori-Kimura
 * 2012-02-04
 */

/*
 * const
 */
var clockNT = {
	'repaintWaitTime': 30000,
	'recentBookmarks': 14,
	'historyMaxResults': 30,
	'maxHistoryItem': 14,
	'searchText': null
};

/*
 * alias getElementById
 */
function $(id){
	return document.getElementById(id);
}


/*
 * show date-time
 */
function repaint(){
	var d = new Date();
	var dt = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
	var tm = ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);

	$('date').innerHTML = dt;
	$('time').innerHTML = tm;
}

///////////////////////////////////////////////////////////////
/*
 * Application launcher
 */

/*
 * get installed Applications
 */
function getApps(){
	chrome.management.getAll(function(info){
		var apps = [];
		for(var i=0; i<info.length; i++){
			if(info[i].isApp){
				apps[apps.length] = info[i];
			}
		}
		rebuildList(apps);
	});
}

/*
 * get Application Icon
 */
function getIconURL(app) {
	if (!app.icons || app.icons.length == 0) {
		return chrome.extension.getURL("icon.png");
	}
	var icon = {size:0};
	for (var i = 0; i < app.icons.length; i++) {
		var item = app.icons[i];
		if (item.size > icon.size) {
			icon = item;
		}
	}
	return icon.url;
}

/*
 * rebuild Applications List
 */
function rebuildList(apps){
	$('app-list').innerHTML = '';
	for(var i=0; i<apps.length; i++){
		//console.log(JSON.stringify(apps[i]));
 
		var div = document.createElement('div');
		div.className = 'app';
		div.id = apps[i].id;
		div.draggable = true;

		//launch app
		div.onclick = function(){
			chrome.management.launchApp(this.id);
			window.close();
		};
		
		//drag app
		div.ondragstart = function(event){
			//console.log(this.id);
			event.dataTransfer.setData('text', this.id);
		};

		var img = document.createElement("img");
		img.src = getIconURL(apps[i]);
		img.width = 32;
		div.appendChild(img);

		var name = document.createElement('span');
		name.className = 'appName';
		name.innerText = apps[i].name;
		div.appendChild(name);

		$('apps').appendChild(div);
	}
}

/*
 * uninstall
 * drop app to trash
 */
function dropApp(event){
	var id = event.dataTransfer.getData('text');
	//console.log(id);
	 
	chrome.management.get(id, function(info){
		var message = chrome.i18n.getMessage('uninstall', info.name);
		if(confirm(message)){
			chrome.management.uninstall(id);
		}
	});
	 
	event.preventDefault();
}

/*
 * cancel onDragOver event
 */
function dragOver(event){
	event.preventDefault();
}


///////////////////////////////////////////////////////////////

function getHistory(searchText){
	
	if(searchText === clockNT.searchText){
		return;
	}
	clockNT.searchText = searchText;
	
	chrome.history.search({'text': searchText}, function(historyItems){
		var ul = document.createElement('ul');
		ul.className = 'nav nav-pills nav-stacked';
		
		for(var i=0; i<historyItems.length; i++){
			if(i > clockNT.maxHistoryItem){
				break;
			}
			try{
				if( typeof historyItems[i].url == 'undefined' ){
					continue;
				}
				var li = document.createElement('li');
				var anchor = document.createElement('a');
				anchor.href = historyItems[i].url;
				if( typeof historyItems[i].title == 'string' && historyItems[i].title.length > 0 ){
					anchor.innerText = historyItems[i].title;
				}else{
					anchor.innerText = historyItems[i].url;
				}
				li.appendChild(anchor);
				ul.appendChild(li);
			}catch(e){}
		}
		$('history-list').innerHTML = '';
		$('history-list').appendChild(ul);
	});
}

function searchHistory(){
	var searchText = $('search-box').value;
	getHistory(searchText);
}

///////////////////////////////////////////////////////////////

// onload
function init(){
	//set date-time
	repaint();
	//set app-list
	getApps();
	//set bookmark
	//getRecent();
	getHistory('');
	
	//set event listener
	chrome.management.onDisabled.addListener(getApps);
	chrome.management.onEnabled.addListener(getApps);
	chrome.management.onInstalled.addListener(getApps);
	chrome.management.onUninstalled.addListener(getApps);
	
	//start repaint timer
	setInterval('repaint()', clockNT.repaintWaitTime);
}
