<%@ page language="java" pageEncoding="UTF-8"%>
<%
	String path = request.getContextPath();
	String basePath = request.getScheme() + "://" + request.getServerName() + ":" + request.getServerPort() + path + "/";
	String socketPath = "ws://" + request.getServerName() + ":" + request.getServerPort() + path + "/";
%>
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html>
	<head>
		<link rel="canonical" href="${roomLink}" />
		<link rel="stylesheet" type="text/css" href="<%=basePath%>css/index.css" />
		<script type="text/javascript">
	    var basePath = "<%=basePath%>", socketPath = "<%=socketPath%>";
	    var ini = ${initiator}, roomLink = "${roomLink}", roomKey = "${roomKey}", user = "${user}";
		</script>
		<script type="text/javascript" src="<%=basePath%>js/index.js"></script>
	</head>
	<body>
		<div id="container" ondblclick="enterFullScreen()">
			<div id="card">
				<div id="local">
					<video id="localVideo" autoplay="autoplay" width="100%" height="100%" />
				</div>
				<div id="remote">
					<video id="remoteVideo" autoplay="autoplay" width="100%" height="100%" />
					<div id="mini">
						<video id="miniVideo" autoplay="autoplay" width="100%" height="100%" />
					</div>
				</div>
			</div>
			<div id="footer"></div>
		</div>
	</body>
</html>
