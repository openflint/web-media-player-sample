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
function hasClass(obj, cls) {
    return obj.className.match(new RegExp('(\\s|^)' + cls + '(\\s|$)'));
  }
function addClass(ele,cls) { 
    ele.className += " "+cls; 
} 
function removeClass(ele,cls) { 
    ele.className = ele.className.replaceAll(cls,"");
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

var Protocol = function(){
    self = this;
    self.proto_senderconnected = {
        "type": "senderconnected",
        "requestId": "requestId-1",
        "data": '{"userAgent": "ios.xxx"}'
    };

    self.proto_load = {
        "requestId": "requestId-2",
        "data": '{"type": "LOAD","media": {"contentId": "##contentId##","contentType": "video/mp4","metadata": {"title": "##title##","subtitle": "##subtitle##"}}}'
    };
    
    self.proto_volumechange = {
        "requestId": "requestId-3",
        "data": '{"type": "SET_VOLUME","volume":{"level":0.3},"muted": false}'
    };

    self.proto_pause = {
        "requestId": "requestId-4",
        "data": '{"type": "PAUSE"}'
    };

    self.proto_play = {
        "requestId": "requestId-5",
        "data": '{"type": "PLAY"}'
    };

    self.proto_seek = {
        "requestId": "requestId-6",
        "data": '{"type": "SEEK","currentTime":360}'
    };

    self.proto_ping = {
        "requestId": "requestId-6",
        "data": '{"type": "PING"}'
    };

    self.proto_getstatus = {
        "requestId": "requestId-6",
        "data": '{"type": "GET_STATUS"}'
    };
};

window.onload = function(){
    console.info("-------------------------------on load....--------------------------");
    window.windowWidth = document.body.offsetWidth;
    window.windowHeight = window.innerHeight;
    var eleFilms = document.getElementById("films"),
        eleFdetail = document.getElementById("film-detail"),
        eleFdetailBack = document.getElementById("film-detail-bg"),
        eleFilmPix = document.getElementById("film-pix"),
        eleFilmTitle = document.getElementById("film-title"),
        eleTempFitem = document.getElementById("temp-fitem").innerHTML,
        eleCloseBtn = document.getElementById("close-btn"),
        eleplayBtn = document.getElementById("play-btn"),
        eleOpenBtn = document.getElementById("open-btn"),
        
        eleToolbar = document.getElementById("toolbar"),
        eleToolbarBack = document.getElementById("toolbar-bg"),
        eleDongleIpInput = document.getElementById("dongle-ip-input"),
        eleInputareaBack = document.getElementById("inputarea-bg"),
        eleInputarea = document.getElementById("inputarea"),

        eleTimeCurrent = document.getElementById("time-current"),
        eleTimeTotal = document.getElementById("time-total"),
        isshowFilmdetail = false,

        // none / reday
        receiverStatus = "none",

        // PLAYING/IDLE/PAUSED/BUFFERING/
        videoStatus = null,

        videoTimeTotal = 0,
        videoTimeCurrent = 0;

    var videoUrl = "",
        videoTitle = "",
        videoSubtitle = "",
        videoCurrUrl = "";

    var channel = null;

    //page view init
    function setView(){
        var w = Math.floor(window.windowWidth/240)*240;
        eleFilms.style.width = w + "px";
        eleFdetail.style.width = eleFdetailBack.style.width = window.windowWidth + "px";
    }

    //show film poster
    function showFilmDetail(){
        if(isshowFilmdetail && receiverStatus!="none"){
            eleFdetail.className = "film-detail";
            eleFdetailBack.className = "film-detail-bg";
            eleFdetail.style.marginLeft = ((window.windowWidth-eleFdetail.offsetWidth)/2) + "px";
            eleFdetail.style.marginTop = "0px";

            eleToolbar.className = "tool";
            eleToolbarBack.className = "tool bg";
        }
    }
    function hideFilmDetail(){
        eleFdetail.className = "film-detail hide";
        eleFdetailBack.className = "film-detail-bg hide";

        eleToolbar.className = "tool hide";
        eleToolbarBack.className = "tool bg hide";
    }

    eleCloseBtn.onclick = function(e){
        hideFilmDetail();
        e.preventDefault();
    };

    setView();

    //match device direction
    window.matchMedia("(orientation: portrait)").addListener(function(e) { 
        window.windowHeight =  (
            'innerHeight' in window? window.innerHeight :
            document.compatMode!=='BackCompat'? document.documentElement.clientHeight :
            document.body.clientHeight);
        window.windowWidth = document.body.offsetWidth;
        setView();
        showFilmDetail();
    });

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
                showFilmDetail();

                videoUrl = sVideoUrl;
                videoTitle = title;
                videoSubtitle = title;

                if(videoCurrUrl!=""){
                    if(videoCurrUrl!=videoUrl){
                        eleplayBtn.innerHTML = "Play";
                    }else{
                        eleplayBtn.innerHTML = "Play";
                        if(videoStatus=="PLAYING"){
                            eleplayBtn.innerHTML = "Pause";
                        }
                    }
                }else{
                    eleplayBtn.innerHTML = "Play";
                }
            };
        }
    });
    
    function playingTimer(){
        if(videoStatus=="PLAYING"){
            videoTimeCurrent +=1;
            eleTimeCurrent.innerHTML = timeformat(videoTimeCurrent);
            if(typeof(window.playingTimerId)!="undefined"){
                clearTimeout(window.playingTimerId);
            }
            window.playingTimerId = window.setTimeout(function(){
                playingTimer();
            }, 1000);
        }
    };
    function communicate(){
        window.senderDaemon.on("appopened", function(messageChannel){
            receiverStatus = "ready";
            eleInputarea.style.display = "none";
            eleInputareaBack.style.display = "none";

            channel = messageChannel;
            console.info("---------onopend----->",channel);
            channel.on("message", function(jsonObject){
                if("data" in jsonObject){
                    var data = JSON.parse(jsonObject["data"]);
                    console.info("------------------------------------------------>jsonObject data: ", data);

                    if(data["type"]=="MEDIA_STATUS"){
                        videoStatus = data["status"][0]["playerState"];

                        videoTimeTotal = data["status"][0]["duration"];
                        videoTimeCurrent = data["status"][0]["currentTime"];

                        if(videoTimeTotal){
                            eleTimeTotal.innerHTML = timeformat(videoTimeTotal);
                        }
                        if(videoTimeCurrent){
                            eleTimeCurrent.innerHTML = timeformat(videoTimeCurrent);
                        }

                        if(videoStatus=="PLAYING"){
                            eleplayBtn.innerHTML = "Pause";
                            playingTimer();
                        }else{
                            eleplayBtn.innerHTML = "Play";
                        }
                    }
                }
            });
        });
    }
    /////////////////set dongle ip & open receiver app/////////////////
    eleDongleIpInput.focus();
    function openApp(){
        console.info("-------------------------------openApp--------------------------");
        if(eleDongleIpInput.value!=""){
            var patrn =/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
            if(!patrn.exec(eleDongleIpInput.value) ){ 
                showAlert("IP address error");
                return;
            }
            // I can not get CROS error. so you must confirmed the ip address right
            var deviceIp = eleDongleIpInput.value;
            window.senderDaemon = new SenderDaemon(deviceIp);            
            communicate();
            window.senderDaemon.openApp(appUrl, -1, true);
            return;
        }else{
            showAlert("IP address error");
        }
    }
    eleDongleIpInput.onkeyup = function(e){
        if(e.keyCode==13){
            openApp();
        }
    };
    eleOpenBtn.onclick = function(e){
        openApp();
    };
    hideAlert();

    eleplayBtn.onclick =function(){
        // PLAYING/IDLE/PAUSED/BUFFERING/
        // videoStatus = null,
        if(channel!=null){
            if(videoCurrUrl==""||videoCurrUrl!=videoUrl){
                eleplayBtn.innerHTML = "Play";

                videoCurrUrl = videoUrl;
                var protoLoad = new Protocol().proto_load;
                protoLoad["data"] = protoLoad["data"].replaceAll("##contentId##",videoUrl)
                    .replaceAll("##title##",videoTitle)
                    .replaceAll("##subtitle##",videoSubtitle);
                console.info("--------------------------------> LOADDING");
                channel.send(JSON.stringify(protoLoad));

            }else if(videoStatus!="PLAYING"){
                eleplayBtn.innerHTML = "Play";
                console.info("---------------------------------> play");
                channel.send(JSON.stringify(new Protocol().proto_play));

            }else{
                eleplayBtn.innerHTML = "Pause";
                console.info("---------------------------------> pause");
                channel.send(JSON.stringify(new Protocol().proto_pause));
            }
        }
    }
};