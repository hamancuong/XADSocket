
chrome.tabs.onUpdated.addListener( function (tabId, changeInfo, tab) {

  if (changeInfo.status == 'complete' && tab.active) {
	//console.log(tabId);
	//setIconAddon('icon_logout.png'); //set default
	connectSocketCookie(tab,false);			
	//catchConnectSocket();	
  }
});

//listen message click2call from client
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	switch(request.type){
		case 'click2call':
			var phone = request.phone;
			sendResponse('send click2call to background OK');
			chrome.storage.local.get('cookie_socket', function(dt){
				var json = dt.cookie_socket;
				if( typeof json != 'undefined' && json.length > 0 ){
					json = json[0];
					sendMessageClient('click2call_BG',phone+" | "+json.socket_session);
					click2call(json.socket_session,phone);
				}
			});
			//return true;
			break;
		case 'refeshPage':
			var d = new Date(Date.now()).toLocaleString();
			saveLogStorage('disconnectSocketXAD',{'disconnectTime':d,'reason':request.KeypressF5});
			break;
		case 'logoutConfirmXAD':
			if(typeof request.session != 'undefined' && request.session != ''){
				socket.emit("logout",{session:request.session});
				sendResponse('logout bg');
			}
			break;
	}
    
});


//notify in client if not focus brower tab
chrome.notifications.onClicked.addListener(function( notificationId ) {
	chrome.storage.local.get('cookie_socket', function(dt){
		var json = dt.cookie_socket;
		if(typeof json != 'undefined' && json.length > 0){
			window.open(json[0].socket_urlCRMNotify,"_blank");
			window.focus();
			chrome.notifications.clear(notificationId, function() {});
		}
	});
});


function showNotification(phone) {
    chrome.notifications.create('callShow', {
        type: 'basic',
        iconUrl: 'img/icon_128.png',
        title: 'Socket call',
        message: 'Call from phone '+phone
    }, function(notificationId) {});
}





