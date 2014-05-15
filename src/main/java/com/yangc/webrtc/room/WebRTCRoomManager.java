package com.yangc.webrtc.room;

import java.util.HashMap;
import java.util.Map;

import com.yangc.webrtc.bean.Room;

public class WebRTCRoomManager {

	private static final Map<String, Room> rooms = new HashMap<String, Room>();

	public static void addUser(String key, String user) {
		System.out.println("addUser - key=" + key + ", user=" + user);
		Room room = rooms.get(key);
		if (room == null) {
			room = new Room();
			room.addUser(user);
			rooms.put(key, room);
		} else {
			room.addUser(user);
		}
	}

	public static void removeUser(String key, String user) {
		System.out.println("removeUser - key=" + key + ", user=" + user);
		Room room = rooms.get(key);
		if (room != null) {
			room.removeUser(user);
		}
		if (room != null && !room.hasUser()) {
			rooms.remove(key);
		}
	}

	public static boolean hasUser(String key) {
		System.out.println("hasUser - key=" + key);
		Room room = rooms.get(key);
		if (room != null) {
			return room.hasUser();
		}
		return false;
	}

	public static String getOtherUser(String key, String user) {
		System.out.println("getOtherUser - key=" + key + ", user=" + user);
		Room room = rooms.get(key);
		if (room != null) {
			return room.getOtherUser(user);
		}
		return null;
	}

}
