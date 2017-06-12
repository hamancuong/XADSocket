function reload_client(){
	chrome.tabs.executeScript(null,{
		code:"location.reload();"
    });
	window.close();
}
function getHtmlShowDefault(){
	var html_show ='\
			<div id="data_setting_socket">\
				Client<input class="form-control" type="text" id="client" value="VEXERE"> <br>\
				User<input class="form-control" type="text" id="username" value="xcs"> <br>\
				Pass<input class="form-control" type="password" id="password" value="123456"> <br>\
				Extension <input class="form-control" type="text" id="extension" value="7113"> <br> \
				<button class="btn btn-primary" id="login_socket">Login</button>\
			</div>';
	return html_show;
}
function getHtmlShow(client,user,pass,extension){
	return '\
		<div id="data_setting_socket">\
			Client<input type="text" id="port" value="'+client+'"> <br>\
			User<input type="text" id="username" value="'+user+'"> <br>\
			Pass<input type="password" id="password" value="'+pass+'"> <br>\
			Extension <input type="text" id="extension" value="'+extension+'"> <br> \
			<button id="login_socket">Login</button>\
		</div>';
}

function getHtmlLogged(user,extension,session){
	var html_logged = '\
			<div class="row">\
				<div class="col-md-12">\
					<div class="img-user"></div>\
					<div class="info-user">\
						<span>Agent: '+user+'</span><br>\
						<span>Extension: SIP/'+extension+'</span><br>\
					</div>\
				</div>\
			</div>	\
			<div class="row">\
				<div class="col-md-12">\
					<input type="text" maxlength="12" class="form-control" id="phoneCallOut">\
					<button class="btn btn-primary" id="btnCallPad" >CallOut</button>\
				</div>\
				<div class="clear"></div>\
				<div class="col-md-12"> \
					<label class="display-pausereason" style="display:none"> Pause Reason </label>\
					<select class="form-control" id="pause_reason" style="display:none">\
					</select>\
				</div> \
				<div class="col-md-12" style="margin-top:5px;"> \
					<div class="pause-col"> \
						<button class="btn btn-primary" id="pause_user" style="display:none">Pause</button> 	\
						<button class="btn btn-primary" id="unpause_user" style="display:none">Unpause</button> 	\
					</div> \
					<div class="logout-col"> \
						<input type="hidden" value="'+session+'" id="socket_session"> \
						<button class="btn btn-danger" id="logout_user" style="display:block">Logout</button> 	\
					</div> \
				</div>\
			</div>';
	return html_logged;
}

$(document).ready(function(){
	chrome.tabs.query({"status":"complete","currentWindow":true,"active":true}, function(tab){
			$("#content").html( getHtmlShowDefault() );
			chrome.storage.local.get("cookie_socket",function(data){					
				if( Object.keys(data).length > 0 && Object.keys(data.cookie_socket).length > 0  ){
					var json = data.cookie_socket;
					json = json[0];
					console.log('Socket storage:');
					console.log(json);
					var str_url_config = json.socket_urlCRMConfig;
					if( typeof str_url_config != 'undefined' ){
						if( tab[0].url.indexOf(str_url_config) > -1 ){
							//socket_ss_cookie =json.socket_session;
							if( typeof json.socket_session === 'undefined' ){
								reload_client();
							}
							loginWithCookie(json,true);
							getPauseReason(json.socket_session);
							setIconAddon("icon.png");
							$("#content").html( getHtmlLogged(json.socket_xad_username,json.socket_xad_extension,json.socket_session) );
							
						}else{
							//saveLogStorage('cookie_socket','');
							excuteScriptClient('alert("This page not allow Addon");');
							window.close();
						}
					}					
				}else setIconAddon("icon_logout.png");
			});

			//login button click
			$("body").on("click","#login_socket",function(){
				var client = $("#client").val();
				var user_e = $("#username").val();
				var pass_e = $("#password").val();
				var ex_e = $("#extension").val();
				
				if(client != '' && user_e != '' && pass_e != '' && ex_e != ''){
					var data_login = {
						'socket_client':client,
						'socket_xad_username':user_e,
						'socket_xad_password':pass_e,
						'socket_xad_extension':ex_e,
						'submit_login':'true'
					};			
					getConfigSocketClient(client,data_login,tab[0]);

				}else saveLogStorage('cookie_socket','');;
				//setIconAddon("icon.png");
				//$("#content").html("user is logging.....");		
			});
			
			
	});
	
	//logout button click
	$("body").on("click","#logout_user",function(){
		//show confirm in client
		excuteScriptClient('checkLogout("'+$("#socket_session").val()+'");');
	});
	
	//pause button click
	$("body").on("click","#pause_user",function(){
		var reason_id = $("#pause_reason").val();
		var reason_name = $("#pause_reason option:selected").text();
		var data = {
			"session" : $("#socket_session").val(),
			"pause_reason_id" : reason_id,
			"pause_reason_name" : reason_name
		}
		socket.emit("pause", data);
	});	
	
	//unpause button click
	$("body").on("click","#unpause_user",function(){
		socket.emit('unpause', {session:$("#socket_session").val()});
		getPauseReason($("#socket_session").val());
	});
	
	
	//event enter in input
	$("body").on("keypress","#phoneCallOut",function(e){
		if( (e.which || e.keyCode) == 13 ){
			if( $(this).val().trim() == '' ){
				$(this).focus();
			}else callOut( $(this).val() );
		}
	});
	
	//open keypad with window popup
	$("body").on("click","#btnCallPad",function(){
		var phone = $("#phoneCallOut").val();
		if(phone.trim() != ''){
			callOut(phone);
		}else{
			$("#phoneCallOut").focus();
		}
		//open keypad window function
		//openKeypad();
	});
});

function openKeypad(){
	chrome.tabs.query({"status":"complete","active":true}, function(tab){
		console.log("count tab:"+tab.length);
		if(tab.length < 2){
			chrome.windows.create({'url': 'keypad.html', 'type': 'popup', 'height': 480, 'width':300}, function(window) {
			});
		}
	});
}

function callOut(phone){
	chrome.storage.local.get("cookie_socket",function(data){
		var json = data.cookie_socket;
		if( typeof json != 'undefined' && json.length > 0 ){
			click2call(json[0].socket_session,phone);
		}
	});
}

function checkLogout(){
	var cfm = confirm("Logout user ?");
	if(!cfm){
		return false;
	}else return true;
}


