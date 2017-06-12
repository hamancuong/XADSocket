var url_api = 'http://xcs01.cloudpbx.vn/cuong/';
var socket;
var pause_reason_list = [];

/*get config from api*/
function getConfigSocketClient(client,dataLogin,tab){
	var script_url = url_api+"getConfig.php?client="+client;
	$.get(script_url).done(function(data){
		if(data != ''){
			var config = JSON.parse(data);
			if( tab.url.indexOf(config.configCRM.urlCRMAllow) > -1 ){
				dataLogin.socket_host = config.host;
				dataLogin.socket_port = config.port;
				dataLogin.socket_reconnectReply = config.reconnectReply;
				dataLogin.socket_reconnectTime = config.reconnectTime;
				dataLogin.socket_typeCRM = config.configCRM.type;
				dataLogin.socket_CRMAction = config.configCRM.action;
				if( config.configCRM.type == 'ZenDesk' ){
					dataLogin.socket_urlAPICreateTicket = config.configCRM.urlAPICreateTicket;
				}
				dataLogin.socket_urlCRMConfig = config.configCRM.urlCRMAllow;
				dataLogin.socket_urlCRMNotify = config.configCRM.urlCRMNotify;
				
				//save config and login
				saveLogStorage('cookie_socket','');
				saveLogStorage('cookie_socket',dataLogin,function(){ /*loginWithCookie(dataLogin,true);*/ reload_client();});
			}else{
				excuteScriptClient('alert("The page not allow Addon XADSocket!");');
				window.close();
			}
		}else{
			excuteScriptClient('alert("Client name wrong!")');
			window.close();
		}
	});
}

/* excute script in client */
function excuteScriptClient(script,callback){
	chrome.tabs.executeScript(null,{
		code:script
    },function(rs){
		callback();
	});
}

/*pause - unpause action*/
function getPauseScript(){
	$("#pause_user").hide();
	$("#pause_reason").hide();
	$(".display-pausereason").hide();
	$("#unpause_user").show();
	getBadgeText("Pause","#ddd");
}

function getUnpauseScript(){
	$("#pause_user").show();
	$("#pause_reason").show();
	$(".display-pausereason").show();
	$("#unpause_user").hide();
	getBadgeText("","transparent");
}
/*---- edit status, icon of addon ----*/
function getBadgeText(text,color){
	console.log("text:"+text+"\n color:"+color);
	chrome.browserAction.setBadgeText({text: text});
	if(text != ""){
		chrome.browserAction.setBadgeBackgroundColor({color:color});
	}
}

function setIconAddon(img){
	chrome.browserAction.setIcon({
	  path : "img/"+img
	});
}
//set status, icon when user logout
function setLogoutInfo(){
	saveLogStorage('bgSocketNum','');
	saveLogStorage('cookie_socket','');
	getBadgeText("","");
	setIconAddon("icon_logout.png");
}

/* send message to client in chrome*/
function sendMessageClient(type,mess,tab){
	chrome.tabs.sendMessage(tab.id, {type: type,message:mess}, function(response) {});
}

/* send message to background */
function sendMessageBG(type,mess){
	chrome.runtime.sendMessage({type:type,message:mess}, function(response) {
		console.log(response)
	});
}

/* save data in storage of Chrome */
function saveLogStorage(name,data,callback){
	console.log("function save data in chrome");
	if(data != ''){
		chrome.storage.local.get(name, function(dt) {
			var json = dt[name];
			console.log(json);
			if(typeof json != 'undefined' && json != ''){
				json.push(data);
				chrome.storage.local.set({[name]: json}, function() {
					console.log(dt);
					callback();
				});
			}else{
				chrome.storage.local.set({[name]: [data]}, function() {
					console.log(data);
					callback();
				});
			}
		});
	}else{
		chrome.storage.local.set({[name]: data}, function() {
			console.log(data);
		});
	}
}
/* function of socket */

//connect socket with data
function connectSocketCookie(tab,popup_focus){
	chrome.storage.local.get("cookie_socket",function(data){
		if( Object.keys(data).length > 0 && Object.keys(data.cookie_socket).length > 0  ){
			var json = data.cookie_socket;
			var str_url_config = json[0].socket_urlCRMConfig;
			if( tab.url.indexOf(str_url_config) > -1 ){
				//sendMessageClient('dataBG',json[0]);
				setIconAddon("icon.png");
				if( typeof json[0].socket_id != 'undefined' && json[0].socket_id != '' ){
					//close socket background when reload page
					socket.disconnect(json[0].socket_id);
				}
				loginWithCookie(json[0],popup_focus,tab);
				catchDisconnectSocket(tab);
				catchReconnectSocket(tab);
			}else{
				if( typeof json[0].submit_login != 'undefined' || json[0].submit_login == 'true' ){
					excuteScriptClient('alert("This page not allow Addon");');
					saveLogStorage('cookie_socket','');
					setIconAddon("icon_logout.png");
				}				
			}
			
		}else setIconAddon("icon_logout.png");
	});
}
//login user in socket with data
function loginWithCookie(json,popup_focus,tab){	
	socket = io.connect('http://'+json.socket_host+':'+json.socket_port,{
		'reconnection': true,
		'reconnectionDelay': json.socket_reconnectTime,
		'reconnectionAttempts': json.socket_reconnectReply,
		'forceNew':true
	});
	
	if( typeof json.socket_session == "undefined" || json.socket_session == "" ){
		console.log("Login new socket");
		var data = {
				'agent_id': json.socket_xad_username,
				'passwd': json.socket_xad_password,
				'extension': json.socket_xad_extension
			};
		socket.emit('login', data);
		//return "login user socket";
	}else{
		//socket.disconnect();
		console.log("Login with already socket");
		socket.emit('register_socket',{session: json.socket_session} );
		getAgentInfo(json.socket_session);
		//return "cookie already";
	}
	getMessageSocket(popup_focus,tab);
}

//get agent info when logged
function getAgentInfo(session){
	socket.emit('agentinfo',{session:session});	
}

//get list pause reason
function getPauseReason(session){
	if( pause_reason_list.length == 0){
		console.log("get pause reason");
		socket.emit('pause_reason',{session:session});
	}
}

//catch event when socket connected
function catchConnectSocket(tab){
	socket.on('connect',function(msg){
		console.log(socket); //show in popup
		sendMessageClient('socketID',socket.id,tab);
	});
}

//catch and write log when socket disconnect and reconnect
function catchDisconnectSocket(tab){
	socket.on('disconnect',function(msg){
		var d = new Date(Date.now()).toLocaleString();
		saveLogStorage('disconnectSocketXAD',{'disconnectTime':d,'reason':msg});
		sendMessageClient('disconnectAlert',msg,tab);
	});
}
function catchReconnectSocket(tab){
	socket.on('reconnect',function(msg){
		var d = new Date(Date.now()).toLocaleString();
		saveLogStorage('reconnectSocketXAD',{'reconnectTime':d,'msg':msg});
		sendMessageClient('reconnectAlert',msg,tab);
	});
}

//get message in socket
function getMessageSocket(popup_focus,tab){
	socket.on("message",function(dt){
		console.log(JSON.stringify(dt));
		//sendMessageClient('popupFocus',JSON.stringify(popup_focus));
		if(popup_focus === false ){
			sendMessageClient("socketRequestData",dt,tab);
		}
		switch(dt.code){
			case "300":
				//login
				if(dt.status == "success"){
					//alert("login success");
					chrome.storage.local.get('cookie_socket', function(dt_cookie) {
						var json = dt_cookie.cookie_socket;
						json = json[0];
						json.socket_session  =  dt.data.session;
						json.socket_id = socket.id;
						delete json.submit_login;
						saveLogStorage('cookie_socket','');
						saveLogStorage('cookie_socket',json);
					});
					console.log('login success');
				}else if(dt.status == 'fail'){
					setLogoutInfo();
				}
				break;
			case "301":
				//create socket fail
				//session expired
				if(dt.status == "fail"){
					setLogoutInfo();
				}
				break;
			case "302":
				//logout
				if(dt.status =="success"){
					setLogoutInfo();
					socket.disconnect();
					$("#content").html( getHtmlShowDefault() );
				}
				break;
			case "303":
				//agent info
				if(dt.status == "success"){
					if(dt.data.status == "pause"){
						getPauseScript();
					}else{
						getUnpauseScript();
					}
				}else{
					//saveDataInChrome('');
				}
				break;
			case "304": //agent pause when logging
				if(dt.status == "success"){
					getPauseScript();
				}
				break;
			case "305": //list pause reason
				if(dt.status == "success"){
					pause_reason_list = dt.data.list;
					$("#pause_reason").html("");
					var list = '';
					$.each(pause_reason_list,function(k,v){
						list += '<option value="'+v.id+'">'+v.name+'</option>';
					});
					//console.log(list);
					$("#pause_reason").html(list);
				}
				break;
			case "306": //agent unpause
				if(dt.status == 'success'){
					getUnpauseScript();
				}
				break;
			case "314": //click2call
				if(dt.status == 'fail'){
					//Device is inused
					if(popup_focus === false) sendMessageClient('click2callFail',dt.message,tab);
				}
				break;
			case "316": //ringing with agent
				// create ticket and return id ticket
				//createTicketZD(dt.data.phone_number,tab);
				var phone = dt.data.phone_number;
				
				sendMessageClient('tabFocus','ringing agent',tab);
				
				chrome.storage.local.get('cookie_socket', function(dt_cookie) {
					var json = dt_cookie.cookie_socket;
					json = json[0];
					if( json.socket_typeCRM == 'ZenDesk' ){
						if( json.socket_CRMAction == 'createTicket'){
							createTicketZD(json.socket_urlAPICreateTicket,phone,json.socket_CRMAction,tab);
						}else if( json.socket_CRMAction == 'searchPhone' ){
							sendMessageClient(json.socket_CRMAction,phone,tab);
						}
					}else{
						
					}
				});
				
				//sendMessageClient('searchPhoneZD',dt.data.phone_number,tab);
				
				showNotification(dt.data.phone_number);
				break;
			case "324"://ringing outbound
				break;
			case "326": //connected outbound
				break;
			case "328": //completed outbound
				break;
			case "352":
				// have call
				if(dt.status == "success"){					
					getBadgeText("C","red");
				}
				break;
			case "356": //info device
				//dt.data.status
				//"DEVICE_RINGING" | "DEVICE_NOT_INUSE" | "DEVICE_UNAVAILABLE"
				break;
		}
	});
}

//click2call
function click2call(session,phone){
	socket.emit('click2call',{session:session, phone_number:phone});
}

/* create ticket with zendesk api */
function createTicketZD(url,phone,action,tab){
	//var url_api = "http://172.168.12.203/cuong/zendesk.php";
	$.post(url,{"OpenTicket":'',"btnClick":'',"phone":phone},function(id){
		sendMessageClient(action,id,tab);
	});
}