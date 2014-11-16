"use strict"
var sCastVideoUrl = "http://fling.matchstick.tv/droidream/samples/vlist.json",
    sVideoBase = "http://fling.matchstick.tv/droidream/samples/",
    appUrl = "http://openflint.github.io/flint-player/player.html";

if (typeof String.prototype.replaceAll != 'function') {
    String.prototype.replaceAll = function (AFindText,ARepText){
        var raRegExp = new RegExp(AFindText,"g");
        return this.replace(raRegExp,ARepText);
    }
}

function getElementsByClass(searchClass, tagName) { 
    var domNode = document;
    if (tagName == null){
        tagName = '*';   
    }
    var el = new Array();
    var tags = domNode.getElementsByTagName(tagName);
    var tcl = " "+searchClass+" ";
    for(var i=0,j=0; i<tags.length; i++) { 
        var test = " " + tags[i].className + " ";
        if (test.indexOf(tcl) != -1){
            el[j++] = tags[i];
        }
    } 
    return el;
};

// httpRequest
function httpRequest(method, url, headers, callback){
    var xhr = new XMLHttpRequest({mozSystem: true});
    xhr.open(method, url, true);
    if(headers){
        for (var i = headers.length - 1; i >= 0; i--) {
            xhr.setRequestHeader(headers[i][0], headers[i][1]);
        }
    }
    xhr.onreadystatechange = function() {
        if(xhr.readyState==4 && xhr.status==200){
            if(callback){
                callback(xhr.responseText);
            }
        }
    }
    xhr.send();
}

function showAlert(msg){
    var errbox = document.getElementById("error"),
        bg = document.getElementById("error-bg"),
        msgbox = document.getElementById("error-content"),
        text = document.getElementById("error-text");
    text.innerHTML = msg;
    msgbox.style.left = (window.windowWidth-250)/2+"px";
    msgbox.style.top = (window.windowHeight-50)/2+"px";

    errbox.style.display = "block";
}
function hideAlert(){
    var bg = document.getElementById("error-bg"),
        errbox = document.getElementById("error"),
        text = document.getElementById("error-text");
    errbox.onclick = function(){
        text.innerHTML = "";
        errbox.style.display = "none";
    };
    bg.onclick = function(){
        text.innerHTML = "";
        errbox.style.display = "none";
    };
}

function timeformat(sec) {
    var hours = Math.floor(sec / 3600);
    var minutes = Math.floor((sec - (hours * 3600)) / 60);
    var seconds = parseInt(sec - (hours * 3600) - (minutes * 60));
    if (hours < 10) {
        hours = "0" + hours;
    }
    if (minutes < 10) {
        minutes = "0" + minutes;
    }
    if (seconds < 10) {
        seconds = "0" + seconds;
    }
    var time = hours + ':' + minutes + ':' + seconds;
    return time;
}

var videoUrl = "",
    videoTitle = "",
    videoSubtitle = "",
    videoCurrUrl = "",
    // none / ready
    receiverStatus = "none",
    // PLAYING/IDLE/PAUSED/BUFFERING/
    videoStatus = null,
    videoTimeTotal = 0,
    videoTimeCurrent = 0;

window.appManager = null;
window.windowWidth = document.body.offsetWidth;
window.windowHeight = window.innerHeight;

var AppManager = function(appid){
    var self = this;
    var senderDaemon = null,
        msgChannel = null;

    var eleOpenBtn = document.getElementById("open-btn"),
        eleDongleIpInput = document.getElementById("dongle-ip-input"),
        eleInputareaBack = document.getElementById("inputarea-bg"),
        eleInputarea = document.getElementById("inputarea"),
        eleCloseAppBtn = document.getElementById("close-app-btn");

    self.send = function(data){
        if(msgChannel){
            msgChannel.send(data);            
        }
    };
    self.openApp = function(){
        if(eleDongleIpInput.value!=""){
            var patrn =/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
            if(!patrn.exec(eleDongleIpInput.value) ){ 
                showAlert("IP address error");
                return;
            }
            // I can not get CROS error. So you must confirmed the ip address right
            var deviceIp = eleDongleIpInput.value;
            senderDaemon = new SenderDaemon(deviceIp, appid);
            senderDaemon.on("appopened", function(messageChannel){
                console.info("------------------------->opened..............");
                receiverStatus = "ready";
                eleInputarea.style.display = "none";
                eleInputareaBack.style.display = "none";

                ("onappopened" in self)&&(self.onappopened());
                msgChannel = messageChannel;
                msgChannel.on("message", function(jsonObject){
                    if("payload" in jsonObject){
                        ("onmessage" in self)&&(self.onmessage(jsonObject.payload));
                    }
                });
                eleCloseAppBtn.className = "close-app-btn";
            });

            senderDaemon.openApp(appUrl, -1, true);
            return;
        }else{
            showAlert("IP address error");
        }
    };

    self.closeApp = function(){
        senderDaemon.closeApp();
    };

    self.on = function(type, func){
        self["on"+type] = func;
    }

    eleOpenBtn.onclick = function(e){
        self.openApp();
    };
    eleDongleIpInput.onkeyup = function(e){
        if(e.keyCode==13){
            self.openApp();
        }
    };
    eleDongleIpInput.focus();

    eleCloseAppBtn.onclick = function(){
        self.closeApp();
        eleCloseAppBtn.className = "close-app-btn hide";
        setTimeout(function(){
            window.location.reload();
        },1000);
    };
    hideAlert();
}

var Protocol = function(){
    var self = this;
    self.proto_load = {
        "namespace": "urn:flint:org.openflint.fling.media",
        "payload": '{"type": "LOAD", "seq": "requestId-2", "media": {"contentId": "##contentId##","contentType": "video/mp4","metadata": {"title": "##title##","subtitle": "##subtitle##"}}}'
    };

    self.proto_pause = {
        "namespace": "urn:flint:org.openflint.fling.media",
        "payload": '{"type": "PAUSE", "seq": "requestId-4"}'
    };

    self.proto_play = {
        "namespace": "urn:flint:org.openflint.fling.media",
        "payload": '{"type": "PLAY", "seq": "requestId-5"}'
    };
};

var PlayerControl = function(){
    var self = this;
    var eleTimeCurrent = document.getElementById("time-current"),
        eleTimeTotal = document.getElementById("time-total"),
        eleplayBtn = document.getElementById("play-btn");

    eleplayBtn.onclick =function(){
        // PLAYING/IDLE/PAUSED/BUFFERING/
        
        if(videoCurrUrl==""||videoCurrUrl!=videoUrl){
            eleplayBtn.innerHTML = "Play";

            videoCurrUrl = videoUrl;
            var protoLoad = new Protocol().proto_load;
            protoLoad["payload"] = protoLoad["payload"].replaceAll("##contentId##",videoUrl)
                .replaceAll("##title##",videoTitle)
                .replaceAll("##subtitle##",videoSubtitle);
            console.info("--------------------------------> LOADDING");
            window.appManager.send(JSON.stringify(protoLoad));

        }else if(videoStatus!="PLAYING"){
            eleplayBtn.innerHTML = "Play";
            console.info("---------------------------------> play");
            window.appManager.send(JSON.stringify(new Protocol().proto_play));

        }else{
            eleplayBtn.innerHTML = "Pause";
            console.info("---------------------------------> pause");
            window.appManager.send(JSON.stringify(new Protocol().proto_pause));
        }
    };

    self.setCurrentTimeData = function(videoTimeCurrent){
        eleTimeCurrent.innerHTML = timeformat(videoTimeCurrent);
    };

    self.setTotalTimeData = function(videoTimeTotal){
        eleTimeTotal.innerHTML = timeformat(videoTimeTotal);
    };

    self.setPlayerButtonStatus = function(videoStatus){
        if(videoStatus=="PLAYING"){
            eleplayBtn.innerHTML = "Pause";
            self.playingTimer();
        }else if(videoStatus=="NEW_VIEWO"){
            eleplayBtn.innerHTML = "Play";
        }else{
            eleplayBtn.innerHTML = "Play";
        }
    };

    self.playingTimerLock = false;
    self.playingTimer = function(){
        if(videoStatus=="PLAYING"&& !self.playingTimerLock){
            self.playingTimerLock = true;
            videoTimeCurrent +=1;
            self.setCurrentTimeData(videoTimeCurrent);
            if(typeof(window.playingTimerId)!="undefined"){
                clearTimeout(window.playingTimerId);
            }
            window.playingTimerId = window.setTimeout(function(){
                self.playingTimerLock = false;
                self.playingTimer();
            }, 1000);
        }
    };
};
var playerControl = new PlayerControl();

var PageView = function(){
    var self = this;
    var eleFilms = document.getElementById("films"),
        eleFdetail = document.getElementById("film-detail"),
        eleFdetailBack = document.getElementById("film-detail-bg"),
        eleToolbar = document.getElementById("toolbar"),
        eleToolbarBack = document.getElementById("toolbar-bg"),
        eleFilmPix = document.getElementById("film-pix"),
        eleFilmTitle = document.getElementById("film-title"),

        eleCloseBtn = document.getElementById("close-btn"),
        eleTempFitem = document.getElementById("temp-fitem").innerHTML,

        isshowFilmdetail = false;
    
    self.viewInit = function(){
        var w = Math.floor(window.windowWidth/240)*240;
        eleFilms.style.width = w + "px";
        eleFdetail.style.width = eleFdetailBack.style.width = window.windowWidth + "px";
    };

    //show film poster
    self.showFilmDetail = function(){
        if(isshowFilmdetail && receiverStatus!="none"){
            eleFdetail.className = "film-detail";
            eleFdetailBack.className = "film-detail-bg";
            eleFdetail.style.marginLeft = ((window.windowWidth-eleFdetail.offsetWidth)/2) + "px";
            eleFdetail.style.marginTop = "0px";

            eleToolbar.className = "tool";
            eleToolbarBack.className = "tool bg";
        }
    };
    self.hideFilmDetail = function(){
        eleFdetail.className = "film-detail hide";
        eleFdetailBack.className = "film-detail-bg hide";

        eleToolbar.className = "tool hide";
        eleToolbarBack.className = "tool bg hide";
    };

    self.dataSourceLoad = function(){
        //get video list from cast video api
        httpRequest("GET", sCastVideoUrl, null, function(resp){
            var o = JSON.parse(resp);
            var videos = o.categories[0].videos;
            var html = "";
            for(var i=0; i<videos.length;i++){
                var img = sVideoBase+videos[i]["image-480x270"],
                    title = videos[i]["title"],
                    url = sVideoBase+videos[i]["sources"][0];
                var s = eleTempFitem.replaceAll("##title##", title)
                            .replaceAll("##img##", img)
                            .replaceAll("##url##", url)
                            .replaceAll("##class##", "fitem");
                html += s;
            }
            eleFilms.innerHTML = html;

            var fitems = getElementsByClass("fitem", "div");
            for(var i =0; i < fitems.length; i++){
                fitems[i].onclick = function(e){
                    var img = this.getAttribute("img"),
                        title = this.getAttribute("title"),
                        sVideoUrl = this.getAttribute("url");

                    eleFilmPix.setAttribute("src", img);
                    eleFilmPix.style.maxHeight = window.windowHeight + "px";
                    eleFilmPix.style.maxWidth = document.body.clientWidth + "px";
                    eleFilmTitle.innerHTML = title;
                    isshowFilmdetail = true;
                    self.showFilmDetail();

                    videoUrl = sVideoUrl;
                    videoTitle = title;
                    videoSubtitle = title;

                    if(videoCurrUrl!=""){
                        if(videoCurrUrl!=videoUrl){
                            playerControl.setPlayerButtonStatus("NEW_VIEWO");
                        }else{
                            if(videoStatus=="PLAYING"){
                                playerControl.setPlayerButtonStatus("PLAYING");
                            }else{
                                playerControl.setPlayerButtonStatus("NEW_VIEWO");
                            }
                        }
                        self.setPlayerButtonStatus();
                    }else{
                        playerControl.setPlayerButtonStatus("NEW_VIEWO");
                    }
                };
            }
        });
    };
    self.dataSourceLoad();
    eleCloseBtn.onclick = function(e){
        self.hideFilmDetail();
        e.preventDefault();
    };
};
var pageView = new PageView();

window.onload = function(){
    console.info("-------------------------------on load....--------------------------");
    pageView.viewInit();

    window.appManager = new AppManager("~flintplayer");
    window.appManager.on("appopened", function(){
        receiverStatus = "ready";
    });
    window.appManager.on("message", function(msg){
        console.info("window.appManager.on message--------------------------->msg data: ", msg)
        var data = JSON.parse(msg);

        if(data["type"]=="MEDIA_STATUS"){
            videoStatus = data["status"][0]["playerState"];

            videoTimeTotal = data["status"][0]["duration"];
            videoTimeCurrent = data["status"][0]["currentTime"];

            if(videoTimeTotal){
                playerControl.setTotalTimeData(videoTimeTotal);
            }
            if(videoTimeCurrent){
                playerControl.setCurrentTimeData(videoTimeCurrent);
            }
            if(videoStatus=="PLAYING"){
                playerControl.playingTimerLock = false;
                playerControl.playingTimer();
            }
            playerControl.setPlayerButtonStatus(videoStatus);
        }
    });

    //match device direction
    window.matchMedia("(orientation: portrait)").addListener(function(e) { 
        window.windowHeight =  (
            'innerHeight' in window? window.innerHeight :
            document.compatMode!=='BackCompat'? document.documentElement.clientHeight :
            document.body.clientHeight);
        window.windowWidth = document.body.offsetWidth;

        pageView.viewInit();
        pageView.showFilmDetail();
    });
};