Cordova文档
	http://cordova.apache.org/docs/

从官网下载、手动安装node，顺便装上npm
	http://nodejs.org/download/
	Linux Binaries -- 下载后解压，然后全部复制到 /usr 下即可，如
		tar xf ...tar.gz
		cd node-*
		rm *
		sudo cp -R * /usr/
安装ant
	sudo apt-get install ant

安装ADT、SDK
	http://developer.android.com
	解压即可，如：
		/opt/android-sdk-linux
        /opt/android-studio
启动ADT
	运行 /opt/android-sdk-linux/tools/android
	安装：
		Tools / Android SDK Tools
		Tools / Android SDK Platform-tools
		Tools / Android SDK Build-tools
		Extras / Android Support Repository
		Extras / Google Repository
		Android 5.1.1 (API 22) /
			SDK Platform
			Google APIs
		 	Google APIs Intel x86 Atom System Image
		 	（可选）Documentation for Android SDK
		 	（可选）Sources for Android SDK
		 	（可选）Samples for SDK
	由于网络原因，一般安装比较慢，可以在 Tools/Options 里设置一下代理
		地址 service.bropen.com.cn，端口 24
设置环境变量：
	vi ~/.bashrc
	PATH=$PATH:/opt/android-sdk-linux/tools/:/opt/android-sdk-linux/platform-tools/
模拟器
	Linux 下可以使用 KVM 模拟器，性能更好，详细参考
	http://developer.android.com/intl/zh-cn/tools/devices/emulator.html#vm-linux

安装cordova
	mkdir cordova_511
	cd cordova_511
	npm install cordova@5.1.1
		MacOS 和 Ubuntu 下安装的基本一样，除了少数
	如果用 root 用户安装，会安装到系统中，升级不方便
		此时安装在 /usr/local/lib/node_modules 下
	检查、安装最新版：
		https://www.npmjs.com/package/cordova
创建工程：
	./node_modules/.bin/cordova create BroMobileShell
	cd BroMobileShell
	../node_modules/.bin/cordova platform add android
	../node_modules/.bin/cordova platform add ios
	空白安卓工程：SVN 7168
	空白iOS工程：SVN 13266~13267
		提交SVN时需要根据 .gitignore 过滤掉一些资源
		platform/ios、platform/ios/HelloCordova 下，均需要过滤掉
			*.mode1v3
			*.perspectivev3
			*.pbxuser
			.DS_Store
			build

优化：
《 Cordova performance tips 》
http://taco.visualstudio.com/en-us/docs/tips-and-workarounds-performance-readme/

TODO 选择图片后，进行二维码扫码
TODO 恢复 barcode 插件中的生成二维码的界面
TODO 使用 file-transfer 插件来实现自动更新

TODO 删除 LocationUtil 等 gps 相关的代码，有插件 geolocation 就够了
TODO 重构消息推送的代码（用极光推送等），并且用插件 de.appplant.cordova.plugin.local-notification 来实现提醒（不一定，极光可能提供了）

TODO Cordova 不支持 user-scalable=yes？
