/**
 * 个推的透传接收处理方法
 */
package bropen.mobile.shell;

import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.SharedPreferences.Editor;
import android.content.pm.PackageManager.NameNotFoundException;
import android.os.Bundle;
import android.util.Log;

//import com.igexin.sdk.Consts;

public class MessageReceiver extends BroadcastReceiver {

	/** 主活动对象 */
	static MainActivity activity = null;

	/**
	 * 接收到消息的事件
	 */
	@Override
	public void onReceive(Context context, Intent intent) {
//		Bundle bundle = intent.getExtras();
//		Log.d("MobieShell", "onReceive() action=" + bundle.getInt("action"));
//		switch (bundle.getInt(Consts.CMD_ACTION)) {
//		case Consts.GET_MSG_DATA:
//			// 获取透传数据
//			byte[] payload = bundle.getByteArray("payload");
//			if (payload != null) {
//				String data = new String(payload);
//				Log.d("MobileShell", "Got Payload:" + data);
//				if ("Active".equals(activity.status)) {
//					// 如果应用在前台运行 调用js中方法来传递消息
//					activity.loadUrl("javascript:device.notify('" + data + "')");
//				} else {
//					// 接收处理透传(payload)数据
//					showNotification(context, data); // 只显示最新的一条
//					// showNotification(context, data, ((int) (Math.random() *
//					// 1000)));
//				}
//			}
//			break;
//		case Consts.GET_CLIENTID:
//			// 获取ClientID(CID)
//			// 第三方应用需要将CID上传到第三方服务器，并且将当前用户帐号和CID进行关联，以便日后通过用户帐号查找CID进行消息推送
//			String cid = bundle.getString("clientid");
//			// 获取 SharedPreferences 对象
//			// 生成一个share.xml,文件存放在/data/data/bropen.mobile.shell/shared_prefs目录下
//			SharedPreferences sp = context.getSharedPreferences("share", 0);
//			// 判断是否是第一次运行或者本地clientId与服务器clientId是否相同
//			String clientId = sp.getString("clientId", null);
//			if (!cid.equals(clientId)) {
//				activity.clientId = clientId;
//				Editor editor = sp.edit();
//				editor.putString("clientId", cid);
//				editor.commit();
//				// 如果页面已加载，则调用页面js方法来传递clientId
//				if (activity.loaded) {
//					activity.loadUrl("javascript:device.setDeviceId('" + clientId + "')");
//				}
//			}
//			break;
//		}
	}

	/**
	 * 接收到透传之后发送notification，可以修改显示方法
	 * 
	 * @throws NameNotFoundException
	 */
	@SuppressWarnings("deprecation")
	public static void showNotification(Context context, String data) {
//		Notification notification = new Notification();
//		NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
//		notification.icon = MyR.drawable.icon; // 图标
//		notification.when = 0; // 系统时间
//		notification.tickerText = context.getString(MyR.string.message_notification_title); // 标题
//		notification.flags |= Notification.FLAG_AUTO_CANCEL; // 点击自动消失
//		notification.defaults |= Notification.DEFAULT_SOUND; // 声音
//		notification.defaults |= Notification.DEFAULT_VIBRATE; // 振动
//		notification.defaults |= Notification.DEFAULT_LIGHTS; // LED
//
//		PendingIntent pendingIntent;
//		Intent intent = new Intent();
//		// 判断应用是否在后台运行
//		if ("Stopped".equals(activity.status)) {
//			intent.setClass(context, MyR.mainActivityClazz);
//		} else {
//			intent.setClass(context, MyR.splashActivityClazz);
//		}
//		intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
//		// 显示
//		int id = 0; // 如果id不一样，则在提示栏会显示多条
//		pendingIntent = PendingIntent.getActivity(context, id, intent, PendingIntent.FLAG_UPDATE_CURRENT);
//		notification.setLatestEventInfo(context, context.getString(MyR.string.message_notification_title), data, pendingIntent);
//		manager.notify(id, notification);
	}
}
