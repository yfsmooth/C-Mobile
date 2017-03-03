(function($) {

	/**
	 * 拼接url
	 * 会将当前浏览器链接上的参数一并拼上
	 * 参数优先级：options > url带的参数 > 浏览器地址带的参数
	 */
	template.helper('stitchParam', function (url, options) {
		// ?selectorType={{selectorType}}&data={"taskId":"{{taskId}}","find":"{{condition}}","orgId":"{{parentOrgIds[i]}}"}
		// &orgId={{parentOrgIds[i]}}&taskId={{taskId}}&single={{single}}&step=selectActors&condition={{condition}}
		return $.o.util.url.stitchParam(url, options);
	});

	/**
	 * 名字切割
	 */
	template.helper("subName", function (value) {
		return $.o.util.subName(value);
	});

})(jQuery);