

var Logins=[]
var isLogin=false;
var hash=undefined;


chrome.storage.sync.get(["hash"], function(result) {
    hash=result["hash"];
    if(!hash){
        window.location.href="/popup/password/password.html";
    }
});

if(document.readyState === 'complete') {
    GetLogins();
}
else{
	document.addEventListener("DOMContentLoaded", function(){
        GetLogins();
	});
}


function AddToDB(data){
    var key=document.getElementById("Mpassword").value;
    document.getElementById("Mpassword").value="";
    EncryptToDB('site:'+data.domain,data,key,key,function(res){
        if(res.Success===true){
            location.reload();
        }
        else{
            if(res.code===1){
                addError(document.getElementById("Mpassword").parentElement);
            }   
        }
    });
}

function Submit(data){
    var key=document.getElementById("Mpassword").value;
    document.getElementById("Mpassword").value="";
    DecryptFromDB('site:'+data.domain,key,function(res){
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if(res.Success===true){
                chrome.tabs.sendMessage(tabs[0].id,{req:"update",user:res.username,pass:res.password},{frameId:data.frameId},null);
            }
            else{
                if(res.code===1){
                    addError(document.getElementById("Mpassword").parentElement);
                }
                console.log(res.Info);
            }
        });
    });

}

function Edit(container,user,pass,domain){

    

    if(container.className===""){
        
        if(res==="red"){
            container.className="hidden";
            user.value="";
            pass.value="";
        }
    
        
    }
    else{
        var key=document.getElementById("Mpassword").value;
        document.getElementById("Mpassword").value="";
        DecryptFromDB('site:'+domain,key,function(res){
            if(res.Success===true){
                container.className="";
                user.value=res.username;
                pass.value=res.password;
            }
            else{
                if(res.code===1){
                    addError(document.getElementById("Mpassword").parentElement);
                }
                console.log(res.Info);
            }
        
        });
    }   
    
}


function GetLogins(){
    chrome.tabs.query({active: true, lastFocusedWindow: true}, function(tabs) {
        
        chrome.webNavigation.getAllFrames({tabId:tabs[0].id},function(frames){
            for(frame of frames){
                try{
                    chrome.tabs.sendMessage(tabs[0].id, {req:"login",frameId:frame.frameId},{frameId:frame.frameId},function(res){
                        if(res!==undefined){
                            if(res.login===true){
                                Logins.push({frameId:res.frameId,domain:res.domain});
                                ShowLoginInPopup({frameId:res.frameId,domain:res.domain});
                            }
                        }
                    });
                }
                catch(error){
                    console.log(error);
                }
            }
        });
    });
}

var isNew=true;
function ShowLoginInPopup(l){

    var MasterMain=document.getElementById("main");

    if(isNew){
        isNew=false;
        
 
        let tmpDef=document.getElementById("def");
        if(tmpDef){
            tmpDef.parentElement.removeChild(tmpDef);
        }

        var MasterPasswordMain=document.getElementById("master");

        var ans=CreateInput("password");
        var Mpass=ans.input;
        var container=ans.container;

        Mpass.id="Mpassword";
        Mpass.placeholder="Master password";

        MasterPasswordMain.appendChild(container);
        
        MasterPasswordMain.appendChild(document.createElement("br"));
    }

    chrome.storage.sync.get(['site:'+l.domain], function(result) {

        if(result['site:'+l.domain]===undefined){

            var MainContainer=document.createElement("div");
            MainContainer.className="container";

            var tmp=document.createElement("span");
            tmp.innerText="Add credentiassls for ";
            MainContainer.appendChild(tmp);
            
            var bold=document.createElement("span");
            bold.style="color:#4caf50;font-weight: bold;";
            bold.innerText=l.domain;
            MainContainer.appendChild(bold);
            MainContainer.appendChild(document.createElement("br"));
            MainContainer.appendChild(document.createElement("br"));

            var ansUser=CreateInput("text");
            var user=ansUser.input;
            var containerUser=ansUser.container;

            user.autocomplete="off";
            user.placeholder="Username";

            MainContainer.appendChild(containerUser);

            MainContainer.appendChild(document.createElement("br"));

            var ansPass=CreateInput("password");
            var pass=ansPass.input;
            var containerPass=ansPass.container;

            pass.autocomplete="off";
            pass.placeholder="Password";

            MainContainer.appendChild(containerPass);
            MainContainer.appendChild(document.createElement("br"));

            var submit=document.createElement("button");
            submit.addEventListener("click",function(){
                AddToDB({domain:l.domain,username:user.value,password:pass.value});
            });
            submit.innerText="Add Credentials";
            MainContainer.appendChild(submit);

            var generate=document.createElement("button");
            generate.addEventListener("click",function(){
                pass.focus();
                pass.select();
                document.execCommand("insertText", false, randomPass());
            });
            generate.innerText="Generate password";
            MainContainer.appendChild(generate);

            MainContainer.appendChild(document.createElement("br"));

            MasterMain.appendChild(MainContainer);
        }
        else{

            var MainContainer=document.createElement("div");
            var EditContainer=document.createElement("div");
            MainContainer.className="container";

            var ansUser=CreateInput("text");
            var user=ansUser.input;
            var containerUser=ansUser.container;

            var ansPass=CreateInput("password");
            var pass=ansPass.input;
            var containerPass=ansPass.container;
            
            let bold=document.createElement("div");
            bold.style="color:#4caf50;font-weight: bold; margin:5px; display: inline-block";
            bold.innerText=l.domain;
            MainContainer.appendChild(bold);
            
            var unlock=document.createElement("i");
            unlock.className="fas fa-lock-open";
            unlock.addEventListener("click",function(){
                Submit(l);
            });
            MainContainer.appendChild(unlock);

            var edit=document.createElement("i");
            edit.className="fas fa-edit";
            edit.addEventListener("click",function(){
                Edit(EditContainer,user,pass,l.domain);
            });
            MainContainer.appendChild(edit);


            var trash=document.createElement("i");
            trash.className="fas fa-trash";
            trash.addEventListener("click",function(){
                VerifyPass(Mpass.value,function(isPass){
                    if(isPass){
                        spawnConfirm("This operation would permenantly delete "+l.domain+"'s credentials. Are you sure you want to delete them?","Cancel","Yes, delete them",function(ret){
                            if(ret==="red"){
                                chrome.storage.sync.remove('site:'+l.domain);
                                location.reload();
                            }
                        });
                    }
                    else{
                        addError(document.getElementById("Mpassword").parentElement);
                    }
                });
                
            });
            MainContainer.appendChild(trash);

            
            EditContainer.className="hidden";
            MainContainer.appendChild(EditContainer);
            EditContainer.appendChild(document.createElement("br"));

            user.autocomplete="off";
            user.placeholder="Username";
            user.value=result['site:'+l.domain].username;

            EditContainer.appendChild(containerUser);

            EditContainer.appendChild(document.createElement("br"));

            pass.autocomplete="off";
            pass.placeholder="Password";
            pass.value=result['site:'+l.domain].password;

            EditContainer.appendChild(containerPass);

            EditContainer.appendChild(document.createElement("br"));
            let submit=document.createElement("button");
            submit.addEventListener("click",function(){
                VerifyPass(Mpass.value,function(isPass){
                    if(isPass){
                        spawnConfirm("Once you edit the credentials, you cannot restore them. Are you sure you want to update the credentials?","No, cancel","Yes, update",function(res){
                            if(res==="red"){
                                AddToDB({domain:l.domain,username:user.value,password:pass.value});
                            }
                        });
                    }
                    else{
                        addError(Mpass.parentElement);
                    }
                });
            });
            submit.innerText="Update";
            EditContainer.appendChild(submit);

            var generate=document.createElement("button");
            generate.addEventListener("click",function(){
                pass.focus();
                pass.select();
                document.execCommand("insertText", false, randomPass());
                //pass.replaceData(0, pass.value.length, randomPass());
            });
            generate.innerText="Generate password";
            EditContainer.appendChild(generate);

            
            EditContainer.appendChild(document.createElement("br"));

            MasterMain.insertBefore(MainContainer,MasterMain.firstChild);
        }
    });
}


function SendToCurrent(message,callback,frameId=null){
    chrome.tabs.query({active: true, lastFocusedWindow: true}, function(tabs) {
        if(frameId!==null){
            chrome.tabs.sendMessage(tabs[0].id, message,{frameId:frameId},callback);
        }
        else{
            chrome.tabs.sendMessage(tabs[0].id, message,callback);
        }
      });
}

