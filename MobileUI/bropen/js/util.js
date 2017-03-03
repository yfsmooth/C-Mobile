/**
 * 工具方法
 */
+(function($) {
	var U = {
		/**
		 * 如果url不是以'html'结尾，默认加上结尾
		 * @param url
		 * @returns
		 */
		url : function(url) {
			url = decodeURIComponent(url);
			var index = url.indexOf('?');
			if ( index > -1 ) {
				var preUrl = url.substring(0, index);
				if ( preUrl.lastIndexOf('.html') == -1 ) url = preUrl + '.html?' + encodeURIComponent(url.substring(index+1));
			} else {
				if ( url.lastIndexOf('.html') == -1 ) url += ".html";
			}
			return url
		},
		/**
		 * 获取url前缀
		 */
		preName : function(url) {
			url = decodeURIComponent(url);
			var index = url.indexOf('?');
			if ( index > -1 ) {
				if ( url.indexOf('.html?') > -1 ) url = url.substring(0, index-5);
				else url = url.substring(0, index);
			} else {
				index = url.lastIndexOf('.html');
				if ( index > -1 ) url = url.substring(0, index);
			}
			return url;
		},
		/**
		 * 给url设置参数(批量)
		 */
		setParams : function(url, params, values) {
			if ( typeof params == 'number' || typeof params == 'string' ) {
				return this.setParam(url, params, values);
			} else if ( params instanceof Array ) {
				$.each(params, function(i, c){
					if ( values[i] !== undefined ) url = U.setParam(url, c, values[i]);
				})
			} else {
				$.each(params, function(k, v){
					url = U.setParam(url, k, v);
				})
			}
			return url;
		},
		/**
		 * 给url设置参数
		 */
		setParam : function(url, param, value) {
			if ( value == undefined || value == null ) return url
			return url + (url.indexOf('?')==-1 ? '?' : '&') + param + '=' + encodeURIComponent(value);
		},
		/**
		 * 删除url中某个参数
		 */
		removeParam : function(url, param) {
			var index = url.indexOf('?');
			if ( index == -1 ) return url;
			else if ( index < url.length - 1 ) {
				var reg = new RegExp('&'+param+'=.+?&', 'g')
				var temp = ('&' + url.substring(index+1) + '&').replace(reg,'&').replace(/(^&|&$)/g, '')
				if ( temp.length == 0 ) {
					return url.substring(0, index);
				} else {
					return url.substring(0, index) + '?' + temp;
				}
			} else {
				return url.substring(0, index);
			}
		},
		/**
		 * get请求
		 * @param url
		 * @param param
		 * @param suc
		 * @param fail
		 * @param before
		 * @param async
		 * @param timeout
		 */
		get : function(url, param, suc, fail, before, async, timeout) {
			for ( var i=5; i>0; i-- ) { // 如果第2~5个参数类型为boolean，则该参数为async
				if ( typeof arguments[i] == 'boolean' ) {
					async = arguments[i];
					arguments[i] = null;
					break;
				}
			}
			if ( typeof param === 'function') {
				suc = param;
				param = null;
			}
			U.ajax({
				url: url,
				async: ( async !== false ),
				timeout: ( timeout || 15*1000 ),
				dataType: "text",
				data: param,
				beforeSend: before,
				success: suc,
				fail: fail
			});
		},
		/**
		 * post请求
		 * @param url
		 * @param param
		 * @param suc
		 * @param fail
		 * @param before
		 * @param async
		 * @param timeout
		 */
		post : function(url, param, suc, fail, before, async, timeout) {
			for ( var i=5; i>0; i-- ) {
				if ( typeof arguments[i] == 'boolean' ) {
					async = arguments[i];
					arguments[i] = null;
					break;
				}
			}
			if ( typeof param === 'function') {
				suc = param;
				param = null;
			}
			U.ajax({
				type: "POST",
				url: url,
				async: ( async !== false ),
				timeout: ( timeout || 15*1000 ),
				dataType: "text",
				data: param,
				beforeSend: before,
				success: suc,
				fail: fail
			});
		},
		/**
		 * post请求
		 * @param params	包含参数：type, url, data, suc, fail, before, timeout..
		 */
		ajax : function(o) {
			o = o || {};
			var params = {
				headers: {
					"Access-Control-Allow-Origin":"*",
					"Access-Control-Allow-Headers":"X-Requested-With"
				},
				type: "GET",
				timeout: 15*1000,
				dataType: "text",
				error: function(data) {
					if ( o.errorTip !== false )
						alert("网络错误或超时");
					if ( typeof o.fail == 'function' ) o.fail.apply(null, U.obj2arr(arguments))
				}
			};
			for ( var key in o ) params[key] = o[key];
			$.ajax(params);
		},
		/**
		 * 隐藏指定页面
		 * @param selector	选择器,可为jquery对象，jquery选择器，默认是class名
		 * @param isSelector是否为选择器
		 */
		hide : function(selector, isSelector) {
			if ( selector == null ) {
				if ( !bro.name ) return
				else selector = bro.name
			}
			if ( typeof selector == 'string' ) {
				if ( !isSelector ) selector = $("." + selector);
				else selector = $(selector);
			}
			if ( selector.length ) {
				selector.data('scrollTop', document.body.scrollTop);
				selector.hide();
			}
		},
		/**
		 * 显示指定页面
		 * @param selector	选择器,可为jquery对象，jquery选择器，默认是class名
		 * @param isSelector是否为选择器
		 */
		show : function(selector, isSelector) {
			if ( selector == null ) {
				if ( !bro.name ) return
				else selector = bro.name
			}
			if ( typeof selector == 'string' ) {
				if ( !isSelector ) selector = $("." + selector);
				else selector = $(selector);
			}
			if ( selector.length ) {
				selector.show();
				if ( selector.data('scrollTop') ) document.body.scrollTop = selector.data('scrollTop')
			}
		},
		/**
		 * 读取cookie
		 * @param name	cookieName
		 * @returns		cookieValue
		 */
		getCookie : function(name) {
			var re = new RegExp("(^| )"+name+"=([^;]*)(;|$)"); // 定义一个正则
			var res = document.cookie.match(re); // 匹配所选字段
			if ( res ) {
				return res[0].split('=')[1]; // 如果匹配成功，返回结果
			} else {
				return null; // 否则返回空
			}
		},
		/**
		 * 设置cookie
		 * @param ms	毫秒
		 */
		setCookie : function(name, value, ms) {
			var date = new Date();
			date.setTime(date.getTime() + ms);
			if ( typeof value == 'object' ) value = JSON.stringify(value);
			document.cookie = name + '=' + value + ';expires=' + date.toGMTString() + ';path=/';
		},
		/**
		 * 删除cookie
		 */
		removeCookie : function(name) {
			this.setCookie(name, '0', -1);
		},
		/**
		 * 扫一扫
		 * TODO 写到工具类中后，扫一扫不好使
		 */
		sweep : function(callback) {
			try {
				cordova.plugins.barcodeScanner.scan(
					function (result) {
						alert("We got a barcode\n" +
							"Result: " + result.text + "\n" +
							"Format: " + result.format + "\n" +
							"Cancelled: " + result.cancelled);
						// 回调callback
						U.execute(callback, result.text, result.format, result.cancelled)
					},
					function (error) {
						alert("Scanning failed: " + error);
					}
				);
			} catch ( e ) {}
		},
		/**
		 * 拍照或选择照片
		 * @param type	1-拍照，2-选择照片
		 * @param callback	回调方法
		 * @param front	true-用前置摄像头拍照
		 */
		camera : function(type, callback, front) {
			try {
				navigator.camera.getPicture(function (imageData) {
					callback('data:image/jpeg;base64,'+imageData)
				}, function onFail(message) {
					alert('Failed because: ' + message);
				}, { quality: 50,
					destinationType: Camera.DestinationType.DATA_URL,
					mediaType: Camera.MediaType.PICTURE,
					sourceType : type == 1 ? Camera.PictureSourceType.CAMERA : Camera.PictureSourceType.PHOTOLIBRARY,
					cameraDirection: front ? Camera.Direction.FRONT : Camera.Direction.BACK
				})
			} catch ( e ) {}
		},
		/**
		 * 调用本地图片查看器打开图片
		 */
		openPic : function(url) {
			try {
				cordova.plugins.disusered.open(url)
			} catch ( e ) {}
		},
		/**
		 * 产生min-max之间的随机数
		 */
		randomNum : function(max, min) {
			var result = Math.random()
			if ( max ) result = Math.random() * (max - (min ? min : 0))
			return result;
		},
		/**
		 * 产生min-max之间的随机整数
		 */
		randomIntNum : function(max, min) {
			if ( !max ) max = 1
			if ( !min ) min = 0
			var result = Math.ceil(this.randomNum(max+1, min))
			if ( result > max ) result = max
			return result
		},
		/**
		 * 转树形结构并返回树
		 */
		toTree : function(key, val, datas) {
			var result = {}
			if ( typeof key == 'number' ) {
				if ( val === undefined ) return datas[key]
				else result[key] = val
			} else if ( typeof key == 'string' ) {
				if ( key.indexOf('\.') < 0 ) {
					if ( val === undefined ) return datas[key]
					result[key] = val
				} else { // 多级
					key = $.map(key.split('\.'), function(i,j){
						if ( $.trim(i) != '' ) return i
					})
					if ( key.length < 1 ) return null
					else if ( key.length == 1 ) {
						if ( val === undefined ) return datas[key[0]]
						result[key[0]] = val
					}
					var data = datas[key[0]]
					if ( val === undefined && data == null ) return null
					if ( !$.isPlainObject(data) ) {
						try {
							data = JSON.parse(data)
						} catch ( e ) {}
						if ( val === undefined ) return null
						if ( !$.isPlainObject(data) ) data = {}
					}
					var item = data
					for ( var i=1; i<key.length-1; i++ ) {
						if ( !$.isPlainObject(item[key[i]]) ) item[key[i]] = {}
						item = item[key[i]]
					}
					if ( val === undefined ) return item[key[key.length-1]]
					item[key[key.length-1]] = val
					result[key[0]] = data
				}
			} else if ( key instanceof Array ) {
				if ( val ) {
					if ( val instanceof Array ) {
						$.each(key, function(i, d) {
							result[d] = val[i]
						})
					} else {
						$.each(key, function(i, d) {
							result[d] = val
						})
					}
				} else {
					$.each(key, function(i, d) {
						result[d] = datas[d]
					})
				}
			}
			return result
		},
		/**
		 * 清除本地缓存
		 */
		clear : function(key) {
			if ( key ) localStorage.removeItem(key);
			else localStorage.clear();
		},
		/**
		 * 本地缓存
		 * 本地存放属性包含 loginTime:最后登录时间, username:用户名，password：密码
		 */
		save : function(params, values) {
			try {
				if ( !params || !values ) return
				$.each(U.toTree(params, values, localStorage), function(k, v) {
					U.clear(k)
					localStorage.setItem(k, typeof v == 'object' ? JSON.stringify(v) : v)
				})
			} catch ( e ) {}
		},
		/**
		 * 从缓存中获取信息
		 */
		getCache : function(key) {
			var data = this.toTree(key, null, localStorage)
			if ( data && (typeof data == 'string') && data.indexOf('{') == 0 ) {
				try {
					return JSON.parse(data)
				} catch (e) {
					return data
				}
			} else {
				return data
			}
		},
		/**
		 * 临时缓存（页面刷新后，缓存消失）
		 */
		tCache : {
			set : function(key, val, keyIsPath) {
				if ( keyIsPath === false ) {
					this[key] = val
				} else {
					$.each(U.toTree(key, val, this), function(k, v) {
						U.tCache[k] = v
					})
				}
			},
			/**
			 * @param isLocal		是否本地存储
			 * @param defaultVal	无值时的默认值
			 */
			get : function(key, keyIsPath, isLocal, defaultVal) {
				var result = (keyIsPath === false) ? this[key] : U.toTree(key, undefined, this)
				if ( result == null && isLocal === true ) result = U.getCache(key)
				if ( result == null && defaultVal ) result = defaultVal
				if ( result != null ) this.set(key, result, keyIsPath)
				return result
			},
			/**
			 * 删除缓存
			 * 注：暂不支持删除localStorage;暂不支持多级删除
			 */
			remove : function(key, keyIsPath, isLocal) {
				if ( key != null ) {
					delete this[key]
					U.toTree(key, null, this)
				} else U.tCache = {set:this.set, get:this.get, remove:this.remove}
			}
		},
		/**
		 * 先从缓存中取，如果没取到或已过期，则请求后台
		 * @param option	<pre class="params">其他可选参数，包括：
		 * 		deadline	过期时间,默认1天
		 * 		reload		强制重新加载,默认为false
		 * 		type		get/post,默认"GET"
		 * 		isFailCallback	info存在且ajax请求失败时，是否回调,默认是true
		 * 		keyIsContainParams	key是否包含参数，默认为true
		 * 		isCacheResult	是否缓存结果到内存，默认为false</pre>
		 */
		doWithCache : function(key, url, params, callback, option) {
			if ( typeof params == 'function' ) {
				option = callback
				callback = params
				params = undefined
			}
			option = $.extend({deadline:24 * 60 * 60, reload:false, type:'GET', isFailCallback:true, keyIsContainParams:true, isCacheResult:false}, option)
			if ( params && option.keyIsContainParams ) for ( var k in params ) key += '_' + k + '-' + params[k]
			var info = option.isCacheResult ? U.cache.get(key) : U.getCache(key)
			if ( !option.reload && info && (!info._update_time || new Date().getTime()-info._update_time < option.deadline*1000) ) {
				callback(info)
			} else {
				U.ajax({
					type: option.type,
					url: bro.server + url,
					data: params,
					success: function(data){
						var obj = JSON.parse(data)
						obj._update_time = new Date().getTime()
						U.save(key, obj)
						callback(obj)
					},
					fail: function(data){
						if ( option.isFailCallback && info ) callback(info)
					},
					errorTip : !(option.isFailCallback && info)
				})
			}
		},
		/**
		 * 一次性缓存
		 */
		oneCache : {
			set : function(name, url, val) {
				var cur
				if ( url == null ) {
					cur = this[name]
					this[name] = val
				} else {
					if ( !$.isPlainObject(this[name]) ) this[name] = {}
					cur = this[name][url]
					this[name][url] = val
				}
				return cur
			},
			get : function(name, url) {
				if ( this[name] ) {
					var val;
					if ( !url ) {
						val = this[name]
						delete this[name]
						return val
					}
					val = this[name][url]
					if ( val ) {
						delete this[name][url]
						return val
					}
					val = this[name][decodeURIComponent(url)]
					if ( val ) {
						delete this[name][decodeURIComponent(url)]
						return val
					}
					return false
				} else {
					return false
				}
			}
		},
		/**
		 * 本地图片预览
		 * @param event		源file对象
		 * @param target	新图片id
		 * @param size		图片大小，默认2M
		 */
		preImg : function(src, target, size, callback) {
			if ( !size ) size = 2
			// 根据这个 <input> 获取文件的 HTML5 js 对象
			if ( typeof src == 'string' ) src = $("#"+src)[0]
			else if ( src instanceof jQuery ) src = src[0]
			var files = src.files, file;
			if (files && files.length > 0) {
				// 获取目前上传的文件
				file = files[0];
				// 文件大小校验
				if ( file.size > 1024 * 1024 * size ) {
					alert('图片大小不能超过 ' + size + 'MB!');
					return false;
				}
				var reader = new FileReader();
				reader.onload = function(evt){
					var dataUrl = evt.target.result;
					if ( target ) $(target).attr('src', dataUrl);
					U.execute(callback, dataUrl)
				}
				reader.readAsDataURL(file);
			}
		},
		/**
		 * 获取url中指定参数
		 */
		getQueryString : function(paramName, url) {
			if( !url ) url = unescape( window.location.href );
			var theRequest = new Object();
			if (url.indexOf("?") != -1) {
				var str = url.substr( url.indexOf("?") + 1 );
				strs = str.split("&");
				for(var i = 0; i < strs.length; i ++) {
					theRequest[strs[i].split("=")[0]] = decodeURIComponent(strs[i].split("=")[1]);
				}
			}
			return paramName ? theRequest[paramName] : theRequest;
		},
		/**
		 * 判断一个对象是否意味着true/false/null。
		 *
		 * <p>尤其是针对字符串形式的：不为0的数字、true、yes、y都表示真；0、false、no、n都表示假；空、undefined或null一般表示什么都不是。<br/>
		 * 这种判断一般出现在某些配置上，所以用了means这个名称。</p>
		 *
		 * @param obj			需要判断的对象
		 * @param nullVal		当obj为null、或表示空的字符串（''、null、undefined）时的返回值，默认为 null
		 * @param unmatchedVal	当obj是字符串，但不是真(1/true/yes/y等)、但也不是假(0/false/no/n)的时候，要返回的值，默认为 true
		 * @return 一般为 true/false/null，除非参数 nullVal、unmatchedVal 要求返回特定类型的值
		 */
		means : function(obj, nullVal, unmatchedVal) {
			if ( nullVal === undefined ) nullVal = null
			if ( unmatchedVal === undefined ) unmatchedVal = null
			if ( obj == null ) return nullVal
			if ( typeof obj == 'string' ) {
				obj = $.trim(obj).toLowerCase()
				if ( obj=="" || obj=="null" || obj=="undefined" ) return nullVal
				if ( obj=="1" || obj=="true" || obj=="yes" || obj=="y" ) return true
				if ( obj=="0" || obj=="false" || obj=="no" || obj=="n" ) return false
				return unmatchedVal != null ? unmatchedVal : true
			} else {
				return obj ? true : false
			}
		},
		/**
		 * 将对象的值转换到数组中
		 * @param obj	带转换对象
		 * @param start	开始下标
		 * @param count 个数
		 */
		obj2arr : function(obj, start, count) {
			var arr = [], index = 0, end = 0
			if ( !start ) start = 0
			if ( count ) end = start + count
			for ( var i in obj ) {
				if ( index++ < start ) continue;
				arr.push(obj[i])
				if ( end != 0 && index >= end ) break
			}
			return arr
		},
		/**
		 * 将对象的值转换成字符串
		 * @param obj	带转换对象
		 */
		obj2str : function(obj) {
			var html = ''
			for ( var key in obj ) {
				html += '&' + key + '=' + obj[key]
			}
			return html.length ? html.substring(1) : html
		},
		/**
		 * 执行方法
		 */
		execute : function(content) {
			if ( typeof content == 'function' ) {
				content.apply(this, this.obj2arr(arguments, 1))
			} else if ( typeof content == 'string' ) {
				eval('('+content+')')
			}
		},
		/**
		 * 将光标定位在text,textarea最后的方法
		 * @param o		需要定位光标的dom节点
		 */
		setPosEnd : function(o) {
			if ( o.setSelectionRange ) {
				setTimeout(function() {
					o.setSelectionRange(o.value.length, o.value.length);
					o.focus();
				} ,0)
			} else if ( o.createTextRange ) {
				var textrange = o.createTextRange();
				textrange.moveStart("character", o.value.length);
				textrange.moveEnd("character", 0);
				textrange.select();
			}
		},
		/**
		 * 系统版本
		 */
		systemVersion : (function() {
			var agent = navigator.userAgent.toLowerCase();
			try {
				return {
					ios : (function() {
						if ( agent.indexOf("like mac os x") > 0 ) {
							return (agent.match(/os [\d._]+/g) + "").replace(/[^0-9|_.]/g, "").replace(/_/g, '.')
						}
						return ""
					})(),
					android : (function() {
						if ( agent.indexOf("android") > 0 ) {
							var index = agent.indexOf('android');
							return agent.substring(index + 8, agent.indexOf(';', index));
						}
						return ""
					})()
				}
			} catch ( e ) {
				return {}
			}
		})(),
		Array : {
			/**
			 * 数组合并,合并到第一个数组里面，合并后，不是新对象
			 * @param arr
			 * @returns {*}
			 */
			concat : function(arr) {
				if ( arr instanceof Array && arguments.length < 2 ) return arr;
				for ( var i=1; i<arguments.length; i++ ) {
					if ( arguments[i] instanceof Array ) {
						for ( var j=0; j<arguments[i].length; j++ ) {
							if ( arguments[i][j] ) arr.push(arguments[i][j]);
						}
					} else {
						if ( arguments[i] ) arr.push(arguments[i]);
					}
				}
				return arr;
			},
			/**
			 * 数组覆盖，覆盖后，原数组对象保持不变
			 * @param arr	原数组
			 * @param arr1	新数组
			 * @returns {*}	将新数组中的内容转到原数组中
			 */
			cover : function (arr, arr1) {
				if ( arr1 instanceof Array ) {
					arr.length = 0;
					for ( var i=0; i<arr1.length; i++ ) arr.push(arr1[i]);
				}
				return arr;
			}
		}
	};

	$.o.util = $.extend(U, $.o.util);
})(jQuery);