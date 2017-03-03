/**
 * 工具类
 */
package bropen.mobile.shell;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.List;

import android.app.ActivityManager;
import android.app.ActivityManager.RunningTaskInfo;
import android.content.Context;
import android.os.Environment;

public class Utils {

	/**
	 * 检测SD卡是否可用
	 * 
	 * @return
	 */
	public static boolean inspectSDcardIsAvailable() {
		if (Environment.getExternalStorageState().equals(Environment.MEDIA_MOUNTED)) {
			return true;
		} else {
			return false;
		}
	}

	/**
	 * 获取操作权限
	 * 
	 * @param args
	 * @return
	 */
	public static String exec(String[] args) {
		String result = "";
		ProcessBuilder processBuilder = new ProcessBuilder(args);
		Process process = null;
		InputStream errIs = null;
		InputStream inIs = null;
		try {
			ByteArrayOutputStream baos = new ByteArrayOutputStream();
			int read = -1;
			process = processBuilder.start();
			errIs = process.getErrorStream();
			while ((read = errIs.read()) != -1) {
				baos.write(read);
			}
			baos.write('\n');
			inIs = process.getInputStream();
			while ((read = inIs.read()) != -1) {
				baos.write(read);
			}
			byte[] data = baos.toByteArray();
			result = new String(data);
		} catch (IOException e) {
			e.printStackTrace();
		} catch (Exception e) {
			e.printStackTrace();
		} finally {
			try {
				if (errIs != null) {
					errIs.close();
				}
				if (inIs != null) {
					inIs.close();
				}
			} catch (IOException e) {
				e.printStackTrace();
			}
			if (process != null) {
				process.destroy();
			}
		}
		return result;
	}

	/**
	 * 本地版本和服务器版本比较。版本格式为 x.y.z
	 * 
	 * @param localVersionName
	 * @param serverVersionName
	 * @return localVersionName等于serverVersionName返回0，
	 *         localVersionName高于serverVersionName返回1，
	 *         localVersionName低于serverVersionName返回-1
	 */
	public static int compareVersion(String localVersionName, String serverVersionName) {
		if (localVersionName == serverVersionName || (localVersionName != null && localVersionName.equals(serverVersionName))
				|| (serverVersionName != null && serverVersionName.equals(localVersionName))) {
			return 0;
		}
		String[] strFg1 = localVersionName.split("\\.");
		String[] strFg2 = serverVersionName.split("\\.");
		for (int i = 0; i < strFg1.length; i++) {
			int v1 = -1;
			int v2 = -1;
			if (!"".equals(strFg1[i])) {
				v1 = Integer.parseInt(strFg1[i]);
			}
			if (!"".equals(strFg2[i])) {
				v2 = Integer.parseInt(strFg2[i]);
			}
			if (v1 == v2) {
				continue;
			}
			return v1 > v2 ? 1 : -1;
		}
		return 0;
	}

	/**
	 * 判断当前应用是否在前台运行。需要用户权限 android.permission.GET_TASKS。 本方法暂时没有使用。
	 * 
	 * @param context
	 * @return
	 */
	public static boolean isTopActivity(Context context) {
		String packageName = context.getPackageName();
		ActivityManager activityManager = (ActivityManager) context.getSystemService(Context.ACTIVITY_SERVICE);
		List<RunningTaskInfo> tasksInfo = activityManager.getRunningTasks(1);
		if (tasksInfo.size() > 0) {
			// 应用程序位于堆栈的顶层
			if (packageName.equals(tasksInfo.get(0).topActivity.getPackageName())) {
				return true;
			}
		}
		return false;
	}
}
