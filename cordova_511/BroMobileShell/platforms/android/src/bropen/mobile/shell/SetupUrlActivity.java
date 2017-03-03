/* Copyright © 2013-2014 北京博瑞开源软件有限公司版权所有。*/
package bropen.mobile.shell;

import android.app.Activity;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.SharedPreferences.Editor;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;

/**
 * 开发模式下，设置首页及更新地址的界面
 * 
 * @see setupurl.xml
 */
public class SetupUrlActivity extends Activity {

	// xml 配置文件名，保存在 /data/data/应用包名/ 下
	static final private String config = "SetupUrl";

	public void onCreate(Bundle icicle) {
		super.onCreate(icicle);
		setContentView(MyR.layout.setupurl);
		final EditText updateUrlEditText = (EditText) findViewById(MyR.id.app_update_url);
		final EditText startUrlEditText = (EditText) findViewById(MyR.id.app_start_url);
		final EditText startParamsEditText = (EditText) findViewById(MyR.id.app_start_params);

		// 从配置文件中取得初始参数值，并填入EditText中
		final SharedPreferences sp = this.getSharedPreferences(config, 0);
		String startUrl = sp.getString("app_start_url", this.getString(MyR.string.app_start_url));
		String startParams = sp.getString("app_start_params", this.getString(MyR.string.app_start_params));
		String updateUrl = sp.getString("app_update_url", this.getString(MyR.string.app_update_url));
		
		updateUrlEditText.setText(updateUrl);
		startUrlEditText.setText(startUrl);
		startParamsEditText.setText(startParams);

		// 给应用按钮添加监听事件
		final SetupUrlActivity self = this;
		Button applyButton = (Button) findViewById(MyR.id.apply);
		applyButton.setOnClickListener(new View.OnClickListener() {
			@Override
			public void onClick(View arg0) {
				// 获取 EditText中的app_update_url、app_start_url的值
				String updateUrl = updateUrlEditText.getText().toString();
				String startUrl = startUrlEditText.getText().toString();
				String startParams = startParamsEditText.getText().toString();
				// 判断两个url是否为空
				if (startUrl != null && startUrl.length() > 0) {
					// 存储app_update_url和app_start_url的值到配置文件中
					Editor editor = sp.edit();
					editor.putString("app_update_url", updateUrl);
					editor.putString("app_start_url", startUrl);
					editor.putString("app_start_params", startParams);
					editor.commit();
					// 跳转到MainActivity界面
					MainActivity.updateUrl = updateUrl;
					MainActivity.startUrl = startUrl;
					MainActivity.startParams = startParams;
					Intent mainIntent = new Intent(self, MyR.mainActivityClazz);
					self.startActivity(mainIntent);
					self.finish();
				} else {
					Toast toast = Toast.makeText(getApplicationContext(), "url不能为空", Toast.LENGTH_SHORT);
					toast.setGravity(Gravity.CENTER, 0, 0);
					toast.show();
				}
			}
		});
	}
}
