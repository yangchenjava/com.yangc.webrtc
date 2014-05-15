package com.yangc.webrtc.bean;

import org.apache.commons.lang.StringUtils;

public class Room {

	private String user_1;
	private String user_2;

	public void addUser(String user) {
		if (StringUtils.isBlank(user_1)) {
			this.user_1 = user;
		} else if (StringUtils.isBlank(user_2)) {
			this.user_2 = user;
		}
	}

	public void removeUser(String user) {
		if (StringUtils.isNotBlank(user_1) && user_1.equals(user)) {
			this.user_1 = null;
		} else if (StringUtils.isNotBlank(user_2) && user_2.equals(user)) {
			this.user_2 = null;
		}
	}

	public boolean hasUser() {
		return StringUtils.isNotBlank(user_1) || StringUtils.isNotBlank(user_2);
	}

	public String getOtherUser(String user) {
		if (StringUtils.isNotBlank(user_1) && user_1.equals(user)) {
			return this.user_2;
		} else {
			return this.user_1;
		}
	}

}
