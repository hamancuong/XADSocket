var socket;
var notifyList = [];
var notification;
var focused = false;


$(document).ready(function(){	
	console.log("complete page");
		var this_url = document.location.href;
		chrome.storage.local.get("cookie_socket",function(data){
			var json = data.cookie_socket;
			if( typeof json != 'undefined' && json.length > 0 ){
				json = json[0];
				var str_url_config = json.socket_urlCRMConfig;
				
				if( typeof str_url_config != 'undefined' && this_url.indexOf(str_url_config) > -1 ){
					chrome.storage.local.get('disconnectSocketXAD', function(dt) {
						//log disconnect from socket
						console.log(dt);
					});
					chrome.storage.local.get('reconnectSocketXAD', function(dt) {
						//log reconnect from socket
						console.log(dt);
					});
					chrome.extension.onMessage.addListener(function (request, sender, sendResponse) {
						//get message from background
						console.log(request.type+":");
						console.log(request.message);
						switch(request.type){
							case 'click2callFail':
								alert("Click2call fail \n"+request.message);
								break;
							case 'createTicket':
								//$("body").append('<a href="tickets/'+request.message+'" id="ticketAPI'+request.message+'" tabindex="-1"></a>');
								var newlink = document.createElement('a');
								newlink.setAttribute('id', 'ticketAPI'+request.message);
								newlink.setAttribute('href', 'tickets/'+request.message);
								$("body").append(newlink);
								$("a#ticketAPI"+request.message)[0].click();
								break;
							case 'searchPhone':
								var phone = request.message;								
								searchPhoneZD(phone);
								break;
							case 'tabFocus':
								window.focus();
								break;
						}
					});	
					
					//get click2call from <a> tag
					$("body").on("click",".click2call",function(){
						//send request click2call to bacground
						sendMessageBG('click2call',{'key':'phone','val':$(this).attr("phone")});
					});
					
					//catch event refesh
					$(document).on("keydown", function(e){
						if ( (e.which || e.keyCode) == 116){
							var d = new Date(Date.now()).toLocaleString();
							saveLogStorage('disconnectSocketXAD','');
							saveLogStorage('disconnectSocketXAD',{'disconnectTime':d,'reason':'Keypress F5'});
						}
					});
					//search in zendesk
					$("#mn_1").on("keyup",function(e){
						console.log( "data in input:"+$(this).val() );
						console.log( "trigger keyup input search with keycode:"+e.keyCode+" & which:"+e.which );
					});
					
					$(window).on('beforeunload', function(){
						console.log("refesh");
						//show confirm with return
						//return 'aaaaaaaaaaaaaaaaaaaaaaaaaa';
					});
	
				}
			}
		});

});

function searchPhoneZD(phone){
	$("#mn_1").val(phone);
	$("a.advanced-search")[0].click();
	/*
	$("#mn_1").trigger(
		jQuery.Event( 'keyup', { keyCode: 13, which: 13 } )
	);
	*/
	
}

function fireKeyup(el,type,keycode){
	var keyboardEvent = new KeyboardEvent(type, {bubbles:true}); 
	Object.defineProperty(keyboardEvent, 'keyCode', {get:function(){return this.keyCodeVal;}}); 
	keyboardEvent.keyCodeVal = keycode;
	document.getElementById(el).dispatchEvent(keyboardEvent);
}


window.onfocus = function() {
    focused = true;
	//removeAllNotifys();
};
window.onblur = function() {
    focused = false;
};

document.addEventListener('DOMContentLoaded', function () {
	//accept notify in browser if not allow
  //if (Notification.permission !== "granted")
    //Notification.requestPermission();
});

//thong bao call
function notifyMe(pic,link) {
  console.log("notify: "+link);
  if (!Notification) {
    alert('Trinh duyet cua ban ko ho tro notify'); 
    return;
  }
  if (Notification.permission !== "granted")
    Notification.requestPermission();
  else {
	console.log("window focus:"+focused);
	//Notification.close();
	if(focused == false){
		notification = new Notification('Socket Call', {
		  icon: "",
		  body: "You have a new call",
		});
		notifyList.push(notification);
		notification.onclick = function () {
			parent.focus();
			window.focus();
			this.close();
		};
	}
  }
}

function removeAllNotifys(){
	console.log("num notify:"+notifyList.length);
	  if(notifyList.length > 0){
		  for(var i=notifyList.length-1; i>=0;i--){
			//if(typeof notifyList[i] != "undefined"){
				notifyList[i].close();
				notifyList.pop();
			//}
		  }
		  //notifyList.length = 0;
		  console.log("notify list:"+notifyList);
	  }
}

function checkLogout(session){
	var cfm = confirm("Logout user ?");
	if(!cfm){
		return false;
	}else{
		console.log(session);
		sendMessageBG('logoutConfirmXAD',{'key':'session','val':session});
	}
}

function sendMessageBG(type,mess){
	chrome.runtime.sendMessage({type:type,[mess.key]:mess.val}, function(response) {
		console.log(response)
	});
}

function saveLogStorage(name,data){
	console.log("function save log");
	if(data != ''){
		chrome.storage.local.get(name, function(dt) {
			var json = dt[name];
			console.log(json);
			if(typeof json != 'undefined' && json != ''){
				json.push(data);
				chrome.storage.local.set({[name]: json}, function() {
					console.log(dt);
				});
			}else{
				chrome.storage.local.set({[name]: [data]}, function() {
					console.log(data);
				});
			}
		});
	}else{
		chrome.storage.local.set({[name]: data}, function() {
			console.log(data);
		});
	}
}
