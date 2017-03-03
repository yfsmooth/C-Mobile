/* Copyright © 2013-2014 北京博瑞开源软件有限公司版权所有。*/
package bropen.mobile.shell;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

import android.annotation.SuppressLint;
import android.annotation.TargetApi;
import android.app.AlertDialog;
import android.app.Dialog;
import android.app.ProgressDialog;
import android.content.ComponentName;
import android.content.Context;
import android.content.DialogInterface;
import android.content.SharedPreferences;
import android.content.DialogInterface.OnClickListener;
import android.content.Intent;
import android.content.pm.PackageManager.NameNotFoundException;
import android.net.ConnectivityManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.os.Message;
import android.util.Log;
import android.view.Menu;
import android.view.MenuItem;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;

import org.apache.cordova.*;
import org.apache.cordova.engine.*;
import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.client.ClientProtocolException;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.impl.client.DefaultHttpClient;

//import com.igexin.slavesdk.MessageManager;

/**
 * webview加载主界面
 */
public class MainActivity extends CordovaActivity {

	/** activity 状态：Active(有焦点在前台)、Paused(没有焦点)、Stopped(不可见)、Inactive(杀掉) */
	String status = "Active";

	/** 个推的clientId，即设备的deviceId */
	String clientId = null;

	/** 是否已加载首页 */
	boolean loaded = false;

	/** 首页URL地址 */
	static public String startUrl = null;
	/** 服务器检测版本更新文件夹URL地址 */
	static public String updateUrl = null;
	/** 首页URL参数 */
	static public String startParams = null;
	/** 是否开发模式 */
	static public boolean isDevelopmentMode = false;

	// 应用更新
	private String serverVersionName = null; // 新版本名称
	private String updateApk = null; // 服务器新apk名称
	private Long fileSize = 1l; // 文件大小
	private int downLoadFileSize; // 下载进度
	private ProgressDialog pd = null; // 下载进度的界面
	private String downloadApkFilePath = null; // 本地下载APK路径

	//private ProgressDialog spinnerDialog; // 加载等待界面

	private boolean isMustUpdate = false; // 是否必须更新
	private boolean isDownloadingApk = false; // 是否正在下载apk
	private boolean updateThreadFinished = false; // 检查更新线程是否结束
	private boolean clientIdThreadFinished = false; // 检查clientId线程是否结束
	private long lastCheckUpdateTime = 0; // 上一次检测更新时间

	// 位置服务
	private LocationUtil locationUtil = null;

	@SuppressLint("SetJavaScriptEnabled")
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);

		// 如果是开发模式，并且 startUrl 为空，则先显示配置界面
		isDevelopmentMode = "true".equals(this.getString(MyR.string.developmentMode));
		if ( isDevelopmentMode ) {
			if ( startUrl == null ) {
				Intent mainIntent = new Intent(this, MyR.setupUrlActivityClazz);
				this.startActivity(mainIntent);
				this.finish();
				return;
			}
		} else {
			startUrl = this.getString(MyR.string.app_start_url);
			updateUrl = this.getString(MyR.string.app_update_url);
			startParams = this.getString(MyR.string.app_start_params);
		}

		super.init();
		appView.postMessage("splashscreen", "show");	// 调用Splash Screen插件，显示启动界面
		MessageReceiver.activity = this;
		// 检查是否开启网络连接：本地首页不检查
		Log.d("BMS", "startUrl = " + startUrl);
		if ( startUrl.startsWith("file://") || checkNetwork() ) {
			// 推送初始化
			boolean isMessageEnabled = "true".equals(this.getString(MyR.string.igexin_enable));
//			if (isMessageEnabled) {
//				Log.d("BMS", "initializing MessageManager.");
//				MessageManager.getInstance().initialize(this.getApplicationContext());
//			}
			// url加载超时时间
			// super.setIntegerProperty("loadUrlTimeoutValue", 60000);
			// 初始化webview设置
			initWebSettings();
			// 显示页面加载的spinner -- 用 splashscreen 代替了
			//spinnerDialog = ProgressDialog.show(this, this.getString(MyR.string.message_waiting), this.getString(MyR.string.message_waiting_loading));
			// 开启线程等待个推的clientId
			if (isMessageEnabled) {
				Log.d("BMS", "initializing clientId.");
				startClientIdThread();
			} else {
				clientIdThreadFinished = true;
			}
			// 开启线程检测更新
			startUpdateThread();
			if ( startUrl.startsWith("file://") ) updateThreadFinished = true; // 本地首页，则不强制
			// 重载CordovaWebViewClient
			//super.appView.setWebViewClient(new MyCordovaWebViewClient(this, super.appView));
			// 加载首页
			startHomepage();
		}
	}

	/**
	 * 重载CordovaWebViewClient，始终从本地加载cordova.js和插件的js文件（cordova_plugins.js除外）
	 */
	/*@Deprecated
	public class MyCordovaWebViewClient extends CordovaWebViewClient {
		public MyCordovaWebViewClient(CordovaInterface cordova, CordovaWebView view) {
			super(cordova, view);
		}

		// Android SDK 3.0 以后
		@Override
		@SuppressLint({ "shouldInterceptRequest", "NewApi" })
		public WebResourceResponse shouldInterceptRequest(WebView view, String url) {
			// 如果加载的是ios中的js则返回null
			if (url.indexOf("cordova/ios") > -1) {
				return new WebResourceResponse("text/javascript", "UTF-8", null);
			} else {
				// 测试用
				// if (url.indexOf(".js") > 0) {
				// return new WebResourceResponse("text/javascript", "UTF-8",
				// new java.io.ByteArrayInputStream(
				// "alert(11)".getBytes()));
				// }
				if (url.indexOf("cordova.js") > -1) {
					return getWebResourceResponse("www/cordova.js");
				} else if (url.indexOf("plugins/org.apache.cordova") > -1) {
					String pluginUrl = "www/" + url.substring(url.indexOf("plugins/"));
					return getWebResourceResponse(pluginUrl);
				}
				return super.shouldInterceptRequest(view, url);
			}
		}
	}//*/

	/**
	 * 按菜单键时，创建menu，仅开发模式时有用
	 */
	public boolean onCreateOptionsMenu(Menu menu) {
		if (!isDevelopmentMode)
			return false;
		menu.add(0, 0, 0, "设置URL");
		menu.add(0, 1, 1, "位置测试");
		locationUtil = new LocationUtil(this);
		return true;
	}

	/**
	 * 处理menu的事件
	 */
	public boolean onOptionsItemSelected(MenuItem item) {
		// 得到当前选中的MenuItem的ID,
		int item_id = item.getItemId();
		switch (item_id) {
		// 配置URL
		case 0:
			Intent intent = new Intent();
			intent.setClass(this, MyR.setupUrlActivityClazz);
			startActivity(intent);
			this.finish();
			break;
		// 获取当前位置
		case 1:
			locationUtil.getLocation();
			break;
		}
		return true;
	}

	/**
	 * 获取js文件数据流
	 * 
	 * @param url
	 * @return WebResourceResponse
	 */
	@SuppressLint("NewApi")
	private WebResourceResponse getWebResourceResponse(String url) {
		WebResourceResponse res = null;
		try {
			InputStream instream = getResources().getAssets().open(url);
			res = new WebResourceResponse("text/javascript", "UTF-8", instream);
		} catch (IOException e) {
			e.printStackTrace();
		}
		return res;
	}

	/**
	 * 初始化 Cordova webview 的 WebSettings 属性
	 */
	@TargetApi(Build.VERSION_CODES.ECLAIR_MR1)
	@SuppressLint({ "SetJavaScriptEnabled", "NewApi" })
	private void initWebSettings() {
		WebSettings webseting = ((SystemWebViewEngine) super.appView.getEngine()).webView.getSettings();
		// 设置webview属性，能够执行js脚本
		webseting.setJavaScriptEnabled(true);
		// 数据缓存方式
		webseting.setDomStorageEnabled(true);
		// webview加进一个回调的代理类JavaScriptInterface，并给它一个调用的名称：android
		// 示例：android.getDeviceId()
		((SystemWebViewEngine) super.appView.getEngine()).webView.addJavascriptInterface(new JavaScriptInterface(), "android");
		// 设置缓存 /data/data/bropen.mobile.shell/app_cache
		String appCacheDir = this.getApplicationContext().getDir("cache", Context.MODE_PRIVATE).getPath();
		webseting.setAppCachePath(appCacheDir);
		webseting.setAppCacheEnabled(true);
		webseting.setLoadsImagesAutomatically(true);
		webseting.setJavaScriptCanOpenWindowsAutomatically(true);
		webseting.setAllowFileAccess(true);
		webseting.setCacheMode(WebSettings.LOAD_DEFAULT);
		// 设置浏览器的 userAgent，便于html5应用识别
		webseting.setUserAgentString(webseting.getUserAgentString() + " BroMobileShell/" + getLocalVersionName());
		// TODO 允许缩放：无效
		// webseting.setSupportZoom(true);
		// webseting.setBuiltInZoomControls(true);
		// webseting.setUseWideViewPort(true);
	}

	/**
	 * 开启线程等待获取个推的clientId
	 */
	private void startClientIdThread() {
		// 获取 share.xml 文件SharedPreferences对象，及其clientId数据
		SharedPreferences sp = this.getSharedPreferences("share", 0);
		clientId = sp.getString("clientId", null);
		if (clientId != null) {
			clientIdThreadFinished = true;
		} else {
			new Thread(new Runnable() {
				int time = 0;

				public void run() {
					if (++time < 60 && clientId == null) {
						try {
							Thread.sleep(500);
						} catch (InterruptedException e) {
							e.printStackTrace();
						}
					} else {
						clientIdThreadFinished = true;
					}
				}
			}).start();
		}
	}

	/**
	 * 开启线程检测更新
	 */
	private void startUpdateThread() {
		new Thread(new Runnable() {
			@Override
			public void run() {
				checkUpdate();
			}
		}).start();
	}

//	/**
//	 * 重写webivew onMessage方法
//	 */
//	@Override
//	public Object onMessage(String id, Object data) {
//		if (id.equals("spinner")) {
//			spinnerDialog.dismiss();
//		}
//		return super.onMessage(id, data);
//	}

	@Override
	protected void onStart() {
		super.onStart();
		new Thread(new Runnable() {
			@Override
			public void run() {
				// 启动时，查找所有相关Apk并删除
				scanApkFiles();
			}
		}).start();
	}

	@Override
	protected void onResume() {
		super.onResume();
		status = "Active";
		long currentCheckUpdateTime = System.currentTimeMillis();
		float intervalTime = (currentCheckUpdateTime - lastCheckUpdateTime) / (24 * 60 * 60 * 1000);
		if (intervalTime > 1.0) {
			lastCheckUpdateTime = currentCheckUpdateTime;
			startUpdateThread();
		}
	}

	@Override
	protected void onStop() {
		super.onStop();
		status = "Stopped";
	}

	/**
	 * 启动Webview并加载首页
	 */
	private void startHomepage() {
		// 开启线程检测两个线程是否执行完：
		// 检测 updateThreadFinished 和 clientIdThreadFinished 是否执行完毕
		new Thread(new Runnable() {
			int count = 30;

			@Override
			public void run() {
				while (true) {
					try {
						Thread.sleep(500);
					} catch (InterruptedException e) {
						e.printStackTrace();
					}
					if (--count == 0)
						break;
					// 两个线程执行完，退出循环
					if (updateThreadFinished && clientIdThreadFinished) {
						break;
					}
					// 如果正在下载apk 则退出
					if (isDownloadingApk) {
						return;
					}
				}
				// 线程执行完加载页面
				Message message = new Message();
				message.what = 3; // 主线程loadUrl
				handler.sendMessage(message);
			}
		}).start();
	}

	/**
	 * 拼接 clientId、app_start_params 并加载主界面Url
	 */
	private void loadUrl() {
		if (clientId != null && startUrl.indexOf("deviceId=") == -1) {
			if (startUrl.indexOf("?") > -1) {
				startUrl += "&deviceId=" + clientId;
			} else {
				startUrl += "?deviceId=" + clientId;
			}
		}
		if ( startParams != null && startParams.length() > 0 ) {
			if (startUrl.indexOf("?") > -1) {
				startUrl += "&" + startParams;
			} else {
				startUrl += "?" + startParams;
			}
		}
		Log.d("BMS", "loadUrl: " + startUrl);
		// 加载首页
		super.loadUrl(startUrl);
		loaded = true;
	}

	/**
	 * 启动时检查并删除 apk 文件
	 */
	private void scanApkFiles() {
		// 检测SD卡是否存在
		if (Utils.inspectSDcardIsAvailable()) {
			File SDPath = Environment.getExternalStorageDirectory();
			deleteApkFiles(SDPath);
		} else {
			File localPath = this.getCacheDir();
			String[] args = { "chmod", "705", localPath.getAbsolutePath() };
			Utils.exec(args);
			deleteApkFiles(localPath);
		}
	}

	/**
	 * 遍历接收一个文件路径，然后把文件子目录中的所有文件遍历,如果有包含当前项目名称则删除
	 * 
	 * @param root
	 */
	private void deleteApkFiles(File root) {
		File files[] = root.listFiles();
		if (files != null) {
			for (File f : files) {
				if (!f.isDirectory()) {
					if (f.toString().contains(this.getString(MyR.string.app_name))) {
						String[] args = { "chmod", "604", f.getAbsolutePath() };
						Utils.exec(args);
						f.delete();
					}
				}
			}
		}
	}

	/**
	 * 检测网络是否连接，如果未连接，则退出
	 */
	private boolean checkNetwork() {
		boolean isAvailable = false;
		// 得到网络连接信息
		ConnectivityManager manager = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
		// 去进行判断网络是否连接
		if (manager.getActiveNetworkInfo() != null) {
			isAvailable = manager.getActiveNetworkInfo().isAvailable();
		}
		if (!isAvailable) {
			setNetwork();
		}
		return isAvailable;
	}

	/**
	 * 网络未连接时，调用设置界面
	 */
	private void setNetwork() {
		AlertDialog.Builder builder = new AlertDialog.Builder(this);
		builder.setTitle(this.getString(MyR.string.message_network));
		builder.setMessage(this.getString(MyR.string.message_network_config));
		builder.setPositiveButton(this.getString(MyR.string.message_network_confirm), new OnClickListener() {
			@Override
			public void onClick(DialogInterface dialog, int which) {
				Intent intent = null;
				// 判断手机系统的版本！如果API大于10 就是3.0+
				// 因为3.0以上的版本的设置和3.0以下的设置不一样，调用的方法不同
				if (android.os.Build.VERSION.SDK_INT > 10) {
					intent = new Intent(android.provider.Settings.ACTION_WIFI_SETTINGS);
				} else {
					intent = new Intent();
					ComponentName component = new ComponentName("com.android.settings", "com.android.settings.WirelessSettings");
					intent.setComponent(component);
					intent.setAction("android.intent.action.VIEW");
				}
				startActivity(intent);
				System.exit(0); // 退出
			}
		});

		builder.setNegativeButton(this.getString(MyR.string.message_network_cancel), new OnClickListener() {
			@Override
			public void onClick(DialogInterface dialog, int which) {
				System.exit(0); // 退出
			}
		});
		builder.create();
		builder.show();
	}

	/**
	 * 检查版本更新
	 */
	private void checkUpdate() {
		Log.d("BMS", "checking update");
		lastCheckUpdateTime = System.currentTimeMillis();
		if (getServerVersion()) {
			String localVersionName = this.getLocalVersionName();
			Log.d("serverVersion=" + serverVersionName, "localVersion=" + localVersionName);
			if (Utils.compareVersion(localVersionName, serverVersionName) == -1) {
				Looper.prepare();
				update(serverVersionName); // 更新版本
				Looper.loop();
			} else {
				updateThreadFinished = true;
			}
		} else {
			updateThreadFinished = true;
		}
	}

	/**
	 * 获得本地版本
	 * 
	 * @see AndroidManifest.xml
	 */
	private String getLocalVersionName() {
		String versionName = null;
		try {
			String packName = this.getPackageName();
			versionName = this.getPackageManager().getPackageInfo(packName, 0).versionName;
		} catch (NameNotFoundException e) {
			Log.e(this.getString(MyR.string.message_version_exception), e.getMessage());
		}
		if (versionName == null)
			return "";
		else
			return versionName;
	}

	/**
	 * 从服务器端获得版本
	 */
	private boolean getServerVersion() {
		if (updateUrl == null || updateUrl.equals("")) {
			return false;
		}
		try {
			URL url = new URL(updateUrl + "version_android.txt");
			HttpURLConnection httpConnection = (HttpURLConnection) url.openConnection();
			httpConnection.setConnectTimeout(5000);
			httpConnection.setDoInput(true);
			httpConnection.setDoOutput(true);
			httpConnection.setRequestMethod("GET");
			httpConnection.connect();
			InputStreamReader reader = new InputStreamReader(httpConnection.getInputStream());
			BufferedReader br = new BufferedReader(reader);
			serverVersionName = br.readLine();
			// 如果版本号后面有.F，必须更新
			if (serverVersionName.endsWith(".F")) {
				isMustUpdate = true;
				serverVersionName = serverVersionName.substring(0, serverVersionName.length() - 2);
			}
			updateApk = this.getString(MyR.string.app_name) + "_" + serverVersionName + ".apk";
			return true;
		} catch (Exception e) {
			e.printStackTrace();
			return false;
		}
	}

	/**
	 * 更新版本
	 */
	private void update(final String serverVersion) {
		String localVersionName = this.getLocalVersionName();
		StringBuilder sb = new StringBuilder();
		sb.append(this.getString(MyR.string.message_local_version) + ":");
		sb.append(localVersionName).append(", ");
		sb.append(this.getString(MyR.string.message_server_version)).append(":");
		sb.append(serverVersionName).append(", ");
		if (isMustUpdate) {
			sb.append(this.getString(MyR.string.message_update_must));
		} else {
			sb.append(this.getString(MyR.string.message_update_prompt));
		}
		final MainActivity self = this;
		Dialog dialog = new AlertDialog.Builder(this).setTitle(this.getString(MyR.string.message_update)).setMessage(sb.toString())
		// 设置内容
				.setPositiveButton(this.getString(MyR.string.message_update_now),// 设置确定按钮
						new DialogInterface.OnClickListener() {
							public void onClick(DialogInterface dialog, int which) {
								pd = new ProgressDialog(self);
								pd.setCancelable(false);
								pd.setTitle(self.getString(MyR.string.message_update_downloading));
								pd.setProgressStyle(ProgressDialog.STYLE_HORIZONTAL);
								downUpdateFile(updateUrl + updateApk);
								isDownloadingApk = true;
							}
						}).setNegativeButton(this.getString(MyR.string.message_update_later), new DialogInterface.OnClickListener() {
					public void onClick(DialogInterface dialog, int whichButton) {
						if (isMustUpdate) {
							System.exit(0);
						} else {
							updateThreadFinished = true;
						}
					}
				}).create();// 创建
		// 显示对话框
		dialog.show();
		dialog.setCancelable(false);
	}

	/**
	 * 下载apk
	 */
	private void downUpdateFile(final String url) {
		pd.show();
		new Thread() {
			public void run() {
				HttpClient client = new DefaultHttpClient();
				HttpGet get = new HttpGet(url);
				HttpResponse response;
				try {
					response = client.execute(get);
					HttpEntity entity = response.getEntity();
					fileSize = entity.getContentLength();
					Message sizeMmessage = new Message();
					sizeMmessage.what = 0;
					handler.sendMessage(sizeMmessage);
					InputStream is = entity.getContent();
					FileOutputStream fileOutputStream = null;
					if (is != null) {
						downloadApkFilePath = getLocalPath() + "/." + updateApk;
						File file = new File(downloadApkFilePath);
						fileOutputStream = new FileOutputStream(file);
						byte[] buf = new byte[1024];
						int ch = -1;
						while ((ch = is.read(buf)) != -1) {
							fileOutputStream.write(buf, 0, ch);
							downLoadFileSize += ch;
							Message message = new Message();
							message.what = 1; // 下载进度
							handler.sendMessage(message);
						}
					}
					fileOutputStream.flush();
					if (fileOutputStream != null) {
						fileOutputStream.close();
					}
					Message message = new Message();
					message.what = 2; // 安装apk
					handler.sendMessage(message);
				} catch (ClientProtocolException e) {
					e.printStackTrace();
				} catch (IOException e) {
					e.printStackTrace();
				}
			}
		}.start();
	}

	/**
	 * 安装应用，并退出当前app
	 */
	private void installUpdate() {
		Intent intent = new Intent(Intent.ACTION_VIEW);
		intent.setDataAndType(Uri.fromFile(new File(downloadApkFilePath)), "application/vnd.android.package-archive");
		String[] args = { "chmod", "604", downloadApkFilePath };
		Utils.exec(args);
		startActivity(intent);
		System.exit(0); // 自动退出
	}

	/**
	 * 主界面用handler线程处理
	 */
	@SuppressLint("HandlerLeak")
	Handler handler = new Handler() {
		@Override
		public void handleMessage(Message msg) {
			switch (msg.what) {
			case 0: // 设置pd的最大值
				// 注意如果值超过int范围即报错
				pd.setMax(fileSize.intValue());
				break;
			case 1: // 设置pd下载进度
				pd.setProgress(downLoadFileSize);
				break;
			case 2: // 安装apk
				pd.cancel();
				downLoadFileSize = 0;
				installUpdate();
				break;
			case 3: // 加载主界面
				loadUrl();
			}
			super.handleMessage(msg);
		}
	};

	/**
	 * 获得保存apk的文件夹，SD卡根目录或者缓存目录
	 */
	private File getLocalPath() {
		if (Utils.inspectSDcardIsAvailable()) { // sd卡存在
			File path = Environment.getExternalStorageDirectory().getAbsoluteFile();
			return path;
		} else {
			File path = this.getCacheDir();
			String[] args = { "chmod", "705", path.getAbsolutePath() };
			Utils.exec(args);
			return path;
		}
	}

	/**
	 * 被JS回调的类
	 */
	class JavaScriptInterface {
		@JavascriptInterface
		public String getDeviceId() {
			return clientId;
		}

		@JavascriptInterface
		public String getLocalURI() {
			return directory;
		}
		final static String directory = "file:///android_asset/www/";
	}

}
