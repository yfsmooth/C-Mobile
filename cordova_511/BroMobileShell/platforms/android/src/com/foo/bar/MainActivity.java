package com.foo.bar;

import android.annotation.SuppressLint;
import android.os.Bundle;

import bropen.mobile.shell.MyR;

public class MainActivity extends bropen.mobile.shell.MainActivity {
	
	@Override
	@SuppressLint("SetJavaScriptEnabled")
	public void onCreate(Bundle savedInstanceState) {
		initMyR();
		super.onCreate(savedInstanceState);
	}
	
	/** 根据 R，初始化 MyR 中的资源定义 */
	public static void initMyR() {
		if ( MyR.inited ) return;
		
		MyR.mainActivityClazz = MainActivity.class;
		MyR.setupUrlActivityClazz = SetupUrlActivity.class;
		
		MyR.drawable.icon = R.drawable.icon;
		
		MyR.id.app_start_params = R.id.app_start_params;
		MyR.id.app_start_url = R.id.app_start_url;
		MyR.id.app_update_url = R.id.app_update_url;
		MyR.id.apply = R.id.apply;
		
		MyR.layout.setupurl = R.layout.setupurl;

		MyR.string.app_name = R.string.app_name;
		MyR.string.app_start_params = R.string.app_start_params;
		MyR.string.app_start_url = R.string.app_start_url;
		MyR.string.app_update_url = R.string.app_update_url;
		MyR.string.developmentMode = R.string.developmentMode;
		MyR.string.igexin_enable = R.string.igexin_enable;
		MyR.string.message_local_version = R.string.message_local_version;
		MyR.string.message_network = R.string.message_network;
		MyR.string.message_network_cancel = R.string.message_network_cancel;
		MyR.string.message_network_config = R.string.message_network_config;
		MyR.string.message_network_confirm = R.string.message_network_confirm;
		MyR.string.message_notification_title = R.string.message_notification_title;
		MyR.string.message_server_version = R.string.message_server_version;
		MyR.string.message_update = R.string.message_update;
		MyR.string.message_update_downloading = R.string.message_update_downloading;
		MyR.string.message_update_later = R.string.message_update_later;
		MyR.string.message_update_must = R.string.message_update_must;
		MyR.string.message_update_now = R.string.message_update_now;
		MyR.string.message_update_prompt = R.string.message_update_prompt;
		MyR.string.message_version_exception = R.string.message_version_exception;
		MyR.string.message_waiting = R.string.message_waiting;
		MyR.string.message_waiting_loading = R.string.message_waiting_loading;
	}
}
