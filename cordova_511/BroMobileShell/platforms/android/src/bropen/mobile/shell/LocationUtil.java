/* Copyright © 2013-2014 北京博瑞开源软件有限公司版权所有。*/
package bropen.mobile.shell;

import android.content.Context;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.location.LocationProvider;
import android.os.Bundle;
import android.util.Log;
import android.widget.Toast;
import android.app.Activity;

/**
 * 位置工具，仅供测试 需要开放 ACCESS_XXXX_LOCATION 等几个权限。
 */
public class LocationUtil {

	private LocationManager locationManager;
	private Activity activity;

	public LocationUtil(Activity activity) {
		this.activity = activity;
		locationManager = (LocationManager) activity.getSystemService(Context.LOCATION_SERVICE);
	}

	/**
	 * 获取当前位置
	 */
	public void getLocation() {
		// 从GPS获取最近的定位信息
		Location location = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER);
		if (location == null) {
			location = locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER);
			// 设置每2秒获取一次网络的定位信息
			locationManager.requestLocationUpdates(LocationManager.NETWORK_PROVIDER, 2000, 8, locationListener);
		} else {
			// 设置每2秒获取一次GPS的定位信息
			locationManager.requestLocationUpdates(LocationManager.GPS_PROVIDER, 2000, 8, locationListener);
		}
		// 提示位置
		updateLocation(location);
	}

	private final LocationListener locationListener = new LocationListener() {
		@Override
		public void onLocationChanged(Location location) {
			// 当定位信息发生改变时，更新位置
			updateLocation(location);
		}

		@Override
		public void onProviderDisabled(String provider) {
			updateLocation(null);
		}

		@Override
		public void onProviderEnabled(String provider) {
			// 当LocationProvider可用时，更新位置
			updateLocation(locationManager.getLastKnownLocation(provider));
		}

		@Override
		public void onStatusChanged(String provider, int status, Bundle extras) {
			switch (status) {
			case LocationProvider.AVAILABLE:
				Toast.makeText(activity, "状态变化了，值是" + status + "", Toast.LENGTH_LONG).show();
				Log.i("gpsListener", "当前GPS状态为可见状态");
				break;
			case LocationProvider.OUT_OF_SERVICE:
				Toast.makeText(activity, "状态变化了，值是" + status + "", Toast.LENGTH_LONG).show();
				Log.i("gpsListener", "当前GPS状态为服务区外状态");
				break;
			case LocationProvider.TEMPORARILY_UNAVAILABLE:
				Toast.makeText(activity, "状态变化了，值是" + status + "", Toast.LENGTH_LONG).show();
				Log.i("gpsListener", "当前GPS状态为暂停服务状态");
				break;
			}
		}
	};

	private void updateLocation(Location location) {
		if (location != null) {
			StringBuffer sb = new StringBuffer();
			sb.append("实时的位置信息：\n经度：");
			sb.append(location.getLongitude());
			sb.append("\n纬度：");
			sb.append(location.getLatitude());
			sb.append("\n高度：");
			sb.append(location.getAltitude());
			sb.append("\n速度：");
			sb.append(location.getSpeed());
			sb.append("\n方向：");
			sb.append(location.getBearing());
			sb.append("\n精度：");
			sb.append(location.getAccuracy());
			Toast.makeText(activity.getApplicationContext(), sb, Toast.LENGTH_SHORT).show();
			System.out.println(sb);
		} else {
			// 传入的Location对象为空
			Toast.makeText(activity.getApplicationContext(), "null", Toast.LENGTH_LONG).show();
		}
	}
}
