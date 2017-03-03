/* Copyright © 2013-2014 北京博瑞开源软件有限公司版权所有。*/

//
//  MainViewController.h
//
//  Created by ___FULLUSERNAME___ on ___DATE___.
//  Copyright ___ORGANIZATIONNAME___ ___YEAR___. All rights reserved.
//

#import "MainViewController.h"
#import <Cordova/CDVUserAgentUtil.h>
#import "CustomURLProtocol.h"
#import "SetupUrlViewController.h"
@implementation MainViewController

#pragma mark

- (id)initWithNibName:(NSString*)nibNameOrNil bundle:(NSBundle*)nibBundleOrNil
{
    self = [super initWithNibName:nibNameOrNil bundle:nibBundleOrNil];
    if (self) {
        // Uncomment to override the CDVCommandDelegateImpl used
        // _commandDelegate = [[MainCommandDelegate alloc] initWithViewController:self];
        // Uncomment to override the CDVCommandQueue used
        // _commandQueue = [[MainCommandQueue alloc] initWithViewController:self];
    }
    return self;
}

- (id)init
{
    self = [super init];
    if (self) {
        // Uncomment to override the CDVCommandDelegateImpl used
        // _commandDelegate = [[MainCommandDelegate alloc] initWithViewController:self];
        // Uncomment to override the CDVCommandQueue used
        // _commandQueue = [[MainCommandQueue alloc] initWithViewController:self];
    }
    BOOL isDevelopmentMode = [@"true" isEqualToString:kIsDevelopmentMode];
    NSString *deviceToken = [[NSUserDefaults standardUserDefaults] objectForKey:@"kDeviceTokenNum"];
    if ( isDevelopmentMode ) {
		self.startPage = [[NSUserDefaults standardUserDefaults] objectForKey:@"kStartUrl"];	// 如果是开发模式，则跳转到设置Url界面
	} else {
		self.startPage = kStartUrl;	// 否则加载固定的首页
	}

    if ( deviceToken != nil ) {
    	NSRange range = [self.startPage rangeOfString:@"?"];
    	if ( range.length > 0 ) {
    		self.startPage = [self.startPage stringByAppendingString:@"&"];
    	} else {
    		self.startPage = [self.startPage stringByAppendingString:@"?"];
    	}
	    self.startPage = [self.startPage stringByAppendingFormat:@"deviceId=%@", deviceToken];
	}

	NSString *startParams = kStartParams;
	if ( isDevelopmentMode ) {
		startParams = [[NSUserDefaults standardUserDefaults] objectForKey:@"kStartParams"];
	}
	if ( startParams != nil && ![startParams isEqualToString:@""] ) {
		NSRange range = [self.startPage rangeOfString:@"?"];
    	if ( range.length > 0 ) {
    		self.startPage = [self.startPage stringByAppendingString:@"&"];
    	} else {
    		self.startPage = [self.startPage stringByAppendingString:@"?"];
    	}
    	self.startPage = [self.startPage stringByAppendingString:startParams];
	}

    
    return self;
}

- (void)didReceiveMemoryWarning
{
    // Releases the view if it doesn't have a superview.
    [super didReceiveMemoryWarning];
    
    // Release any cached data, images, etc that aren't in use.
}

/**
 * 当前控制器注册自定义的CustomURLProtocol资源加载的协议类
 */
- (void)registerProtocol
{
    [CustomURLProtocol registerViewController:self];
}

#pragma mark View lifecycle

- (void)viewWillAppear:(BOOL)animated
{
    // View defaults to full size.  If you want to customize the view's size, or its subviews (e.g. webView),
    // you can do so here.
    
    [super viewWillAppear:animated];
    // 页面加载之前检查更新
    _versionCheckUtil = [[VersionCheckUtil alloc]init];
    [_versionCheckUtil versionCheckRequest];
}

/**
 * @Override
 * 覆盖父类方法，设置自定义的 userAgent
 */
- (NSString*)userAgent
{
    if (_userAgent == nil) {
        NSString* originalUserAgent = [CDVUserAgentUtil originalUserAgent];
        
        // 获取当前版本号，并且去除掉localVersion首尾的空白字符和换行字符
        NSString *localVersion = [[[NSBundle mainBundle] infoDictionary] objectForKey:(NSString *)kCFBundleVersionKey];
        localVersion = [localVersion stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];
        // 拼接新的UserAgent
        originalUserAgent = [NSString stringWithFormat:@"%@ BroMobileShell/%@", originalUserAgent, localVersion];
        //NSLog(@"test%@", originalUserAgent);
        // 设置UserAgent: viewDidLoad 中自动设置
        //[CDVUserAgentUtil acquireLock:^(NSInteger lockToken) {
        //    [CDVUserAgentUtil setUserAgent: userAgent lockToken: lockToken];
        //    [CDVUserAgentUtil releaseLock: &lockToken];
        //}];
        
        // Use our address as a unique number to append to the User-Agent.
        _userAgent = [NSString stringWithFormat:@"%@ (%lld)", originalUserAgent, (long long)self];
    }
    return _userAgent;
}
- (void)viewDidLoad
{
    [super viewDidLoad];
    [self registerProtocol];
    
    BOOL isDevelopmentMode = [@"true" isEqualToString:kIsDevelopmentMode];
    if (isDevelopmentMode) {
        _locationUtil = [[LocationUtil alloc]init];
        // 添加双击手势
        UITapGestureRecognizer* doubleTap = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(handleSingleTap:)];
        doubleTap.numberOfTapsRequired = 2;
        [self.view addGestureRecognizer:doubleTap];
        doubleTap.delegate = self;
        doubleTap.cancelsTouchesInView = NO;
        self.setActionSheet.delegate = self;
    }
    // Do any additional setup after loading the view from its nib.
    //[self getDeviceIdAndLocalURI];
    
}

#pragma mark 手势代理方法

/**
 * 手势在响应方法双击屏幕空白处 调出设置按钮
 */
-(void)handleSingleTap:(UITapGestureRecognizer *)sender
{
    if ( !_setActionSheet ) {
        _setActionSheet = [[UIActionSheet alloc] initWithTitle:nil delegate:self cancelButtonTitle:nil destructiveButtonTitle:nil otherButtonTitles:@"取消",@"设置URL",@"位置测试",nil];
    }
    [_setActionSheet showInView:self.webView];
}

- (BOOL)gestureRecognizer:(UIGestureRecognizer *)gestureRecognizer shouldRecognizeSimultaneouslyWithGestureRecognizer:(UIGestureRecognizer *)otherGestureRecognizer
{
    return YES;
}

#pragma mark actionSheet　delegate method

- (void)actionSheet:(UIActionSheet *)actionSheet clickedButtonAtIndex:(NSInteger)buttonIndex
{
    // 配置URL
    if (buttonIndex == 1) {
        if (!_setVc) {
            _setVc = [[SetupUrlViewController alloc] init];
        }
        [self presentViewController:_setVc animated:YES completion:nil];
    }
    // 获取当前位置
    if (buttonIndex == 2) {
        [_locationUtil getLocation];
    }
}

/*
 #pragma mark JS方法获取deviceToken和localURI
 
 -(void) getDeviceIdAndLocalURI
 {
 // deviceToken
 NSString *deviceToken = [[NSUserDefaults standardUserDefaults] objectForKey:@"kDeviceTokenNum"];
 // localURI
 NSString *executableFile = [[[NSBundle mainBundle] infoDictionary] objectForKey:(NSString *)kCFBundleExecutableKey];
 NSString *localURI = [NSString stringWithFormat:@"file://%@/%@.app/www/",NSHomeDirectory(),executableFile];
 // js
 NSString *jsString = [NSString stringWithFormat:@"if ( undefined == window.Device ) Device = {}; Device.getDeviceId = function() { return \"%@\" }; Device.getLocalURI = function() { return \"%@\" }", deviceToken, localURI];
 
 [self.webView stringByEvaluatingJavaScriptFromString:jsString];
 }
 */

- (void)viewDidUnload
{
    [super viewDidUnload];
    // Release any retained subviews of the main view.
    // e.g. self.myOutlet = nil;
}

- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation
{
    // Return YES for supported orientations
    return [super shouldAutorotateToInterfaceOrientation:interfaceOrientation];
}

/* Comment out the block below to over-ride */

/*
 - (UIWebView*) newCordovaViewWithFrame:(CGRect)bounds
 {
 return[super newCordovaViewWithFrame:bounds];
 }
 */

#pragma mark UIWebDelegate implementation

- (void)webViewDidFinishLoad:(UIWebView*)theWebView
{
    // Black base color for background matches the native apps
    theWebView.backgroundColor = [UIColor blackColor];
    
    // 回调页面上的js方法，做初始化设置
    [self setLocalURI];
    [self setDeviceId];
    //[self setUserAgent];
    
    return [super webViewDidFinishLoad:theWebView];
}

/* Comment out the block below to over-ride */

- (void) webViewDidStartLoad:(UIWebView*)theWebView
{
    return [super webViewDidStartLoad:theWebView];
}

- (void) webView:(UIWebView*)theWebView didFailLoadWithError:(NSError*)error
{
    return [super webView:theWebView didFailLoadWithError:error];
}

- (BOOL) webView:(UIWebView*)theWebView shouldStartLoadWithRequest:(NSURLRequest*)request navigationType:(UIWebViewNavigationType)navigationType
{
    //NSLog( @"%@", [request valueForHTTPHeaderField:@"User-Agent"] );
    
    /* 废弃（异步执行）：重写父类方法，实现js接口，调用方式 window.location = "jscall:方法名"
     if ( [[[request URL] absoluteString] hasPrefix:@"jscall:getLocalURI"] ) {
     [self performSelector:@selector(getLocalURI)];
     return NO;
     }
     if ( [[[request URL] absoluteString] hasPrefix:@"jscall:getDeviceId"] ) {
     [self performSelector:@selector(getDeviceId)];
     return NO;
     } //*/
    
    // https 请求，忽略证书校验
    if (!_authenticated) {
        _authenticated = NO;
        _urlConnection = [[NSURLConnection alloc] initWithRequest:request delegate:self];
        _request = request;
        [_urlConnection start];
        return NO;
    }
    
    return [super webView:theWebView shouldStartLoadWithRequest:request navigationType:navigationType];
}

/**
 * JS API：获取本地文件路径并调用JS中的方法返回获取到的路径
 */
- (void) setLocalURI
{
    NSString *executableFile = [[[NSBundle mainBundle] infoDictionary] objectForKey:(NSString *)kCFBundleExecutableKey];
    NSString *localURI = [NSString stringWithFormat:@"file://%@/%@.app/www/",NSHomeDirectory(),executableFile];
    
    NSString *jsCallBack = [NSString stringWithFormat:@"device.setLocalURI('%@')", localURI];
    [self.webView stringByEvaluatingJavaScriptFromString: jsCallBack];
}

/**
 * JS API：获取设备ID
 */
- (void) setDeviceId
{
    NSString *deviceToken = [[NSUserDefaults standardUserDefaults] objectForKey:@"kDeviceTokenNum"];
    if ( deviceToken != nil ) {
		NSString *jsCallBack = [NSString stringWithFormat:@"device.setDeviceId('%@')", deviceToken];
		[self.webView stringByEvaluatingJavaScriptFromString: jsCallBack];
	}
}

/**
 * 废弃：设置 UserAgent，网上的各种方法都试了不成功，干脆回调js来设置
 - (void) setUserAgent
 {
 NSString *jsCallBack = @"device.isBroMobileShell = true";
 [self.webView stringByEvaluatingJavaScriptFromString: jsCallBack];
 }
 */

#pragma mark - NURLConnection delegate，实现https请求

- (void)connection:(NSURLConnection *)connection didReceiveAuthenticationChallenge:(NSURLAuthenticationChallenge *)challenge
{
    if ([challenge previousFailureCount] == 0)
    {
        _authenticated = YES;
        NSURLCredential *credential = [NSURLCredential credentialForTrust:challenge.protectionSpace.serverTrust];
        [challenge.sender useCredential:credential forAuthenticationChallenge:challenge];
    } else {
        [[challenge sender] cancelAuthenticationChallenge:challenge];
    }
}

- (void)connection:(NSURLConnection *)connection didReceiveResponse:(NSURLResponse *)response
{
    // remake a webview call now that authentication has passed ok.
    _authenticated = YES;
    [self.webView loadRequest:_request];
    // Cancel the URL connection otherwise we double up (webview + url connection, same url = no good!)
    [_urlConnection cancel];
}

- (BOOL)connection:(NSURLConnection *)connection canAuthenticateAgainstProtectionSpace:(NSURLProtectionSpace *)protectionSpace
{
    // We use this method is to accept an untrusted site which unfortunately we need to do, as our PVM servers are self signed.
    return [protectionSpace.authenticationMethod isEqualToString:NSURLAuthenticationMethodServerTrust];
}

@end

@implementation MainCommandDelegate

/* To override the methods, uncomment the line in the init function(s)
   in MainViewController.m
 */

#pragma mark CDVCommandDelegate implementation

- (id)getCommandInstance:(NSString*)className
{
    return [super getCommandInstance:className];
}

- (NSString*)pathForResource:(NSString*)resourcepath
{
    return [super pathForResource:resourcepath];
}

@end

@implementation MainCommandQueue

/* To override, uncomment the line in the init function(s)
   in MainViewController.m
 */
- (BOOL)execute:(CDVInvokedUrlCommand*)command
{
    return [super execute:command];
}

@end
