var UniUser=null;
var UniPassword=null;

console.log("aidss");
chrome.runtime.onMessage.addListener(handleMessage);

function handleMessage(message, sender, sendResponse){
	switch(message.req){
		case "login":
			var res={
				login:(UniPassword!==null),
				domain:window.location.host,
				frameId:message.frameId
			};
			sendResponse(res);
		break;
		case "update":

			UniUser.focus();
			UniUser.select();
			if(!document.execCommand("insertText", false, message.user)){
				UniUser.value=message.user;
			}
			clearSelection();

			UniPassword.focus();
			UniPassword.select();
			if(!document.execCommand("insertText", false, message.pass)){
				UniPassword.value=message.pass;
			}

			clearSelection();

		break;
	}
}

function UpdateAll(){
	let res=GetCreds(document);
	if(res.pass!=null){
		UniUser=res.user;
		UniPassword=res.pass;

		//observer.disconnect();
	}
}

function invisible(elem){
	return (elem.offsetWidth <= 0 && elem.offsetHeight <= 0) || window.getComputedStyle(elem,null)["display"]==="none";
}

function obs(){
	observer.observe(document.body, { childList: true,  subtree: true});

}
if(document.readyState === 'complete') {
	UpdateAll();
	obs();
}
else{
	document.addEventListener("DOMContentLoaded", function(){
		UpdateAll();
		obs();

	});
}

var observer = new MutationObserver(UpdateAll);

function GetCreds(form){

	var inputs=[];
	let pass=false;
	for (let input of form.getElementsByTagName('input')){
		if((input.type==='text'||input.type==='email'||input.type==='password'||input.type==='number'||input.type==='tel')){
			pass=pass	||(input.type==='password');
			inputs.push(input);
		}
	}
	if(!pass){
		return {user:null, pass:null}
	}

	var password=null;
	var username=null;
	
	for (let i=0; i<inputs.length; i++){
		if (inputs[i].type==='password'){
			for (let j=i; j>=0; j--){
				if(inputs[j].type==='text'||inputs[j].type==='email'||inputs[j].type==='number'||inputs[j].type==='tel'){
					if(!(invisible(inputs[i])&&invisible(inputs[j]))){
						username=inputs[j];
						password=inputs[i];
						break;
					}
				}
			}
			if(password!=null){
				break;
			}
		}
	}
	
	return {user:username, pass:password}
}

function clearSelection()
{
 if (window.getSelection) {window.getSelection().removeAllRanges();}
 else if (document.selection) {document.selection.empty();}
}