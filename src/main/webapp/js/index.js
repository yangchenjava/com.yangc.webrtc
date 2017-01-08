var container;
var card;
var localVideo;
var miniVideo;
var remoteVideo;
var footer;

var localStream;
var remoteStream;
var channel;
var channelReady = false;
var pc;
var socket;
var initiator = ini;
var started = false;
var isRTCPeerConnection = true;
var sdpConstraints = {
	"mandatory": {
		"OfferToReceiveAudio": true,
		"OfferToReceiveVideo": true
	}
};
var isAudioMuted = false;
var isVideoMuted = false;

var channelOpenTime;
var channelCloseTime;

/**
 * 初始化(标签对象设置,一些显示的状态重置,打开websocket通道,采集本地音视频)
 */
function initialize(){
	console.log("initialize - roomKey=" + roomKey);
	container = document.getElementById("container");
	card = document.getElementById("card");
	localVideo = document.getElementById("localVideo");
	miniVideo = document.getElementById("miniVideo");
	remoteVideo = document.getElementById("remoteVideo");
	footer = document.getElementById("footer");
	resetStatus();
	openChannel();
	getUserMedia();
}

/**
 * 重置footer的状态
 */
function resetStatus(){
	if (!initiator) {
		footer.innerHTML = "让别人加入视频聊天: <a href='" + roomLink + "'>" + roomLink + "</a>";
	} else {
		footer.innerHTML = "初始化...";
	}
}

/**
 * 打开websocket通道,用于数据传输
 */
function openChannel(){
	console.log("openChannel");
	socket = new WebSocket(socketPath + "websocket/" + user);
	// 连接打开
	socket.onopen = function(){
		channelOpenTime = new Date();
		console.log("Channel open time is " + channelOpenTime.toLocaleString());
		channelReady = true;
		if (initiator) maybeStart();
	};
	// 收到消息
	socket.onmessage = function(e){
		console.log("收到信息 = " + e.data);
		if (isRTCPeerConnection) {
			// 建立视频连接
			processSignalingMessage(e.data);
		} else {
			processSignalingMessage00(e.data);
		}
	};
	// 连接关闭
	socket.onclose = function(){
		if (!channelOpenTime) {
			channelOpenTime = new Date();
		}
		channelCloseTime = new Date();
		console.log("Channel close time is " + channelCloseTime.toLocaleString() + ", keep time "
			+ ((channelCloseTime.getTime() - channelOpenTime.getTime()) / 1000) + "s");
		openChannel();
	};
	// 连接出错
	socket.onerror = function(e){
		console.log("Channel error");
	};
}

/**
 * 创建PeerConnection,往PeerConnection添加本地音视频流,呼叫
 */
function maybeStart(){
	if (!started && localStream && channelReady) {
		footer.innerHTML = "连接中...";
		console.log("Creating PeerConnection.");
		createPeerConnection();
		console.log("Adding local stream.");
		pc.addStream(localStream);
		started = true;
		// Caller initiates offer to peer.
		if (initiator) doCall();
	}
}

/**
 * 呼叫
 */
function doCall(){
	console.log("Sending offer to peer.");
	if (isRTCPeerConnection) {
		pc.createOffer(setLocalAndSendMessage, null, sdpConstraints);
	} else {
		var offer = pc.createOffer(sdpConstraints);
		pc.setLocalDescription(pc.SDP_OFFER, offer);
		sendMessage({
			type: "offer",
			sdp: offer.toSdp()
		});
		pc.startIce();
	}
}

/**
 * 应答
 */
function doAnswer(){
	console.log("Sending answer to peer.");
	if (isRTCPeerConnection) {
		pc.createAnswer(setLocalAndSendMessage, null, sdpConstraints);
	} else {
		var offer = pc.remoteDescription;
		var answer = pc.createAnswer(offer.toSdp(), sdpConstraints);
		pc.setLocalDescription(pc.SDP_ANSWER, answer);
		sendMessage({
			type: "answer",
			sdp: answer.toSdp()
		});
		pc.startIce();
	}
}

function setLocalAndSendMessage(sessionDescription){
	pc.setLocalDescription(sessionDescription);
	sendMessage(sessionDescription);
}

/**
 * 异步发消息
 */
function sendMessage(message){
	var msgString = JSON.stringify(message);
	console.log("发出信息: " + msgString);
	var path = basePath + "message?key=" + roomKey + "&user=" + user;
	var xhr = new XMLHttpRequest();
	xhr.open("POST", path, true);
	xhr.send(msgString);
}

/**
 * 创建PeerConnection,设置回调
 */
function createPeerConnection(){
	var pc_config = {
		"iceServers": [
		    {"url": "stun:stun.l.google.com:19302"}
		]
	};
	try {
		pc = new webkitRTCPeerConnection(pc_config);
		pc.onicecandidate = function(event){
			if (event.candidate) {
				sendMessage({
					type: "candidate",
					label: event.candidate.sdpMLineIndex,
					id: event.candidate.sdpMid,
					candidate: event.candidate.candidate
				});
		    } else {
		      console.log("End of candidates.");
		    }
		};
		console.log("Created webkitRTCPeerConnnection with config \"" + JSON.stringify(pc_config) + "\".");
	} catch (e) {
		try {
			var stun_server = "";
			if (pc_config.iceServers.length !== 0) {
				stun_server = pc_config.iceServers[0].url.replace("stun:", "STUN ");
			}
			pc = new webkitPeerConnection00(stun_server, function(candidate, moreToFollow){
				if (candidate) {
					sendMessage({
						type: "candidate",
						label : candidate.label,
						candidate : candidate.toSdp()
					});
				}

				if (!moreToFollow) {
					console.log("End of candidates.");
				}
			});
			isRTCPeerConnection = false;
			console.log("Created webkitPeerConnnection00 with config \"" + stun_server + "\".");
		} catch (e) {
			console.log("Failed to create PeerConnection, exception: " + e.message);
			alert("Cannot create PeerConnection object; WebRTC is not supported by this browser.");
			return;
		}
	}

	pc.onconnecting = function(message){
		console.log("Session connecting.");
	};
	pc.onopen = function(message){
		console.log("Session opened.");
	};
	pc.onaddstream = function(event){
		console.log("Remote stream added.");
		var url = webkitURL.createObjectURL(event.stream);
		miniVideo.src = localVideo.src;
		remoteVideo.src = url;
		remoteStream = event.stream;
		waitForRemoteVideo();
	};
	pc.onremovestream = function(event){
		console.log("Remote stream removed.");
	};
}

function waitForRemoteVideo(){
	var videoTracks = remoteStream.videoTracks;
	if (typeof(videoTracks) === "undefined" || videoTracks.length === 0 || remoteVideo.currentTime > 0) {
		transitionToActive();
	} else {
		window.setTimeout(waitForRemoteVideo, 100);
	}
}

/**
 * 处理服务器传来的消息
 */
function processSignalingMessage(message){
	var msg = JSON.parse(message);

	if (msg.type === "offer") {
		// Callee creates PeerConnection
		if (!initiator && !started) maybeStart();

		// We only know JSEP version after createPeerConnection().
		if (isRTCPeerConnection) {
			pc.setRemoteDescription(new RTCSessionDescription(msg));
		} else {
			pc.setRemoteDescription(pc.SDP_OFFER, new SessionDescription(msg.sdp));
		}
		doAnswer();
	} else if (msg.type === "answer" && started) {
		pc.setRemoteDescription(new RTCSessionDescription(msg));
	} else if (msg.type === "candidate" && started) {
		var candidate = new RTCIceCandidate({
			sdpMLineIndex: msg.label,
			candidate: msg.candidate
		});
		pc.addIceCandidate(candidate);
	} else if (msg.type === "bye" && started) {
		onRemoteHangup();
	}
}

function processSignalingMessage00(message){
	var msg = JSON.parse(message);

	// if (msg.type === 'offer') should not happen here.
	if (msg.type === "answer" && started) {
		pc.setRemoteDescription(pc.SDP_ANSWER, new SessionDescription(msg.sdp));
	} else if (msg.type === "candidate" && started) {
		var candidate = new IceCandidate(msg.label, msg.candidate);
		pc.processIceMessage(candidate);
	} else if (msg.type === "bye" && started) {
		onRemoteHangup();
	}
}

/**
 * 对方挂断
 */
function onRemoteHangup(){
	console.log("Session terminated.");
	transitionToWaiting();
	stop();
	initiator = 0;
}

/**
 * 挂断
 */
function onHangup(){
	console.log("Hanging up.");
	transitionToDone();
	stop();
	initiator = 0;
	sendMessage({
		type: "bye"
	});
}

/**
 * 断开PeerConnection
 */
function stop(){
	started = false;
	isRTCPeerConnection = true;
	isAudioMuted = false;
	isVideoMuted = false;
	pc.close();
	pc = null;
}

/**
 * 转换为通话状态
 */
function transitionToActive(){
	card.style.webkitTransform = "rotateY(180deg)";
	window.setTimeout(function(){
		localVideo.style.opacity = 0;
		localVideo.src = "";
	}, 500);
	window.setTimeout(function(){
		miniVideo.style.opacity = 1;
	}, 1000);
	remoteVideo.style.opacity = 1;
	footer.innerHTML = "<input id='hangup' type='button' value='Hang up' onclick='onHangup()' />";
}

/**
 * 转换为等待状态
 */
function transitionToWaiting(){
	card.style.webkitTransform = "rotateY(0deg)";
	window.setTimeout(function(){
		localVideo.src = miniVideo.src;
		miniVideo.src = "";
		remoteVideo.src = "";
	}, 500);
	localVideo.style.opacity = 1;
	miniVideo.style.opacity = 0;
	remoteVideo.style.opacity = 0;
	footer.innerHTML = "让别人加入视频聊天: <a href='" + roomLink + "'>" + roomLink + "</a>";
}

/**
 * 转换为挂断状态
 */
function transitionToDone(){
	card.style.webkitTransform = "rotateY(0deg)";
	window.setTimeout(function(){
		localVideo.src = miniVideo.src;
		miniVideo.src = "";
		remoteVideo.src = "";
	}, 500);
	localVideo.style.opacity = 1;
	miniVideo.style.opacity = 0;
	remoteVideo.style.opacity = 0;
	footer.innerHTML = "You have left the call. <a href='" + roomLink + "'>Click here</a> to rejoin.";
}

/**
 * 获取用户多媒体(摄像头,麦克风)
 */
function getUserMedia(){
	try {
		navigator.webkitGetUserMedia({
			"audio": true,
			"video": true
		}, onUserMediaSuccess, onUserMediaError);
		console.log("Requested access to local media with new syntax.");
	} catch (e) {
		try {
			navigator.webkitGetUserMedia("video,audio", onUserMediaSuccess, onUserMediaError);
			console.log("Requested access to local media with old syntax.");
		} catch (e) {
			alert("webkitGetUserMedia() failed. Is the MediaStream flag enabled in about flags?");
			console.log("webkitGetUserMedia failed with exception: " + e.message);
		}
	}
}

/**
 * 多媒体采集成功回调
 */
function onUserMediaSuccess(stream){
	console.log("User has granted access to local media.");
	var url = webkitURL.createObjectURL(stream);
	localVideo.style.opacity = 1;
	localVideo.src = url;
	localStream = stream;
	// Caller creates PeerConnection.
	if (initiator) maybeStart();
}

function onUserMediaError(error){
	alert("Failed to get access to local media. Error code was " + error.code + ".");
}

function enterFullScreen(){
	container.webkitRequestFullScreen();
}

window.setTimeout(initialize, 1);

// Send BYE on refreshing(or leaving) a demo page to ensure the room is cleaned for next session.
window.onbeforeunload = function(){
	sendMessage({
		type: "bye"
	});
};
