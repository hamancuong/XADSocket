$(document).ready(function(){
	$("#phonenumber").focus();
	$("#phonenumber").on("keypress",function(e){
		if( e.keyCode == 13 ){
			click2call();
		}
		$(".key").each(function(){
			if( $(this).attr('key') == String.fromCharCode(e.keyCode) ){
				//$(this).trigger('click');
				$(this).is(":active");
			}
		});
		console.log( String.fromCharCode(e.keyCode) );
	});
	$("#divKeypad").on("click","span.key",function(){
		var phone = $("#phonenumber").val();
		var key = $(this).text();
		$("#phonenumber").val( phone+key ).focus();
	});
	$(".call").on("click",function(){
		click2call();
	});
});

function click2call(){
	if($("#phonenumber").val()!=''){
		$(".watermask").show();
		$(".watermask").html('<span>Call to<br> '+$("#phonenumber").val()+' </span>');
		chrome.runtime.sendMessage({type: "click2call",phone:$("#phonenumber").val()}, function(response) {
			console.log(response)
		});
	}else{
		$(".watermask").hide();
		$(".watermask").html('');
		$("#phonenumber").focus();
	}
}