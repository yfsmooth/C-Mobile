package bropen.mobile.shell;

@SuppressWarnings("rawtypes")
public class MyR {
	/** 是否已初始化 */
	public static boolean inited = false;
	
	public static Class mainActivityClazz = null;
	public static Class setupUrlActivityClazz = null;
	
	// from R.java
    public static class drawable {
        public static int icon=0x7f020000;
    }
    public static class id {
        public static int app_start_params=0x7f060009;
        public static int app_start_url=0x7f060007;
        public static int app_update_url=0x7f060005;
        public static int apply=0x7f06000a;
        //public static int versionNumber=0x7f06000d;
    }
    public static class layout {
        public static int setupurl=0x7f030001;
        //public static int splashscreen=0x7f030002;
    }
    public static class string {
        /**  应用名称 */
        public static int app_name=0x7f050000;
        /**  应用首页参数：传给首页的URL参数，如 x=1&y=2 */
        public static int app_start_params=0x7f050004;
        /**  应用首页：远程或本地，如 file:///android_asset/www/index.html */
        public static int app_start_url=0x7f050003;
        /**  应用个更新地址：空则不更新 */
        public static int app_update_url=0x7f050002;
        /**  开发模式时，是否加载设置url页面 */
        public static int developmentMode=0x7f050016;
        /**  是否启用个推 */
        public static int igexin_enable=0x7f050005;
        public static int message_local_version=0x7f050009;
        public static int message_network=0x7f050011;
        public static int message_network_cancel=0x7f050014;
        public static int message_network_config=0x7f050012;
        public static int message_network_confirm=0x7f050013;
        /**  消息定义 */
        public static int message_notification_title=0x7f050006;
        public static int message_server_version=0x7f05000a;
        public static int message_update=0x7f05000b;
        public static int message_update_downloading=0x7f05000e;
        public static int message_update_later=0x7f05000d;
        public static int message_update_must=0x7f05000f;
        public static int message_update_now=0x7f05000c;
        public static int message_update_prompt=0x7f050010;
        public static int message_version_exception=0x7f050015;
        public static int message_waiting=0x7f050007;
        public static int message_waiting_loading=0x7f050008;
    }
}
