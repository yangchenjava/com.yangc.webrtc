package com.yangc.webrtc.websocket;

import javax.websocket.OnClose;
import javax.websocket.OnOpen;
import javax.websocket.Session;
import javax.websocket.server.PathParam;
import javax.websocket.server.ServerEndpoint;

@ServerEndpoint(value = "/websocket/{user}")
public class WebRTCAnnotation {

	private Session session;
	private String user;

	@OnOpen
	public void onOpen(Session session, @PathParam("user") String user) {
		this.session = session;
		this.user = user;
		// 触发连接事件, 在连接池中添加连接
		WebRTCConnectionPool.addConnection(this);
	}

	@OnClose
	public void onClose() {
		// 触发关闭事件, 在连接池中移除连接
		WebRTCConnectionPool.removeConnection(this);
		// try {
		// this.session.close();
		// } catch (IOException e) {
		// e.printStackTrace();
		// }
	}

	public Session getSession() {
		return session;
	}

	public String getUser() {
		return user;
	}

}
