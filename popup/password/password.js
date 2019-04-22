var hash=undefined;
var salt=undefined;
var error=undefined;

var ln=false;
var lt=false;

if(document.readyState === 'complete') {
    onload();
}
else{
	document.addEventListener("DOMContentLoaded", function(){
        onload();
	});
}


function onload(){
    var passMain=document.getElementById("passMain");

    var oldRes=CreateInput("password");
    oldRes.input.id="old";
    oldRes.input.placeholder="Old master password";
    oldRes.input.className="hidden";

    var new1Res=CreateInput("password");
    new1Res.input.id="new1";
    new1Res.input.placeholder="New master password";

    var new2Res=CreateInput("password");
    new2Res.input.id="new2";
    new2Res.input.placeholder="Repeat new master password";

    var submitbtn=document.createElement("button");
    submitbtn.id="submit";
    submitbtn.innerText="Set new password";
    submitbtn.addEventListener("click",function(){
        submit();
    });

    

    passMain.appendChild(oldRes.container);
    passMain.appendChild(new1Res.container);
    passMain.appendChild(new2Res.container);
    passMain.appendChild(document.createElement("br"));
    passMain.appendChild(submitbtn);

    var deleteContainer=document.getElementById("deleteContainer");

    var ans=CreateInput("password");
    var delpass=ans.input;
    var container=ans.container;

    delpass.id="Mpassword";
    delpass.placeholder="Master password";

    deleteContainer.insertBefore(container,deleteContainer.firstChild);

    document.getElementById("delete").addEventListener("click",function(){
        VerifyPass(delpass.value,function(isPass){
            if(isPass){
                spawnConfirm("Are you sure you want to DELETE YOUR ACCOUNT PERMANENTLY? This proccess is not reversible","Cancel", "Terminate",function(res){
                    if(res==="red"){
                        chrome.storage.sync.clear();
                        location.reload();
                    }
                });
            }
            else{
                addError(container);
            }
        });
        
    });

    chrome.storage.sync.get(["hash"], function(result) {
        if(result["hash"]){
            hash=Uint8Array.from(result["hash"]);
            document.getElementById("link").classList.remove("hidden");
            document.getElementById("old").classList.remove("hidden");
            document.getElementById("header").classList.remove("hidden");
            submitbtn.innerText="Change password";
            document.getElementById("deleteContainer").classList.remove("hidden");
        }
    });
    chrome.storage.sync.get(["salt"], function(result) {
        if(result["salt"]){
            salt=Uint8Array.from(result["salt"]);
        }
        else{
            salt=new Uint8Array(64);
            window.crypto.getRandomValues(salt);
        }
    });
    document.getElementById("new1").oninput=function(){

        var val=document.getElementById("new1").value;

        ln=val.length>=12;
        lt= /\d/.test(val) && /[a-zA-Z]/.test(val);
        

        if(ln){
            document.getElementById("checkLen").style="";
            document.getElementById("checkLen").classList.add("passOptionSuccess");
        }
        else{
            document.getElementById("checkLen").classList.remove("passOptionSuccess");
        }

        if(lt){
            document.getElementById("checkLetters").style="";
            document.getElementById("checkLetters").classList.add("passOptionSuccess");
        }
        else{
            document.getElementById("checkLetters").classList.remove("passOptionSuccess");
        }

    };
}


function submit(){

    function PassCheckAgain(){
        if(new1===new2){
            HaveIBeenPwned(new1,function(have){
                if(have){
                    addError(document.getElementById("checkPwned").parentElement);
                    document.getElementById("checkPwned").style="color:#ED4337;";
                }
                else{
                    ChangePass(old,new1);
                }
            });
        }
        else{
            addError(document.getElementById("new1").parentElement);
            addError(document.getElementById("new2").parentElement);
        }
    }

    var old=document.getElementById("old").value;
    var new1=document.getElementById("new1").value;
    var new2=document.getElementById("new2").value;

    if(!ln){
        addError(document.getElementById("checkLen").parentElement);
        document.getElementById("checkLen").style="color:#ED4337;";
    }
    if(!lt){
        addError(document.getElementById("checkLetters").parentElement);
        document.getElementById("checkLetters").style="color:#ED4337;";
    }
    if(!(lt&&ln)){
        return;
    }

    if(hash){

        VerifyPass(old,function(eq){
            if(eq){
                PassCheckAgain();
            }
            else{
                addError(document.getElementById("old").parentElement);
            }
        });

        
    }
    else{
        PassCheckAgain();
    }
    
}

var numCallbacks=0;
function ChangePass(oldPass,newPass){
    chrome.storage.sync.get(function(oldData){
        keys=[];
        for(var key in oldData){
            if(key.length>5){
                if(key.substring(0,5)==="site:"){
                    keys.push(key);
                }
            }
        }
        for(var key of keys){
            DecryptFromDB(key,oldPass,function(result){
                if(result.Success){
                    EncryptToDB(key,{username:result.username,password:result.password},oldPass,newPass,function(wtf){
                        numCallbacks++;
                        if(numCallbacks===keys.length){
                            chrome.storage.sync.set({salt:Array.from(salt)});
                            PBKDF2_SHA256(newPass,salt,function(newHash){
                                chrome.storage.sync.set({hash:Array.from(new Uint8Array(newHash))});
                                window.location.href="/popup/main/popup.html";
                            });
                        }
                    });
                }
                else{
                    console.log("fail");
                }
            });
        }
        if(keys.length===0){
            chrome.storage.sync.set({salt:Array.from(salt)});
            PBKDF2_SHA256(newPass,salt,function(newHash){
                chrome.storage.sync.set({hash:Array.from(new Uint8Array(newHash))});
                window.location.href="/popup/main/popup.html";
            });
        }
        

    });
    
    
    
    
}
