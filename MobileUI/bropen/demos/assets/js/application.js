/* 应用的js */
/** 自定义配置 */
$.o.config = {
	/** 需登录的页面 */
	pages_authenticated: ["index.html", "personal.html", "security.html", "forum_pub.html", "forum.html?type=1&active=mine",
		"forum.html?type=2&active=mine", "collection_add.html", "collection_edit.html", "collection_view.html",
		"collection.html", "cropper.html", "forum_edit.html", "forum_pub.html", "gift_exchange.html", "integral.html", "personal_profile_edit.html", "personal_profile.html",
		"security_password_update.html", "security_question_confirm.html", "security_question_setup.html"],

	/** 用户登录请求的URL */
	// http://192.168.0.233:8081/boeMobileAdapter/mobileLogin/loginByUsername?username=zhangsan&password=123456
	user_login_url: "server2/mobileLogin/login",

	/** 服务器地址 */
	server_url: ["http://192.168.0.123:8081/bro/",
		"http://192.168.0.123:8083/boeMobileAdapter/",
		"http://192.168.0.123:8083/boeMobileAdapter/"],

	server_url_pattern: [/^\/?server1\//, /^\/?server2\//, /^\/?boeMobileAdapter\//],

	server_url_replace: true,

	/** 保持登录的间隔：20' */
	user_login_interval: 20 * 60 * 1000,

	/** 默认用户头像的URL */
	user_default_avatar_url: false,

	/** 图片加载压缩比 */
	img_quality: 40,
	/** 图片加载宽度:头像图片,普通图片 */
	img_width_avatar: 150,
	img_width_normal: ($(window).width() * 1.5),

	/** light7配置 */
	swipePanelOnlyClose: true,

	telphone: '18012345678'
};

/** 首页 */
$.o.page.on("pageInit", "#index", function (e, page) {
	console.log('首页初始化!!------------------------------------');
});
/** 表单校验、提交 */
$(document).on("pageInit", ".form", function (e, id, page) {
	console.log('form pageInit')
	page.find('form').on('o.submit.done', function (e, data) {
		console.log(arguments)
	});
	page.data('pageExt')['form-popover'].on('click', '#test', function () {
		console.log('form-popover--test--------我被点击了');
	});
});
/** 模板 */
$(document).on("pageInit", ".template-show", function (e, id, page) {
	console.log('template_show pageInit')
	page.on('o.template.data.loaded', function (e, data) {
		console.log('o.template.data.loaded----------template_show------------------------------o.template.data.loaded')
		console.log(arguments)
	});
});
/** 模板 */
$(document).on("pageInit", ".test-page-template", function (e, id, page) {
	page.on('o.template.success', function (e, data) {
		console.log('o.template.success----------test-page-template')
		console.log(arguments)
	});
});

/** 下拉刷新 */
$(document).on("pageInit", ".page-ptr", function (e, id, page) {
	var $content = $(page).find(".content").on('refresh', function (e) {
		// 2s timeout
		setTimeout(function () {
			var cardHTML = '<div class="card">' +
				'<div class="card-header">Title</div>' +
				'<div class="card-content">' +
				'<div class="card-content-inner">Contents Contents Contents Contents Contents Contents Contents Contents Contents ' +
				'</div>' +
				'</div>' +
				'</div>';
			$content.find('.card-container').prepend(cardHTML);
			// Done
			$.pullToRefreshDone($content);
		}, 2000);
	});
});
/* 到底部自动加载更多 */
$(document).on("pageInit", ".page-infinite-scroll", function (e, id, page) {
	function addItems(number, lastIndex) {
		var html = '';
		for (var i = 0; i < 20; i++) {
			html += '<li class="item-content"><div class="item-inner"><div class="item-title">Item</div></div></li>';
		}
		$('.infinite-scroll .list-container').append(html);
	}

	var loading = false;
	$(page).on('infinite', function () {

		if (loading) return;

		loading = true;

		setTimeout(function () {
			loading = false;

			addItems();
		}, 1000);
	});
});
/* 多页签列表 */
$(document).on("pageInit", "#page-ptr-tabs", function (e, id, page) {
	$(page).find(".pull-to-refresh-content").on('refresh', function (e) {
		// 2s timeout
		var $this = $(this);
		setTimeout(function () {

			$this.find('.content-block').prepend("<p>New Content......</p>");
			// Done
			$.pullToRefreshDone($this);
		}, 2000);
	});
	$(page).find(".infinite-scroll").on('infinite', function (e) {
		// 2s timeout
		var $this = $(this);
		if ($this.data("loading")) return;
		$this.data("loading", 1);
		setTimeout(function () {
			$this.find('.content-block').append("<p>New Content......</p><p>New Content......</p><p>New Content......</p>");
			$this.data("loading", 0);
		}, 2000);
	});
});

/** 登录页显示前事件，还可以有其他事件，见 o.page.on 的 API 注释 */
$.o.page.on("pageInit", ".login", function (event, page) {
	page.find("form").validator(function () {
		$(this).addClass("disabled").prop("disabled", true);	// 禁用登录按钮
		$.o.user.login(page.find("form").serialize());	// 用户登录
	});
});
/** 我页面 */
$.o.page.on("pageInit", ".myself", function (e, page) {
	page.on('click', '#myContent', function () {
		//头像图片点击事件
		var buttons1 = [];
		if ($.o.native.device.platform) {
			buttons1.push({
				text: '拍照',
				bold: true,
				onClick: function () {
					$.o.native.camera.takePhoto(pic_add);
				}
			});
			buttons1.push({
				text: '相册',
				bold: true,
				onClick: function () {
					$.o.native.camera.choosePicture(pic_add);
				}
			});
		} else {
			buttons1.push({
				text: '<input type="file" id="head_hortrait_pic" name="head_portrait" accept="image/*">',
				close: false
			});
			buttons1.push({
				text: '确定',
				bold: true,
				onClick: function () {
					var $file = $("#head_hortrait_pic")
					$.o.util.preImg($file, null, 10, pic_add);
					$file.val('');
				}
			});
		}
		var buttons2 = [
			{
				text: '取消',
			}
		];
		var groups = [buttons1, buttons2];
		$.actions(groups);

		// 添加图片处理
		function pic_add(base64) {
			if (base64.indexOf('data:image/') != 0)
				base64 = 'data:image/jpeg;base64,' + base64;
			$.o.util.oneCache.set('cropper', 'base64', base64);
			$.o.util.oneCache.set('cropper', 'callback', function () {
				page.find('#myContent').html('<img src="' + $.o.user.avatarUrl + '"/>');
			});
			$.o.page.change(assets.baseBro + "bropen/templates/cropper.html");
		}
	})
});

/** 测试页面 */
$.o.page.on("pageAnimationStart", "*", function (e, page) {  // 动画开始
	console.log('document----------all pageInit----------')
	console.log(arguments)
}).on("pageInit", "*", function (e, page) {  // 页面初始化
	console.log('document----------test init:------' + page.attr('class'))
	console.log(arguments)
}).on("pageAnimationEnd", "*", function (e, page) {  // 动画结束
	console.log('document----------test pageAnimationEnd')
	console.log(arguments)
}).on("beforePageSwitch", "*", function (e, page) {  // 页面移动前
	console.log('document----------test beforePageSwitch')
	console.log(arguments)
}).on("pageReinit", "*", function (e, page) {    // 再次进入该页面
	console.log('document----------test pageReinit')
	console.log(arguments)
}).on("o.back", "*", function (e, page) {    // 回退到该页面
	console.log('document----------test o.back')
	console.log(arguments)
}).on("o.forward", "*", function (e, page) { // 前进到该页面
	console.log('document----------test o.forward')
	console.log(arguments)
}).on("loaded", "*", function (e, page) {    // 页面ajax加载到body完成
	console.log('document----------test loaded')
	console.log(arguments)
}).on("pageSwitched", '*', function (e, page) {  // 跳转到别的页面结束
	console.log('document----------test pageSwitched')
	console.log(arguments)
});
/** 测试页面 */
$(window).on("pageLoadStart", function (e, id, page) {
	console.log('window----------test pageLoadStart')
	console.log(arguments)
}).on("pageLoadCancel", function (e, id, page) {
	console.log('window----------test pageLoadCancel')
	console.log(arguments)
}).on("pageLoadError", function (e, id, page) {
	console.log('window----------test pageLoadError')
	console.log(arguments)
}).on("pageLoadComplete", function (e, id, page) {
	console.log('window----------test pageLoadComplete')
	console.log(arguments)
}).on("beforePageRemove", function (e, id, page) {
	console.log('window----------test beforePageRemove')
	console.log(arguments)
}).on("pageRemoved", function (e, id, page) {
	console.log('window----------test pageRemoved')
	console.log(arguments)
});

//对话框
$(document).on("pageInit", "#page-modal", function (e, id, page) {
	var $content = $(page).find('.content');
	$content.on('click', '.alert-text', function () {
		$.alert('Hello Fool');
	});

	$content.on('click', '.alert-text-title', function () {
		$.alert('Alter message', 'title!');
	});

	$content.on('click', '.alert-text-title-callback', function () {
		$.alert('Custom Alert message', 'custom alert title!', function () {
			$.alert('Yout clicked OK button!')
		});
	});
	$content.on('click', '.confirm-ok', function () {
		$.confirm('Are you sure?', function () {
			$.alert('You clicked OK button!');
		});
	});
	$content.on('click', '.prompt-ok', function () {
		$.prompt("What's your name?", function (value) {
			$.alert('Your name is "' + value + '"');
		});
	});
	$content.on('click', '.show-toast', function () {
		$.toast("Toast");
	});
});
