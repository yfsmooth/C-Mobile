package com.foo.bar;

import android.os.Bundle;

public class SetupUrlActivity extends bropen.mobile.shell.SetupUrlActivity {

	@Override
	public void onCreate(Bundle icicle) {
		MainActivity.initMyR();
		super.onCreate(icicle);
	}
}
