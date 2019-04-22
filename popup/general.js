function VerifyPass(pass,callback){
    chrome.storage.sync.get(["hash"], function(result1) {
        var GenHash=undefined;
        if(result1["hash"]){
            GenHash=Uint8Array.from(result1["hash"]);
        }
        chrome.storage.sync.get(["salt"], function(result2) {
            var GenSalt=undefined;
            if(result2["salt"]){
                GenSalt=Uint8Array.from(result2["salt"]);
            }
            if(GenSalt&&GenHash){
                PBKDF2_SHA256(pass,GenSalt,function(resHash){
                    callback(ArrComp(new Uint8Array(resHash),GenHash));
                });
            }
            else{
                callback(false);
            }
        });
    });
}

function ArrComp(a,b){
    var flag=true;
    if (a.byteLength != b.byteLength) {flag=false;}
    for(var i=0; i<a.byteLength; i++){
        flag&=a[i]===b[i];
    }
    return flag;
}

function digestMessage(message,salt,callback) {

    (function(){
        const encoder = new TextEncoder();
        const data = encoder.encode(message);

        var c = new Uint8Array(data.length + salt.length);

        c.set(data);
        c.set(salt, data.length);

        return window.crypto.subtle.digest('SHA-256', c);

    })().then(digestValue => {
        callback(digestValue);
    });
}

function PBKDF2_SHA256(plain,salt,callback){
    aes4js.derive(plain,salt).then(key=>{
        crypto.subtle.exportKey("raw",key).then(keyBuffer=>{
            window.crypto.subtle.digest("SHA-256",keyBuffer).then(resHash=>{
                callback(resHash);
            });
        });
    });
}


function CreateInput(type){

    var input=document.createElement("input");
    input.type=type;

    var container=document.createElement("div");
    container.className="inputParent";

    var bottomBorder=document.createElement("span");
    bottomBorder.className="focus-border";

    container.appendChild(input);
    container.appendChild(bottomBorder);

    if(type==="password"){
        var eye=document.createElement("i");
        eye.className="togglePass fa fa-eye";
        eye.style="font-size:20px";
        eye.addEventListener("click",function(){
            if(input.type==="password"){
                eye.className="togglePass fa fa-eye-slash";
                input.type="text";
            }
            else{
                eye.className="togglePass fa fa-eye";
                input.type="password";
            }
        });
        container.appendChild(eye);
    }
    
    return {container:container,input:input};
}

function DecryptFromDB(entry,key,callback){
    VerifyPass(key,function(isPass){
        if(isPass){
            chrome.storage.sync.get([entry], function(result) {
                if(result[entry]!==undefined){
                    chrome.storage.sync.get(["salt"], function(saltRes) {
                        var GenSalt=undefined;
                        if(saltRes["salt"]){
                            GenSalt=Uint8Array.from(saltRes["salt"]);
                        }
                        aes4js.decrypt(key,GenSalt,result[entry]).then(plaintext=>{
                            var obj=JSON.parse(plaintext);
                            if(obj.username!==undefined&&obj.password!==undefined){
                                callback({Success:true,username:obj.username,password:obj.password});
                            }
                            else{
                                callback({Success:false,Info:"AES decryption failed",code:3});
                            }
                        });
                    });
                }
                else{
                    callback({Success:false,Info:"The entry doesn't exist in the database",code:2});
                }
            });
        }
        else{
            callback({Success:false,Info:"The master password is not valid",code:1});
        }
    });
}

function EncryptToDB(entry,data,oldKey,newKey,callback){
    if (callback===undefined){
        callback=function(bull){};
    }

    VerifyPass(oldKey,function(isPass){
        if(isPass){
            chrome.storage.sync.get(["salt"], function(saltRes) {
                var GenSalt=undefined;
                if(saltRes["salt"]){
                    GenSalt=Uint8Array.from(saltRes["salt"]);
                }
                aes4js.encrypt(newKey,GenSalt,JSON.stringify({username:data.username,password:data.password})).then(cipher=>  {
                    var toDB={};
                    toDB[entry]=cipher;
                    chrome.storage.sync.set(toDB);
                    callback({Success:true})
                });
            });
        }
        else{
            callback({Success:false,Info:"Invalid master password",code:1})
        }
    });
}

function addError(element){
    element.classList.add('error');
    setTimeout(function(){ 
        element.classList.remove('error');
    }, 350);
}

function randomPass(){
    var pass = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-+_=.,?";

    for (var i = 0; i < 12; i++)
        pass += possible.charAt(Math.floor(Math.random() * possible.length));

    return pass;
}


function hexString(buffer) {
    const byteArray = new Uint8Array(buffer);
    const hexCodes = [...byteArray].map(value => {
        const hexCode = value.toString(16);
        const paddedHexCode = hexCode.padStart(2, '0');
        return paddedHexCode.toUpperCase();
    });
    return hexCodes.join('');
}

function HaveIBeenPwned(pass,callback){
    const encoder = new TextEncoder(); 
    const data = encoder.encode(pass);
    window.crypto.subtle.digest('SHA-1', data).then(digestValue => {
        hash = hexString(digestValue);
        first = hash.substring(0, 5);
        last = hash.substring(5);
        fetch('https://api.pwnedpasswords.com/range/' + first)
        .then(
        function(response) {
            if (response.status !== 200) {
            console.log('Looks like there was a problem. Status Code: ' +
                response.status);
                callback(false);
            return;
            }
        return response.text();
        })
        .then(function(text) {
        return text.split("\r\n");  
        })
        .then(function(arr){
            var flag=false;
            arr.forEach((s)=>{
                let a = s.split(":");
                if(a[0] == last) {
                    flag=true;
                    return true;
                }
            
            });
            callback(flag);
            return flag;
        
        });
    
    });
}

function spawnConfirm(message,green,red,callback){
    var overlay=document.createElement("div");
    overlay.className="overlay";
    overlay.onclick=function(){
        callback("cancel");
        overlay.parentElement.removeChild(overlay);
    };

    var alert=document.createElement("div");
    alert.className="alert container";
    alert.innerText=message;

    var greenbtn=document.createElement("button");
    greenbtn.className="inlineButton";
    greenbtn.innerText=green;
    greenbtn.onclick=function(){
        callback("green");
        this.parentElement.parentElement.parentElement.removeChild(this.parentElement.parentElement);
    };

    var redbtn=document.createElement("button");
    redbtn.className="inlineButton redButton";
    redbtn.innerText=red;
    redbtn.onclick=function(){
        callback("red");
        this.parentElement.parentElement.parentElement.removeChild(this.parentElement.parentElement);
    };
    

    var style=document.createElement("style");
    style.innerHTML="html, body{overflow: hidden;}";

    alert.appendChild(document.createElement("br"));
    alert.appendChild(document.createElement("br"));
    alert.appendChild(greenbtn);
    alert.appendChild(redbtn);
    overlay.appendChild(alert);
    overlay.appendChild(style);
    document.body.appendChild(overlay);

}