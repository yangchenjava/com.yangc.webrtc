package com.yangc.webrtc.servlet;

import java.io.BufferedReader;
import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.lang3.StringUtils;

import com.yangc.utils.json.JsonUtils;
import com.yangc.webrtc.bean.Message;
import com.yangc.webrtc.room.WebRTCRoomManager;
import com.yangc.webrtc.websocket.WebRTCConnectionPool;

public class WebRTCMessageServlet extends HttpServlet {

	private static final long serialVersionUID = -7562539044520902910L;

	@Override
	public void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		this.doPost(request, response);
	}

	@Override
	public void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		String key = request.getParameter("key"); // 房间号
		String user = request.getParameter("user"); // 一端通话人
		String otherUser = WebRTCRoomManager.getOtherUser(key, user); // 另一端通话人
		BufferedReader reader = request.getReader();
		String content = null;
		StringBuilder sb = new StringBuilder();
		while ((content = reader.readLine()) != null) {
			// 获取输入流，主要是视频定位的信息
			sb.append(content);
		}
		String message = sb.toString();

		String type = JsonUtils.fromJson(message, Message.class).getType();
		// 客户端退出视频聊天
		if (StringUtils.isNotBlank(type) && type.equals("bye")) {
			WebRTCRoomManager.removeUser(key, user);
		}
		if (StringUtils.isNotBlank(otherUser)) {
			if (user.equals(otherUser)) {
				message = message.replace("\"offer\"", "\"answer\"");
				message = message.replace("a=crypto:0 AES_CM_128_HMAC_SHA1_32", "a=xrypto:0 AES_CM_128_HMAC_SHA1_32");
				message = message.replace("a=ice-options:google-ice\\r\\n", "");
			}
			// 向对方发送连接数据
			WebRTCConnectionPool.sendMessage(otherUser, message);
		}
	}

}
