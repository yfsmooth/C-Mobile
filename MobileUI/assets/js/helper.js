/**
 * url转意
 */
template.helper("encodeUrl", function (value) {
	return (typeof value == 'string') ? encodeURIComponent(value) : value;
});
/**
 * 字符串截取
 * */
template.helper("substr", function (value, length, text) {
	if (value.length > length) return value.substring(0, length) + text;
	else return value;
})
/**
 * 通讯录顶部导航
 */
template.helper("navigation", function (value) {
	if (typeof value != 'string' || !value) return value;
	return value.replace(/^\/+/, '').split("/");
});
/*template.helper("subUrl", function (value) {
	if (value) {
		var str = value.split(":")[1]
		var taskId = str.split(",")[0]
		return taskId
	}
})*/
/**
 * 将null转化成0
 */
template.helper("num", function (value) {
	if (!value) value = 0;
	return value;
})
/**
 * 输出用户公司名
 */
template.helper("companyName", function () {
	return $.o.i18n.m("o.companyInf.name");
})
/**
 * 判断是否有手势密码
 */
template.helper("gesturePwd", function () {
	return $.o.util.cache.get("gesturepwd")?true:false;
})