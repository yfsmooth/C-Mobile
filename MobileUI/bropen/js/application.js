(function ($) {
	/**
	 * 扩展工具方法
	 */
	$.o.util.subName = function (value) {
		if (typeof value != 'string') value = value + "";
		var index = value.toString().indexOf('(');
		if (index != -1) value = value.substring(0, index);
		value = value.replace(/\s/g, '');
		return (value.length > 2) ? value.substring(value.length - 2) : value;
	}

	// 扩展$j
	window.$j = $;

	/**
	 * 拼接url
	 * 会将当前浏览器链接上的参数一并拼上
	 * 参数优先级：options > url带的参数 > 浏览器地址带的参数
	 * @param url
	 * @param options
	 * @param rmArr		链接上需要删除的参数
	 */
	$.o.util.url.stitchParam = function (url, options, rmArr) {
		if (typeof url == 'object') {
			options = url;
			url = null;
		}
		var params = $.extend($.o.util.url.getParameters(), $.o.util.url.getParameters(url), options);
		var href = url ? ( url.indexOf('?') > 0 ? url.substring(0, url.indexOf('?')) : url ) : ''; // 截取'?'前面部分
		if ( rmArr ) {
			for ( var i=0; i<rmArr.length; i++ ) {
				delete params[rmArr[i]];
			}
		}
		if (params) {
			href += '?';
			$.each(params, function (k, v) {
				if ( v != null ) href += k + '=' + encodeURIComponent(typeof(v) == 'object' ? JSON.stringify(v) : v) + '&';
			});
			href = href.substring(0, href.length - 1);
		}
		return href;
	}
})(jQuery);
(function ($) {
	/**
	 * 常量集
	 */
	var Constants = {
		// 选人初始化 缓存key
		selectorInit : "selector.init",
		// 选人结果集 缓存key
		selectorResult : "selector.selector.result",
		// 后台ajax请求人员结果 缓存key
		selectorSearch : "selector.search.result",

		// 已选人初始化 缓存key
		selectedInit : "selected.init",
		// 已选人结果 缓存key
		selectedResult : "selected.result",

		// 流程选人初始化 缓存key
		processSelectorInit : "message_processes.selector.init",
		// 流程选人 缓存key
		processSelector : "message_processes.selector",

		// 通讯录 缓存key
		contactCache : "contact.data",

		/**
		 * 生成key
		 * @param module	模块
		 * @param arguments[i > 1]	模块参数, eg：module为selectorSearch
		 * @returns {*}
		 */
		get : function(module) {
			if ( arguments.length > 1 ) {
				for ( var i=1; i<arguments.length; i++ ) {
					var arr = (arguments[i] instanceof Array) ? arguments[i] : [arguments[i]];
					for ( var j=0; j<arr.length; j++ ) {
						module += '.' + arr[j];
					}
				}
			}
			return module;
		}
	};
	$.o.Constants = $.extend($.o.Constants, Constants);
})(jQuery);
(function ($, template) {
	// TODO 华为自带浏览器（朱家骐）的手机不支持 float

	/** 登录页显示前事件，还可以有其他事件，见 o.page.on 的 API 注释 */
	$.o.page.on("pageInit", ".login", function (event, page) {
		page.find("form").validator(function () {
			$(this).addClass("disabled").prop("disabled", true);	// 禁用登录按钮
			$.o.user.login(page.find("form").serialize());	// 用户登录
		});
	});

	/**
	 * 监听用户登陆
	 */
	$(window).on('o.login.success', function () {
		$('[data-o-nickname="true"]').html($.o.util.subName($.o.user.nickname));
	});

	/**
	 * 列表下拉刷新后，更新总数量提醒
	 */
	$(document).on("o.listloader.success", "*", function (e, data) {
		var me = $(this),
			target = me.data('count-target');
		if (target) {
			var src = me.closest('body .page').find(target);
			if (src.length) src.html(data.total);
		}
	});

	// 附件下载
	$(document.body).on("click", 'a[tag="attachment"]', function(e) { // 注：此处不能用document监听，否则会走light7的监听
		location.href = $(this).attr("href");
		if ( e.preventDefault ) e.preventDefault();
		if ( e.stopPropagation ) e.stopPropagation();
	});

	/**
	 * 添加头像颜色
	 */
	function addColor($div) {
		var colors = ["#88abda", "#acd598", "#ff8e6b", "#f29c9f"];
		$div.each(function (i) {
			$(this).css('background-color', colors[i % colors.length]);
		});
	}

	/* 已选人数据回显 */
	function displaySelector(page, selector) {
		page.find('#checked-head').html("");
		// 根据缓存中取人(回显)
		for (var i = 0; i < selector.length; i++) {
			checkedEmp(page, selector[i])
		}
	}

	/**
	 * 选中人员
	 * @param page      页面
	 * @param emp       人员，结构：{id:人员id, name:人员名称, color:颜色, orgName:人员机构}
	 * @param single
	 */
	function checkedEmp(page, emp, single, checked, selector) {
		if (!$.isPlainObject(emp)) {
			if (emp instanceof HTMLElement) emp = $(emp);
			var checked = checked || emp.prop('checked'),
				$li = emp.closest('.user'),
				emp = {
					id: $li.data('id'),
					name: $li.data('name'),
					color: $li.find('.round-head').css('background-color'),
					fullName: page.find('#orgName').val()
				};
			if ($.o.util.means(single)) { // 单选
				if (selector) {
					if (selector[0] && selector[0].id == emp.id) return;
					selector[0] = emp;
				}
			} else if (checked) { // 多选选中人员
				if (selector) selector.push(emp);
			} else { // 多选取消已选中人员
				removeEmp(page, emp.id, selector);
				return;
			}
		}
		var $checkeds = page.find('#checked-head');
		if ($.o.util.means(single)) { // 单选，清除已选人员
			if ($checkeds.length) $checkeds.html('');
			page.find('.user .gou.gou1').removeClass('gou1');
			page.find('.user .checked').prop('checked', false);
		}
		if (checked == false) {
			removeEmp(page, emp.id);
		} else {
			// 回显已选人员并打钩
			page.find('.user[data-id="' + emp.id + '"] .gou').addClass('gou1');
			page.find('.user[data-id="' + emp.id + '"] .checked').prop('checked', true);
			if ($checkeds.length) {
				$checkeds.append(template.compile('<div class="round-head" data-id="{{emp.id}}" {{if emp.color}}style="background-color:{{emp.color}};"{{/if}}>{{subName(emp.name)}}</div>')({
					$: $,
					emp: emp
				}));
				var $checkedWrap = page.find('.headerChecked');
				$checkedWrap[0].scrollLeft = 10000; // 人员往左移
				if ( $checkeds.is(":visible") ) {
					showSelected()
				} else {
					page.one("pageAnimationEnd", showSelected);
				}
				function showSelected() {
					page.find('.selected')[$checkedWrap.width() < $checkeds.width() ? "show" : "hide"]();
				}
			}
		}
	}

	/**
	 * 全选
	 * @param page
	 */
	function selectAll(page, selector) {
		var noCheckeds = page.find('.user :checkbox:not(:checked)'); // 未选中
		if (noCheckeds.length) {
			for (var i = 0; i < noCheckeds.length; i++) {
				checkedEmp(page, noCheckeds[i], null, true, selector);
			}
		} else { // 取消
			var checkeds = page.find('.user :checkbox:checked').closest('.user'); // 已选中
			if (checkeds.length) {
				for (var i = 0; i < checkeds.length; i++) {
					removeEmp(page, $(checkeds[i]).data('id'), selector);
				}
			}
		}
	}

	/**
	 * 删除人员
	 * @param page  页面
	 * @param id    人员id
	 */
	function removeEmp(page, id, selector) {
		if (id instanceof HTMLElement) id = $(id).data('id');
		if (selector) {
			for (var i = selector.length - 1; i >= 0; i--) {
				if (selector[i].id == id) selector.splice(i, 1);
			}
		}
		page.find('#checked-head .round-head[data-id="' + id + '"]').remove();
		page.find('.user[data-id="' + id + '"] .gou.gou1').removeClass('gou1');
		page.find('.user[data-id="' + id + '"] .checked').prop('checked', false);
		var $checkeds = page.find('#checked-head');
		if ($checkeds.length) page.find('.selected')[page.find('.headerChecked').width() < $checkeds.width() ? "show" : "hide"]();
	}

	/**
	 * 将导航向左滚动
	 * @param page
	 */
	function navScrollTurnLeft(page) {
		setTimeout(function () {
			// 使滚动条置顶
			var scroll = page.find(".headerNav");
			if (scroll) scroll[0].scrollLeft = 10000;
		}, 10);
	}

	/**
	 * 首页
	 */
	$.o.page.on("pageInit", "#index", function(e, page) {
		page.on("o.template.success", ".content", function(e, data) {
			var totalWorks = parseInt(data.totalWorks),
				totalNews = parseInt(data.totalNews),
				totalNotices = parseInt(data.totalNotices),
				total = totalNews + totalNotices + totalWorks;
			$(".badge-mywork.no-content")[totalWorks>0 ? "show" : "hide"]();							// 我的工作(显示点)
			$(".badge-mywork:not(.no-content)").html(totalWorks)[totalWorks>0 ? "show" : "hide"]();		// 我的工作(显示数字)
			$(".badge-news.no-content")[totalNews>0 ? "show" : "hide"]();								// 新闻(显示点)
			$(".badge-news:not(.no-content)").html(totalNews)[totalNews>0 ? "show" : "hide"]();			// 新闻(显示数字)
			$(".badge-notice.no-content")[totalNotices>0 ? "show" : "hide"]();							// 公告(显示点)
			$(".badge-notice:not(.no-content)").html(totalNotices)[totalNotices>0 ? "show" : "hide"]();	// 公告(显示数字)
			$("#bar-information .badge").html(total)[total>0 ? "show" : "hide"]();
			$("#bar-work .badge.no-content")[total>0 ? "show" : "hide"]();
		});
	});

	/**
	 * 头像裁剪
	 */
	$.o.page.on("loaded", ".cropper", function (event, page) {
		var cropper = $.o.util.oneCache.get('cropper');
		if (cropper.base64 == null) {
			$.o.page.back();
			return;
		}
		var isServerCropper = false;
		if ($.o.native.device.platform && $.o.native.device.platform.toLowerCase() == 'ios') {
			isServerCropper = $.o.native.device.version.match(/^\d+\.\d+/) == '8.1'; // 是否中服务器进行裁剪
		}
		page.find("[data-o-template-script-id]")
			.data('o-template-params', {action: 'server2/secUser/uploadAvatar', tag: 'avatar', total: 1})
			.on("o.template.success", function () {
				var $form = $(this).find('form');
				if (isServerCropper) $form.find('img').attr('src', cropper.base64);
				$.o.page.bindForm($(this).find('form'));
			});
		var $image = page.find(".img-container img").attr('src', cropper.base64),
			options = {
				guides: false,
				background: false,
				viewMode: 1,
				dragMode: 'move',
				cropBoxMovable: false,
				cropBoxResizable: false,
				aspectRatio: 1
			};
		page.one('pageInit', function () {
			$image.cropper(options);
		});
		// Methods
		page.on('click', '#btn-top-right', function () {
			$.showPreloader();
			if (!$image.data('cropper')) return;
			if (isServerCropper) {
				var cropperData = $image.cropper("getData");
				cropperData.w = cropperData.width;
				cropperData.h = cropperData.height;
				page.find("form #avatarData").val(JSON.stringify(cropperData));
				page.find("form").submit();
			} else {
				var result = $image.cropper("getCroppedCanvas");
				if (result) {
					page.find("form img").attr('src', result.toDataURL("image/jpeg"));
					page.find("form").submit();
				}
			}
		});

		// 上传成功
		page.on('o.submit.done', "form", function (e, data) {
			$.hidePreloader();
			$.o.user.data = $.extend({}, $.o.user.data, {avatarUrl: $.o.util.url.getUrl(data.url)});
			var callback = cropper.callback;
			if (callback) callback(data);
			$.o.page.one("pageSwitched", "*", function(e, page) {
				if ( page.hasClass("cropper") ) {
					$.router.removePage(page);
				}
			});
			$.o.page.back();
		});
	});

	/**
	 * 选人页面
	 * (注：内置了两套模板：知会选人、流程选人)
	 * 非内置模板需传入参数 params：
	 * @param: params.title     标题
	 * @param: params.dataUrl   请求地址
	 * @param: params.key       缓存的key
	 * @param: params.btnName   按钮名称
	 * @param: params.callback  回调方法
	 * @param: params.selectorInit  初始化选人树
	 * @param: params.selected  初始化已选人
	 */
	$.o.page.on("loaded", ".selector", function (e, page) {
		// 初始化数据
		var params = $.extend($.o.util.url.getParameters(),             // url上带的参数
				$.o.util.tCache.get($.o.Constants.selectorInit),                       // 从缓存中获取
				$.o.util.oneCache.get($.o.Constants.selectorInit, 'selector.html')),   // 从缓存中获取
			condition = params.condition,                               // 搜索条件
			callback = params.callback,
			rootOrgId = params.rootOrgId,                               // 机构根节点id
			rootOrgFullName = params.rootOrgFullName;                   // 机构根节点name
		delete params.callback; // 避免ajax操作请求参数会调用方法

		// 已选人 数据结构: [{id:人员id, name:人员名称, color:显示颜色, orgName:人员机构路径}...]
		var selector = $.o.util.tCache.get($.o.Constants.selectorResult);
		var isInit = false;
		if (!selector) { // 初始化已选人
			isInit = true;
			$.o.util.tCache.set($.o.Constants.selectorResult, selector = []);
			$.o.util.Array.concat(selector, $.o.util.oneCache.get($.o.Constants.selectorResult, 'select.html'));
		}

		var selectorSearchs = $.o.util.tCache.get( $.o.Constants.get($.o.Constants.selectorSearch, condition), null, null, {
			data: [],
			condition: condition
		});

		// 初始化内置模板
		if (params.selectorType == 'informed') { // 知会
			params = $.extend({
				title: "知会选人",
				key: "",
				dataUrl: "server2/work/loadActors",
				btnName: "发送知会"
			}, params);
			callback = function (params, selector) {
				if (selector.length == 0) {
					$.o.dialog.alertError('请选择知会人!');
					return;
				}

				var allNames = [],	// 存储所有用户名称
					data = {		// 存储所有id
						taskId: params.taskId,
						readers: []
					};
				for (var i = 0; i < selector.length; i++) {
					data.readers.push(selector[i].id);
					allNames[i] = selector[i].name;
				}

				$.modal({
					title: "确认发送" + (allNames.length ? '给' : '') + allNames.join(',') + "?",
					buttons: [{
						text: '取消',
						onClick: function () {
							return false;
						}
					}, {
						text: '确认',
						onClick: function () {
							data.readers = JSON.stringify(data.readers);
							// 提交
							$.ajax({
								url: "server2/work/sendToread",
								type: "post",
								dataType: "json",
								data: data, success: function (data) {
									if (data.success) {
										$.alert('知会成功', function () {
											$.o.page.history.go('._info');
										});
									}
								}, error: function () {
									$.alert("知会失败");
								}
							});
						}
					}]
				});
			}
		} else if (params.selectorType == 'processSelector') { // 流程选人
			params = $.extend({
				title: "成员选择",
				key: "",
				dataUrl: "server2/work/loadActors",
				btnName: "确&nbsp;&nbsp;定"
			}, params);
			callback = function (params, selector) {
				$.o.util.Array.cover($.o.util.tCache.get( $.o.Constants.get($.o.Constants.processSelector, params.actorId) ), selector);
				$.o.page.history.go('.message_processes'); // 跳转的流程
			}
			if (isInit) {
				params.selected = $.o.util.tCache.get( $.o.Constants.get($.o.Constants.processSelector, params.actorId), null, null, []);
				params.selectorInit = $.o.util.tCache.get( $.o.Constants.get($.o.Constants.processSelectorInit, params.actorId) );
			}
		}
		if (isInit) {
			if ( params.selected ) $.o.util.Array.concat(selector, params.selected);
			if (params.selectorInit) {
				params.selectorInit = convertersActors(params.selectorInit); // 格式转化
				params.selectorInit.isRoot = true; // 标记根节点
				selectorSearchs.data.push(params.selectorInit);
				if ( !rootOrgId && params.selectorInit.id ) {
					$.o.util.tCache.set('selector.init.rootOrgId', (rootOrgId = params.selectorInit.id));
					$.o.util.tCache.set('selector.init.rootOrgFullName', (rootOrgFullName = params.selectorInit.orgName));
				}
			}
		}
		params.selector = selector;

		// 缓存处理
		var result = selectorSearchs.data.length ? getData(selectorSearchs.data) : null;
		if (selectorSearchs.data.length && condition == selectorSearchs.condition && !$.o.util.means(params.reload) && result && result.data) {
			page.data('o-template-params', $.extend({}, params, result));
		} else {
			page.data('o-template-data-url', params.dataUrl).data('o-template-params', {title:params.title, btnName:params.btnName});
		}
		page.on('o.template.data.loaded', function (e, data) {
			data = convertersActors(data); // 格式转化
			data.searchId = params.orgId; // 含搜索条件的查询，如果搜索orgId为193下面的，返回结果可能是193的下级，加上此行，避免每次重复搜索
			data.isRoot = true; // 标记根节点
			selectorSearchs.data.push(getPath(data));
		}).on('o.template.success', function (e, data) {
			page.removeData('o-template-data-url').data('o-template-params', $.extend({}, params, data)); // 当返回该页面时，可以重新渲染数据

			addColor(page.find('.user .round-head')); // 列表头像添加颜色
			displaySelector(page, selector); // 回显人员、已选人打钩
			navScrollTurnLeft(page); // 顶部导航向左滚动
		});
		/**
		 * 根据orgId递归查找
		 * @param data
		 * @returns {*}
		 */
		function getData(data) {
			if ($.isPlainObject(data)) {
				var result, orgId = params.orgId;
				if ( (data.searchId == orgId || data.id == orgId) &&
						( !params.groupId || (params.groupId && params.groupId == data.groupId) ) ) {
					result = $.extend({}, data, {parentOrgIds: [], orgNames: []}); // 采用新对象，避免层级错乱
				} else {
					if (data.data) {
						for (var i = 0; i < data.data.length; i++) {
							var el = data.data[i];
							if (el.type == 'org') {
								result = getData(el);
								if (result) {
									result.parentOrgIds.push(el.id);
									break;
								}
							}
						}
					}
				}
				if (result) {
					if (data.isRoot) getPath(result, data.fullIds || (data.id && data.id.toString()));
					return result;
				}
			} else if (data instanceof Array) {
				for (var i = 0; i < data.length; i++) {
					var result = getData(data[i]);
					if (result) return result;
				}
			}
		}

		/**
		 * 生成层级结构
		 */
		function getPath(data, fullIds, orgName) {
			if ( !$.isPlainObject(data) ) return data;
			// 产生机构层级：["168", "177", "301", "2739500", "2739517", "3584180", "553", "2517392", "2940374", "2940414"]
			if (!fullIds) fullIds = data.fullIds;
			if (!data.parentOrgIds) data.parentOrgIds = [];
			if (fullIds) {
				if (typeof fullIds == 'string') fullIds = fullIds.replace(/^;|;$/g, '').split(';');
				if ( data.parentOrgIds.length ) $.o.util.Array.concat(data.parentOrgIds, fullIds.reverse()).reverse();
				else data.parentOrgIds = fullIds;
			}

			if (!orgName) orgName = data.orgName;
			if (!data.orgNames) data.orgNames = [];
			if (orgName) {
				var orgNames = orgName.replace(/^\/+?/, '').split('/');
				if ( data.orgNames.length ) $.o.util.Array.concat(data.orgNames, orgNames.reverse()).reverse();
				else data.orgNames = orgNames;
			}

			// 过滤rootOrgId以上层级
			if (rootOrgId) {
				for (var i = 0; i < data.parentOrgIds.length; i++) {
					if (rootOrgId == data.parentOrgIds[i]) {
						data.parentOrgIds.splice(0, i);
						data.orgNames.splice(0, i);
						break;
					}
				}
			}
			if ( rootOrgFullName ) {
				var rootOrgName = rootOrgFullName.replace(/^\/+?/, '').split('/');
				rootOrgName = rootOrgName[rootOrgName.length - 1];
				for (var i = 0; i < data.orgNames.length; i++) {
					if (rootOrgName == data.orgNames[i]) {
						data.orgNames.splice(0, i);
						break;
					}
				}
			}
			return data;
		}

		/**
		 * 数据结构转换
		 * @param actors
		 * @return
		 */
		function convertersActors(actors) {
			if ( $.isPlainObject(actors) && actors.tree ) {
				actors = calOrganizationTreeAsJSON(actors.tree.items[0]) // 数组转对象
			} else if ( actors instanceof Array ) {
				actors = calOrganizationTreeAsJSON(actors) // 数组转对象
			}
			if ( $.isPlainObject(actors) ) {
				// 如果actors.data[0]是根节点下的人，结构调整
				if ( actors.data && actors.id == actors.data[0].id ) {
					var result = actors.data[0].data
					if ( !result ) result = []
					for ( var i=1; i<actors.data.length; i++ ) {
						result.push(actors.data[i]);
					}
					//result.fullIds = Organization.get(result.id)?.fullIds
					actors.data = result;
				}
			}
			return actors;
		}
		/**
		 * 按照新的格式计算组织机构树的JSON串
		 * 新格式：[{“id ”:””,”type ”:”org”,”name”:”综合部”, "size":5(机构含所有下级机构下人数),”data”:[{“id”:””,”type”:”user”,”name”:”张三”}]}]
		 */
		function calOrganizationTreeAsJSON(items, find, level) {
			var map = {};
			if ( !items ) return map;
			if ( !level ) level = 0;
			var childItems = [];
			for ( var i = 0; i < items.length; i++ ) {
				var item = items[i];
				if ( i == 0 ) map["name"] = item;							// 人或机构的名称
				else if ( i == 1 ) {
					map["id"] = item.id;
					if (item.fn) map["orgName"] = item.fn;
					if (item.t == "o") {
						map["type"] = "org";		// 类型
						if ( map.name && map.name.indexOf("..") != -1 ) { // 是分组(机构人太多，每200人分成一组)
							map["orgName"] = map["orgName"] + "/" + map.name
							map["group"] = true
							map["groupId"] = parseInt( Math.ceil( parseInt(map.name.split("\\.\\.")[1]) / 200 ) ) // 标记某个组,从1开始逐个递增
						} else {
							// 统计第一级机构下人数，因为前台无缓存，每次加载查询，所以只统计第一级人数
							//if ( level == 1 ) map["size"] = EmployeeIdentity.executeQuery("select count(e.id) from bropen.framework.core.osm.EmployeeIdentity e where e.organization.fullIds like '%;${item.id};%' and e.disabled = 0")?.get(0);
						}
					} else {
						map["type"] = "user";		// 类型
					}
				} else {
					// 递归转换子机构的JSON串
					childItems.push( calOrganizationTreeAsJSON(item, find, level + 1) );
				}
			}
			if ( childItems && childItems.length )
				map["data"] = childItems;									// 下级机构
			return map;
		}

		page.on("click", ".searchbar-cancel", function () { // 点击搜索
			var text = page.find("#search").val().replace(/\s/g, '');
			if (text.length < 2) {
				$.toast('请输入两个以上字符');
				return;
			}
			var href = $.o.util.url.stitchParam('selector.html', {
				condition: text,
				orgId: rootOrgId ? rootOrgId : ('selectPersonJsonTreeStore_' + params.taskId + '-root')
			}, ["groupId"]);
			$.o.page[condition ? 'replace' : 'change'](href, {
				noAnimation: true,
				reload: true
			});
		}).on('click', '.user .checked', function () { // 点击选框
			checkedEmp(page, this, params.single, null, selector);
		}).on('click', '#checked-head .round-head', function () { // 点击顶部已选人员
			removeEmp(page, this, selector);
		}).on('click', '#btn-top-right', function () { // 全选
			selectAll(page, selector);
		}).on('beforePageSwitch', function () {
			var selectorPageSelector = ".selector, .selected"; // 选人页面选择器
			$.o.page.one('pageAnimationStart', '*', function (e, newPage) {
				if (!newPage.is(selectorPageSelector)) { // 跳转到非选人页面，删除缓存
					$.o.util.tCache.remove($.o.Constants.selectorSearch);
					$.o.util.tCache.remove($.o.Constants.selectorInit);
					$.o.util.tCache.remove($.o.Constants.selectorResult);
				}
			}).one('pageSwitched', '*', function (e, newPage) {
				if (!newPage.is(selectorPageSelector)) { // 跳转到非选人页面，删除页面，否则会出现bug：见 BROMOB-117
					$.router.removePage(page);
				}
			});
		}).on('click', '#submit', function () { // 点击确定
			callback(params, selector);
		});
	});

	/**
	 * 已选人页面
	 */
	$.o.page.on("loaded", ".selected", function (e, page) {
		// 获取已选人员信息
		var params = $.extend($.o.util.url.getParameters(),
				$.o.util.tCache.get($.o.Constants.selectedInit),
				$.o.util.oneCache.get($.o.Constants.selectedInit, "selected.html")),
			selected = $.o.util.Array.concat([],
				$.o.util.tCache.get($.o.Constants.selectedResult),
				$.o.util.oneCache.get($.o.Constants.selectedResult, "selected.html")),
			callback = params.callback;
		delete params.callback; // 避免ajax操作请求参数会调用方法

		if (params.selectorType == 'selector') { // 选人列表进来
			$.o.util.Array.concat(selected, $.o.util.tCache.get($.o.Constants.selectorResult));
			callback = function (params, result) {
				$.o.util.Array.cover($.o.util.tCache.get($.o.Constants.selectorResult), result);
			}
		} else if (params.selectorType == 'processSelector') { // 流程提交
			$.o.util.Array.concat(selected, $.o.util.tCache.get( $.o.Constants.get($.o.Constants.processSelector, params.actorId) ));
			callback = function (params, result) {
				$.o.util.Array.cover($.o.util.tCache.get( $.o.Constants.get($.o.Constants.processSelector, params.actorId) ), result);
			}
		}

		var me = page.find('[data-o-template-script-id]');
		me.data('o-template-params', {selected: selected}).on('o.template.success', function () {
			addColor(page.find('li .round-head')); // 列表头像添加颜色
		});

		page.on("click", "#btn-top-right", function () { // 全选按钮
			selectAll(page);
		}).on("click", ".user .checked", function () { // 复选框
			checkedEmp(page, this);
		}).on("click", "#delete", function () { // 删除按钮
			// 获取所有选中li
			var $li = page.find('.user .checked:checked').closest('.user');
			for (var i = $li.length - 1; i >= 0; i--) {
				var id = $($li[i]).data('id');
				for (var j = selected.length - 1; j >= 0; j--) {
					if (id == selected[j].id) {
						selected.splice(j, 1);
						break;
					}
				}
			}
			callback(params, selected);
			$.o.page.back();
		}).on('beforePageSwitch', function () {
			$.o.page.one('pageAnimationStart', '*', function (e, newPage) {
				if (!newPage.is('.selected')) { // 跳转页面，删除缓存
					$.o.util.tCache.remove("selected");
				}
			});
		});
	});

})(jQuery, template);

(function($) {
	/**
	 * 转化已选人结构
	 * @param selector
	 * @returns {Array}
	 */
	function getSelected(selector) {
		var selected = [];
		var colors = ["#88abda", "#acd598", "#ff8e6b", "#f29c9f"]
		for ( var i=0; i<selector.items.length; i++ ) {
			var emp = selector.items[i];
			selected.push({
				id: emp.id,
				name: emp.c,
				color: colors[i % colors.length],
				fullName: emp.fn.replace('/'+emp.c, '')
			});
		}
		return selected;
	}

	/**
	 * 人员组织
	 * 配合标签使用 － g:osmField
	 */
	window.osmField = {
		open: function( el, callback, callbackAfter ) {
			if ( typeof(el) == "string" )
				el = $.look('#' + el);
			var self = this, $el = $(el)
				, $elHidden = $el.prev("#" + $el.attr("idsname").replace(/\./g,"\\."))
				, elHidden = $elHidden.get(0)
				, uuid = $elHidden.data("uuid")
				, type = $el.attr("osmType")
				, url = $el.attr("osmDataUrl").replace(/^\/?boeHQ\//, '/boeMobileAdapter/');
			// 取数据的URL & JSON（get方式，浏览器缓存 --- IE8下面缓存很恶心，n久都不失效，加个5'的时间戳）
			var dataUrl = $el.data("dataUrl");
			if ( !dataUrl || $el.data("dataUrlOrig") != url ) {
				dataUrl = url + (url.indexOf("?")>0 ? "&":"?") + "type=" + type;
				if ( type == "1" || type == "4" ) {	// 人员选择时的特殊处理
					dataUrl += "&lazy=true&defaultEmployees=" + elHidden.value;
				}
				$el.data("dataUrl", dataUrl);
				$el.data("dataUrlOrig", url);
			}
			var data = self.loadDataJSON(dataUrl);
			//业务支援体系/CIO组织/基础设施管理本部/智能办公部/OA系统开发科/刘江峰 (员工／高级工程师:00002141)
			var selected = $el.data("emp-selected");
			if ( !selected && data.selected && data.selected.items.length ) {
				selected = getSelected(data.selected);
			}
			var params = $.o.util.url.getParameters();
			$.o.util.tCache.set($.o.Constants.selectorInit, {
				title : $(el).closest('li').find('.label label').text().replace(':', ''),
				dataUrl: "server2/work/loadActors",
				btnName: "确&nbsp;&nbsp;定",
				selectorInit: data,
				selected: selected,
				callback: function (params, selector) {
					$el.data("emp-selected", selector);
					self.sendResult(selector, el, elHidden, callback, callbackAfter)
					$.o.page.history.go('._info');
				}
			});
			$.o.page.change("../bropen/templates/selector.html?selectorType=" + el.id + "&taskId=" + params.taskId + "&single=" + (el.getAttribute("osmmulti") == "false"))
		},

		sendResult: function(result, el, elHidden, callback, callbackAfter) {
			// 记录选人之前osmField的值
			var oldValue = elHidden.value + "&" + el.value;
			// 显示分隔符，默认为逗号
			var sep = el.getAttribute("osmSeparator") || ", ";
			if ( result && result.length ) {
				var codes		= [] 	// 所选人的ID，可能是员工ID，也可能是员工身份ID（属性isEI=“true”）
					, fullNames	= []	// 所选人所在组织的全名
					, names		= [];	// 所选人的姓名
				elHidden.value = "";
				//result = result.split(";");
				for ( var i=0; i<result.length; i++ ) {
					codes.push(result[i].id);
					fullNames.push(result[i].fullName);
					names.push(result[i].name);
				}
				elHidden.value = codes.join(";");
				// 回调函数，以字符窜的形式返回所有被选人的ID，例："12324,34325,43543"
				var array;
				if ( callbackAfter ) {
					array = callbackAfter({element:el, codes:codes, fullNames:fullNames, names:names});
				}
				if ( !array ) {
					array = [];
					for ( var i=0; i<result.length; i++ ) {
						array[i] = result[i].name;
					}
				}
				el.value = array.join(sep);
			} else {
				//elHidden.value = /true|1/i.test(el.getAttribute("osmMulti")) ? "" : "null";
				elHidden.value = "";	// 表单域"xx.id"必须设为"null"才能将其引用的Domain对象也设为null，否则校验错误；修改GrailsDataBinder处理空串亦可）
				el.value = "";
				if ( callbackAfter ) {
					callbackAfter( {element:el, codes:[], fullNames:[], names:[]} );
				}
			}
			// 如果osmField的值发生变化，加载change事件
			try {
				if ( oldValue != elHidden.value + "&" + el.value ) {
					$(el).trigger("change");
					$(elHidden).trigger("change");
				}
				$(el).trigger("blur");	// 调用blur用于表单验证
			} catch(e) {}
		},

		loadDataJSON: function (url) {
			var json;
			// AJAX同步获取JSON: 如果有错误，jQuery全局事件会自动提示
			$.ajaxSetup( {async:false, dataType:"text"} );
			$.get( url, function(data, status, xhr) {
				json = ( typeof data == "string" ) ? JSON.parse(data) : data;
			});
			return json;
		},

		dataJSONCache: {}
	};

})(jQuery);

(function($) {

	/**
	 * 根据所有实际申请人身份获取所有的实际申请人
	 */
	window.getShijirenIds = function (map) {
		var result = [];
		if ( map.codes.length > 0 ) {
			var url = "boeMobileAdapter/work/getEmployeeByEI";
			$.ajaxSetup({async:false});
			$.getJSON(url, {
				eiId: map.codes.join(";"),
				url: "app/getEmployeeByEIAsJSON",
				taskId: $.o.util.url.getParameter("taskId")
			}, function(data) {
				if (typeof data == 'string') data = JSON.parse(data.replace(/null/g, '"null"'))
				for ( var i = 0; i < map.names.length; i++ ) {
					// 获取实际申请人所在的部门（集团领导：部门中起始字符不包括“/”；其他：部门中起始字符不包括“/京东方集团”）
					var fullName = map.fullNames[i]//.replace("/"+map.names[i], "");
					if ( fullName.split("/").length > 2 ) {
						// 不是集团领导
						fullName = fullName.substring(map.fullNames[i].indexOf("/", 1) + 1);
					} else {
						// 集团领导
						fullName = fullName.substring(1);
					}
					result[i] = calShijiren(fullName, data.names[i], data.titles[i], data.codes[i], data.ranks[i]);
				}
				if ( $("#shijirenIds").length ) $("#shijirenIds").val(data.ids.join(";"));
			})
		}
		// 实际申请人
		if ( $("[idsname='shijirenEiIds']").length ) $("#shijirenEis").val(result.join("\n"));
		return result;
	}

	/**
	 * 计算实际申请人/起草人的显示文本
	 */
	function calShijiren(fullName, shijiren, shijiGangwei, shijiBianhao, rank) {
		if ( !shijiren ) return '';
		if ( !fullName ) return shijiren + ' (' + shijiGangwei + (Boolean(rank) ? '／' + rank : "") + ':' + shijiBianhao + ')';
		return fullName + "/" + shijiren + ' (' + shijiGangwei + (Boolean(rank) ? '／' + rank : "") + ':' + shijiBianhao + ')';
	}

})(jQuery);