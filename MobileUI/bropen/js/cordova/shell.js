/**
 * 设备信息
 */
var mdevice = {
	/** 是否是通过客户端访问 */
	isShell: (navigator.userAgent.indexOf("BroMobileShell") > 0),
	/**
	 * native callback: 接收推送消息
	 * @param message
	 */
	notify: function( message ) {
		console.log( "notification: " + message );
	},
	
	/**
	 * inative callback for iOS: 设置消息推送的设备ID
	 * @param deviceId
	 */
	setDeviceId : function( deviceId ) {
		alert("setDeviceId: " + deviceId);
		this.deviceId = deviceId;
	},
	/**
	 * native callback for iOS: 设备的www文件夹位置
	 * @param localURI
	 */
	setLocalURI : function( localURI ) {
		//alert("setLocalURI: " + localURI);
		this.localURI = localURI;
	},
	/**
	 * native api: 获取消息推送的设备ID
	 */
	getDeviceId : function() {
		if ( this.isShell ) {
			// TODO 尝试从URL中取
			return this.deviceId || android.getDeviceId();
		} else {
			return null;
		}
	},
	/**
	 * native api：获取设备的www文件夹位置
	 */
	getLocalURI : function() {
		if ( this.isShell ) {
			return this.localURI || android.getLocalURI();
		} else {
			return null;
		}
	},
	/**
	 * 获得客户端的 userAgent
	 */
	getUserAgent : function() {
		return navigator.userAgent;
	},
	/**
	 * 获得BroMobileShell的版本号
	 */
	getShellVersion : function() {
		if ( this.isShell ) {
			return this.getUserAgent().replace( /^.+BroMobileShell\/([^ ]+).*$/, "$1" );
		} else return undefined;
	},
	/**
	 * 获得平台名称：android/ios
	 */
	getPlatform : function() {
		var ua = navigator.userAgent;
		if ( ua.indexOf("Android") > -1 ) {
			return "android";
		} else if ( ua.indexOf("iPhone") > -1 ) {
			return "ios";
		} else {
			return null;
		}
	}
};

/**
 * 如果是客户端，则自动加载平台自适应的 cordova.js
 */
if ( mdevice.isShell && mdevice.getPlatform() ) {
	var shelljs = document.getElementById("bro-mobile-shell");
	if ( shelljs ) {
		var cordovajs = shelljs.getAttribute("cordova");
		if ( cordovajs ) {
			if ( cordovajs.lastIndexOf("/") == cordovajs.length - 1 )
				cordovajs = cordovajs.substring(0, cordovajs.length - 1);
			var m = document.createElement("script");
			m.src = cordovajs + "/" + mdevice.getPlatform() + "/cordova.js" + (window.assets ? ("?"+assets.ver) : "");
			document.head.appendChild(m);
		}
	}
}

/**
 * 如果是安卓：监听 backbutton 的事件，连续两次按下Android退回键时退出程序
if ( navigator.userAgent.indexOf("Android") > 0 ) {
	backbuttonexit(true);
	
	function backbuttonexit( register ) {
		if ( !register ) {
			document.removeEventListener("backbutton", _backbuttonexitEvent, false);
		} else {
			// 设备ready后，监听退回键事件
			document.addEventListener("deviceready", function() {
				document.addEventListener("backbutton", _backbuttonexitEvent, false);
			}, false);
		}
	}

	// 记录按下第一次退回键的时间
	var _backbuttonexitEventBeginTime = null;
	
	// 事件：连续两次按下Android退回键时，退出程序
	function _backbuttonexitEvent() {
		var duration = 2000;
		// 第二次
		if ( _backbuttonexitEventBeginTime ) {
			var now = new Date().getTime();
			if ( now - _backbuttonexitEventBeginTime < duration ) {
				return navigator.app.exitApp();
			}
			_backbuttonexitEventBeginTime = null;
		}
		// 第一次
		if ( !_backbuttonexitEventBeginTime ) {
			_backbuttonexitEventBeginTime = new Date().getTime();
			// 创建一个提示框
			var m = document.createElement('div');
			m.innerHTML = "再按一次退出程序";
			m.style.cssText = "width:60%; min-width:150px; background:#000; opacity:0.8; height:40px; color:#fff; line-height:40px; "
					+ "text-align:center; border-radius:5px; position:fixed; top:84%; left:20%; z-index:999999; font-weight:bold;";
			document.body.appendChild(m);
			// 等待、添加特效、删除提示框
			setTimeout(function() {
				var d = 0.5;
				m.style.webkitTransition = '-webkit-transform ' + d
						+ 's ease-in, opacity ' + d + 's ease-in';
				m.style.opacity = '0';
				setTimeout(function() {
					document.body.removeChild(m);
				}, d * 1000);
			}, duration);
		}
	}
}
 */