/*===========================================================================
 * from fwk/application.js
 *===========================================================================*/

/**
 * JQuery AJAX调用的全局事件
 * 		1.4.2bind到window对象上即可
 * 		1.4.3+需要bind到document对象
 * ajaxSuccess:
 * 		LoginController
 * 			验证失败则刷新页面，激活登录窗口
 * 			访问拒绝则弹出提示
 * 		其他 JSON 命令：
 * 			message、error、redirect、reload
 * ajaxError：提示。
 *
 * 注1：当放回json中有message、error，或者触发ajaxError时，会自动alert对应的信息；
 *		如果不需要自动提示，则可以设置相应的参数(alertMsg、alertErr、alertException)将其屏蔽，
 *		例如：$.ajaxSetup({alertMsg:false, alertErr:false});
 * 注2：需要 hack jquery.js，详见 BROFWK-234
 */
$(document).bind("ajaxSuccessBefore", function(evt, xhr, setting) {
	$.hidePreloader();
	// 如果发现用户身份验证失败，则重新登录 -- 配合loginController.authAjax
	if ( xhr && xhr.responseText.indexOf("auth failed") != -1 ) {
		setTimeout("location.reload()", 2000);
	}
	// 如果发现用户权限校验失败，则提示 -- 配合loginController.deniedAjax
	else if ( xhr && xhr.responseText.indexOf("access denied") != -1 ) {
		$.o.dialog.alertError(m('o.ajax.denied', [setting.url]));
	}
	// 如果一个用户只允许在一个地方登录
	else if (xhr && -1 != xhr.responseText.indexOf("#isConcurrentSessionEnabled.reload#") ) {
		if ( $("body").data("logout") ) return;
		$("body").html( xhr.responseText ).data("logout", true);
	}
	// 尝试显示JSON消息，并重定向/刷新：{message:xxx, error:xxx, redirect:xxx, reload:xxx}
	else {
		try {
			var result = $.parseJSON(xhr.responseText);
			if ( result.error ) {
				// 如果setting中有alertErr且为真，或者为undefined
				if ( setting.alertErr || setting.alertErr==undefined ) {
					// 不显示连续三个回车后的内容（约定）
					if ( result.error instanceof Array ) {
						$.o.dialog.alertError(result.error.join("\n").replace(/\r?\n\r?\n\r?\n(.|[\r\n])+/,""));
					}
					else {
						$.o.dialog.alertError( String(result.error).replace(/\r?\n\r?\n\r?\n(.|[\r\n])+/,"") );
					}
				}
			} else if ( result.message ) {
				if ( result.success ) {
					// 如果setting中有alertMsg且为真，或者为undefined
					if ( setting.alertMsg || setting.alertMsg==undefined ) {
						// 不显示连续三个回车后的内容（约定）
						$.o.dialog.alertError( String(result.message).replace(/\r?\n\r?\n\r?\n(.|[\r\n])+/,"") );
					}
				} else {
					if ( setting.alertErr || setting.alertErr==undefined ) {
						// 不显示连续三个回车后的内容（约定）
						if ( result.message instanceof Array ) {
							$.o.dialog.alertError(result.message.join("\n").replace(/\r?\n\r?\n\r?\n(.|[\r\n])+/,""));
						}
						else {
							$.o.dialog.alertError( String(result.message).replace(/\r?\n\r?\n\r?\n(.|[\r\n])+/,"") );
						}
					}
				}
			}
			if ( result.redirect ) {
				setTimeout("location = '"+ result.redirect + "'", 500);
			} else if ( result.reload ) {
				setTimeout("location.reload()", 500);
			}
		} catch (e) {}
	}
}).bind("ajaxErrorBefore", function(e, xhr, setting, exception) {
	$.hidePreloader();
	// cometd不显示ajax异常
	if ( setting && setting.url.indexOf('cometd')!=-1 ) return $.hidePreloader();
	// 如果setting中有alertException且为真，或者为undefined
	if ( setting.alertException || setting.alertException==undefined ) {
		// 访问失败：如果url里有参数ignore404、ignore500、ignore400，则这种种错误都不alert
		var code = errorCode();
		if ( !$.o.user.loggedin ) { // 未登陆时，访问首页，会提示错误"没有网络连接!"
			$.o.dialog.alertError(m('o.user.ajax.failed'));
			return;
		}
		if ( code == 0 ) {
			$.o.dialog.alertError(m('o.ajax.0'));
		} else if ( exception && code!=400 && code!=404 && code!=500 && exception != 'canceled' && exception != 'abort' ) {
			$.o.dialog.alertError(m('o.ajax.failed', [exception, setting.url]));
		} else if ( code==400 && setting.url.indexOf("ignore400")==-1 ) {
			document.title = m('o.ajax.400', [setting.url]);
		} else if ( code==404 && setting.url.indexOf("ignore404")==-1 ) {
			document.title = m('o.ajax.404', [setting.url]);
		} else if ( code==500 && setting.url.indexOf("ignore500")==-1 ) {
			$.o.dialog.alertError(m('o.ajax.500', [setting.url]));
		}
	}
	//----
	function errorCode() {
		if ( (xhr && xhr.status=="400") || exception=="Bad Request" || String(exception).indexOf("was not called")>1 ) return 400;
		if ( (xhr && xhr.status=="404") || exception=="Not Found" ) return 404;
		if ( (xhr && xhr.status=="500") || exception=="Internal Server Error" ) return 500;
		return xhr ? xhr.status : null;
	}
});
// 显示、隐藏进度
$(document).bind("ajaxStart",function(e,setting) {
	// hack jquery：trigger时加上setting参数 --- cometd和locker不显示ajax进度
	if ( setting && setting.url.indexOf('cometd')!=-1 ) return;
	if ( setting && setting.url.indexOf('locker')!=-1 ) return;
	if ( setting.silent !== true ) $.showPreloader();
})/*.bind("ajaxStop",function() { // 此处会把错误提示给屏蔽掉
	$.hidePreloader();
});*/

/*===========================================================================
 * prototype
 *===========================================================================*/

String.prototype.startsWith = function(s) {
	return this.indexOf(s) == 0;
};

if ( !String.prototype.endsWith ) {
	String.prototype.endsWith = function(s) {
		var i = this.lastIndexOf(s);
		return (i == -1) ? false : (i == this.length - s.length);
	};
}

if ( !String.prototype.contains ) {
	String.prototype.contains = function(s) {
		return this.indexOf(s) != -1;
	};
}

// 将 base64 字符串转换为 Blob 对象
String.prototype.toBlob = function( type ) {
	var bin = atob( this ),
		len = bin.length,
		len32 = len >> 2,
		a8 = new Uint8Array( len ),
		a32 = new Uint32Array( a8.buffer, 0, len32 );

	for ( var i=0, j=0; i < len32; i++ ) {
		a32[i] = bin.charCodeAt(j++)  |
			bin.charCodeAt(j++) << 8  |
			bin.charCodeAt(j++) << 16 |
			bin.charCodeAt(j++) << 24;
	}

	var tailLength = len & 3;

	while( tailLength-- ) {
		a8[ j ] = bin.charCodeAt(j++);
	}

	return new Blob( [a8], {'type': type} );
};

if( window.HTMLCanvasElement && !HTMLCanvasElement.prototype.toBlob ) {
	Object.defineProperty( HTMLCanvasElement.prototype, 'toBlob', {
		value: function( callback, type, quality ) {
			var base64 = this.toDataURL( type, quality ).split(',')[1],
				blob = base64.toBlob( type || 'image/png' );
			callback( blob );
		}
	});
}

/*

API设计：
	$.o					命名空间，取 bro + open 共有的 o 字
	$.o.config_default	默认配置
	$.o.config			用户配置，由用户自定义
		login_url ...
	$.o.native			设备原生API
	$.o.page			页面导航API
	$.o.dialog			自定义的 alert、confirm、prompt 等方法
	$.o.user			用户对象与API
	$.o.i18n			国际化，只有 m、merge 两个方法，如 m("foo.bar")
	$.o.util			工具方法

css class 规范
	产品：
		o-...	都加前缀 o-
		o-page-login 之类的
	应用：
		app-	都加前缀 app-

tag data attributes 规范：
	产品：
		data-o-XXXX		中间都加命名空间 o-
	应用：
		data-app-XXXX	中间都加命名空间 app-

页面规范：
	. 可以加 <title> 标签，设置网页标题
	. 页面内容（含 js、css）必须包含在 <div data-role="page" class="o-page-XXXX"> 标签内
		id 属性可有可无
		class 属性用来配置样式，建议所有页面都配上
	. 如果要在页面显示执行代码，使用事件方式，如：
		$.o.page.on("beforeshow", ".o-page-login", function(event, ui) {
			// 其中 ui.toPage 就是对应的 page div 对象，
			// 此外，只要页面的 url 不一样，这里获取的（页面上生成的） div 都会不一样
			console.log(ui.toPage)
		})
	. 对于登录页等，应主动禁用 dom cache；而列表页面，建议启用 dom cache
		在 page div 中加 data-dom-cache="true/false" 的属性
	. 如果一个页面需要预加载，可以在链接 a 标签上加 data-prefetch="true"，或者调用 $.o.page.load 方法；
		不过如果此时页面需要登录，则不会被预加载。
	. 对于页面按钮（button），类型应设为 type="button"，避免点击后直接提交表单
	. 正常情况下，页面只需要包含 page div，但可能不方便调试，可以：
		将 index 上的 head、body 等全部复制到要测试的页面中，并且设置允许该页面匿名访问
		这样就可以直接在浏览器输入该页面的地址、并可以刷新测试
	. 页面中如果有模态窗口（如 alert 等），切换页面时会自动隐藏他们，因此，如有必要最好编写模态窗口的隐藏或回调事件
	. 如果页面中有需要上下滚动的内容（比如列表、或者比较长的页面表单等），需要将需要滚动的内容包在一个 div.o-scroll 中，并且再将该 div 包在一个 .o-scroll-wrap 容器中
	. TODO +缓存参数，包括时间；或强制重载；或定期清理不被访问的页面
	. BootStrap 的组件里，常需要通过 html 标签的 data-xx 属性指定一个选择器，如果多个页面下有相同 id 的标签，则：
		如 data-target="#myModal" 可以写成 data-target=".ui-page-active #myModal"，说明在当前 page 下找 #myModal 元素。

页面跳转规范：
	. a 链接属性 href 会被 jQM 自动处理
		可配置 data-transition、data-direction 设置页面过渡效果
			http://www.w3school.com.cn/jquerymobile/jquerymobile_transitions.asp
		如果为 #id，则自动显示在当前页面中的那个 page div，否则自动改为 ajax 加载页面。
		ajax 加载时，target 属性必须为空，并且不能配置如下属性：
			data-rel="back"、data-rel="external"、data-ajax="false"
	. 如果HTML元素有 data-o-tel="1331234556" 或 data-o-sms="1331234556"，则会自动调用设备的电话、短信程序打开
	. 如果HTML元素有 data-o-url-change="x.html" 或 data-o-url-replace="x.html"，则点击后自动跳转到对应的页面
		其他属性包括：
			transition			跳转方式，如淡入淡出等
			direction			方向，默认正向，reverse:反向
			data-o-url-params	JSON格式的URL参数
			data-o-url-reload	是否重新加载：不同于 dom cache，此时退回操作不会重新加载，但是点击本链接会重新加载
	. 如果 HTML 元素有 data-o-url-back="true"，则点击后自动后退到上一页
	. 如果 HTML 元素有 data-o-login="true"，则点击后进入登录页
		提示：如果不是HTML元素，但是要跳转到登录页，应直接调用 $.o.page.login()，不要 $.o.page.change 到登录页，以免异常
	. 如果 HTML 元素有 data-o-logout="true"，则点击后自动注销并显示登录页
	. 对于微信这样的一级页面，手指 swip 时应该设为 flip 的过渡效果，并配合方向；问题是，如何实现顶部、底部栏固定呢？ --- jQM 可以
		在 header 或 footer 中，只要 data-id 一致，页面切换时会固定显示。
	. 在导航模板中有 data-o-navbar-swipe="true"，则会自动监听手指左右滑动，以切换页面
		TODO 黄超的手机有问题，切换不灵敏，浏览器版本：AppleWebKit/537.36(KHTML, like Gecko) Version/4.0 Chrome/33.0.0.0 Mobile Safari/537.36 BroMobileShell/1.0.0

UI组件：
	. 如果img元素有 data-action="zoom" 属性，则点击后会自动放大
		此外，还修改了 bootstrap 中的 zoom 插件，实现左右滑动、切换图片、
			切换查看某一块的图片（当某个元素(包裹图片的节点)设置 data-o-zoom-wrap="true" 时，切换图片时，只会切换该元素内部的图片）,如手机qq空间中查看图片，切换时只会切换到当前这一块的图片
	. 如果图片有 class="o-avatar" 则表示是一个头像，显示为圆形，如
		<img class="o-avatar" data-o-template-dynamic="true" data-src="{{$.o.user.avatarUrl}}" style="width: 80px" />
			第一次渲染DOM时，这里的src为一个非法的URL，需要延迟加载，以免出现一个 404 请求，因此采用属性 data-src 代替 src 加载。
	. 如果图片有 data-original="图片真实url"，则页面会自动延迟加载对应的图片（显示到该图片位置时才加载）
	. 如果某元素有 data-o-picture 属性和 data-o-picture-target 属性，则点击该元素时，可以拍照或选择图片并预览。
		其中，data-o-picture 表示操作类型，可选的值有 camera:拍照、 album:从图库选择图片；
		data-o-picture-target 表示存放预览图片的 img元素对象，其值可以是各种 jquery的选择器。
		如：<div data-o-picture="camera" data-o-picture-target="#cameraPicture">,表示点击该 div时可以拍照，并在 id为 cameraPicture的 img元素上预览。
	. 如果表单元素 form 上加上属性  data-o-form="true"，则该表单在提交的时候会将表单内容（包括文件 <input type='file'>）上传到服务端，
		如果要将 form 表单内的 img 图片也上传（指拍照或从图库选择的图片）：
			可以在 img 标签上加上属性 data-o-form-img="true" 属性，同时指定其 name 属性（同 input file 的 nname 属性）。
			如：<img data-o-form-img="true" name="photo" src=".." />
		表单提交会自动被拦截进行表单校验（http://niceue.com/validator/），校验通过则自动通过 ajax 提交：
			如果需要实现自定义提交，可以在页面显示事件中，绑定提交事件，如：
				$.o.page.on("beforeshow", ".o-page-login", function(event, ui) {
					ui.toPage.find("form").validator(function() {
						// 自定义提交事件
					});
				}
			可以通过表单事件 o.submit.done 和 o.submit.fail 来监听自动 ajax 提交成功或异常，如：
				$.o.page.on("load", ".o-page-form", function(event, ui) {
					ui.toPage.find("form").on("o.submit.done", function( event, data ) {
						// 提交成功
						event.preventDefault();	// 屏蔽自动提示错误消息
					}).on("o.submit.fail", function( event, jqXHR, textStatus, errorThrown ) {
						// 提交失败
						event.preventDefault();	// 屏蔽自动提示错误消息
					});
				});
	. $.o.dialog 包中，包含有 alert、confirm、prompt、actionsheet、dropmenu 等常用组件，
		这些组件的模板定义在 templates/dialogs.html 中，随首页自动加载，
		除模板外，actionsheet、dropmenu 还有一批 o-xxxx 打头的样式规则，用于个性定制。
		如果按钮等元素上有 data-o-dropmenu-target 并指向一个下拉菜单的选择器（如#id），则点击后自动显示（见模板中的 myDropmenu 示例）。
	. $.fn.listloader 列表组件
		如果 div 有属性 data-o-listloader="true"，则页面显示时会自动将其转换为列表，并可以实现下拉刷新、上拉/点击/自动加载下一页等功能，
		其他属性包括：
			o-listloader-template-id	渲染列表数据的模板id
			o-listloader-url			加载数据的url地址
			o-listloader-max			每页条数，默认取配置 config.listloader_page_max
			o-listloader-type			下一页/更多的加载方式：pull-上拉加载，click-点击加载按钮，auto-到底部自动加载（默认）
			o-listloader-params			JSON格式的URL参数
		每次请求服务器、模板渲染时的默认参数：
			url中的参数、$
		加载特效的模板定义在 templates/listloader.html 中，并且有一批 o-listloader 打头的样式规则用于个性定制。
		样例参考 listloader1/2/3.html，以及 application.css 中 .app-listloader 相关样式规则。
	. 如果元素有 data-o-qrcode-text 属性，则在该元素内部会自动生成二维码，
		其他属性包括：
			o-qrcode-text			要编码的字符串
			o-qrcode-size			二维码的宽和高，单位是px，只允许生成正方形二维码，默认256
			o-qrcode-color-bg		背景色，默认：#FFFFFF
			o-qrcode-color-fg		前景色，默认：#000000
			o-qrcode-color-corner	三个角的颜色，默认：#000000
			o-qrcode-image-url		二维码正中间图片的url，只支持配置正方形图片
			o-qrcode-image-size		image的宽和高，单位px，默认：30
资源组织规范：
	加一个 bropen 的文件夹，存放产品资源，而工程的 assets 只存放工程自身的静态资源
	在 index 中使用 assets 来定义资源和加载资源，同时：
		1、如果打包部署，应该将 assets.ver 设为空
		2、如果打包部署，如果对资源文件有修改，则应设置资源版本号

模板 artTemplate 使用说明：
	. 官方说明
		http://aui.github.io/artTemplate/
		这里采用“简洁语法”。
	. 属性说明
		data-o-template-async: 加载子模板或数据时，是否异步，默认为 false
		data-o-template-params: 渲染模板时的参数，JSON格式
			此外，该参数还会包含 $、window、page 等对象；
			如该模板包含在其他模板内部，则可以包含父模板渲染时的其他参数。
		data-o-template-include: HTML或脚本子模板的 URL
			页面上设置一个容器，如 <span data-o-template-include="templates/include.html"></span>，
			会自动在页面显示前同步加载模板文件、渲染到上面的 span 容器中；如果是 data-o-template-include-lazy，则会异步加载、延迟渲染。
			子模板只会在页面加载或显示时加载一次，但其中还可以包含模板片段和子模板。
		data-o-template-include-script: 上一个参数加载的是否是脚本子模板
			脚本子模板中的内容和脚本模板一样，但不需要 script 标签，代码灵活性较高，
			注：模板中，非模板标签不能连着写两个大括号如'{{'、'}}', 可以写成 '{ {'、'} }'，即大括号间加空格。
		data-o-template-script-id: 页面上脚本模板片段的ID
			如 <script id="test" type="text/html">....</script>
			默认情况下，每次进入页面会重新渲染模板，如不需要重新渲染，需添加 data-o-template-fixed="true" 属性
		data-o-template-data-url: 通过 AJAX 加载的数据，加载完后才渲染子模板
			data-o-template-data-params: 加载数据时的参数，JSON格式，同时会包括当前页面url中的参数等
		data-o-template-fixed、data-o-template-dynamic: HTML 模板片段
			页面元素可以设置 xxx ="true"，前者表示一旦渲染后，就不再变化，后者表示每次显示前，都会重新渲染。
			如：<h1 data-o-template-fixed="true">Hello, {{$.o.user.nickname}}!</h1>
 			模板片段不能 ajax 加载数据，但是可以通过 data-o-template-params 传参。
			此外，通过本方式，可以实现整个页面的国际化（i18n）渲染。
 		data-o-template-fail-back: 模板加载失败是否回退
	. 事件
		o.template.data.beforeload	加载数据前，可接收参数 {url: xxx, data: xxx}
		o.template.data.loaded		加载数据完成后，参数为服务器返回的数据对象
		o.template.success			模板渲染完成后，可接收参数 params（渲染模板所使用的数据）
	. 默认情况下，模板都在 beforeshow 事件中渲染，
		但是如果有属性 data-o-template-onload="true"，则在页面的 load 事件中加载
	. 每次模板渲染时的默认参数：
		url中的参数、$、page、window
	. 对于首页（index.html），由于一开始就显示出来了，如果有模板片段，页面会先显示编译前的模板内容、然后再显示编译后的真实内容，
		因此，将首页放到一个独立的 index_.html 中，在 index.html 中使用子模板方式引用

文件目录规范：
	app			应用目录，存放 html 等静态文件
				首页均通过文件 index.html 使用模板的方式引用文件 _index.html
	assets		应用的资源目录，包括 css、img、js 等子文件夹
	templates	应用的模板目录
	bropen		产品目录

后台服务的 AJAX URL 规范：
	在 config 中，有 server_url_pattern 和 server_url_jsessionid 两个配置，
		前者是一个正则表达式，用来判断 url 是否是后台服务，如: /\/Foobar\//g
		后者是一个布尔值，如果为真，则自动在 url 参数前拼上 ;jsessionid=xxx。
	TODO AJAX 请求前的修改API与策略 --- 比如url、cookie加东西等

授权管理规范：
	. 登录到后台后，后台应以 json 格式返回 o.user 对象的相关属性值，如 username、jsessionid 等
	. 在页面的 beforeload 中拦截未登录请求，并重定向到登录页 -- @see page._initLoginInterceptor
	. TODO 除了登录外的页面拦截机制，比如必须实名用户访问等
	. 定时登录维持在线状态：加了个配置 user_login_interval，定时重新登录

跨域支持：
	. 在 ui 端，自动启用了 cors 跨域支持
		需要注意的是，使用 Chrome 通过 file://... 访问APP，然后跨域请求服务端，会抛出下面的异常：
			Uncaught SecurityError: Failed to execute 'replaceState' on 'History': A history state object with URL 'file:///...
		可以加上参数 --allow-file-access-from-files 启动 chrome，如：
			google-chrome --allow-file-access-from-files
	. 服务端，如的 Apache HTTPd，可以使用 headers 组件
		启用：a2enmod headers
		配置文件中添加：Header set Access-Control-Allow-Origin "*"
		详情参考 http://enable-cors.org/server_apache.html
	. 如果服务端是 adapter，自动在 filter 中添加了上面的 http 头
	. 在基于 cordova 的 shell 端，默认启用了 whitelist 插件，并且在 config.xml 中默认启用了跨域支持（access等几个配置）
		但是，在 ui 端的 html 页面中，仍然需要加上 Content-Security-Policy 的 meta 头，如：
			<meta http-equiv="Content-Security-Policy" content="default-src * 'unsafe-inline' 'unsafe-eval'">

手势 -- 如缩放：
	. 引入了插件 hammerjs
 		http://hammerjs.github.io/
	. 示例如：
		var mc = new Hammer(this._$body.get(0));
		mc.on("swipeleft", $.proxy(this.swipeleft, this));
		mc.on("swiperight", $.proxy(this.swiperight, this));
		mc.get('pinch').set({ enable: true });
		mc.on("pinch", function(evt) {
			alert("pinch -- " + evt.scale)
		});
		mc.destroy();
	. （废弃） 引入了插件 jquery.event.ui.js，提供了对手势/鼠标的通用事件，包括点击（tap）、长按、拖曳、长按后拖曳、缩放等事件
		https://github.com/mmikowski/jquery.event.ue
		同时做了些修改。
 		注：html中设置 viewport meta 标签，user-scalable 为 yes 时，在浏览器中可以实现手势缩放，但是 Cordova 默认不支持：（
	. （废弃） 以缩放为例：
		// 监控缩放开始事件：必须监控，否则后续事件无效；这里可以设置一个命名空间 foobar，以便结束后关闭监控
		$(window).on("uzoomstart.foobar", function(event) {
			//console.log("start"); console.log(event)
		});
		// 监控缩放移动（uzoommove）或结束事件（uzoomend）事件，计算缩放比例，并对希望缩放的内容进行缩放处理
		$(window).on("uzoomend.foobar", function(event) {
			// 定义希望缩放的目标对象
			var target = $.o.page.activePage.find("h1");
			// 计算缩放比例 scale，并缓存下来
			var before = Math.sqrt(
					  Math.pow((event.touch0.px_start_x - event.touch1.px_start_x), 2)
					+ Math.pow((event.touch0.px_start_y - event.touch1.px_start_y), 2)
				);
			var after = Math.sqrt(
				  Math.pow((event.touch0.px_current_x - event.touch1.px_current_x), 2)
					+ Math.pow((event.touch0.px_current_y - event.touch1.px_current_y), 2)
				);
			var gap = after - before,
				lastScale = target.data("scale") || 1,
				scale = lastScale + gap / 600;
			if ( scale < 1 ) scale = 1;
			target.data("scale", scale);
			// 对目标进行缩放：方式1 -- 不推荐，局部放大时、会覆盖到其他页面元素上，而不是自动扩大其所在的容器
			//target.css("transform", "scale(" + scale + "," + scale + ")");
			//target.css("transform-origin", scale == 1 ? "" : "top left");
			// 对目标进行缩放：方式2 -- 推荐
			//target.css("font-size" ....)
		});
		// 使用命名空间关闭所有事件监听
		$(window).off(".foobar");

================================== jQM =========================================

ajax加载跟踪：
	1、页面不建议有 id，如果页面重用，会有重复
	2、ajax加载后，会自动设置data-url为当前的url
		加载时（load、change），如果当前body中找到data-url为目标url的，则直接显示，否则重新ajax加载一遍
		 l5561 -> 5471 -> 6268 -> 4995
	3、ajax加载新的page后，除了在第一个页面上的page div，当前的page div会被销毁，导致后退、前进时，重新ajax加载
		-> 5568 -> 5793
	4、比如当前为 index.html，通过 ajax 加载 login.html 后，直接刷新浏览器，会保持在 login.html 界面，但是没有样式什么的，
		需要在 login.html 中加上完整的 header、body。
		原因：不是用的一个页面 + #hash，不象 framework 里的用的 bbq，使用 hash 来记录当前页面.....

问题 -- ajax 加载的页面上如果有 script 标签，不会被执行：
	容器 <div data-role="page"> 外的 <script> 标签不执行，如果放到 div 里面会执行

TODO 问题 --- a 标签里的 href，默认是 GET，会被浏览器缓存
	而调用 change、load 方法时，可以配置 option.type 为 post

mobileinit 事件：
	必须在加载 jqm.js 前绑定，否则不执行

事件
	http://api.jquerymobile.com/category/events/
	页面事件（page 打头的一堆）基本上都废弃了，迁移到了 page、pagecontainer 等 widget 上，参考：
		http://api.jquerymobile.com/page/
		http://api.jquerymobile.com/pagecontainer/
	示例：
		$("body").pagecontainer({beforechange: function() ...
		$("body").on("pagecontainerbeforechange", function() ....
		一些事件可以拦截并中止掉：event.preventDefault() 或 return false
	扩展：
		新增了 pagecontainer 的 parseload 事件，允许对 ajax 加载的 html 进行修改，如：
		$("body").on("pagecontainerparseload", function(event, data) {
			data.html = "......"
		});

页面过渡配置：
	默认的 page 切换效果为 fade，可以改成其他，如 slide 为左右滑动
	http://www.w3school.com.cn/jquerymobile/jquerymobile_transitions.asp
	如 $.mobile.defaultPageTransition = "none";

dom cache 配置：
	默认情况下，ajax加载page时会自动删除当前的 ajax page div，如需保留，可使用全局的 dom cache
	有三种策略：
		1 是设置全局配置 domCache 为真
			$.mobile.page.prototype.options.domCache = true;
		2 是在页面容器（page div）上设 data-dom-cache="true"，
		3 是通过事件设
			$(document).on('pagebeforecreate', function(evt) {	// 策略3
				//$(evt.target).page({ domCache: true });	// 有bug(bindRemove)，换下面的写法
				$(evt.target).data("mobile-page").options.domCache = true;
			});
	参考：
		demo's "Page/DOM Cache"
		http://dev.chetankjain.net/2011/12/jquery-mobile-page-caching-demo.html

// Set a namespace for jQuery Mobile data attributes
// 这样 <div data-role="page"> 必须写成 <div data-jqm-role="page">，即 data 中间加了 jqm-
//$.mobile.ns = "jqm-";

*/

(function($) {
	var o = {};
	$.o = o;

	/** 默认配置 */
	o.config_default = {
		/** 用户登录页面的URL */
		user_login_page_url: "login.html",

		/** 用户手势解锁页面的URL */
		uesr_gestrue_page_url: "gesture.html",

		/** 用户登录请求的URL */
		user_login_url: "",

		/** 默认用户头像的URL */
		user_default_avatar_url: (window.assets ? window.assets.baseBro : "") + "bropen/img/avatar-default.png",

		/** 保持登录的间隔，单位毫秒 */
		// TODO 仅当使用 jsessionid 来维持登录状态的情况下，才用这种方式；如该是大型的应用，应该用缓存服务器来保持登录状态
		user_login_interval: null, //20 * 60 * 1000,

		/** 需登录的页面 */
		pages_authenticated : [],
		/** 可匿名的页面 */
		pages_anonymous : [],

		/** 登录后的默认首页地址 */
		home_page_url : "index.html",

		/** 列表页每页默认数据条数 */
		listloader_page_max : 10,

		/** 后台服务器地址（注：支持数组，但server_url_pattern配置必须同时为数组） */
		server_url : "",

		/**
		 * 用于匹配后台服务器地址的URL正则表达式
		 * 所有 ajax 请求会被自动拦截，并修改 url 参数，添加 server_url 前缀。如 /\/Foobar\//g
		 * 注：支持数组
		 */
		server_url_pattern: null,

		/** 添加前缀或替换前缀，默认false：添加前缀（注：支持数组，但server_url_pattern配置必须同时为数组） */
		server_url_replace : false,

		/** 调用后台服务时，是否在 URL 参数前拼上 ;jsessionid=xxx（注：支持数组，但server_url_pattern配置必须同时为数组） */
		server_url_jsessionid: true,

		/** swiper默认配置 */
		swiper_config : {
			pagination: '.page-current .swiper-pagination',
			paginationClickable: true,
			autoplay: 3000,
			loop: true,
			centeredSlides: true,
			calculateHeight : true,
			autoplayDisableOnInteraction: false
		}
	};

	$(document).one('pageInit', '#index', function(e, id, page) {
		var el = this, args = arguments;
		// 启用跨域支持
		$.support.cors = true;
		// 初始化页面相关
		o.page.init.apply(el, args);

		$(function() {
			// 合并配置，并生成新的 o._config -- 再合一次
			o._config = $.extend({}, o.config_default, o.config);
			// 初始化light7 i18n
			$.modal.prototype.defaults.modalButtonOk = o.i18n.m('o.dialog.confirm');
			$.modal.prototype.defaults.modalButtonCancel = o.i18n.m('o.dialog.cancel');
			$.modal.prototype.defaults.modalPreloaderTitle = o.i18n.m('o.dialog.preloaderTitle');
			$.modal.prototype.defaults.actionsCloseByOutside = true;
			// 首页再次触发pageInit事件，用于首页组件初始化
			page.data('url', o._config.home_page_url)
				.attr('data-url', encodeURIComponent(o._config.home_page_url))
				.trigger("pageInit", [id, page]);
			// 替换所有后台 ajax 请求的 url
			$(document).on("ajaxStartAny", function(e, setting) {
				if ( setting.silent !== true ) $.showPreloader();
				setting.url += ( setting.url.indexOf('?') > 0 ) ? '&' : '?';
				if ( !setting.url.startsWith("http") && o._config.server_url_pattern ) {
					setting.url += '_=' + (+new Date());
					var result = o.util.url.getUrls(setting.url),
						sessionid = o.user.sessionid instanceof Array ? o.user.sessionid[result.index] : o.user.sessionid;
					// 设置请求为ajax请求
					if ( setting.data instanceof FormData ) {
						setting.data.append( 'ajax', true );
					} else if ( typeof setting.data == 'string' ) {
						setting.data = setting.data ? (setting.data + '&') : '';
						setting.data += 'ajax=' + true;
					} else if ( $.isPlainObject(setting.data) ) {
						setting.data.ajax = true;
					}
					if ( result.pattern ) {
						setting.url = result.url;
						if ( setting.data instanceof FormData ) {
							if ( sessionid ) setting.data.append( 'sessionId', sessionid );
							setting.data.append( 'userAgent', navigator.userAgent );
						} else if ( typeof setting.data == 'string' ) {
							setting.data = setting.data ? (setting.data + '&') : '';
							setting.data += 'userAgent=' + navigator.userAgent;
							if ( sessionid ) setting.data += '&sessionId=' + sessionid;
						} else if ( $.isPlainObject(setting.data) ) {
							setting.data = $.extend(setting.data, {sessionId : sessionid, userAgent : navigator.userAgent});
						}
					}
				} else {
					setting.url += '_=' + assets.ver;
				}
			});
			// 登录到首页
			o.page.loginHomepage.apply(el, args);
			// 初始化覆盖niceValidate的消息提示方法
			$.validator.prototype._makeMsg = function(el, field, ret) {
				if ( ret.msg != null )
					o.dialog.alertError( ret.msg );
			};
		});
	});

	/**
	 * 页面及导航
	 */
	o.page = new function() {
		var me = this,
			rootUri = null,
			container = null;

		/** 所有HTML页面存放的根URI，如 http://..../app/ */
		this.__defineGetter__("rootUri", function() {
			return rootUri;
		});

		/** 页面容器的 jq 对象，默认为 body */
		this.__defineGetter__("container", function() {
			return container;
		});

		/** 初始化 */
		this.init = function() {
			// 首页
			var uri = o.util.url.parse(location.href);
			rootUri = uri.domain + uri.directory;

			container = $("body");

			_initLoginInterceptor.apply(this, arguments);
			_initPageElements.apply(this, arguments);
			_initPageEvents.apply(this, arguments);
			_initArtTemplate.apply(this, arguments);
		};

		function _initLoginInterceptor() {
			// 监听ajax加载页面前的自定义事件，拦截未授权请求，并采用欺骗 jQM 的方式重定向到登录页
			// BTW：其实用 jQM 自带的事件 beforeload 也可以，不过怕 app 自己监听做其他用，此外在真正执行 ajax 方法前还有一些退出条件，因此加一个事件最合适
			$(window).on('beforeload_ajax', function( event, router, url ) {
				if ( !o.page.authorize(url) ) {
					$(document).one("ajaxStartAny", function(e, setting) {
						// TODO 风险：如果同时有多个ajax请求，此处应判断是否为 ui.toPage 页面对应的请求
						//if ( setting.url.startsWith( ui.absUrl ) ) {
						// 欺骗 jQM，实际加载登录页（setting 属性是通过修改 jQuery 源码来的）
						// 但此时浏览器的 location 和历史记录都是目标 url：）
						setting.url = o._config.user_login_page_url;
						// 登录成功后，再 replace 到实际的页面
						var toUrl = url,
							options = {reload: true, transition: "none"};
						o.user._callback_success_login = function() {
							console.log( "login succes, continue to: " + toUrl );
							me.one("pageSwitched", ".page", function(e, page) {
								$.router.removePage(page);	// 删除登录页：由于 page div 的 data-url 属性是一样的，因此 jQM 无法自动删除
							});
							me.overwrite(toUrl, options);
						};
						//}
					});
				}
			});
		}

		function _initPageElements() {
			// 监听打电话
			$(document).on('click', '[data-o-tel]', function() {
				location.href = 'tel:' + $(this).data('tel');
			});
			// 监听发短信
			$(document).on('click', '[data-o-sms]', function() {
				location.href = 'sms:' + $(this).data('sms');
			});
			// 监听页面跳转
			$(document).on('click', '[data-o-url-change]', function() {
				me.change($(this).data("o-url-change"), {
					transition: $(this).data("transition"),
					reverse: $(this).data("direction") === "reverse",
					data: $(this).data("o-url-params"),
					reload: $(this).data("o-url-reload")
				});
			});
			$(document).on('click', '[data-o-url-replace]', function() {
				me.replace( $(this).data("o-url-replace"), {
					transition: $(this).data("transition"),
					reverse: $(this).data("direction") === "reverse",
					data: $(this).data("o-url-params"),
					reload: $(this).data("o-url-reload")
				});
			});
			// 返回
			$(document).on('click', '[data-o-url-back]', function(e) {
			  /*  if ( $.mobile.navigate.history.activeIndex == 0 ) {
					// 如果是注销后被登录页覆盖的匿名首页，则 overwrite 回首页
					if ( $.mobile.firstPage.data("_loggedout") ) {
						me.homepage({method: "overwrite", _page: $.mobile.firstPage});
					}
					// TODO 如果第一页不是首页，而是其他页面，则 replace 为首页；安卓返回键处（o.native.android.backbutton.click）同。
				} else {
					me.back();
				}*/
				if ( o.page.history.backs.length == 0 ) {
				} else {
					me.back();
				}
				e.preventDefault();
			});
			// 前进后退
			$(document).on('click', '[data-o-url-go]', function(e) {
				me.go( $(this).data('o-url-go') );
				e.preventDefault();
			});
			// 登录
			$(document).on('click', '[data-o-login]', function(event) {
				me.login();
				event.preventDefault();
			});
			// 注销
			$(document).on('click', '[data-o-logout]', function(event) {
				me.logout();
				event.preventDefault();
			});
			// 显示下拉菜单
			$(document).on('click', "[data-o-dropmenu-target]", function() {
				var follow = $(this),
					target = $(this).data("o-dropmenu-target");
				o.dialog.dropmenu({target: target, follow: follow});
			});
			// 拍照或选择图片并预览
			$(document).on("click", "[data-o-picture]", function( event ) {
				if ( o.native.enabled ) {
					var type = $(this).data("o-picture"),
						target = $(this).data("o-picture-target");
					if ( type && target ) {
						if ( type == "camera" ) {
							o.native.camera.takePhoto( function( imageData ) {
								me.activePage.find(target).attr("src", "data:image/jpeg;base64," + imageData);
							}, function() {
								o.dialog.alertError(o.i18n.m("o.picture.camera.failed"));
							}, null);
						} else if ( type == "album" ) {
							o.native.camera.choosePicture( function( imageData ) {
								me.activePage.find(target).attr("src", "data:image/jpeg;base64," + imageData);
							}, function() {
								o.dialog.alertError(o.i18n.m("o.picture.album.failed"));
							}, null);
						}
					}
				}
			});
			// 表单提交
			$(document).on("click", "[data-o-submit='true']", function( e ) {
				$(this).closest('form').submit();
				e.preventDefault();
				e.stopPropagation();
			});
		}

		var barIds = {}; // 存储底部导航页面对应的id
		function _initPageEvents(e, id, page) {
			/*me.on("beforehide", "*", function(event, ui) {
				// 页面隐藏前，隐藏所有模态窗口、折叠层
				$(".modal.in").modal('hide');
				$(".collapse.in").collapse('hide');

				// 隐藏表单验证提示消息，避免切换页面时（输入框失去焦点）再次触发验证
				$("#alertError").hide();

				// 解绑页面左右滑动事件
				$(document).off('.navbar-swipe');
			});*/

			/*me.on("show", "*", function(event, ui) {
				// 监听图片延迟加载
				setTimeout(function() {
					ui.toPage.find("img[data-original]")
						.lazyload({effect: "fadeIn"});
				}, 1);

				// 监听导航页面的左右滑动
				if ( ui.toPage.find("[data-o-navbar-swipe='true']").length ) {
					var $active = ui.toPage.find('[data-role="footer"] .active');
					if ( $active.index() < $active.siblings().length ) { // 可向左滑动
						$(document).on("swipeleft.navbar-swipe", function(e) {
							// 滑动头部、底部、放大的图片时，不切换页面
							if ( $(e.target).closest('div[data-role="header"], div[data-role="footer"]').length ) return;
							me.change($active.next().data('o-url-change'), {transition: "slide"});
						});
					}
					if ( $active.index() > 0 ) { // 可向右滑动
						$(document).on("swiperight.navbar-swipe", function(e) {
							// 滑动头部、底部、放大的图片时，不切换页面
							if ( $(e.target).closest('div[data-role="header"], div[data-role="footer"]').length ) return;
							me.change($active.prev().data('o-url-change'), {transition: "slide", reverse: true});
						});
					}
				}
			});*/

			$(window).on("o.native.keyboard.show", function() {
				/*// 软件盘显示时,修改错误提示框位置
				var keyboardHeight = o.native.keyboard.height;
				var $alertError = $("#alertError");
				var alertErrorBottom = $alertError.data('o-dialog-alertError-bottom') || parseInt( $alertError.css('bottom') );
				$alertError.data('o-dialog-alertError-bottom', alertErrorBottom).css('bottom', alertErrorBottom + keyboardHeight);*/

				// 安卓上点击非输入框时，部分手机输入法偶尔未收缩
				if ( o.native.device.platform == "Android" ) {
					$(window).one('click', ':not(input,textarea)', function() {
						o.native.keyboard.close();
					});
				}
			});

			// 软件盘显示时,还原错误提示框位置
			$(window).on("o.native.keyboard.hide", function() {
				var $alertError = $("#alertError");
				if ( !$alertError.data('o-dialog-alertError-bottom') )
					$alertError.css('bottom', $alertError.data('o-dialog-alertError-bottom'));
			});

			// Android下，监听软键盘的显示、隐藏事件
			if ( o.native.device.platform == "Android" ) {
				var $window = $(window);
				// 软件盘隐藏时，恢复页面位置
				$window.on("o.native.keyboard.hide", function() {
					var $el_margin_bottom = $('.o-keyboard-up-margin-bottom'),
						$keyboard_div = $("#o-keyboard-placeholder");
					if ( $el_margin_bottom.length )
						$el_margin_bottom.css( "margin-bottom", "" );
					if ( $keyboard_div.length )
						$keyboard_div.hide();
				});

				// 软键盘显示时，将页面往上顶，以显示当前焦点输入框
				var selector = 'input[type="text"],input[type="tel"],input[type="search"],input[type="password"],input[type="number"],input[type="email"],textarea';
				$(document).on("focus click", selector, popUpKeyboard);
				function popUpKeyboard( event ) {
					setTimeout(function() {
						var keyboardHeight = o.native.keyboard.height;
						if ( keyboardHeight ) {
							var $el = $(event.target),
								elTop = $el.offset().top,				// 当前元素距离文档页面顶部高度
								winTop = elTop - $window.scrollTop(),	// 当前元素距离可视区顶部高度
								elHeight = $el.outerHeight(),			// 当前元素本身的高度
								winHeight = $window.height();
							var $target, $modal = me.activePage.find('.modal.modal-in:visible');
							// 输入框在模态框上
							if ( $modal.length ) {
								$target = $modal;
								$target.addClass("o-keyboard-up-margin-bottom").css( "margin-bottom", keyboardHeight.toString() + 'px' );
								if ( winHeight - winTop - elHeight < keyboardHeight ) {
									$target.parent().scrollTop( keyboardHeight + elTop - winHeight + elHeight );
								}
							}
							// 输入框在page上
							else {
								$target = me.activePage.find(".content:visible");
								$target.addClass("o-keyboard-up-margin-bottom").css( "margin-bottom", keyboardHeight.toString() + 'px' );
								var headerHeight = parseInt( $target.css('top') );	// 顶部header高度
								if ( elTop > headerHeight && elTop + elHeight > winHeight - keyboardHeight ) {
									if ( elTop - headerHeight < keyboardHeight ) { // 输入框在屏幕的上半部分
										$target.scrollTop( elTop - headerHeight );
									} else { // 输入框在屏幕的下班部分
										$target.parent().scrollTop( keyboardHeight );
										$target.scrollTop( $target.scrollTop() + (elTop - headerHeight - keyboardHeight) );
									}
								}
							}
						}
					}, 200);
				}
			}

			me.on("pageAnimationStart", "*", function(event, page) {
				_initBar(event, page);
				_initSlide(event, page);
				_init(event, page);
			});

			/* 监听模板加载成功 */
			$(document).on('o.template.success', '*', function(e, data) {
				_init(e, $(this));
			});

			/* 监听跳转掉其他页面前 */
			me.on('beforePageSwitch', '*', function(e, page) {
				// 停止轮播图
				page.find('[data-o-swiper_="true"]').each(function(i, el) {
					el.swiper.stopAutoplay();
				});
				// 隐藏modal
				$.closeModal();

				var activePanel = $('.panel:visible'); // TODO 临时解决bug：进入页面a，点击按钮测栏打开，点击侧边栏的链接跳转后,再返回页面a，点击按钮，侧栏不能再弹出。
				if ( activePanel.length ) {
					// 隐藏侧边栏
					$.closePanel();
					me.one('pageInitInternal', '*', function(e, page) {
						if ( !$.allowPanelOpen ) {
							var activePanel = $('.panel:visible');
							activePanel.css({display: ''});
							activePanel.trigger('closed');
							$('body').removeClass('panel-closing');
							$.allowPanelOpen = true;
						}
					});
				}

				// 删除页面前将底部导航挪到body中
				var $bar = page.find('.bar-tab');
				if ( $bar.length ) $bar.prependTo(document.body);
			});

			/* 监听页面删除前 */
			me.on('beforePageRemove', '*', function(e, page) {
				var pageExts = page.data('pageExt');
				// 删除popover等
				if ( pageExts ) {
					$.each(pageExts, function(k, v) {
						v.remove();
					});
				}
			});

			_initBar(e, page, true);
			_initSlide(e, page);

			/**
			 * 初始化页面元素
			 * @param e
			 * @param $container
			 * @private
			 */
			function _init(e, $container) {
				// 面板、popup、popover挪到body中，否则样式显示出错
				var $page = $container.closest('body .page');
				if ( $page && $page.length ) {
					// add 将组件绑定到page上，方便从page上获取组件
					if ( !$page.data('pageExt') ) $page.data('pageExt', {});
					var pageExt = $container.find(".popup, .popover, .panel, .panel-overlay").appendTo(document.body);
					if ( pageExt.length ) {
						pageExt.each(function(i, el) { // 注：popover必须加id
							var $el = $(el), id = el.id ? el.id : 'pageExt-' + (+new Date());
							$page.data('pageExt')[id] = $el;
						});
					}
					// 修改popover的选择器id，避免选中其他页面
					$page.find('[data-popover]:not([data-o-popover-init])').each(function(i, el) {
						var $el = $(el),
							id = $el.data('popover').substring(1),
							newId = id + '-' + (+new Date()),
							desc = $page.data('pageExt')[id];
						if ( desc && desc.attr('id') == id ) {
							desc.attr('id', newId);
							$el.attr('data-popover', '#' + newId);
						}
					}).attr('data-o-popover-init', true);
				}

				// 监听列表下拉刷新、上拉加载更多/点击加载更多/自动加载更多
				$container.find("[data-o-listloader='true']").each(function(i, el) {
					var $el = $(el);
					$el.listloader({
						templateId:	$el.data('o-listloader-template-id'),
						url:		$el.data('o-listloader-url'),
						max:		$el.data('o-listloader-max'),
						type:		$el.data('o-listloader-type'),
						params:		$.extend(o.util.url.getParameters($container.data('url')), $el.data('o-listloader-params')),
						reload:		$el.data('o-listloader-reload')
					});
				}).removeData("o-listloader").removeAttr('data-o-listloader');

				// 监听二维码生成
				$container.find("[data-o-qrcode-text]").each(function(i, el) {
					var $el = $(el);
					$el.append(new AraleQRCode($.extend({}, {
						text:			$el.data('o-qrcode-text'),
						size:			$el.data('o-qrcode-size'),
						background:		$el.data('o-qrcode-color-bg'),
						foreground:		$el.data('o-qrcode-color-fg'),
						pdground:		$el.data('o-qrcode-color-corner'),
						image:			$el.data('o-qrcode-image-url'),
						imageSize:		$el.data('o-qrcode-image-size')
					})));
				}).removeData('o-qrcode-text').removeAttr('data-o-qrcode-text');

				// swiper
				// 再次进入该页面
				if ( e.type == 'pageAnimationStart' ) {
					$.reinitSwiper($container);
					$container.find('[data-o-swiper_="true"]').each(function(i, el) {
						el.swiper.startAutoplay();
					});
				}
				// 首次加载
				$container.find('[data-o-swiper="true"]').each(function(i, el) {
					var $el = $(el).addClass('swiper-container');
					$el.data($.extend(o._config.swiper_config, $el.data()));
				}).removeData("o-swiper").removeAttr('data-o-swiper').attr('data-o-swiper_', true);
				if ( e.type != 'pageAnimationStart' ) $.initSwiper($container);

				// datetimepicker
				$container.find('[data-o-timepicker="true"]').each(function() {
					$(this).datetimePicker();
				}).removeData("o-timepicker").removeAttr('data-o-timepicker');

				// 通过 validator 插件监听表单提交事件，并进行 ajax 提交
				$container.find("form[data-o-form='true']").each(function() {
					me.bindForm($(this));
				}).removeData("o-form").removeAttr('data-o-form');
			}

			/**
			 * 初始化底部导航
			 * @param e
			 * @param page
			 * @private
			 */
			function _initBar(e, page, isInit) {
				var barUrl = page.data('o-bar'),
					barId = page.data('o-bar-id');
				if ( isInit ) {
					$(document.body)[barUrl ? 'removeClass' : 'addClass']("tabbar-hidden");
				}
				if ( !page.hasClass('page-inited' ) || isInit ) {
					if ( barUrl ) {
						page.removeClass('no-tabbar');
						if ( barIds[barUrl] && $('#' + barIds[barUrl]) ) {
							renderBar();
						} else {
							$.get(barUrl, function(html) {
								var params = $.extend({}, {$:$, window:window}, {barId:barId});
								var bar = $('<div>'+template.compile(html)( params )+'</div>').find('.bar-tab');
								if ( !bar.attr('id') ) bar.attr('id', 'bar-' + new Date().getTime());
								barIds[barUrl] = bar.attr('id');
								$('.page-group').prepend(bar); // 移到page-group中，这样就可以和别的页面共用导航
								renderBar();

								bar.on('click', 'a.tab-item[href], .tab-item[data-o-url-change]', function(e) {
									var $el = $(this);
									if ( $el.hasClass('active') ) {
										e.preventDefault();
										e.stopPropagation();
										return;
									}
									if ( $el.index() < bar.find('.tab-item.active').index() ) {
										e.preventDefault();
										e.stopPropagation();
										o.page.change( $el.attr('href') || $el.data('o-url-change'), {reverse:true} );
									}
								});
							});
						}
					} else {
						page.addClass('no-tabbar');
					}
				} else {
					renderBar();
				}
				function renderBar() {
					var $bar = $('#' + barIds[barUrl]);
					$('.bar-tab:visible').not( $bar ).hide();
					if ( $bar.length ) {
						if ( barId ) { // 高亮显示当前底部导航项
							$bar.find('#bar-' + barId).addClass('active')
								.siblings('.active').removeClass('active');
						}
						if ( isInit ) {
							moveBar();
						} else {
							// 进入页面后，将底部导航挪到页面中。移动过程中，如果再点击别的页面，取消导航移动
							page.one('pageAnimationEnd', moveBar).one('beforePageSwitch', function() {
								page.off('pageAnimationEnd', moveBar);
							});
						}
						function moveBar() {
							if ( page.is(':visible') ) $bar.prependTo(page).show();
						}
					}
				}
			}

			/**
			 * 初始化侧边导航
			 * @param e
			 * @param page
			 * @private
			 */
			function _initSlide(e, page) {
				if ( page.data('o-slide') ) {
					//$.allowPanelOpen = true;
					$.enableSwipePanels();
				} else {
					//$.allowPanelOpen = false;
					$.disableSwipePanels();
				}
			}
		}

		var templates = {}, templateKeys = "";
		function _initArtTemplate() {
			var args = arguments;
			// 自动渲染模板片段
			o.page.pageInitExec(function() {
				renderArtTemplate(args[0], $('body'));
			});
			me.on("loaded", '*', renderArtTemplate);			// 其他页面在加载后、添加jQM样式/事件之前
			me.on('pageAnimationStart', '*', renderArtTemplate);

			// -- 渲染模板片段
			function renderArtTemplate( event, page ) {
				var selectorSuffix = "[data-o-template-onload='true']";
				if ( event.type.endsWith("pageAnimationStart") )
					selectorSuffix = ":not(" + selectorSuffix + ")";
				else if ( event.type == 'pageInit' )
					selectorSuffix = "";

				renderTemplates( page, page, selectorSuffix, o.util.url.getParameters(page.data('url')) );
				//ui.toPage.find(".__script").removeClass("__script");
			}
			function renderTemplates( page, container, selectorSuffix, params, silent ) {
				// 渲染模板片段
				renderFragment( container, params );

				// 渲染子模板等
				var selectors = [];
				selectors.push("[data-o-template-include]" + selectorSuffix);	// 子模板
				selectors.push("[data-o-template-script-id]" + selectorSuffix);	// 模板ID
				if ( container.is(selectors.join(",")) &&
					( container.hasClass('page') || container[0] == document.body ) ) { // 防止重复加载
					getTemplate( container, params, null, silent );
				} else {
					container.find(selectors.join(",")).each(function () {
						getTemplate( $(this), params, null, silent );
					});
				}

				/**
				 * 加载模板
				 * @param $el
				 * @param params
				 * @param callback
				 * @param silent	沉默模式，ajax不会出现刷新层
				 */
				function getTemplate( $el, params, callback, silent ) {
					var async = !!$el.data("o-template-async"),
						url = $el.data("o-template-include");
					if ( url ) {
						if ( !templateKeys.contains("#" + url + "#") ) {
							templateKeys += "#" + url + "#";	// 不能直接用 templates[url] 来判断？？
							$.ajax( url, {
								type: "GET",
								async: async,
								silent: silent,
								dataType: 'html'
							}).done(function ( html ) {
								templates[url] = html;
								var $el_new = renderInclude( $el, url );
								if ( $el_new && $el_new.length ) {
									$el_new.each(function (i, el) {
										getTemplate( $(el), params, callback, silent );
									});
								} else {
									getData( $el, params, callback, silent );
								}
							}).fail(function ( jqXHR, textStatus, errorThrown ) {
								var event = $.Event("o.template.fail");
								$el.trigger( event, arguments );
								if ( !event.isDefaultPrevented() && textStatus ) {
									o.dialog.alertError({body: textStatus, duration:0});
								}
								if ( $el.data('o-template-fail-back') === true &&
									$el.closest('body .page').data('fail') !== true ) {
									$el.closest('body .page').data('fail', true);
									o.page.back();
								}
							})
						} else {
							var $el_new = renderInclude( $el, url );
							if ( $el_new && $el_new.length ) {
								$el_new.each(function (i, el) {
									getTemplate( $(el), params, callback, silent );
								});
							} else {
								getData( $el, params, callback, silent );
							}
						}
					} else {
						getData( $el, params, callback, silent );
					}

					function renderInclude( $el, url ) {
						var isScript = !!$el.data("o-template-include-script");
						if ( !isScript ) {
							if ( $el.data('o-template-replace') ) {
								var $el_new = $(templates[url]);
								$el.replaceWith($el_new);
								return $el_new;
							} else $el.html(templates[url]);
						}
					}
				}

				// 加载数据
				function getData( $el, params, callback, silent ) {
					var async = !!$el.data("o-template-async"),
						params2 = $el.data("o-template-params");
					if ( typeof params2 == 'string' )
						params2 = eval("(" + params2 + ")");
					params = $.extend(params, params2);

					var url = $el.data("o-template-data-url"),
						urlParams = $.extend(params, $el.data("o-template-data-params"));
					$el.data("o-template-url-params", urlParams);
					if ( url ) {
						$el.trigger('o.template.data.beforeload', {url: url, data: urlParams});
						o.page.pageInitExec(function() {
							if ( silent !== true ) $.showPreloader(); // 解决bug：模板渲染页面，如果加载时间太长，页面出现长时间空白
							$.ajax( url, {
								type: "POST",
								data: urlParams,
								async: async,
								silent: silent,
								dataType: 'json'
							}).done(function ( data ) {
								if ( silent !== true ) $.showPreloader(); // 解决bug：模板渲染页面，如果加载时间太长，页面出现长时间空白
								if (typeof data == 'string')
									data = eval("(" + data + ")");
								$el.trigger('o.template.data.loaded', data);
								params = $.extend(params, data);
								renderTemplate($el, params, callback, silent);
							}).fail(function ( jqXHR, textStatus, errorThrown ) {
								var event = $.Event("o.template.fail");
								$el.trigger( event, arguments );
								if ( !event.isDefaultPrevented() && textStatus ) {
									o.dialog.alertError({body: textStatus, duration:0});
								}
								if ( $el.data('o-template-fail-back') === true &&
									$el.closest('body .page').data('fail') !== true ) {
									$el.closest('body .page').data('fail', true);
									o.page.back();
								}
							});
						});
					} else {
						renderTemplate($el, params, callback, silent);
					}
				}

				function renderTemplate( $el, params, callback, silent ) {
					var url = $el.data("o-template-include"),
						isReplace = $el.data('o-template-replace');
					if ( url ) {
						$el.attr("data-o-template-include_", url);
						var isScript = !!$el.data("o-template-include-script");
						if ( isScript ) {
							if ( isReplace ) {
								var $el_new = $(compile(templates[url], params));
								$el.replaceWith($el_new);
								$el = $el_new;
							} else $el.html(compile(templates[url], params));
						}
					} else {
						var scriptId = $el.data("o-template-script-id");
						if ( scriptId ) {
							params = $.extend( {$: $, page: page, window: window}, params );
							if ( isReplace ) {
								var $el_new = $(template(scriptId, params));
								$el.replaceWith($el_new);
								$el = $el_new;
							} else $el.html( template(scriptId, params) );
							if ( $el.data('o-template-fixed') ) {
								$el.removeData("o-template-fixed").removeAttr("data-o-template-fixed")
									//.removeData("o-template-script-id")
									.removeAttr("data-o-template-script-id");
							}
						}
					}
					// 避免重复加载模板
					$el.removeAttr("data-o-template-include").removeData("o-template-include");
					// 递归
					if ( container[0] != $el[0] )
						renderTemplates( page, $el, selectorSuffix, params, silent );
					// 事件
					$el.trigger('o.template.success', params);
					if ( $el.data("o-template-refresh-interval") && !$el.data("o-template-refresh") ) {
						$el.data("o-template-refresh", setInterval(function() {
							if ( $el.closest(document).length ) { // $el还存在于浏览器中
								getTemplate( $el, $el.data("o-template-url-params"), null, true );
							} else { // $el已经被删除
								clearInterval( $el.data("o-template-refresh") );
							}
						}, $el.data("o-template-refresh-interval")) );
					}
					$.hidePreloader();
					if ( params.success === false ) {
						// 不显示连续三个回车后的内容（约定）
						if ( params.message instanceof Array ) {
							$.o.dialog.alertError(params.message.join("\n").replace(/\r?\n\r?\n\r?\n(.|[\r\n])+/,""));
						} else {
							$.o.dialog.alertError( String(params.message).replace(/\r?\n\r?\n\r?\n(.|[\r\n])+/,"") );
						}
					}
				}

				function renderFragment( $el, params ) {
					$el.find("[data-o-template-fixed='true']:not([data-o-template-script-id])" + selectorSuffix).each(function () {
						var $el = $(this),
							html = $el.prop("outerHTML"),
							$elNew = $( compile(html, params, $el.data("o-template-params")).replace(/\\{/g, "{").replace(/\\}/g, "}") ); // 模板中嵌套模板，子模板可以用{\{..}\}方式使用模板语句
						$el.replaceWith($elNew);	// 采用 replace 的方式，这样可以不用外部容器、并且可以处理容器属性中的模板片段
						$elNew.removeData("o-template-fixed").removeAttr("data-o-template-fixed");
					});
					$el.find("[data-o-template-dynamic='true']" + selectorSuffix).each(function () {
						var $el = $(this),
							html = $el.data("o-template-dynamic-html") || $el.prop("outerHTML"),
							$elNew = $( compile(html, params, $el.data("o-template-params")).replace(/\\{/g, "{").replace(/\\}/g, "}") );
						$el.replaceWith($elNew);
						if ( $el.data('o-template-fixed') ) {
							$el.removeData("o-template-fixed").removeAttr("data-o-template-fixed")
								.removeData("o-template-dynamic").removeAttr("data-o-template-dynamic");
						} else {
							$elNew.data("o-template-dynamic-html", html);
						}
					});
				}

				function compile( html, params, params2 ) {
					if ( typeof params == "string" ) params = eval("(" + params + ")");
					if ( typeof params2 == "string" ) params2 = eval("(" + params2 + ")");
					params = $.extend( {$: $, page: page, window: window}, params, params2 );

					var newHtml = template.compile(html)( params );
					return newHtml.replace(/data-src=/g, 'src=');	// TODO 硬编码：有没有更好的方法呢？
				}
			}
		};

		/**
		 * 页面初始化后执行方法
		 * @param callback
		 */
		this.pageInitExec = function(callback) {
			var args = [].slice.call(arguments, 1),
				me = this;
			if ( o.page._config ) {
				callback.apply(me, args);
			} else {
				$(function() {
					callback.apply(me, args);
				});
			}
		}

		/**
		 * 通过 validator 插件监听表单提交事件，并进行 ajax 提交
		 * app 中，可以在 beforeshow 等后来事件中，覆盖 $form.validator 的事件实现自定义提交
		 */
		this.bindForm = function($form) {
			$form.validator(function() {
				$.showPreloader();
				if ( $form.data('doing') ) return;
				$form.data('doing', true);
				// 提交表单 (包含图片 & 文件上传)
				// TODO 图片裁剪结果
				var formData = new FormData( $form[0] );
				// 绑定表单里面要上传的图片
				$form.find("img[data-o-form-img='true']").each(function( i, el ) {
					var base64 = $(el).attr('src'),
						name = $(el).attr("name");	// 表单字段名
					if ( base64.indexOf("base64") != -1 && name ) {
						// 如果是base64字符串(防止url类型的src)，则拼到 formdata 中
						var blob = base64.split(',')[1].toBlob( "image/jpeg" );
						formData.append( name, blob, name + ".jpg" );
					}
				});
				// ajax提交表单
				$.ajax( $form.attr("action"), {
					type: "POST",
					data: formData,
					processData: false,   // 告诉jQuery不要去处理发送的数据
					contentType: false,   // 告诉jQuery不要去设置Content-Type请求头
					dataType: 'json',
					alertMsg: false
				}).done(function ( data ) {
					var event = $.Event("o.submit.done");
					$form.trigger( event, arguments );
					if ( !event.isDefaultPrevented() && typeof(data) == "object"
						&& data.success === false && data.message ) {
						o.dialog.alertError({body: data.message, duration:0});
					}
				}).fail(function ( jqXHR, textStatus, errorThrown ) {
					var event = $.Event("o.submit.fail");
					$form.trigger( event, arguments );
					if ( !event.isDefaultPrevented() && textStatus ) {
						o.dialog.alertError({body: textStatus, duration:0});
					}
				}).always(function () {
					$form.removeData('doing');
					$.hidePreloader();
				});
			});
			return $form;
		};

		/**
		 * app 启动时，登录到首页
		 *
		 * 登录策略：
		 * 1、如果首页不需要登录（可匿名访问的）
		 *		从缓存加载 user 信息，然后显示首页，同时异步 login 一下更新 user session
		 *		假如 login 失败，清理 user 信息。
		 * 2、如果首页需要登录
		 *		从缓存加载 user，没有自动重定向到登录页，
		 *		如有则先 login 一下更新 session，如果 login 失败，则重定向到登录页，否则显示首页
		 */
		this.loginHomepage = function(e, id, page) {
			/*
			测试用例：
			1、将index设为不允许匿名
				1.1 打开首页，需登录
				1.2 打开首页，需登录，输入用户名、密码执行登录，关闭浏览器或F5刷新，直接进入首页
			 	1.3 打开首页，需登录，执行登录，登录成功后，修改 login.json 的 success 为 false，关闭浏览器或F5刷新，需重新登录
			 		输入用户名、密码执行登录，失败，重新返回登录页，但是浏览器历史仍然是1
			 	1.4 注销后，进入登录页；运行 $.o.page.homepage()，仍然跳到登录页
			 	1.5 如果是android，注销后，点退回按钮，则显示是否退出app
			2、将index设为允许匿名
				2.1 未登录的情况下，刷新打开首页，显式匿名
				2.2 登录的情况下，刷新打开首页，显式当前登录用户，后台有ajax登录请求
				2.3 修改 login.json 的 success 为 false，然后同2.2操作：
					后台有ajax登录请求，对当前首页显式无影响，但 $.o.user.loggedin、$.o.user.loggedout 均为 false
			 	2.4 注销后，进入登录页；运行 $.o.page.homepage()，打开首页
			 	2.5 注销后，在登录页上点安卓的退回按钮、或者点返回按钮，则打开首页
			*/

			// 首页是否需要登录
			var needLogin = !me.authorize(o._config.home_page_url);

			// default intercept: if not loggedin, then overwrite with login page
			/*me.on("pageInit", ".ui-page:first", function(event, ui) {
				//console.log(3);
				if ( me._loggedout || needLogin ) {
					console.log("logout (case 1.3、1.5、1.7、1.8、1.9) or visit homepage without login (case 1.1、1.3).");
					var page = ui.toPage;
					if ( me._loggedout && !needLogin ) page.data("_loggedout", true); // for case loginHomepage >> 2.5
					delete me._loggedout;	// for case loginHomepage >> 2.4 & 1.4
					// 用户注销
					o.user.logout();
					// 修改 jQM 的历史记录
					$.mobile.navigate.history.activeIndex = 0;
					$.mobile.navigate.history.stack.splice(1);
					$.mobile.navigate.history.previousIndex = undefined;
					// 删除所有 .ui-page
					$(".ui-page:gt(0)").remove();
					// 重定向到登录
					me.login({method: "overwrite", transition: 'slide', success: function() {
						// 重定向到首页
						page.removeData("_loggedout");
						me.homepage({method: "overwrite", _page: page});
					}});
				}
			});*/

			// 从缓存加载 user
			o.user.init();
			console.log("homepage = " + o._config.home_page_url + ", homepage need login = " + needLogin + ", loggedin status == " + o.user.loggedin);
			// 首页需要登录
			if ( needLogin ) {
				if ( o.user.loggedin ) {
					// try sync login again before show page:
					// failed  -> overwrite with login page			----> 上面的 default 事件
					// success -> do nothing
					//console.log(1);
					o.user.login(null, {quiet: true, async: false});
					/*o.user.login(null, {quiet: true, async: false, failedForce: function() {
						console.log(2)
						console.log("relogin by cache failed, goto login!")
						//me.logout();
					 	$.showPreloader();
						me.one("beforeshow", "*", function() {
							me.login({method: "overwrite", transition: 'slide', success: function() {
								me.homepage({method: "overwrite"});
							}});
						});
					 }});*/
				} else {
					// overwrite with login page before show page	---> 上面的 default 事件
					/*$.showPreloader();
					var page = me.activePage;
					me.one("beforeshow", "*", function(event, ui) {
						me.login({method: "overwrite", transition: 'slide', success: function() {
							// 重新渲染首页子模板
							page.find("[data-o-template-include_]").each(function(){
								var $el = $(this);
								$el.attr("data-o-template-include", $el.attr("data-o-template-include_"));
							});
							// 重定向到首页
							me.homepage({method: "overwrite"});
						}});
					});*/
					if ( me._loggedout && !needLogin ) page.data("_loggedout", true); // for case loginHomepage >> 2.5
					delete me._loggedout;	// for case loginHomepage >> 2.4 & 1.4
					// 用户注销
					o.user.logout();
					$.router.stack.setItem("back", "[]"); // 清除历史记录
					// 修改 jQM 的历史记录
					/*$.mobile.navigate.history.activeIndex = 0;
					$.mobile.navigate.history.stack.splice(1);
					$.mobile.navigate.history.previousIndex = undefined;*/
					// 删除所有 .ui-page
					//$(".ui-page:gt(0)").remove();
					// 重定向到登录
					if ($.o.util.cache.get("gesturepwd")){
						me.gesture({method: "overwrite", transition: 'slide', success: function() {
							// 重定向到首页
							me.homepage({method: "overwrite", reload: true, _page: page});
						}});
					} else {
						me.login({method: "overwrite", transition: 'slide', success: function() {
							// 重定向到首页
							page.removeData("_loggedout");
							me.homepage({method: "overwrite", reload: true, _page: page});
						}});
					}
				}
			}
			// 首页不需要登录
			else {
				if ( o.user.loggedin ) {
					// try async login again, and do nothing even failed
					o.user.login(null, {quiet: true, async: true});
				} else {
					// do nothing
				}
			}
		};

		/**
		 * 打开登录页
		 *
		 * @param options.method	跳转到登录页面的方法，默认为 change，还可为 replace、overwrite
		 * @param options.success	登录成功的回调方法，可接收服务器返回的 json 数据作为参数
		 * @param options.*			其他页面加载参数，见 http://api.jquerymobile.com/pagecontainer/#method-change
		 */
		this.login = function( options ) {
			options = options || {};
			// 记录登录回调方法
			o.user._callback_success_login = options.success;
			delete options.success;
			// 打开登录页
			if ( !options.method ) options.method = "change";
			this[options.method]( o._config.user_login_page_url, options );
		};

		/**
		 * 打开手势解锁页
		 */
		this.gesture = function( options ) {
			options = options || {};
			// 记录登录回调方法
			o.user._callback_success_login = options.success;
			delete options.success;
			// 打开登录页
			if ( !options.method ) options.method = "change";
			this[options.method]( o._config.uesr_gestrue_page_url, options );
		}

		/** 替换 history.go 方法，修正 jQM 的历史堆栈信息，避免注销后无法退回到首页所在的位置 */
		/*history._go = history.go;
		history.go = function( steps ) {
			if ( !steps ) return;
			var len = $.mobile.navigate.history.stack.length,
				aidx = $.mobile.navigate.history.activeIndex;
			if ( steps < 0 && -steps > aidx ) {
				return history.go( -aidx );
			} else if ( steps > len - aidx - 1 ) {
				return history.go( len - aidx - 1 );
			}

			if ( steps > 1 || steps < -1 ) {
				me.one("change", "*", function () {
					console.log("history.go == " + steps);
					$.mobile.navigate.history.activeIndex = aidx + steps;
				});
			}
			history._go(steps);
		};*/

		/**
		 * 注销
		 *
		 * 1、注销后始终显示登录页，并且浏览器历史无法再往前退
		 * 2、在登录页点返回键返回时，则提示退出app
		 * 3、到首页后，点返回键提示退出 app
		 *
		 * @param options.succes	注销成功的回调方法
		 */
		this.logout = function( options ) {
			/*
			 测试用例
			 1、将index设为不允许匿名
			 1.1 打开首页，显示登录页；登录到首页，然后点注销，显示登录页
			 1.2 打开首页，显示登录页，登录后，刷新，直接进入首页，然后点注销，显示登录页
			 1.3 打开首页登录，切换不同的页面×2，退回1次，然后点注销，显示登录页
			 1.4 打开首页登录，切换不同的页面×2，退回2次(回到首页)，然后点注销，显示登录页
			 1.5 打开首页登录，切换不同的页面×2，再反复切换两次（共6次），运行 history.go(-4)，当前页面不变，然后点注销，显示登录页
			 1.6 打开首页登录，切换不同的页面×2，再反复切换一次（共4次），运行 history.go(-4)，回到首页，然后点注销，显示登录页
			 1.7 打开首页登录，切换一次页面，然后点注销，显示登录页
			 1.8 打开首页登录，切换不同的页面×2，再反复切换两次（共6次），运行 history.go(-4)、history.go(4)，当前页面不变，然后点注销，显示登录页
			 1.9 打开首页登录，切换不同的页面×2，再反复切换一次（共4次），运行 history.go(-4) 退回首页、history.go(4)，当前页面不变，然后点注销，显示登录页
			 2、将index设为允许匿名
			 2.1 未登录的情况下，打开首页，点注销，进入登录页，F5刷新，直接进入匿名的首页
			 2.2 未登录的情况下，打开首页，点注销，进入登录页，登录后，F5刷新，直接进入首页，并显示登录名
			 2.3 登录的情况下，打开首页，点注销，进入登录页，F5刷新，直接进入匿名的首页
			 2.4 未登录的情况下，打开首页，多次切换不同页面，在不是首页的页面中点注销，进入登录页，F5刷新，直接进入匿名的首页
			 2.5 未登录的情况下，打开首页，多次切换不同页面，然后返回到匿名首页，然后点注销，进入登录页，F5刷新，直接进入匿名的首页
			 注：所有用例中，一但注销到登录页，浏览器将无法后退
			 */
			o.user.logout();
			me._loggedout = true;	// for case loginHomepage >> 2.4 & 1.4
			$.router.removePage('.page:not(.page-current)', null, true);
			o.page.one('pageInit', '*', function() {
				$.router.stack.setItem("back", "[]"); // 清除历史记录
				$.router.removePage('.page:not(.page-current)', null, true);
			});
			// 如果设置了手势解锁，则跳转到手势解锁页面
			if (!$.o.util.cache.get("gesturepwd")) {
				me.homepage();
			} else {
				me.gesture();
			}
			/*var needLogin = !me.authorize(o._config.home_page_url);
			var aidx = $.mobile.navigate.history.activeIndex;
			if ( aidx > 0 ) {
				/!*if ( needLogin ) {
					me.one("change", ".ui-page:first", function () {
						console.log("logout case: 1.3、1.5、1.7、1.8、1.9 -- @see loginHomepage");
						/!*$.mobile.navigate.history.activeIndex = 0;
						$.mobile.navigate.history.stack.splice(1);
						$.mobile.navigate.history.previousIndex = undefined;
						me.login({method: "overwrite", transition: 'slide', success: function () {
							me.homepage({method: "overwrite"});
						}});*!/
					});
				} else {
					alert(111);
					/!*$(".ui-page:gt(0)").remove();
					$.mobile.navigate.history.activeIndex = 0;
					$.mobile.navigate.history.stack.splice(1);
					$.mobile.navigate.history.previousIndex = undefined;*!/
				}*!/
				// DONE 如果 history.go +-N>1，有问题啊！ ---- 替换 history.go 方法，但不能替换加强的浏览器退回行为（通过浏览器直接退回N步）
				history.go( -aidx );
			} else {
				console.log("logout case: 1.1、1.2、1.4、1.6");
				me.activePage.trigger( "pagecontainerchange", {toPage: me.activePage} );
				//me.login({method: "overwrite", transition: 'slide', success: function () {
				//	me.homepage({method: "overwrite"});
				//}});
			}*/
		};

		/**
		 * 打开首页
		 *
		 * @param options.method	跳转到首页的方法，默认为 change，还可为 replace、overwrite
		 * @param options			其他页面加载参数，同 change 方法
		 */
		this.homepage = function( options ) {
			options = options || {};
			if (!options.method) options.method = "change";

			// 重新渲染首页子模板
			/*if ( options.method == "overwrite" && options._page ) {
				options._page.find("[data-o-template-include_]").each(function () {
					var $el = $(this);
					$el.attr("data-o-template-include", $el.attr("data-o-template-include_"));
				});
			}*/

			this[options.method](o._config.home_page_url, options);
		};

		/**
		 * 跳转到新页面（类似 location = url）
		 *
		 * @param options   页面加载参数，详见 http://api.jquerymobile.com/pagecontainer/#method-change
		 *				  如 options.data 为 字符串或Map类型的、ajax 请求时的 url 参数
		 */
		this.change = function( url, options ) {
			options = $.extend(options, {changeHash: true, replaceHistory: false});
			$.router.loadPage(url, false, false, options.reload, null, options.reverse );
		};

		/**
		 * 加载并覆盖当前页面（创建一个新的页面DIV）
		 * 类似 location.replace，但不记录浏览器历史（location上的地址不会变化），因此刷新/返回/前进到当前页时，仍然会加载被覆盖前的页面。
		 *
		 * @param options   同 change 方法
		 */
		this.overwrite = function( url, options ) {
			options = $.extend(options, {changeHash: false, replaceHistory: false});
			$.router.replacePage(url, false, options.reload, false);
		};

//		/**
//		 * NOTFIX 加载并覆写当前页面（覆盖当前页面DIV的内容）：难点在于各个 page 事件和过渡效果 --- 使用子模板实现
//		 *
//		 * @param options.transition	覆盖时的过渡效果
//		 */
//		overwriteContent: function( url, options ) {
//			alert("暂未实现！");
//		},

		/**
		 * 加载并覆盖当前页面、同时覆盖浏览器历史与地址栏（类似 location.replace）
		 *
		 * @param options   同 change 方法
		 */
		this.replace = function( url, options ) {
			options = $.extend(options, {changeHash: true, replaceHistory: true});
			$.router.replacePage(url, options.noAnimation ? options.noAnimation : false, options.reload, null, options.reverse);
			/*return;
			if ( $.mobile.navigate.history.activeIndex == 0 ) {
				// 如果是第一个页面不允许 replace，只允许 overwrite，否则：
				// 1、刷新浏览器，样式什么的都没有了
				// 2、点注销没反应
				// 3、....
				this.overwrite(url, options);
			} else {
				// 修改了 jQM 的源代码，搜 “replaceHistory” 的相关处；对浏览器的历史相关事件影响未知。
				options = $.extend(options, {changeHash: true, replaceHistory: true});
				this.container.pagecontainer("change", url, options);
			}*/
		};

		/**
		 * 历史记录
		 */
		this.history = new function() {
			/**
			 * 前进历史
			 */
			this.forwards = function() {
				return JSON.parse($.router.stack.getItem("forward"))
			};

			/**
			 * 后退历史
			 */
			this.backs = function() {
				return JSON.parse($.router.stack.getItem("back"))
			};

			/**
			 * 计算 当前页面 到 指定selector 的距离
			 * @param selector
			 * @returns {*}
			 */
			this.step = function(selector) {
				var backs = this.backs()
				for ( var i=backs.length-1; i>=0; i-- ) {
					var page = $(backs[i].pageid);
					if ( page.length && page.is(selector) ) {
						return i - backs.length;
					}
				}
				return null;
			};

			/**
			 * 跳转到指定selector的页面
			 */
			this.go = function(selector) {
				var step = this.step(selector);
				if ( step ) o.page.go( step );
				return step;
			};
		};

		/**
		 * 预加载页面到 dom 中，但是不显示。会触发到 pagecreate 事件。
		 *
		 * @param options   同 change 方法
		 */
		this.prefetch = function( url, options ) {
			if ( this.authorize(url) )
				this.container.pagecontainer( "load", url, options );
		};

		/**
		 * 通过 url 检查是否需要登录授权
		 */
		this.authorize = function( url ) {
			var pathname = o.util.url.parse( url ).hrefNoSearch.replace(rootUri, ""),	//如: /pro/abc/index.html
				curl = pathname.substring( pathname.indexOf( "\/" ) + 1 ),				//如: pro/abc/index.html
				path = pathname.substring( 0, pathname.lastIndexOf("\/") + 1 );			//如: /pro/abc/
			// 必须登录访问的名单：permit all but deny some for anonymous visit
			if ( o._config.pages_authenticated.length > 0 ) {
				for ( var i = 0; i < o._config.pages_authenticated.length; i++ ) {
					var purl = o._config.pages_authenticated[i];
					if ( curl == purl || (purl.endsWith("/") && path.startsWith(purl)) )
						return o.user.loggedin;
				}
				return true;
			}
			// 允许匿名访问的名单：deny all but permit some for anonymous visit
			else if ( o._config.pages_anonymous.length > 0 ) {
				for ( var i = 0; i < o._config.pages_anonymous.length; i++ ) {
					var purl = o._config.pages_anonymous[i];
					if ( curl == purl || (purl.endsWith("/") && path.startsWith(purl)) )
						return true;
				}
				return o.user.loggedin;
			}
			return o.user.loggedin;
		};

		this.back = function(reload) {
			$.router.back(o._config.home_page_url, reload);
		};
		this.forward = function(reload) {
			$.router.forward(o._config.home_page_url, reload);
		};
		this.go = function( steps, reload ) {
			$.router.go(steps, reload);
		};
		this.reload = function() {
			$.router.reloadPage();
		};

		/**
		 * 获得当前显示的页面对象
		 */
		this.__defineGetter__("activePage", function() {
			return $.router.getCurrentPage();
		});

		/**
		 * 绑定特定页面的加载、显示等事件，例如：
		 *	$.o.page.on("show", ".o-page-login", function(event, ui) {
		 *		console.log(ui.toPage)
		 *	})
		 * 更多的事件可参见：
		 * 		http://api.jquerymobile.com/pagecontainer/
		 * 		http://api.jquerymobile.com/page/
		 * 注1：如果是如 beforeload 事件（其 toPage 还不是 jQuery Dom）或其他类似的情况下，则事件不会执行，因为 selector 不可能满足。
		 * 注2：事件 beforecreate、create 实际绑定到 jQM 的 page 组件的事件，而其他绑定到 pagecontainer 组件中
		 */
		this.on = function( type, selector, callback ) {
			_bind( type, selector, callback, false);
			return this;
		};

		/**
		 * 绑定只执行一次的页面事件
		 */
		this.one = function( type, selector, callback ) {
			_bind( type, selector, callback, true);
			return this;
		};

		var _eventProxy = {};
		function _bind( type, selector, callback, once ) {
			if ( !_eventProxy[type] ) {
				_eventProxy[type] = [];
				// 每种事件注册一个全局的监听器
				me.container.on(type, function(event, id, page) {
					return handler(event, id, page);
				});
				function handler( event, id, page ) {
					if ( typeof(page) != "string" ) {
						if ( !page ) page = me.activePage;
						var events = _eventProxy[type],
							returnFalse = false;
						for ( var i=0; i<events.length; i++ ) {
							if ( events[i] && page.is(events[i].selector) ) {
								var ret = events[i].callback( event, page );
								if ( ret === false ) returnFalse = true;
								if ( events[i].once ) events[i] = null;
							}
						}
						for ( var i=events.length-1; i>=0; i-- ) {
							if ( events[i] == null )
								events.splice(i, 1);
						}
						if ( returnFalse ) return false;
					}
				}
			}
			// 记录监听队列
			_eventProxy[type].push( {selector: selector, callback: callback, once: once} );
		}

	};

	/**
	 * 用户
	 */
	o.user = new function() {
		var me = this,
			id = null,
			username = null,
			nickname = null,
			avatarUrl = null,
			sessionid = null,
			jsessionid = null,
			loggedin = false,
			loggedout = false,
			loginIntervalId = null,	 // 保持登录的定时器句柄
			lastLoggedinParams = null,  // 上次成功登录的url参数
			lastLoggedinData = null;	// 上次成功登录的服务器返回数据

		/** 是否已登录 */
		this.__defineGetter__("loggedin", function() {
			return loggedin;
		});
		/** 是否已注销 */
		this.__defineGetter__("loggedout", function() {
			return loggedout;
		});
		/** 用户ID */
		this.__defineGetter__("id", function() {
			return id;
		});
		/** 用户名 */
		this.__defineGetter__("username", function() {
			return username;
		});
		/** 用户昵称 */
		this.__defineGetter__("nickname", function() {
			return nickname || o.i18n.m("o.user.nickname.anonymous");
		});
		/** 头像图片的URL */
		this.__defineGetter__("avatarUrl", function() {
			return avatarUrl || o._config.user_default_avatar_url;
		});
		/** 登录的 session id*/
		this.__defineGetter__("jsessionid", function() {
			return jsessionid;
		});
		/** SSO的 session id*/
		this.__defineGetter__("sessionid", function() {
			return sessionid;
		});
		/** 登录/注册后，服务器返回的其他信息 */
		this.__defineGetter__("data", function() {
			return lastLoggedinData;
		});

		/** 修改并缓存用户信息：比如通过用户登录后、或通过用户中心修改后 */
		this.__defineSetter__("data", function( data ) {
			_initUser( data );
			if ( !loggedin ) return;
			o.util.cache.set("user", {params: lastLoggedinParams, data: lastLoggedinData});
		});
		/** 修改并缓存用户登录参数：比如用户登录后、或修改密码时 */
		this.__defineSetter__("loginParams", function( params ) {
			lastLoggedinParams = params;
			o.util.cache.set("user", {params: lastLoggedinParams, data: lastLoggedinData});
			_keepLogin();	// 保持登录
		});

		/**
		 * 初始化用户信息
		 */
		this.init = function() {
			// 通过缓存中初始化用户信息
			var cache = o.util.cache.get('user');
			if ( cache ) {
				_initUser( cache.data );
				lastLoggedinParams = cache.params;
			} else {
				_initUser( null );
			}
			return this;
		};

		/**
		 * 注销登录
		 */
		this.logout = function() {
			_initUser(null);
			loggedout = true;
			return this;
		};

		/**
		 * 用户登录，并触发登录成功或失败的事件
		 *
		 * @param params			登录参数，如用户名、密码等，可以为 map 或形如 a=1&b=2 的字符串。如果为空则取上次登录时的参数。
		 * @param options.success	登录成功的回调方法，如果为空则自动重定向到首页
		 * @param options.failed	登录失败或异常的回调方法
		 * @param options.quiet		登录成功或失败后什么都不做，否则执行回调方法或重定向到首页，默认为 false
		 * @param options.async		是否异步，默认为 true
		 */
		this.login = function( params, options ) {
			options = $.extend({"success": me._callback_success_login}, options);
			if ( !params ) params = lastLoggedinParams;

			if ( options.quiet ) {
				_login( params, options );
			} else {
				$.showPreloader();
				//setTimeout(function(){
					_login(params, options);
				//}, 100);
			}
			return this;
		};

		function _initUser( data ) {
			if ( data ) {
				id = data.data ? data.data.id : null;
				username = data.username;
				nickname = data.displayName;//nickname;
				avatarUrl = data.avatarUrl ? data.avatarUrl : (data.data ? data.data.avatarUrl : o._config.user_default_avatar_url);
				jsessionid = data.jsessionid;
				sessionid = data.sessionid;
				lastLoggedinData = data;
				loggedin = true;
			} else {
				if ( loginIntervalId ) {
					clearInterval(loginIntervalId);
					loginIntervalId = null;
				}
				jsessionid = username = nickname = lastLoggedinParams = null;
				avatarUrl = o._config.user_default_avatar_url;
				loggedin = false;
				o.util.cache.remove("user");
			}
			loggedout = false;
		}

		function _keepLogin() {
			if ( !loginIntervalId && o._config.user_login_interval > 0 ) {
				loginIntervalId = setInterval(function() {
					_login(lastLoggedinParams, {quiet: true});
				}, o._config.user_login_interval);
			}
		}

		function _login( params, options ) {
			$.ajax({
				url 	: o._config.user_login_url,
				data		: params,
				type		: "POST",
				async	: options.async == null ? true : options.async,
				dataType: "json",
				alertMsg: false	// 不直接 alert 返回结果里的 message
			}).done(function(data, textStatus, jqXHR) {
				if ( $.o.util.means(data.success) ) {
					lastLoggedinData   = data;
					lastLoggedinParams = params;
					_initUser(data);	// 初始化user对象
					_keepLogin();		// 保持登录
					o.util.cache.set("user", {params: params, data: data});	// 缓存

					// 事件 & 回调 & & 首页
					delete me._callback_success_login;
					$(window).trigger("o.login.success", data);
					if ( options && options.success ) {
						if ( !options.quiet )
							options.success(data);
					} else if ( !options || !options.quiet ) {
						o.page.homepage();
					}
				} else {
					failed(jqXHR, data.message, null)
				}
			}).fail(failed);


			function failed( jqXHR, textStatus, errorThrown ) {
				loggedin = false;
				$(window).trigger("o.login.failed", jqXHR, textStatus, errorThrown);
				if ( options && options.failed && !options.quiet )
					options.failed( jqXHR, textStatus, errorThrown );
				if ( options && options.failedForce )
					options.failedForce( jqXHR, textStatus, errorThrown );
			}
		}

	};

	/**
	 * 国际化
	 */
	o.i18n = new function() {
		var _messages = {};	// 消息缓存

		/**
		 * 获得国际化消息。
		 * 注：$.o.i18n.m(...) 等价于 m(...)
		 *
		 * @param code		The code to resolve the message for
		 * @param [args]	A list of argument values to apply to the message, when code is used.
		 * @param [defult]	The default message to output if the error or code cannot be found.
		 */
		this.m = function( code ) {
			// 解析 args、default 参数
			var args = undefined, defult = undefined;
			if ( arguments.length == 3 ) {
				args = arguments[1];
				defult = arguments[2];
			} else if ( arguments.length == 2 ) {
				if ( typeof(arguments[1]) == "string" ) {
					defult = arguments[1];
				} else {
					args = arguments[1];
				}
			}
			// 搜索code定义、拼参数
			if ( _messages && _messages[code] != undefined ) {
				var result = _messages[code];
				if ( args instanceof Array ) {
					for ( var i=0; i<args.length; i++ ) {
						result = result.replace("{"+i+"}", args[i]);
					}
				} else if ( args ) {
					result = result.replace("{0}", args);
				}
				return result;
			}
			// 无定义
			else if ( defult != undefined ) return defult;
			else return code;
		};

		/**
		 * 合并国际化定义
		 * 格式参考：zh_CN.js
		 */
		this.merge = function( messages ) {
			_merge( messages );	// 递归合并

			function _merge(mm, path) {
				for ( var k in mm ) {
					var v = mm[k];
					if ( typeof(v) == "object" ) {
						if ( path ) {
							_merge(v, path + "." + k);
						} else {
							_merge(v, k);
						}
					} else if ( path ) {
						_messages[path + "." + k] = v;
					} else {
						_messages[k] = v;
					}
				}
			}
		};

	};
	window.m = o.i18n.m;

	/**
	 * 工具方法
	 */
	o.util = new function() {
		/**
		 * url 相关工具
		 */
		this.url = new function() {
			/**
			 * 解析一个 url，并返回包含 url 各属性的对象
			 * @param url	相对或绝对路径
			 * @return 形如下例的对象
			 {
				 authority: "localhost"
				directory: "/ui/abc/"
				domain: "http://localhost"
				doubleSlash: "//"
				filename: "xxx.html"
				hash: ""
				host: "localhost"
				hostname: "localhost"
				href: "http://localhost/ui/abc/xxx.html?pp=aa"
				hrefNoHash: "http://localhost/ui/abc/xxx.html?pp=aa"
				hrefNoSearch: "http://localhost/ui/abc/xxx.html"
				pathname: "/ui/abc/xxx.html"
				port: ""
				protocol: "http:"
				search: "?pp=aa"
			}
			 */
			this.parse = function( url ) {
				url = this.makeUrlAbsolute(url, location.href);
				return this.parseUrl(url);
			};

			/**
			 * 截取url中的文件名
			 * 如 http://localhost/abc/xxx.html?pp=aa 返回 xxx.html
			 */
			this.getFilename = function( url ) {
				var result = decodeURIComponent( url ),
					index = result.indexOf('?');
				if ( index > -1 )
					result = result.substring( 0, index );
				index = result.lastIndexOf('\/');
				result = result.substring( index+1 );
				return result;
			};

			/**
			 * 获取url中的请求参数
			 * @param name	参数名称
			 * @param url	需要解析的 url，默认是 location.href
			 */
			this.getParameter = function( name, url ) {
				var params = this.getParameters(url);
				return params[name];
			};

			/**
			 * 获取url中的所有请求参数
			 * @param url	需要解析的 url，默认是 location.href
			 */
			this.getParameters = function( url ) {
				var params = {};
				if ( url === null ) return params;
				if( !url ) url = location.href;
				if ( url.indexOf("?") != -1 ) {
					var str = url.substr( url.indexOf("?") + 1),
						strs = str.split("&");
					for ( var i = 0; i < strs.length; i ++ ) {
						var arr = strs[i].split("=");
						params[ decodeURIComponent(arr[0]) ] = decodeURIComponent( arr[1] );
					}
				}
				return params;
			};

			/**
			 * copy with jqm
			 */
			// This scary looking regular expression parses an absolute URL or its relative
			// variants (protocol, site, document, query, and hash), into the various
			// components (protocol, host, path, query, fragment, etc that make up the
			// URL as well as some other commonly used sub-parts. When used with RegExp.exec()
			// or String.match, it parses the URL into a results array that looks like this:
			//
			//	 [0]: http://jblas:password@mycompany.com:8080/mail/inbox?msg=1234&type=unread#msg-content
			//	 [1]: http://jblas:password@mycompany.com:8080/mail/inbox?msg=1234&type=unread
			//	 [2]: http://jblas:password@mycompany.com:8080/mail/inbox
			//	 [3]: http://jblas:password@mycompany.com:8080
			//	 [4]: http:
			//	 [5]: //
			//	 [6]: jblas:password@mycompany.com:8080
			//	 [7]: jblas:password
			//	 [8]: jblas
			//	 [9]: password
			//	[10]: mycompany.com:8080
			//	[11]: mycompany.com
			//	[12]: 8080
			//	[13]: /mail/inbox
			//	[14]: /mail/
			//	[15]: inbox
			//	[16]: ?msg=1234&type=unread
			//	[17]: #msg-content
			//
			this.urlParseRE = /^\s*(((([^:\/#\?]+:)?(?:(\/\/)((?:(([^:@\/#\?]+)(?:\:([^:@\/#\?]+))?)@)?(([^:\/#\?\]\[]+|\[[^\/\]@#?]+\])(?:\:([0-9]+))?))?)?)?((\/?(?:[^\/\?#]+\/+)*)([^\?#]*)))?(\?[^#]+)?)(#.*)?/,

			//Returns true for any relative variant.
			this.isRelativeUrl = function( url ) {
				// All relative Url variants have one thing in common, no protocol.
				return this.parseUrl( url ).protocol === "";
			}

			//Turn the specified realtive URL into an absolute one. This function
			//can handle all relative variants (protocol, site, document, query, fragment).
			this.makeUrlAbsolute = function( relUrl, absUrl ) {
				if ( !this.isRelativeUrl( relUrl ) ) {
					return relUrl;
				}

				if ( absUrl === undefined ) {
					absUrl = location.href;
				}

				var relObj = this.parseUrl( relUrl ),
					absObj = this.parseUrl( absUrl ),
					protocol = relObj.protocol || absObj.protocol,
					doubleSlash = relObj.protocol ? relObj.doubleSlash : ( relObj.doubleSlash || absObj.doubleSlash ),
					authority = relObj.authority || absObj.authority,
					hasPath = relObj.pathname !== "",
					pathname = this.makePathAbsolute( relObj.pathname || absObj.filename, absObj.pathname ),
					search = relObj.search || ( !hasPath && absObj.search ) || "",
					hash = relObj.hash;

				return protocol + doubleSlash + authority + pathname + search + hash;
			}

			//Turn relPath into an asbolute path. absPath is
			//an optional absolute path which describes what
			//relPath is relative to.
			this.makePathAbsolute = function( relPath, absPath ) {
				var absStack,
					relStack,
					i, d;

				if ( relPath && relPath.charAt( 0 ) === "/" ) {
					return relPath;
				}

				relPath = relPath || "";
				absPath = absPath ? absPath.replace( /^\/|(\/[^\/]*|[^\/]+)$/g, "" ) : "";

				absStack = absPath ? absPath.split( "/" ) : [];
				relStack = relPath.split( "/" );

				for ( i = 0; i < relStack.length; i++ ) {
					d = relStack[ i ];
					switch ( d ) {
						case ".":
							break;
						case "..":
							if ( absStack.length ) {
								absStack.pop();
							}
							break;
						default:
							absStack.push( d );
							break;
					}
				}
				return "/" + absStack.join( "/" );
			}

			//Parse a URL into a structure that allows easy access to
			//all of the URL components by name.
			this.parseUrl = function( url ) {
				// If we're passed an object, we'll assume that it is
				// a parsed url object and just return it back to the caller.
				if ( $.type( url ) === "object" ) {
					return url;
				}

				var matches = this.urlParseRE.exec( url || "" ) || [];

				// Create an object that allows the caller to access the sub-matches
				// by name. Note that IE returns an empty string instead of undefined,
				// like all other browsers do, so we normalize everything so its consistent
				// no matter what browser we're running on.
				return {
					href:		 matches[  0 ] || "",
					hrefNoHash:   matches[  1 ] || "",
					hrefNoSearch: matches[  2 ] || "",
					domain:	   matches[  3 ] || "",
					protocol:	 matches[  4 ] || "",
					doubleSlash:  matches[  5 ] || "",
					authority:	matches[  6 ] || "",
					username:	 matches[  8 ] || "",
					password:	 matches[  9 ] || "",
					host:		 matches[ 10 ] || "",
					hostname:	 matches[ 11 ] || "",
					port:		 matches[ 12 ] || "",
					pathname:	 matches[ 13 ] || "",
					directory:	matches[ 14 ] || "",
					filename:	 matches[ 15 ] || "",
					search:	   matches[ 16 ] || "",
					hash:		 matches[ 17 ] || ""
				};
			}

			/**
			 * 获取转换后的url
			 * @param url
			 */
			this.getUrl = function( url ) {
				return this.getUrls( url ).url;
			}

			/**
			 * 获取转换后的url
			 * @param url
			 */
			this.getUrls = function( url ) {
				var result = {url:url}
				if ( o._config.server_url_pattern ) {
					if ( o._config.server_url_pattern instanceof Array ) {
						for ( var i=0; i<o._config.server_url_pattern.length; i++ ) {
							var isReplace = o._config.server_url_replace instanceof Array ? o._config.server_url_replace[i] : o._config.server_url_replace,
								pattern = o._config.server_url_pattern[i],
								server_url = o._config.server_url instanceof Array ? o._config.server_url[i] : o._config.server_url,
								isJsessionid = o._config.server_url_jsessionid instanceof Array ? o._config.server_url_jsessionid[i] : o._config.server_url_jsessionid,
								jsessionid = o.user.jsessionid instanceof Array ? o.user.jsessionid[i] : o.user.jsessionid;
							if ( pattern.test(url) ) {
								if ( isReplace ) url = url.replace(pattern, server_url);
								else url = server_url + url;
								if ( isJsessionid && jsessionid ) {
									// 修改 url，在参数前添加 ";jsessionid=...."
									url = url.replace(/(;jsessionid=[^\?]*)?(\?|$)/, ";jsessionid=" + jsessionid + "$2");
								}
								result.index = i;
								result.url = url;
								result.pattern = true;
								break;
							}
						}
					} else {
						if ( o._config.server_url_pattern.test(url) ) {
							if ( o._config.server_url_replace ) url = url.replace(o._config.server_url_pattern, o._config.server_url);
							else url = o._config.server_url + url;
						}
						if ( o._config.server_url_jsessionid && o.user.jsessionid ) {
							url = url.replace(/(;jsessionid=[^\?]*)?(\?|$)/, ";jsessionid=" + o.user.jsessionid + "$2");
						}
						result.url = url;
						result.pattern = true;
					}
				}
				return result;
			}
		};

		/**
		 * 本地缓存（localStorage）相关的工具
		 * @type {cache}
		 */
		this.cache = new function() {

			this.get = function(key) {
				var value = localStorage.getItem(key);
				if ( value && value.indexOf("[json] ") == 0 ) {
					value = JSON.parse(value.substr("[json] ".length));
				}
				return value;
			};

			this.set = function(key, value) {
				if ( typeof value == 'object' ) {
					value = "[json] " + JSON.stringify(value);
				}
				localStorage.setItem(key, value);
				return this;
			};

			this.once = function(key) {
				var value = this.get(key);
				this.remove( key );
				return value;
			};

			this.remove = function(key) {
				localStorage.removeItem(key);
				return this;
			};

			this.clear = function() {
				localStorage.clear();
				return this;
			};

			/**
			 * 将 ajax 请求的结果缓存下来，缓存的键根据 url 生成
			 *
			 * @param ajaxOptions	$.ajax 方法的参数，如 {type: "POST", url: "some.php", data: {name: "John", location: "Boston"}}
			 * @param cacheOptions	缓存参数，包括：
			 * @param cacheOptions.maxAge		缓存有效期，单位为秒，默认1天
			 * @param cacheOptions.reload		是否强制重新加载，默认 false
			 * @param cacheOptions.dataAsKey	是否将 ajaxOptions.data 中的内容作为 key 的一部分，默认为 true
			 * @param callback		成功的回调函数，等同于 $.o.util.cache.ajax(...).done(callback)
			 *
			 * @return $.Deferred 对象
			 */
			this.ajax = function( ajaxOptions, cacheOptions, callback ) {
				if (!ajaxOptions || !ajaxOptions.url) return null;
				cacheOptions = $.extend(
					{maxAge: 24 * 60 * 60, reload: false, dataAsKey: true}, cacheOptions);

				// 生成缓存的 key
				var key = ajaxOptions.url;
				if (cacheOptions.dataAsKey && ajaxOptions.data) {
					var dataKeys = [];
					for (k in ajaxOptions.data) {
						dataKeys.push(k);
					}
					dataKeys.sort();
					for (var i = 0; i < dataKeys.length; i++) {
						key += "&" + dataKeys[i] + "=" + ajaxOptions.data[dataKeys[i]];
					}
				}

				// ajax请求、缓存并返回 Deferred 对象
				var me = this,
					now = new Date().getTime(),
					result = this.get(key);
				if (cacheOptions.reload || !result || (result.ts && now - result.ts > cacheOptions.maxAge * 1000)) {
					return $.ajax(ajaxOptions).done(function (data) {
						// 请求成功则缓存
						if (!data.error && !(data.success === false))
							me.set(key, {ts: now, data: data});
					}).done(callback);
				} else {
					return $.Deferred().done(callback).resolve(result.data);
				}
			};
		};
	};

	/**
	 * 设备原生API
	 */
	o.native = new function() {
		var _shell = !!(window.mdevice && mdevice.isShell);

		/**
		 * 是否启用了原生API
		 */
		this.__defineGetter__("enabled", function() {
			return _shell;
		});

		/**
		 * 设备信息
		 */
		this.__defineGetter__("device", function() {
			return window.device || {};
		});

		/**
		 * 输入法面板
		 * 包括 show、close 两个方法，其中 show 方法只能用于 Android
		 */
		this.keyboard = new function() {
			var height = 0,
				visible = false;

			this.__defineGetter__("height", function() {
				return height;
			});
			this.__defineGetter__("visible", function() {
				// 代替原生的 isVisible，获得一定延迟
				return visible; //cordova.plugins.Keyboard.isVisible;
			});
			this.show = function() {
				cordova.plugins.Keyboard.show();
			};
			this.close = function() {
				cordova.plugins.Keyboard.close();
			};

			$(window).on("o.native.keyboard.show", function( e, data ) {
				visible = true;
				height = data.keyboardHeight;
			});

			$(window).on("o.native.keyboard.hide", function( e ) {
				setTimeout(function() {
					visible = false;
				}, 100);
			});
		};

		/**
		 * 网络
		 */
		this.network = new function() {
			/**
			 * 网络类型
			 */
			this.__defineGetter__("type", function() {
				if ( _shell ) {
					var networkState = navigator.connection.type,
						states = {};
					states[Connection.UNKNOWN]  = 'UNKNOWN';
					states[Connection.ETHERNET] = 'ETHERNET';
					states[Connection.WIFI]		= 'WIFI';
					states[Connection.CELL_2G]  = 'CELL_2G';
					states[Connection.CELL_3G]  = 'CELL_3G';
					states[Connection.CELL_4G]  = 'CELL_4G';
					states[Connection.CELL]	 = 'CELL';
					states[Connection.NONE]	 = 'NONE';
					return states[networkState];
				}
			});

			/**
			 * 国际化的网络类型名称
			 */
			this.__defineGetter__("typeName", function() {
				return o.i18n.m("o.native.network.type." + this.type);
			});

			/**
			 * 网络状态：offline/online
			 */
			this.__defineGetter__("status", function() {
				return (navigator.connection.type == Connection.NONE) ? "offline" : "online";
			});
		};

		/**
		 * 地理位置：等同于HTML5的原生API（navigator.geolocation），并建议使用后者
		 */
		this.geolocation = navigator.geolocation;

		/**
		 * 调用本地应用打开文件（如图片、视频、文档等）
		 *
		 * @param uri 文件地址
		 */
		this.open = function( uri ) {
			// 会下载到 Android/data/com.foobar/cache 下
			cordova.plugins.disusered.open(uri);
		};

		/**
		 * 相机
		 */
		this.camera = new function() {
			/**
			 * 拍照
			 *
			 * @param success	成功的回调方法，可接收的参数由 options.destinationType 确定，默认为 base64 编码的字符串
			 * @param failed	失败的回调方法，可接收错误消息为参数
			 * @param options	参见 http://plugins.cordova.io/#/package/org.apache.cordova.camera
			 */
			this.takePhoto = function( success, failed, options ) {
				options = $.extend( options, {sourceType : Camera.PictureSourceType.CAMERA} );
				_getPicture( success, failed, options );
			};

			/**
			 * 从图库中选择一张图片
			 *
			 * @param success
			 * @param failed
			 * @param options
			 */
			this.choosePicture = function( success, failed, options ) {
				options = $.extend( options, {sourceType : Camera.PictureSourceType.PHOTOLIBRARY} );
				_getPicture( success, failed, options );
			};

			function _getPicture( success, failed, options ) {
				navigator.camera.getPicture(
					function (imageData) {
						setTimeout(function() {
							success(imageData);	//"<img width=100 height=100 src='data:image/jpeg;base64," + mageData + "' />"
						}, 0);
					},
					failed,
					$.extend(
						{destinationType: Camera.DestinationType.DATA_URL, mediaType: Camera.MediaType.PICTURE,
							// 此处若去掉 correctOrientation，ios拍照、相册选图后的图片会大上10倍左右，并且拍照后的图片，进行裁剪、缩放后，图片旋转了90度
							correctOrientation:true},
						options
					)
				);
			}

			/**
			 * 从图库中选择多张图片
			 *
			 * @param success				选择成功的回调方法，可接收代表每张图片的字符串类型的参数（参考 destinationType）。
			 * @param failed				失败的回调方法，可接收错误消息为参数。
			 * @param options.maximumImagesCount	设置选择图片的最大数量，默认为15
			 * @param options.width			设置被选中图片返回后的最大宽度，如果被选中图片宽度大于该值，返回的图片将自动缩放
			 * @param options.height		设置被选中图片返回后的最大高度，如果被选中图片高度大于该值，返回的图片将自动缩放
			 * @param options.quality		设置调整后的图片的图像质量，类型为int(0-100)，默认为100
			 * @param options.destinationType		success 回调函数的参数值类型：
			 * 								默认为 Camera.DestinationType.DATA_URL，即base64编码的字符串；
			 * 								还可以为 Camera.DestinationType.FILE_URI，即临时文件路径，
			 * 									可通过 o.native.file.readAsDataURL 读取文件内容（base64），
			 *	 								且处理完毕后必须调用 o.native.file.remove 方法删除该临时文件。
			 * @see https://github.com/wymsee/cordova-imagePicker
			 * @see http://ngcordova.com/docs/plugins/imagePicker/
			 */
			this.choosePictures = function( success, failed, options ) {
				window.imagePicker.getPictures(
					function(results) {
						// 此处results返回从图库中选择的多张图片在当前应用中的缓存路径对应的数组
						for ( var i=0; i<results.length; i++ ) {
							if ( options && options.destinationType == Camera.DestinationType.FILE_URI ) {
								success(result[i]);
							} else {
								o.native.file.readAsDataURL(results[i], function (data) {
									success(data);
									o.native.file.remove(results[i]);
								});
							}
						}
					},
					failed, options
				);
			};
		};

		/**
		 * QQ API
		 *
		 * @see https://github.com/iVanPan/Cordova_QQ
		 * @see cordova 工程中的 cordova-qq.txt 文档
		 */
		this.qq = new function() {

			/**
			 * 检查客户端是否安装QQ
			 *
			 * @param success   如果设备安装QQ时的回调方法
			 * @param failed	如果设备没有安装QQ时的回调方法
			 */
			this.checkInstalled = function (success, failed) {
				YCQQ.checkClientInstalled(success, failed);
			};

			/**
			 * 第三方应用登陆QQ并从QQ获得授权
			 * 注：一次授权默认有效期是90天，如果已经授权过再次调用这个函数去授权也不会出错
			 *
			 * @param success   授权成功时的回调函数
			 * @param failed	授权失败时的回调函数
			 */
			this.login = function (success, failed) {
				//default is 0,only for iOS. 如果去掉可能会有授权失败的情况出现
				var checkClientIsInstalled = 1;
				// 登录
				YCQQ.ssoLogin(
					/**
					 * 成功的回调方法
					 * @param args.access_token  认证成功之后返回的访问令牌
					 * @param args.userid		认证成功之后返回的用户id
					 *
					 * 注：实际使用时只要授权成功即可进行分享QQ好友、添加到收藏、添加到QQ空间等功能,这两个参数可以不用
					 */
					success,
					/**
					 * 失败的回调方法
					 * @param reason   字符串，表示失败原因
					 */
					failed,
					checkClientIsInstalled);
			};

			/**
			 * 第三方应用退出QQ
			 *
			 * @param success  退出时成功的回调函数
			 * @param failed   退出失败时的回调函数
			 */
			this.logout = function (success, failed) {
				YCQQ.logout(success, failed);
			};

			/**
			 * 分享到QQ好友
			 *
			 * @param options.url		 REQUIRED 分享资源的链接
			 * @param options.title	   REQUIRED 分享信息的标题
			 * @param options.description REQUIRED 分享信息的描述
			 * @param options.imageUrl			 分享信息的缩略图URL(不同于分享到QQ空间，这里只支持一个图片地址)
			 * @param success 成功的回调函数
			 * @param failed  失败时的回调函数
			 */
			this.shareToFriends = function (options, success, failed) {
				YCQQ.shareToQQ(success, failed, options);
			};

			/**
			 * 分享到QQ空间
			 *
			 * @param options.url		  REQUIRED  分享资源的链接
			 * @param options.title		REQUIRED  分享信息的标题
			 * @param options.description  REQUIRED  分享信息的描述
			 * @param options.imageUrl			   分享信息的图片URL，
			 *									   可以填多个URL地址，如：['https://www.baidu.com/img/bdlogo.png',
			 *														'https://www.baidu.com/img/bdlogo.png',
			 *														'https://www.baidu.com/img/bdlogo.png']
			 * @param success  成功的回调函数
			 * @param failed   失败时的回调函数
			 */
			this.shareToQzone = function (options, success, failed) {
				YCQQ.shareToQzone(success, failed, options);
			};

			/**
			 * 添加到QQ收藏
			 *
			 * @param options.url		  REQUIRED  分享资源的链接
			 * @param options.title		REQUIRED  分享信息的标题
			 * @param options.description  REQUIRED  分享信息的描述
			 * @param options.imageUrl			   享信息的缩略图URL(不同于分享到QQ空间，这里只支持一个图片地址)
			 * @param success  成功的回调函数
			 * @param failed   失败时的回调函数
			 */
			this.addToFavorites = function (options, success, failed) {
				YCQQ.addToQQFavorites(success, failed, options);
			};
		};

		/**
		 * 微信 API
		 *
		 * @see https://github.com/xu-li/cordova-plugin-wechat
		 * @see cordova 工程中的 cordova-plugin-wechat.txt 文档
		 */
		this.wechat = new function() {

			/**
			 * 检查客户端是否安装微信
			 *
			 * @param success   如果设备安装微信时的回调方法
			 * @param failed	如果设备没有安装微信、或发生异常时的回调方法
			 */
			this.checkInstalled = function (success, failed) {
				Wechat.isInstalled(
					function (installed) {
						if (installed) {
							success();
						} else {
							failed();
						}
					}, failed);
			};

			/**
			 * 分享到微信好友
			 *
			 * 文本分享时的参数：
			 * @param options.text		  REQUIRED 分享文本内容
			 *
			 * 链接分享时的参数：
			 * @param options.url		   REQUIRED 分享资源的链接
			 * @param options.title		 REQUIRED 分享信息的标题
			 * @param options.description   REQUIRED 分享信息的描述
			 * @param options.imageUrl			   分享信息的缩略图URL
			 *
			 * 回调函数：
			 * @param success			   成功的回调函数
			 * @param failed				失败时的回调函数
			 */
			this.shareToSession = function (options, success, failed) {
				options.scene = Wechat.Scene.SESSION;
				share(options, success, failed);
			};

			/**
			 * 分享到微信朋友圈
			 * @see #shareToSession
			 */
			this.shareToTimeline = function (options, success, failed) {
				options.scene = Wechat.Scene.TIMELINE;
				share(options, success, failed);
			};

			//-- 分享
			function share(options, success, failed) {
				if (options.url) {
					options.message = {
						title: options.title,
						description: options.description,
						thumb: options.imageUrl,
						media: {
							type: Wechat.Type.LINK,
							webpageUrl: options.url
						}
					};
				} else if (options.text) {
					// DO NOTHING
				}
				Wechat.share(options, success, failed);
			}
		};

		/**
		 * 二维码/条形码扫描
		 *
		 * @param success  扫描成功/或取消扫描的回调方法，可接收扫描结果的 Map 对象，含 text、format、cancelled 等属性
		 * @param failed   异常的回调方法，可接收 error 对象
		 */
		this.scanBarcode = function( success, failed ) {
			cordova.plugins.barcodeScanner.scan( success, failed );
		};

		/**
		 * 缓存清理：包括浏览器缓存和文件缓存
		 * 如需清理浏览器的 localStorage 缓存，请参考 o.util.cache.clear()
		 *
		 * @param success  清理缓存成功的回调方法，可接收一个字符串参数
		 * @param failed   清理缓存失败的回调方法，可接收一个字符串参数
		 */
		this.clearCache = function( success, failed ) {
			window.cache.clear( success, failed );
			window.cache.cleartemp();
		};

		/**
		 * 提醒，涉及插件：dialogs、vibration、local-notification
		 */
		this.notification = new function() {
			/**
			 * 震动
			 *
			 * @param duration	时长（单位毫秒），iOS无效
			 */
			this.vibrate = function( duration ) {
				navigator.vibrate(duration);
			};

			/**
			 * 声音提示
			 *
			 * @param times	提示次数
			 */
			this.beep = function( times ) {
				navigator.notification.beep( times );
			};

			/**
			 * 显示原生的 alert 窗口
			 *
			 * @param message		消息内容
			 * @param callback		关闭时的回调方法
			 * @param title			窗口标题，默认为 Alert
			 * @param buttonLabel	按钮名称，默认为 OK
			 */
			this.alert = function( message, callback, title, buttonLabel ) {
				navigator.notification.alert(message, callback, title, buttonLabel);
			};

			/**
			 * 显示原生的 confirm 窗口
			 *
			 * @param message		消息内容
			 * @param callback		点击按钮时的回调方法，可接收从1开始的 buttonIndex 参数，表示点击的按钮序号
			 * @param title			窗口标题，默认为 Confirm
			 * @param buttonLabels	按钮名称，默认为 ["OK","Cancel"]
			 */
			this.confirm = function( message, callback, title, buttonLabels ) {
				navigator.notification.confirm(message, callback, title, buttonLabels);
			};

			/**
			 * 显示原生的 prompt 窗口
			 *
			 * @param message		消息内容
			 * @param callback		点击按钮时的回调方法，可接收从1开始的 buttonIndex 参数，表示点击的按钮序号
			 * @param title			窗口标题，默认为 Prompt
			 * @param buttonLabels	按钮名称，默认为 ["OK","Cancel"]
			 * @param defaultText	默认文字
			 */
			this.prompt = function( message, callback, title, buttonLabels, defaultText ) {
				navigator.notification.prompt(message, callback, title, buttonLabels, defaultText);
			};

			/**
			 * 设备消息栏提醒
			 */
			this.local = new function() {
				/**
				 * 发布一条消息
				 *
				 * @param options.id		消息ID，默认为 0
				 * @param options.title		消息标题，iOS默认为空，Android默认为应用名
				 * @param options.text		消息文本
				 * @param options.badge		显示在 app 图标右上角（iOS）、或消息提醒右边（Android）的数字，默认为 0，即不显示
				 * @param options.data		额外的、JSON格式的数据，可以在 clicked 事件中获取
				 */
				this.notify = function( options ) {
					options = $.extend(options, {icon: "res://icon.png"});
					cordova.plugins.notification.local.schedule(options);
				};

				/**
				 * 设置点击消息事件
				 *
				 * @param callback	回调方法，可接收 notification 对象为参数，
				 * 					其中 id 为消息ID、data 为JSON格式的消息数据
				 */
				this.clicked = function( callback ) {
					cordova.plugins.notification.local.on("clicked", callback);
				};

				// 初始化
				function _init() {
					var first = true;
					cordova.plugins.notification.local.on("click", function(notification, state) {
						alert( "click -- " + notification.id );
						if ( first === true ) {
							// 点击提示启动app时，直接清空所有，否则每次重启Android系统后，还可能会提示
							cordova.plugins.notification.local.cancelAll( notification.id );
							first = undefined;
							// TODO 退出的时候，需要清空当前的提醒吗（注：不是取消）？
						} else {
							// 提示后马上清掉
							cordova.plugins.notification.local.cancel(notification.id);
						}
					});
				}
				if ( _shell ) _init();
			};
		},

		/**
		 * 原生的 http 客户端
		 * @see https://github.com/wymsee/cordova-HTTP
		 */
			this.http = window.cordovaHTTP;

		/**
		 * 启动界面
		 */
		this.splashscreen = {
			show: function() {
				navigator.splashscreen.show();
			},
			hide: function() {
				navigator.splashscreen.hide();
			}
		};

		/**
		 * 文件系统 API，封装了极少数插件 file 的功能
		 *
		 * @see https://www.npmjs.com/package/cordova-plugin-file
		 * @see https://github.com/apache/cordova-plugin-file
		 */
		this.file = {
			/**
			 * 包含各系统文件夹路径的Map
			 */
			dirs: window.cordova ? window.cordova.file : {},

			/**
			 * 读取文件，并转为形如 data:image/jpeg;base64,xxxx 的字符串
			 * 如：$.o.native.file.readAsDataURL(path, function(r){ console.log(r) });
			 */
			readAsDataURL: function(filePath, success) {
				//filePath = "file:///data/data/com.foobar/cache/tmp_IMG_20160107_2039271094772842.jpg"
				window.resolveLocalFileSystemURL(filePath, function(fileEntry){
					fileEntry.file(function(file){
						var reader = new FileReader();
						reader.onloadend = function(e) {
							success(this.result);
						};
						reader.readAsDataURL(file);
					});
				});
			},

			/**
			 * 删除文件（夹）
			 */
			remove: function(filePath) {
				window.resolveLocalFileSystemURL(filePath, function(fileEntry){
					fileEntry.remove();
				});
			}
		};

		/**
		 * 退出 APP
		 */
		this.exit = function() {
			navigator.app.exitApp();
		};

		// 初始化
		var me = this;
		if ( _shell ) _init();

		/**
		 * @private
		 * 初始化设备
		 */
		function _init() {
			document.addEventListener('deviceready', function() {
				// 自动隐藏启动界面
				setTimeout(function() {
					me.splashscreen.hide();
				}, 500);
				// 定义事件
				_initEvents();
			});
		}
		/**
		 * @private
		 * 定义事件 o.native.*，事件的参数都是 (event, data)，其中 data 为 map
		 */
		function _initEvents() {
			// 更多的事件见 http://cordova.apache.org/docs/en/5.0.0/cordova_events_events.md.html#Events
			addEventListener('native.keyboardshow', function(event) {
				// 输入法显示
				// 示例：$(window).on("o.native.keyboard.show", function(event, data) { data.keyboardHeight })
				$(window).trigger("o.native.keyboard.show", {keyboardHeight: event.keyboardHeight} );
			});
			addEventListener('native.keyboardhide', function(event) {
				// 输入法隐藏
				$(window).trigger("o.native.keyboard.hide", {} );
			});
			if ( me.device.platform == "Android" ) {
				// Android 的返回键
				document.addEventListener("backbutton", function(event) {
					$(window).trigger("o.native.android.backbutton.click", {} );
				}, false);
			}
			document.addEventListener("offline", function(event) {
				// 网络离线
				$(window).trigger("o.native.network.offline", {} );
			}, false);
			document.addEventListener("online", function(event) {
				// 网络在线
				$(window).trigger("o.native.network.online", {} );
			}, false);

			// 如果是Android，监听 backbutton （返回键）的事件，当已退回到首页了，则连续按两次退出程序
			if ( me.device.platform == "Android" ) {
				$(window).on("o.native.android.backbutton.click", function() {
					// DONE 如果当前弹出对话框等层，则应该先关掉，而不是直接返回上一页或退出
					// DONE 如果 index 嵌入 home，则是 1，否则应该是 0 -- app 上，只要退到首页，就不允许再退了
					if ( o.native.keyboard.visible ) {
						o.native.keyboard.close();
					} else if ( $(".modal-in:visible").length > 0 ) {
						// 模态框
						$.closeModal();
					} else if ( $(".zoom-img-wrap:visible").length > 0 ) {
						// 图片放大: 在 toolkit.js 里处理过了
					//} else if ( $(".collapse.in:visible").length > 0 ) {
					//	$(".collapse.in").collapse('hide');
					} else if ( $(".panel.active:visible").length > 0 ) {
						// 侧边栏
						$.closePanel();
					} else if ( o.page.history.backs().length == 0 || location.pathname.endsWith("/" + o._config.home_page_url) ) {
						// 如果是被登录页覆盖的匿名首页，则显示首页
						if ( $.o.page.activePage.data("_loggedout") ) {
							o.page.homepage({method: "overwrite"});
						}
						// 否则退出 app
						else {
							backbuttonExit();
						}
					} else {
						o.page.back();
					}
				});
			}

			//-------
			// 事件：连续两次按下Android退回键时，退出程序
			function backbuttonExit() {
				var duration = 2000;
				// 第二次
				if ( me._backbuttonExitBeginTime ) {
					var now = new Date().getTime();
					if ( now - me._backbuttonExitBeginTime < duration )
						return me.exit();
					delete me._backbuttonExitBeginTime;
				}
				// 第一次
				if ( !me._backbuttonExitBeginTime ) {
					me._backbuttonExitBeginTime = new Date().getTime();
					// 创建一个提示框
					var m = document.createElement('div');
					m.innerHTML = o.i18n.m("o.native.exit.confirm");
					m.style.cssText = "width:60%; min-width:150px; background:#000; opacity:0.8; height:40px; color:#fff; line-height:40px; "
						+ "text-align:center; border-radius:5px; position:fixed; top:84%; left:20%; z-index:999999; font-weight:bold;";
					document.body.appendChild(m);
					// 等待、添加特效、删除提示框
					setTimeout(function() {
						var d = 0.5;
						m.style.webkitTransition = '-webkit-transform ' + d + 's ease-in, opacity ' + d + 's ease-in';
						m.style.opacity = '0';
						setTimeout(function() {
							document.body.removeChild(m);
						}, d * 1000);
					}, duration);
				}
			}
		}

	};

	/**
	 * alert、comfirm、prompt 等常用对话框
	 * 需在 index 中引用模板 templates/dialogs.html
	 */
	o.dialog = new function() {

		/**
		 * alert - 提醒
		 *
		 * @param options.body	消息内容
		 * @param options.title	消息标题，默认为空
		 * @param options.close	关闭时的回调方法
		 */
		this.alert = function ( body, title, close ) {
			if ( typeof body == 'object' ) {
				title = body.title;
				close = body.close;
				body = body.body;
			}
			$.alert(body, title, close);
		};

		/**
		 * 错误提示
		 *
		 * @param options.body		错误信息
		 * @param options.duration	持续显示时间(以毫秒为单位)，默认为 2000。如果为 0 则不自动消失。
		 */
		this.alertError = function ( body, duration, callback ) {
			if ( typeof body == 'object' ) {
				duration = body.duration;
				callback = body.callback;
				body = body.body;
			}
			$.toast(body, duration, callback);
		};

		/**
		 * dropmenu - 下拉菜单
		 *
		 * @param options.target			下拉菜单的元素对像或选择器，如 #id、.ui-page-active #id，默认为 #dialogDropmenu
		 * @param options.follow  REQUIRED	跟随元素（如右上角的+号）的选择器或对象（ID属性不能为空）
		 * @param options.click				点击任意操作时的回调方法，可接收操作序号（0+）、以及对应的 buttons[N] 对象为参数
		 * @param options.buttons			操作列表
		 * @param options.buttons[n].icon		小图标的src地址
		 * @param options.buttons[n].text		操作标题
		 * @param options.buttons[n].click		点击时的回调函数，参数同 options.click
		 */
		this.dropmenu = function ( options ) {
			var target = (typeof (options.target) == "object") ? options.target : null,
				follow = (typeof (options.follow) == "object") ? options.follow : null;
			if ( options.target ) {
				target = options.target.contains(" ") ? $(options.target) : o.page.activePage.find(options.target);
				if (target.length == 0) target = $(options.target);
			} else {
				target = $("#dialogDropmenu");
			}
			if ( null == follow && options.follow ) {
				follow = options.follow.contains(" ") ? $(options.follow) : o.page.activePage.find(options.follow);
				if (follow.length == 0) follow = $(options.follow);
			}

			// 先对其进行定位，以防detach后无法定位
			locateDropmenu();
			if ( target.closest("div.ui-page-active").length == 0 ) target.detach();

			// 跟随元素ID和上次的一样或 options.buttons 为空则复用，否则创建新的 dropmenu
			var followId = follow.attr("id");
			if ( options.buttons && target.data("o-dropmenu-follow-id") != followId ) {
				target.data("o-dropmenu-follow-id", followId);
				createDropmenu();
			}

			// 显式下拉菜单
			target.modal('show');

			function createDropmenu() {
				var container = target.find(".popover-content");
				container.html("");
				for ( var i = 0; i < options.buttons.length; i++ ) {
					var btn = options.buttons[i],
						html = template( "dialogDropmenu_btn", btn );
					$(html).appendTo(container).data("o-dropmenu-btn", btn).on("click", function() {
						var idx = container.find(".row").index( $(this) ),
							btn = $(this).data("o-dropmenu-btn");
						if ( options.click ) options.click( idx, btn );
						if ( btn.click ) btn.click( idx, btn );
					});
				}
			}

			function locateDropmenu() {
				// 位置动态变化计算
				var elH = follow.innerHeight(),				// 目标元素高度
					elW = follow.innerWidth(),				// 目标元素宽度
					selW = parseInt( target.find('.popover').css("width") ),	// 获取弹出框的宽度
					y = follow.offset().top - $(document).scrollTop() + elH,
					x = follow.offset().left - $(document).scrollLeft() + elW - selW,
					$arrow = target.find(".popover .arrow"); // 箭头
				if ( $arrow.data('o-dropmenu-arrow-right') === undefined )
					$arrow.data( 'o-dropmenu-arrow-right', parseInt( $arrow.css("right") ) ); // 默认right
				if ( x < 0 ) {
					$arrow.css({"right": $arrow.data('o-dropmenu-arrow-right') - x});
					x = 0;
				} else {
					$arrow.css({"right": $arrow.data('o-dropmenu-arrow-right')});
				}
				target.find(".popover").css({"top": y + "px", "left": x + "px"});
			}
		};

		/**
		 * actionsheet - 底部选择框
		 *
		 * @param options.title				消息标题，默认为空
		 * @param options.click				点击任意操作时的回调方法，可接收操作序号（0+）、以及对应的 buttons[N] 对象为参数
		 * @param options.buttons			操作列表
		 * @param options.buttons[n].text		操作名
		 * @param options.buttons[n].type		框类型，可选值有:
		 * 											title: 表示是一个标题框,将运用标题样式 (对应Action Sheet中的.modal-content.title)
		 * 											confirm: 表示是一个确定框,将运用确认样式 (对应Action Sheet中的.modal-content.confirm)
		 * 											cancel: 表示是一个取消框,将运用取消样式 (对应Action Sheet中的.modal-content.cancel)
		 * 										如果不设改属性,将使用默认的类型样式 (对应Action Sheet中的.modal-content)
		 * @param options.buttons[n].cls		样式class(可自己写样式,通过该属性添加上去)
		 * @param options.buttons[n].click		点击操作时的回调函数，参数同 options.click
		 */
		this.actionsheet = function ( options ) {
			var dlg = $("#dialogActionsheet"),
				container = dlg.find(".modal-dialog").html("");

			if ( dlg.parent("body").length == 0 ) dlg.detach();

			if ( options.title ) {
				var html = template( "dialogActionsheet_title", options );
				container.append( html );
			}

			if ( options.buttons ) {
				for ( var i = 0; i < options.buttons.length; i++ ) {
					var btn = options.buttons[i],
						html = template( "dialogActionsheet_" + (btn.type || "common"), btn );
					$(html).appendTo(container).data("o-actionsheet-btn", btn).one("click", function() {
						var idx = container.find(".modal-content").index( $(this) ),
							btn = $(this).data("o-actionsheet-btn");
						if ( options.click ) options.click( idx, btn );
						if ( btn.click ) btn.click( idx, btn );
					});
				}
			}

			dlg.modal('show');
		};

		/**
		 * confirm - 确认
		 *
		 * @param options.body		消息内容
		 * @param options.title		消息标题，默认为空
		 * @param options.cancel	取消时的回调方法
		 * @param options.confirm	确定时的回调方法
		 */
		this.confirm = function( options ) {
			options = (typeof(options) != "object") ? {body: options} : (options || {});

			var dlg = $("#dialogConfirm");
			if ( dlg.parent("body").length == 0 ) {
				dlg.detach().on("click", "button", function() {
					if ( $(this).hasClass("o-btn-confirm") ) {
						dlg.data("o-btn-close", "confirm");
					} else {
						dlg.data("o-btn-close", null);
					}
				});
			}

			dlg.find("#dialogConfirmLabel").html( options.title || '&nbsp;' );
			dlg.find(".modal-body").html( options.body );

			dlg.one("hidden.bs.modal", function() {
				if ( dlg.data("o-btn-close") == "confirm" ) {
					if ( typeof(options.confirm) == "function" )
						options.confirm();
				} else {
					if ( typeof(options.cancel) == "function" )
						options.cancel();
				}
			});

			dlg.modal('show');
		};

		/**
		 * prompt - 提示输入
		 *
		 * @param options.default	默认的消息文本
		 * @param options.title		消息标题，默认为空
		 * @param options.cancel	取消时的回调方法
		 * @param options.confirm	确定时的回调方法，可接收用户输入的文本为参数
		 */
		this.prompt = function( options ) {
			options = (typeof(options) != "object") ? {title: options} : (options || {});

			var dlg = $("#dialogPrompt");
			if ( dlg.parent("body").length == 0 ) {
				dlg.detach().on("click", "button", function() {
					if ( $(this).hasClass("o-btn-confirm") ) {
						dlg.data("o-btn-close", "confirm");
					} else {
						dlg.data("o-btn-close", null);
					}
				});
			}

			dlg.find("#dialogPromptLabel").html( options.title || '&nbsp;' );
			dlg.find("#dialogPromptText").val( options["default"] );

			dlg.one("hidden.bs.modal", function() {
				if ( dlg.data("o-btn-close") == "confirm" ) {
					if ( typeof(options.confirm) == "function" )
						options.confirm( dlg.find("#dialogPromptText").val() );
				} else {
					if ( typeof(options.cancel) == "function" )
						options.cancel();
				}
			});

			dlg.modal('show');
			setTimeout(function(){
				dlg.find("#dialogPromptText").get(0).focus();
			}, 500);
		};
	};
	$.init();
})(jQuery);

(function($){
	/**
	 * 列表
	 *
	 * @param options.templateId	渲染列表数据的模板id
	 * @param options.url			加载数据的url地址
	 * @param options.max			每页条数，默认取配置 config.listloader_page_max
	 * @param options.type			下一页/更多的加载方式：pull-上拉加载，click-点击加载按钮，auto-到底部自动加载（默认）
	 * @param options.params		JSON 类型的加载请求参数
	 * @param options.reload		进入页面是否重新加载
	 */
	$.fn.listloader = function( options ) {
		var me = this;
		if ( me.length > 1 ) throw new Error( "Only one element support!" );

		options = $.extend( {type: "auto", offset: 0, max: $.o._config.listloader_page_max}, options );
		me.data( options );

		if ( me.data("o-listloader-initted") == true ) {
			return me;
		} else {
			me.data("o-listloader-initted", true);
		}

		var loader = createDropload();

		me.lock = function() {
			loader.lock();
			return me;
		};

		me.unlock = function() {
			loader.unlock();
			return me;
		};

		me.resetload = function() {
			$.pullToRefreshDone(me);
			return me;
		};

		if ( me.css('display') != 'none' ) loadData(true);	// 加载第一页
		return me;

		function createDropload() {
			createDroploadUi();
			$.initPullToRefresh(me);
			$.initInfiniteScroll(me);
		}

		function createDroploadUi() {
			// 加载成功后事件：先赋一个空的
			me.data("o-listloader-loaded", function() {});
			me.addClass('pull-to-refresh-content infinite-scroll');	// 设置class
			me.data('distance', 100);	// 设置下拉高度
			if ( me.find('.o-listloader-data').length == 0 )		// 添加默认数据容器
				me.append('<div class="o-listloader-data"></div>');
			if ( !me.find('.o-listloader-up-pull').length )			// 添加下拉刷新层
				me.prepend(template('o-listloader-up-pull', {$:$})).children(':first').addClass('o-listloader-up-pull');
			if ( !me.find('.o-listloader-auto-loading').length )	// 添加底部加载层
				me.append(template('o-listloader-auto-loading', {$:$})).children(':last').addClass('o-listloader-auto-loading');
			me.on('o.listloader.refreshed', function() {	// 监听自定义下拉刷新事件
				$.pullToRefreshDone(me);
			}).on('refresh', function(e) {	// light7 下拉刷新触发事件
				loadData( true );
			}).data('o-listloader-load', function() {	// 保存 加载 方法
				var $loading = me.find('.o-listloader-auto-loading');
				if ($loading.is(':visible') && $loading.offset().top < $(window).height()) {
					loadData();
				}
			}).data('o-listloader-loaded', function(finished) { // 加载成功后事件
				if ( finished ) {
					// 隐藏底部加载栏
					me.find('.o-listloader-auto-loading').hide();
				} else {
					setTimeout(function() {
						me.data('o-listloader-load')();
					}, 500);
				}
			}).on('infinite', function() {	// light7 上拉到底部触发事件
				loadData();
			}).on('show', function() {	// 针对多页签，切换到指定页签时加载
				if ( me.data('reload') ) {	// 重新加载
					loadData(true);
					me.removeData('reload');
				} else {
					me.data('o-listloader-load')();
				}
			});
			if ( options.reload ) {
				me.closest('body .page').on('pageAnimationStart', function() {
					if ( me.css('display') != 'none' ) loadData(true);	// 加载第一页
					else me.data('reload', true);
				});
			}
		}

		/**
		 * 加载数据
		 *
		 * @param refresh	是否重新加载
		 */
		function loadData( refresh ) {
			if ( me.data('loading') ) return;
			if ( refresh ) me.data('offset', 0);
			if ( refresh || me.data('total') === undefined || me.data('offset') < me.data('total') ) {
				me.data('loading', true);
				// 触发加载前事件
				me.trigger('o.listloader.beforeload', options);
				$.o.page.pageInitExec(function() {
					$.ajax({
						url: options.url,
						type: 'post',
						dataType: 'json',
						data: $.extend(options.params, {offset: me.data('offset'), max: me.data('max')}),
						success: function(data) {
							var html = template(options.templateId, $.extend({$:$}, options.params, data));
							if ( refresh || me.data('offset') == 0 ) {
								me.scrollTop(0);
								me.find('.o-listloader-data').html(html);
							} else {
								me.find('.o-listloader-data').append(html);
							}
							// 还原加载状态
							me.resetload();
							// 更新当前分页信息
							me.data('total', data.total)
								.data('offset', me.data('offset') + me.data('max'));
							// 更新UI
							if ( me.data('offset') >= me.data('total') ) {
								showFinished();
								me.data("o-listloader-loaded")(true);
							} else {
								me.find('.o-listloader-auto-loading').show(); // 解决bug：第一次下拉没有数据，添加数据后，第二次下拉，只会添加一页数据
								me.siblings('.o-listloader-finished').hide();
								me.data("o-listloader-loaded")(false);
							}
							// 触发加载完成事件
							if ( refresh ) {
								me.trigger('o.listloader.refreshed', data);
							} else {
								me.trigger('o.listloader.loaded', data);
							}
							me.trigger('o.listloader.success', data);

							me.data('loading', false);
						},
						error: function() {
							me.resetload(); // 还原加载状态
						}
					});
				});
			} else {
				showFinished();
				me.resetload();
			}

			/* 加载完成显示提示，3s后隐藏 */
			function showFinished() {
				var $finished = me.siblings('.o-listloader-finished').show();
				setTimeout(function() {
					if ( $finished.css("display") != 'none' )
						$finished.slideToggle();
				}, 2000);
			}
		}
	};

	/**
	 * 查找元素，先查找当前页面的，没找到再查找其他页面的
	 * @param selector
	 * @returns {*}
	 */
	$.look = function(selector) {
		var val = $.o.page.activePage.find(selector);
		return (val && val.length) ? val : $(selector);
	}
})(jQuery);
