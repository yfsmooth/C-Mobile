/* 应用的js */
/** 自定义配置 */
$.o.config = {
	/** 可匿名的页面 */
	pages_anonymous: ["login.html","gesture.html"],

	/** 用户登录请求的URL */
	user_login_url: "server2/mobileLogin/login",

	/** 服务器地址 */
	server_url: ["http://192.168.0.230:8081/bro/",
		//"http://192.168.0.88:8081/boeMobileAdapter/",
		//"http://192.168.0.88:8081/boeMobileAdapter/",
		//"http://192.168.0.88:8080/boeHQ/"],
		"http://192.168.0.230:8888/Foobar/",
		"http://192.168.0.230:8888/Foobar/"
	],
	server_url_pattern: [/^\/?server1\//, /^\/?server2\//, /^\/?Foobar\//],
	//server_url_pattern: [/^\/?server1\//, /^\/?server2\//, /^\/?boeMobileAdapter\//, /^\/?boeHQ\//],
	server_url_replace: true,

	/** 自定义配置 帮助-电话,邮箱，即时通讯 */
	telphone: "15111234857",
	email: "jdf@bropen.com",
	pidgin: "jdf",

	/** 保持登录的间隔：20' */
	user_login_interval: 20 * 60 * 1000,

	/** 默认用户头像的URL */
	user_default_avatar_url: false,

	/** 图片加载压缩比 */
	img_quality: 40,
	/** 图片加载宽度:头像图片,普通图片 */
	img_width_avatar: 150,
	img_width_normal: ($(window).width() * 1.5)
};

$.o.i18n.merge({
	"bropen.bpm.instance.ProcessInstance.priority":{
		0:"无",
		5:"一般",
		7:"紧急",
		9:"特急"
	}
});
/**
 * i18n
 */
template.helper("i18n", function (prefix, val) {
	var code = prefix
	if (val != null)
		code += "." + val
	return $.o.i18n.m(code)
});
$.o.Constants.FIELD_PROCESS_INST = "processInstance";


/**
 * 单个点击复选框
 */
function bunForOne(obj) {
	//如果是选中的添加对勾
	if (obj.checked) {
		$(obj).closest(".ch1").find(".gou").addClass("gou1");
	} else {
		$(obj).closest(".ch1").find(".gou").removeClass("gou1");
	}
}
/**
 * 全选按钮
 */
function bunForAll(page) {
	var checkeds = page.find("#checked").find(":checkbox");
	var fals = true;
	// 判断是否未全部选中状态,全选为false
	if (page.find(":checked").length == checkeds.length) {
		fals = false;
	}
	if (fals) {
		// 遍历checkbox加上.gou样式
		for (var i = 0; i < checkeds.length; i++) {
			checkeds[i].checked = "checked";
			$(checkeds[i]).closest(".ch1").find(".gou").addClass("gou1");
		}
	} else {
		// 遍历checkbox去掉.gou样式
		for (var i = 0; i < checkeds.length; i++) {
			checkeds[i].checked = "";
			$(checkeds[i]).closest(".ch1").find(".gou").removeClass("gou1");
		}
	}
}
/**
 * 添加头像颜色
 */
function addColor(page) {
	var colors = ["#88abda", "#acd598", "#ff8e6b", "#f29c9f"];
	page.find("#checked,#checked-emp").find(".round-head").each(function (i, e) {
		$(e).attr("style", "background-color:" + colors[i % colors.length]);
	});
	// 头部已选人加颜色
	page.find("#checked-head").find(".round-head").each(function (i, e) {
		$(e).attr("style", "background-color:" + colors[i % colors.length]);
	});
	// 流程页面选人加颜色
	page.find("#div_opinion").find(".round-head").each(function (i, e) {
		$(e).attr("style", "background-color:" + colors[i % colors.length]);
	});
}
/**
 * 页面层级导航栏
 */
function navigation(page) {
	// 办理所有层级
	page.find(".navigation").each(function (i, e) {
		var length = page.find(".navigation").length;
		// 所带层级跳转层级数
		$(e).find("a").attr("data-o-url-go", 1 + i - length);
		// 最后一个添加颜色
		if (i == length - 1) $(e).find("a").attr("style", "color:#717171");
		$(e).css("color", "#717171");
	});
	setTimeout(function () {
		// 使滚动条置顶
		var scroll = page.find(".headerNav");
		if (scroll) scroll[0].scrollLeft = 10000;
	}, 10);
}
/**
 * 通讯录搜索
 */
function searchEmp(page, templateId, orgId) {
	page.on("click", ".searchbar-cancel", function () {
		// 查找搜索框内容
		var text = page.find("#search").val();
		// 如果为空就返回首页
		if (text == "" || text == null) {
			page.find(".content .older").show();
			page.find("#find").html("");
		} else if (text.length < 2) { // 验证必须两个字以上
			$.toast('请输入两个以上字符');
			return
		} else {
			$.ajax({
				url: 'server2/address',
				type: 'post',
				sync: true,
				data: {'find': text, orgId: orgId},
				dataType: 'json',
				success: function (data) {
					page.find(".content .older").hide();
					page.find("#find").html(template(templateId, data.data));
					addColor(page);
				}
			});
		}
	});
}
/**
 * 登录页面
 */
$.o.page.on("pageInit", ".login", function(e, page) {
	// 控制垂直居中
	var pageHeight = $(window).get(0).innerHeight;
	var formHeight = page.find(".content form").height();
	page.find(".logo-div").css("margin-top",(pageHeight-formHeight)/3);
	// 点击眼睛图标显示密码
	page.on("click", "#item3 img", function(){
		if (page.find("#item3 input").attr("type") == "text") {
			page.find("#item3 input").attr("type","password");
		} else {
			page.find("#item3 input").attr("type","text");
		}
	})
	page.on("click", "#submit", function(){
		// 缓存中存入密码
		$.o.util.cache.set("password",$("#password").val());
		// 去掉用户名中的空格
		var username = page.find("#username").val().replace(/[ ]/g,"");
		page.find("#username").val(username);
	})
})
/**
 * 首页
 */
$.o.page.on("pageInit", ".index", function (e, page) {
	page.on("focus", "#search", function() {
		$.o.page.change("index_search.html")
	})
})

/**
 * 首页搜索
 */
$.o.page.on("pageInit", ".index-search", function (e, page) {
	setTimeout(function() {
		page.find("#search").focus()
	}, 500)
	// 点击搜索分类
	page.on("click", ".btn-contact, .btn-work", function() {
		var $type = page.find("#type")
		var type = $type.val(),
			curType = $(this).data("type")
		var $search = page.find("#search")
		if (type == curType) {
			$type.val("")
			$search.attr("placeholder", "请输入关键字").focus()
		} else {
			$type.val(curType)
			$search.attr("placeholder", "在" + $(this).text() + "中搜索").focus()
		}
	}).on("click", ".searchbar-cancel", function() {
		$.post("/server2/homepage/allProcess", {type: page.find("#type").val(), condition: page.find("#search").val()}, function(data) {
			var html = template("template-work-list", $.extend({window:window, $:$}, data))
			console.log(data)
			console.log(html)
		})
	});
}).on("pageSwitched", ".index-search", function(e, page) {
	$.router.removePage(page);
})

/**
 * 通讯录首页
 */
$.o.page.on("pageInit", ".contact", function (e, page) {
	searchEmp(page, "template-contact_find", $.o.util.url.getParameter('orgId'));
}).on("pageSwitched", ".contact", function (e, page) {  // 跳转到别的页面时去掉搜索
	page.find(".content .older").show();    // 显示原始内容
	page.find("#find").html("");            // 清空查询结果
	page.find("#search").val('');           // 清空搜索栏
});
/**
 * 企业通讯添
 */
$.o.page.on("loaded", ".contact-ent", function (e, page) {
	var params = $.o.util.url.getParameters();
	searchEmp(page, "template-contact-ent_find", params.orgId);
	var me = page.find("[data-o-template-script-id]");
	if ( params.groupId ) { // 在分组下
		var key = $.o.Constants.get($.o.Constants.contactCache, params.orgId, params.groupId);
		me.removeAttr("data-o-template-data-url").removeData("o-template-data-url").data('o-template-params', $.o.util.tCache.get(key));
	} else {
		me.on("o.template.data.loaded", function(e, data) {
			for ( var i=0; i<data.data.data.length; i++ ) {
				var el = data.data.data[i];
				if ( el.type == "org" && el.group ) { // 缓存分组下数据
					var key = $.o.Constants.get($.o.Constants.contactCache, params.orgId, el.groupId);
					$.o.util.tCache.set(key, {data:el});
				}
			}
		});
	}
	page.on('o.template.success', '.content', function () {
		addColor(page)
		navigation(page)
	});
}).on("pageSwitched", ".contact-ent", function (e, page) {  // 跳转到别的页面时去掉搜索
	page.find(".content .older").show();    // 显示原始内容
	page.find("#find").html("");            // 清空查询结果
	page.find("#search").val('');           // 清空搜索栏
});

/** 创建流程 */
$.o.page.on("pageInit", ".message_processes", function (e, page) {
	var processId;
	var taskId = $.o.util.url.getParameter('taskId');//任务id
	var nowstep = $.o.util.url.getParameter('step');//当前所在步骤
	var definitionName = $.o.util.url.getParameter('definitionName');//取文种名称
	var SequenceFlowGroups;//提交分组
	var decisiveOp;//决定性意见(组)
	var sequenceFlowsway;//路径(组)
	var sequenceFlowGroup;//最终选择的提交分组
	var decisiveOpchoice;//最终选择决定性意见id
	var sequenceFlowschoice;//最终选择路径id
	var noSelectActors;//最终不需要选择的办理人
	var noSelectReaders;//最终不需要选择的阅知人
	var selectIdGroup = [];//选人栏编号(每个编号对应缓存中的一段内容)
	var buttonsCancel = [{
		text: '取消'
	}];
	// 初始化流程页面
	$.post("server2/step/submit", {data: JSON.stringify({taskId: taskId}), step: ""}, function (data) {
		var templateHtml = template("template-message_processes-show", {definitionName: definitionName});
		page.find("#process").html(templateHtml);
		if ( typeof data == 'string' ) data = JSON.parse(data);

		if (data.success == false) {
			$.o.dialog.alertError(data.message || '加载失败', null, function () {
				page.data('fail', true);
				if ( page.is(':visible') ) $.o.page.back();
			});
			return;
		}
		processId = data.data.processId;
		if (data.data.hasSequenceFlowGroups == null) {
			//不存在提交分组
			page.find("#refer").hide();
			if (data.data.decisiveOpinions != null) {
				//有决定性意见
				page.find("#div_opinionon").show();
				//初始化决定性意见
				decisiveOp = data.data.decisiveOpinions;
			} else {
				//无决定性意见
				//初始化路径模块
				addwayModularity(data, true);
			}
			return;
		}
		SequenceFlowGroups = data.data.hasSequenceFlowGroups;
		//如果提交分组的条数为1
		if (SequenceFlowGroups.length == 1) {
			var referText = SequenceFlowGroups[0].text;
			page.find("#refer").find(".item-title").html(referText);
			var obj = {taskId: taskId, sequenceFlowGroup: SequenceFlowGroups[0].value};
			page.off("click", "#refer", referClick);
			$.post("server2/step/submit", {
					data: JSON.stringify(obj),
					step: "hasSequenceFlowGroups"
				},
				/**
				 *  根据返回step的值判断应该走的流程
				 *  @params: result.type  hasDecisiveOpinions：有决定性意见
				 *                        hasOpinions：需要填写意见(不用选择路径,没有决定性意见)
				 *                        getSequenceFlows：需要选择路径(没有决定性意见)
				 *                        selectActors：选人
				 *                        submit：提交
				 */
				function (result) {
					if ( typeof result == 'string' ) var result = JSON.parse(result);
					nowstep = result.step;//记录当前流程的步骤
					if (result.step == "hasDecisiveOpinions") {
						//有决定性意见
						page.find("#div_opinionon").show();
						//初始化决定性意见
						decisiveOp = result.data.decisiveOpinions;
					} else {
						//无决定性意见
						//初始化路径模块
						addwayModularity(result, false);
					}
				});
		}
	})
	// 提交分组
	page.on('click', '#refer', referClick);

	// 决定性意见
	page.on('click', '#opinionon', function () {
		var buttons = [];
		var step = "hasDecisiveOpinions";
		for (var i = 0; i < decisiveOp.length; i++) {
			var decisiveOpJson = decisiveOp[i].value;
			var decisiveOpText = decisiveOp[i].text;
			buttons.push({
				text: decisiveOpText,
				value: decisiveOpJson,
				onClick: function () {
					//点击决定性意见,隐藏路径和意见选人
					page.find("#div_way").hide();
					page.find("#div_way").find(".item-title").html("请选择");
					changeTextColor("div_way", "#939999");
					page.find("#div_opinion").empty().hide();
					decisiveOpchoice = this.value;
					var obj = {taskId: taskId, decisiveOpinion: this.value, sequenceFlowGroup: sequenceFlowGroup};
					var btText = this.text;
					$.post("server2/step/submit", {data: JSON.stringify(obj), step: step}, function (result) {
						page.find("#div_opinionon .item-title").html(btText);
						changeTextColor("div_opinionon", "#7c8185");
						if ( typeof result == 'string' ) result = JSON.parse(result);
						nowstep = result.step;//记录当前流程的步骤
						//添加路径模块
						addwayModularity(result, false);
					})
				}
			})
		}
		var groups = [buttons, buttonsCancel];
		$.actions(groups);
	});

	// 路径
	page.on('click', '#way', wayClick);

	// 意见输入
	page.on("click", ".opinion", function () { // 点击意见显示文本域，切换图标颜色
		var me = $(this);
		me.siblings('.opinion.active').removeClass('active').next().hide();
		if (me.hasClass('active')) {
			me.removeClass('active').next().hide();
		} else {
			me.addClass('active').next().show().find('textarea').focus();
		}
	}).on("blur click", "textarea", function () { // 文本框失去焦点、点击(已填意见赋值)
		$(this).parents("li").prev().find(".item-title").html($(this).val());
	}).on("input", "textarea", function () { // 统计文本框字数
		$(this).parents("div").first().find("span").html($(this).val().length);
	}).on("click", ".back", function () { // 返回按钮事件
		clearCache();
	});

	// (确认)提交按钮
	page.on("click", ".submit", toSubmit);

	// 提交分组点击事件
	function referClick() {
		var step = "hasSequenceFlowGroups";
		var buttons1 = [];
		for (var i = 0; i < SequenceFlowGroups.length; i++) {
			var gJson = SequenceFlowGroups[i].value;
			var gText = SequenceFlowGroups[i].text;
			buttons1.push({
				text: gText,
				value: gJson,
				onClick: function () {
					//点击提交分组下面的步骤隐藏,清空之前选择过的数据
					page.find("#div_opinionon").hide();
					page.find("#div_opinionon").find(".item-title").html("请选择");
					changeTextColor("div_opinionon", "#939999");
					page.find("#div_way").hide();
					page.find("#div_way").find(".item-title").html("请选择");
					changeTextColor("div_way", "#939999");
					page.find("#div_opinion").empty().hide();

					var obj = {taskId: taskId, sequenceFlowGroup: this.value};
					var btValue = this.value;
					var btText = this.text;
					$.post("server2/step/submit", {data: JSON.stringify(obj), step: step}, function (result) {
						/**
						 *  根据返回step的值判断应该走的流程
						 *  @params: result.type  hasDecisiveOpinions：有决定性意见
						 *                        hasOpinions：需要填写意见(不用选择路径,没有决定性意见)
						 *                        getSequenceFlows：需要选择路径(没有决定性意见)
						 *                        selectActors：选人
						 *                        submit：提交
						 */
						page.find("#refer").find(".item-title").html(btText);
						changeTextColor("refer", "#7c8185");//颜色变深
						if ( typeof result == "string" ) result = JSON.parse(result);
						nowstep = result.step;//记录当前流程的步骤
						sequenceFlowGroup = btValue;
						if (result.step == "hasDecisiveOpinions") {
							//有决定性意见
							page.find("#div_opinionon").show();
							//初始化决定性意见
							decisiveOp = result.data.decisiveOpinions;
						} else {
							//无决定性意见
							//初始化路径模块
							addwayModularity(result, false);
						}
					});
				}
			})
		}
		var groups = [buttons1, buttonsCancel];
		$.actions(groups);
	}

	// 路径点击事件
	function wayClick() {
		var buttons = [];
		var step = "getSequenceFlows";
		for (var i = 0; i < sequenceFlowsway.length; i++) {
			var getSequenceFlowsValue = sequenceFlowsway[i].id;
			var getSequenceFlowsText = sequenceFlowsway[i].text;
			buttons.push({
				text: getSequenceFlowsText,
				value: getSequenceFlowsValue,
				onClick: function () {
					//点击路径隐藏意见与选人
					page.find("#div_opinion").empty().hide();
					var obj = {taskId: taskId, sequenceFlowId: this.value};
					var btText = this.text;
					$.post("server2/step/submit", {data: JSON.stringify(obj), step: step}, function (result) {
						page.find("#div_way").find(".item-title").html(btText);
						changeTextColor("div_way", "#7c8185");
						sequenceFlowschoice = getSequenceFlowsValue;
						if ( typeof result == 'string' ) result = JSON.parse(result);
						nowstep = result.step;//记录当前流程的步骤
						//如果意见和选人同时为空,则说明需要提交当前流程
						addOpActorModularity(result);
					});
				}
			})
		}
		var groups = [buttons, buttonsCancel];
		$.actions(groups);
	}

	/** 加载路径模块
	 *  @param result 数据结果,可能有多个步骤信息
	 *  @param ifInPageFirst 是否第一次进入页面就跳到路径步骤(没有提交分组与决定性意见)(此参数的存在原因是第一次进入页面的返回参数形式,与后面请求控制器的返回参数形式不同)
	 * */
	function addwayModularity(result, ifInPageFirst) {
		/**
		 * 初始化路径(1.一条路径;2.多条路径)
		 *  1.一条路径时不需要选择,路径,意见,选人一起弹出.
		 *  2.多条路径时,需要选择路径,仅弹出意见和选人
		 */
		sequenceFlowsway = result.data.sequenceFlows;
		if (sequenceFlowsway.length > 1) {
			page.find("#div_way").show();
			// 点会签后，路径的点击事件被解绑了，所以重新绑定
			if ( page.data('way') === false ) page.on('click', '#way', wayClick).removeData('way'); // 路径
		} else if (sequenceFlowsway.length == 1) {
			//如果路径有一条时,给路径赋值,且路径框不能点击
			page.find("#div_way").show();
			page.find("#way_value").html(sequenceFlowsway[0].text);
			page.off('click', '#way', wayClick).data('way', false);
			sequenceFlowschoice = sequenceFlowsway[0].id;
			addOpActorModularity(result);
		}
	}

	//加载意见,选人模块
	/**
	 * 选人数据初始化
	 * 分别有四个选人分组
	 * @param: data.actors(需要选择的办理人)
	 * @param: data.readers(需要选择的阅知人)
	 * @param: data.noSelectActors(不需要选择的办理人)
	 * @param: data.noSelectReaders(不需要选择的阅知人)
	 * 存入选人数据的方案:
	 * 1.分别存入每个选人分组的id(注意:需要选择的分组中存入的是多个分组路径id)
	 * 2.在每个选人框中存入data-id属性,对应的属性值为对应的分组路径id
	 * 3.根据对应的id存入不需要选择的两个选人分组的选人信息
	 */
	function addOpActorModularity(result) {
		// 清空选人数据
		clearCache();
		selectIdGroup = [];
		/**
		 *  选择路径后,意见和选人一起出现.
		 *  意见可能有多组
		 *  选人可能有多组
		 * */
		page.find("#div_opinion").show();
		// 加载意见模块
		if (result.data.opinion != null) {
			//判断是否有意见模块
			var newContentHtml = template("template-opinions-show", result);
			page.find("#div_opinion").append(newContentHtml);
		}
		// 加载选人模块
		var newSelectorHtml = template("template-selector-show", $.extend({window:window, $:$}, $.o.util.url.getParameters(), result));
		page.find("#div_opinion").append(newSelectorHtml);
		// 存入actors路径id
		for (var i = 0; i < result.data.actors.length; i++) {
			selectIdGroup.push(result.data.actors[i].id);
			$.o.util.tCache.set( $.o.Constants.get($.o.Constants.processSelectorInit, result.data.actors[i].id), result.data.actors[i].data);
		}
		// 存入readers路径id
		for (var i = 0; i < result.data.readers.length; i++) {
			selectIdGroup.push(result.data.readers[i].id);
			$.o.util.tCache.set( $.o.Constants.get($.o.Constants.processSelectorInit, result.data.readers[i].id), result.data.readers[i].data);
		}
		//存入noSelectActors,noSelectReaders
		noSelectActors = result.data.noSelectActors;
		noSelectReaders = result.data.noSelectReaders;
		addColor(page);//初始化头像颜色
		nowstep = "selectActors";//已初始化选人模块，则步骤更新至选人
	}

	// 提交方法
	function toSubmit() {
		if (nowstep == "selectActors" || nowstep == "submit") {
			var allNames = [], allNameIds = {};
			//校验意见
			var optional = $("#optional").val(),
				// ["id":task.processInstId, "taskId":task.id, "submitSequenceFlows":["sequenceFlows":sequenceFlows, readers:readers].encodeAsJSON(),
				// "sequenceFlowId":data.sequenceFlowId, "optional":data.optional, "opinions":data.opinions?.encodeAsJSON(), "returnObject":true]
				res = {
					id: processId,						// 流程实例id
					taskId: taskId,						// 任务id
					sequenceFlowId: sequenceFlowschoice,// 选择的提交路径
					submitSequenceFlows: {
						readers: [],					// 阅知人
						sequenceFlows: []				// 提交路径对应的下一环节办理人
					},
					optional: optional,					// 意见是否必填
					opinions: [],						// 意见
					returnObject: true					// 返回结果类型标识符
				}
			var textareas = page.find(".choise textarea");
			for ( var i=0; i<textareas.length; i++ ) {
				var me = $(textareas[i]),
					val = me.val().replace(/^\s+|\s+$/g, '');
				if (optional == 2 && val == "") {
					$.alert("您未填写完意见!");
					return false;
				}
				res.opinions.push({
					command: val=='' && !$.o.util.means(page.find('#opinionBlank').val()) ? 'delete' : 'save',
					content: val,
					decisiveOpinion: decisiveOpchoice,
					sfId: sequenceFlowschoice,
					tag: me.data('id'),
					taskId: taskId
				});
			}
			// 校验选人
			for (var i = 0; i < selectIdGroup.length; i++) {
				// 分别取出每组的选人信息
				var selectIdGroupId = selectIdGroup[i];
				var data = $.o.util.tCache.get( $.o.Constants.get($.o.Constants.processSelector, selectIdGroupId) );
				if (!data) {
					$.alert("您还未完成选人!");
					return false;
				}
				if ( selectIdGroupId.startsWith('toread') ) {
					for ( var j=0; j<data.length; j++ ) {
						concatAllNames(data[j].id, data[j].name);
						res.submitSequenceFlows.readers.push(data[j].id);
					}
				} else {
					var todor = {
						id: selectIdGroupId.split('&')[1],
						isEI: true,
						nodes: [{
							actors: [],
							nodeDisplayName: "null"
						}]
					}
					for (var j = 0; j < data.length; j++) {
						concatAllNames(data[j].id, data[j].name);
						todor.nodes[0].actors.push(data[j].id);
					}
					res.submitSequenceFlows.sequenceFlows.push(todor);
				}
			}

			// 拼接 不需要选择的办理人
			if ( noSelectActors ) {
				for (var i = 0; i < noSelectActors.length; i++) {
					var noSelectActor = noSelectActors[i];
					var todor = {
						id: noSelectActor.sequenceFlowId,
						isEI: true,
						nodes: [{
							actors: noSelectActor.actors.split(','),
							nodeDisplayName: noSelectActor.sequenceFlowName
						}]
					}
					res.submitSequenceFlows.sequenceFlows.push(todor);
					concatAllNames(noSelectActor.actors, noSelectActor.names);
				}
			}
			// 拼接 不需要选择的阅知人
			if ( noSelectReaders ) {
				for (var i = 0; i < noSelectReaders.length; i++) {
					concatAllNames(noSelectReaders[i].actors, noSelectReaders[i].names);
					$.o.util.Array.concat(res.submitSequenceFlows.readers, noSelectReaders[i].actors.split(','))
				}
			}

			res.opinions = JSON.stringify(res.opinions);
			res.submitSequenceFlows = JSON.stringify(res.submitSequenceFlows);

			$.modal({
				title: "确认提交" + (allNames.length>0 && allNames[0]!="" ? '给' : '') + allNames.join(',') + "?",
				buttons: [{
					text: '取消',
					onClick: function () {
						return false;
					}
				}, {
					text: '确认',
					onClick: function () {
						//提交
						$.post("server2/step/submit", {data: JSON.stringify(res), step: nowstep}, function (data) {
							var result = (typeof data == 'string') ? JSON.parse(data) : data;
							if (result.success) {
								clearCache(); // 清空缓存中选人信息
								$.o.dialog.alert("提交成功!", null, function () {
									$.o.page.go(-2, true);
								});
							} else $.alert(result.data.message);
						});
					}
				}]
			});

			/**
			 * 拼接人员名称
			 * @param ids
			 * @param names
			 */
			function concatAllNames(ids, names) {
				if ( typeof(ids) == "number" ) ids = ids + "";
				ids = ids.split(',');
				names = names.split(',');
				for ( var i=0; i<ids.length; i++ ) {
					var id = ids[i];
					if ( !allNameIds[id] ) {
						allNameIds[id] = true;
						allNames.push(names[i]);
					}
				}
			}
		}
		else {
			$.alert("您还未填完所有的信息!");
		}
	}

	// 清空缓存中的选人信息
	function clearCache() {
		$.o.util.tCache.remove( $.o.Constants.processSelector );
	}

	//更改确定文字颜色
	function changeTextColor(id, color) {
		page.find("#" + id).find(".item-title").css("color", color);
	}
})
/** 创建流程已选人回显 */
.on("o.back", ".message_processes", function (e, page) {
	page.find(".select_person .item-inner").each(function () {
		var me = $(this);
		//取对应的路径id
		var dataId = me.data("id");
		//根据路径id,取选人信息
		if (dataId) {
			var selector = $.o.util.tCache.get( $.o.Constants.get($.o.Constants.processSelector, dataId) ) || [];
			var $div = me.find('.checkedEmp').html('');
			me.find(".selected")[selector.length > 5 ? "show" : "hide"]();
			for ( var i=0; i<selector.length; i++ ) {
				$div.append( template.compile('<div class="round-head" data-id="{{emp.id}}" {{if emp.color}}style="background-color:{{emp.color}};"{{/if}}>{{$.o.util.subName(emp.name)}}</div>')({$:$, emp:selector[i]}) )
			}
		}
	});
});
/** 起草中心页面 */
$.o.page.on("pageInit", ".draft_center", function (e, page) {
	// 页面搜索按钮
	page.on("click", ".searchbar-cancel", function () {
		// 恢复初始状态
		$(".search_html").html("")
		page.find(".all-div").show();
		page.find(".all").show();
		// 搜索框内容
		var text = page.find("#search").val();
		if (text == "" || text == null) {
			$.o.page.change("draft_center.html");
			return;
		}
		// 遍历所有的文件
		var nav3 = page.find(".nav3")
		for (var i = 0; i < nav3.length; i++) {
			var spans = $(nav3[i]).find("span")
			for (var j = 0; j < spans.length; j++) {
				if ($(spans[j]).html().toString().indexOf(text) != -1) {
					var html = $(spans[j]).parents(".nav3")
					$(".search_html").append(html)
				}
			}
		}
		// 隐藏原来的文件
		page.find(".all-div").hide();
		page.find(".all").hide();
	});
	// 显示和隐藏二级三级菜单
	page.on('click', '.type,.all', function () {
		//判断该元素后一个元素是否有子列表,如果有则隐藏
		var afterDom = $(this).next();
		afterDom.toggle();
	}).on('click', '.erji', function () {
		var afterDom = $(this).parent().next();
		afterDom.toggle();
	});
	// 声明变量接收变量
	var list = [];
	var sumNum = 0;
	var $div = page.find(".first-div");
	// 循环获取第一个层次的li
	for (var i = 0; i < $div.length; i++) {
		// 找到所有的流程
		var next = $($div[i]).find(".nav3");
		sumNum += next.length;
		// 加到list中
		list[i] = next.length;
		// 找到所有的第二级别的li
		var $nextDiv = $($div[i]).find(".next-div");
		for (var j = 0; j < $nextDiv.length; j++) {
			var next1 = $($nextDiv[j]).find(".nav3");
			//每一个第二及别的li加上数目
			$($nextDiv[j]).parent().find("#nextNum").html("(" + next1.length + ")");
		}
	}
	// 找到所有的第一基层级别的li
	var type = page.find(".type");
	for (var i = 0; i < type.length; i++) {
		//加上数目
		$(type[i]).find("#number").html("(" + list[i] + ")");
	}
	page.find("#titleNum").html("(" + sumNum + ")");
});

/** 草稿删除页面 */
$.o.page.on("pageInit", ".draft_info", function (e, page) {
	page.on('o.template.success', function (e, data) {
		if (data.success == false) {
			$.o.dialog.alertError(data.message || '加载失败', null, function () {
				page.data('fail', true);
				if ( page.is(':visible') ) $.o.page.back();
			});
		}
		page.find('.datetime:visible,.date:visible').each(function () {
			// 根据日期格式判断该使用时间控件还是日历控件
			if ($(this).hasClass("date") && $(this).val().length < 12) {
				var inputVal = $(this).val()
				$(this).val(inputVal + " 00:00")
			}
			$(this).addClass('datetime-picker').datetimePicker();
		})
		// 隐藏表单中的模板行
		page.find('.template').css("display", "none");
		// 隐藏表单中的checkbox
		page.find('.editable').css("display", "none");
	})
});

/**
 * 草稿删除
 */
$.o.page.on("pageInit", ".draft_delete", function (e, page) {
	// 全选按钮
	page.on("click", "#checkAll", function () {
		bunForAll(page)
	});
	page.on("click", ".checkbox", function () {
		bunForOne(this)

	});

	page.on("click", "#delete", function () {
		var selected = page.find("input:checked");
		for (var i = 0; i < selected.length; i++) {
			$(selected[i]).closest(".row").remove();
		}
		if (page.find("input").length == 1) {
			$.o.page.change("listDraft.html")
		}
	});
});
/** 我页面 */
$.o.page.on("pageInit", ".myself", function (e, page) {
	$(".picker").picker("close");
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
				text: '取消'
			}
		];
		var groups = [buttons1, buttons2];
		$.actions(groups);
	}).on('click', '#quiet', function () {
		//绑定退出按钮
		$.modal({
			title: "确认退出?",
			buttons: [{
				text: '取消',
				onClick: function () {
				}
			}, {
				text: '确认',
				onClick: function () {
					$.o.page.logout();
				}
			}]
		})
	}).on('click', '#gesture', function () {
		//绑定手势密码设置按钮
		$.modal({
			title: "确认设置手势密码?",
			buttons: [{
				text: '取消',
				onClick: function () {
				}
			}, {
				text: '确认',
				onClick: function () {
					var encKey = $.o.util.cache.get("gesturepwd");
					var setting = "new";
					if (encKey) setting = "revise";
					$.o.page.change("gesture.html?setting=" + setting + "");
				}
			}]
		})
	});
	// 添加图片处理
	function pic_add(base64) {
		if (base64.indexOf('data:image/') != 0)
			base64 = 'data:image/jpeg;base64,' + base64;
		$.o.util.oneCache.set('cropper', 'base64', base64);
		$.o.util.oneCache.set('cropper', 'callback', function () {
			$('[id="myContent"]').html('<img src="' + $.o.user.avatarUrl + '"/>');
		});
		$.o.page.change("../bropen/templates/cropper.html");
	}
});
$.o.page.on("pageInit", ".draft", function (e, page) {
	page.on("click", ".searchbar-cancel", function () {
		var text = page.find("#search").val();
		if (text == "" || text == null) return;
		page.find(".row").each(function (i, e) {
			if ($(e).text().toString().indexOf(text) != -1) {
				var html = $(e).closest(".row");
				page.find(".list-search").append(html)
			}
		});
		page.find(".content").hide();
	});
});
/** 工作页面 */
$.o.page.on("pageInit", ".work", function (e, page) {
	page.on('click', '#outpower', function () { // 外出授权
		$.alert("开发中,敬请期待!");
	}).on("click", "#setting", function () { // 开发中
		$.alert("开发中,敬请期待!");
	});
});
/** 流程跟踪 */
$.o.page.on("pageInit", ".processlog", function (e, page) {
	//绑定 按钮链接
	page.on("o.template.data.loaded", function (e, data) {
		if (typeof data.html == "string") {
			data.html = JSON.parse(data.html);
		}
	});
});
/** 列表页面的查询 */
$.o.page.on("pageInit", "._list", function (e, page) {
	page.on("click", ".searchbar-cancel", function () {
		var search = page.find("#search").val();
		var url = $(this).data("id");
		var data = "(pi.title like '%" + search + "%' or t.sender like '%" + search + "%')";
		data = encodeURIComponent(data);
		$.o.page.replace(url + ".html?search.where=" + data + '&condition=' + encodeURIComponent(search));
	});
});
/** 列表页面的查询 */
$.o.page.on("pageInit", ".news,.notice", function (e, page) {
	page.on("click", ".searchbar-cancel", function () {
		var search = page.find("#search").val();
		var url = $(this).data("id");
		var data = "(pi.title like '%" + search + "%')";
		data = encodeURIComponent(data);
		$.o.page.replace(url + ".html?search.where=" + data + '&condition=' + encodeURIComponent(search));
	});
});
/**
 * 工作提醒
 */
$.o.page.on("o.back", ".work_notice", function (e, page) {
	page.one("pageAnimationEnd", function(e, id, page) {
		// 待阅,阅读后刷新
		var $toread = page.find('#tab2');
		if ( $toread.is(":visible") ) page.find('#tab2').trigger('refresh');
		// 待阅待办后刷新待阅待办数量
		$.ajax({
			url: 'server2/work/countWork',
			type: 'post',
			sync: true,
			success: function (data) {
				console.log(data);
				page.find("#todoCount").html(data.todoCount);
				page.find("#toreadCount").html(data.toreadCount);
			}
		});
	})
});
/**
 * 个人资料
 */
$.o.page.on("loaded", ".personal-info", function (e, page) {
	var $template = page.find("[data-o-template-script-id]");
	if ( !$.o.util.url.getParameter("currentUser") ) { // 当前用户直接从$.o.user中获取信息，非当前用户从后台加载
		$template.data("o-template-async", true).data("o-template-data-url", "server2/address/user");
	}
});
/**
 * 手势解锁
 */
$.o.page.on("pageInit", ".gesture", function (e, page) {
	// 阻止iOS浏览器上下滑动网页
	page.find(".content").on('touchmove', function (event) {
		event.preventDefault();
	})
	$.o.util.cache.remove("passwdTemp");
	var pageWidth = $(window).get(0).innerWidth;
	page.find("#gesturepwd").css("margin-left", pageWidth * 0.1);
	// 根据setting参数判断，是新建，修改，密码还是登录
	var setting = $.o.util.url.getParameter("setting"); // new, revise, login
	if (setting == "revise") {
		// 重新设置手势密码
		page.find(".gesture-title").html("请输入旧手势密码");
	} else if (setting == "new") {
		// 设置新手势密码
		page.find(".gesture-title").html("请输入新手势密码");
	} else {
		// 登录
		page.find(".gesture-title").html("请输入手势密码");
		page.find(".pull-left").removeClass("back");
		page.find(".pull-left").attr("data-o-url-change","login.html");
	}
	// 初始化手势解锁控件
	page.find("#gesturepwd").GesturePasswd({
		backgroundColor:"#ffffff",  //背景色
		color:"#dd4c39",   //主要的控件颜色m
		roundRadii:pageWidth/13.5,    //大圆点的半径
		pointRadii:pageWidth/55, //大圆点被选中时显示的圆心的半径
		space:pageWidth/8,  //大圆点之间的间隙
		width:pageWidth * 0.8,   //整个组件的宽度
		height:pageWidth * 0.8,  //整个组件的高度
		lineColor:"#dd4c39",   //用户划出线条的颜色
		zindex :100  //整个组件的css z-index属性
	});
	// 输入图形结束事件
	page.on("hasPasswd", "#gesturepwd", function (e,passwd) {
		// 获取手势密码加密字符串
		var encKey = $.o.util.cache.get("gesturepwd");
		if (encKey) {
			// 取到加密字符串进行解密
			try {
				// 解密成功，获取到用户名
				var username = GibberishAES.dec(encKey, passwd);
				if (username) {
					if(setting=="revise"){
						// 重新设置手势密码
						$.o.util.cache.remove("gesturepwd");
						page.find("#gesturepwd").trigger("passwdRight");
						$.o.page.change("gesture.html?setting=new");
						return ;
					} else {
						// 解密成功提交后台进行登录
						page.find("#gesturepwd").trigger("passwdRight");
						var password = $.o.util.cache.get("password");
						$.o.user.login({'username': username, 'password': password});
					}
				}
			} catch (e) {
				// 解密失败
				page.find("#gesturepwd").trigger("passwdWrong");
				$.alert("图案错误！");
				return;
			}
		} else {
			// 设置新手势密码
			// 对手势密码进行加密存在本地
			var passwdTemp = $.o.util.cache.get("passwdTemp");
			if (passwdTemp) {
				// 判断再次输入的手势密码和前一次是否相同
				if (passwd == passwdTemp) {
					// 两次输入的图案相同
					page.find("#gesturepwd").trigger("passwdRight");
					var encKey = GibberishAES.enc($.o.user.username, passwd);
					$.o.util.cache.set("gesturepwd",encKey);
					$.alert("保存成功！");
					setTimeout(function(){
						$.o.page.change("myself.html");
					},1000);  //延迟一秒以照顾视觉效果
					$.o.util.cache.remove("passwdTemp");
				} else {
					page.find("#gesturepwd").trigger("passwdWrong");
					$.alert("两次输入的图案不同！");
				}
			} else {
				if(passwd.length<3){
					page.find("#gesturepwd").trigger("passwdWrong");
					setTimeout(function(){
						$.alert("密码太短！");
					},1000);  //延迟一秒以照顾视觉效果
				} else {
					$.modal({
						title: "是否确认当前输入的密码?",
						buttons: [{
							text: '取消',
							onClick: function () {
								page.find("#gesturepwd").trigger("passwdWrong");
							}
						}, {
							text: '确认',
							onClick: function () {
								page.find("#gesturepwd").trigger("passwdRight");
								page.find(".gesture-title").html("请再次输入新手势密码");
								$.o.util.cache.set("passwdTemp",passwd);
							}
						}]
					})
				}
			}
		}
	})
});