package com.yangc.webrtc.websocket;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

public class WebRTCConnectionPool {

	private static final Map<String, WebRTCAnnotation> connections = new HashMap<String, WebRTCAnnotation>();

	public static void addConnection(WebRTCAnnotation connection) {
		// 添加连接
		System.out.println("user: " + connection.getUser() + " join..");
		connections.put(connection.getUser(), connection);
	}

	public static void removeConnection(WebRTCAnnotation connection) {
		// 移除连接
		System.out.println("user: " + connection.getUser() + " exit..");
		connections.remove(connection.getUser());
	}

	public static void sendMessage(String user, String message) {
		// 向特定的用户发送数据
		System.out.println("send message to user: " + user + ", message content: " + message);
		WebRTCAnnotation connection = connections.get(user);
		if (connection == null) return;
		try {
			connection.getSession().getBasicRemote().sendText(message);
		} catch (IOException e) {
			connections.remove(user);
			try {
				connection.getSession().close();
			} catch (IOException e1) {
				e1.printStackTrace();
			}
		}
	}

}
