package com.yangc.webrtc.servlet;

import java.io.IOException;
import java.util.concurrent.atomic.AtomicInteger;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.lang3.StringUtils;

import com.yangc.webrtc.room.WebRTCRoomManager;

public class WebRTCRoomServlet extends HttpServlet {

	private static final long serialVersionUID = -7562539044520902910L;

	private static final String USER_PREFIX = "user";
	private static final AtomicInteger connectionIds = new AtomicInteger(1);

	@Override
	public void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		this.doPost(request, response);
	}

	@Override
	public void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		String key = request.getParameter("key");
		if (StringUtils.isBlank(key)) {
			// 如果房间为空, 则生成一个新的房间号
			key = "" + System.currentTimeMillis();
			response.sendRedirect("room?key=" + key);
		} else {
			Integer initiator = 1;
			// 第一次进入是没有人的, 所以就要等待连接, 如果第二个人进入了这个房间, 页面就会发起视频通话的连接
			if (!WebRTCRoomManager.hasUser(key)) {
				// 如果房间没有人则不发送连接的请求
				initiator = 0;
			}
			String user = USER_PREFIX + connectionIds.getAndIncrement();
			// 向房间中添加用户
			WebRTCRoomManager.addUser(key, user);
			String roomLink = request.getScheme() + "://" + request.getServerName() + ":" + request.getServerPort() + request.getContextPath() + "/room?key=" + key;
			request.setAttribute("initiator", initiator);
			request.setAttribute("roomLink", roomLink);
			request.setAttribute("roomKey", key);
			request.setAttribute("user", user);
			request.getRequestDispatcher("index.jsp").forward(request, response);
		}
	}

}
