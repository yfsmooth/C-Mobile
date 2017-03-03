/* Copyright © 2013-2014 北京博瑞开源软件有限公司版权所有。*/

//
//  AppDelegate.m
//
//  Created by ___FULLUSERNAME___ on ___DATE___.
//  Copyright ___ORGANIZATIONNAME___ ___YEAR___. All rights reserved.
//


#import "AppDelegate.h"
#import "MainViewController.h"
#import "SetupUrlViewController.h"

#import <Cordova/CDVPlugin.h>
#import <objc/runtime.h>
#import "VersionCheckUtil.h"

#define kDeviceToken @"kDeviceTokenNum"

@implementation AppDelegate

@synthesize window, viewController,deviceToKen;
@synthesize isRepeat;
@synthesize launchNotification;
@synthesize isDevelopmentMode;

#pragma mark - 实现远程推送需要实现的监听接口

#ifndef DISABLE_PUSH_NOTIFICATIONS

/**
 * 注册远程通知成功后的回单函数，接收从苹果服务器返回的唯一的设备token值，并把该值上传到推送服务器
 */
- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken
{
	
	self.deviceToKen = [[[deviceToken description] stringByTrimmingCharactersInSet:[NSCharacterSet
																					characterSetWithCharactersInString:@"<>"] ] stringByReplacingOccurrencesOfString:@" " withString:@""];
	
	//判断token是否为空，若为空再重新注册一次
	BOOL isRemoteNotificationEnabled = [@"true" isEqualToString:kIsRemoteNotificationEnabled];
	if (isRemoteNotificationEnabled && self.deviceToKen==nil && isRepeat) {
		[[UIApplication sharedApplication] registerForRemoteNotificationTypes:(
			UIRemoteNotificationTypeAlert | UIRemoteNotificationTypeBadge | UIRemoteNotificationTypeSound)];
		isRepeat = NO;
		return ;
	}
	[[NSUserDefaults standardUserDefaults] removeObjectForKey:kDeviceToken];
	[[NSUserDefaults standardUserDefaults] setObject:self.deviceToKen forKey:kDeviceToken];
	
	[self loadStartPage];
}

/**
 * 注册远程通知失败后的回调函数
 */
- (void)application:(UIApplication *)app didFailToRegisterForRemoteNotificationsWithError:(NSError *)err
{
	NSString *str = [NSString stringWithFormat: @"didFailToRegisterForRemoteNotificationsWithError: %@", err];
	NSLog(@"%@",str);

	[self loadStartPage];
}

#endif

/**
 * 加载首页
 */
- (void)loadStartPage
{
	CGRect screenBounds = [[UIScreen mainScreen] bounds];
	
#if __has_feature(objc_arc)
	self.window = [[UIWindow alloc] initWithFrame:screenBounds];
#else
	self.window = [[[UIWindow alloc] initWithFrame:screenBounds] autorelease];
#endif
	self.window.autoresizesSubviews = YES;

	// 开发环境，启动后直接显示URL配置界面；否则加载首页
	if ( isDevelopmentMode ) {
		//  && [[NSUserDefaults standardUserDefaults] objectForKey:@"kStartUrl"] == nil
#if __has_feature(objc_arc)
		self.setViewController = [[SetupUrlViewController alloc] init];
#else
		self.setViewController = [[[SetupUrlViewController alloc] init] autorelease];
#endif
		self.window.rootViewController = self.setViewController;
	} else {
#if __has_feature(objc_arc)
		self.viewController = [[MainViewController alloc] init];
#else
		self.viewController = [[[MainViewController alloc] init] autorelease];
#endif
		self.window.rootViewController = self.viewController;
	}
	[self.window makeKeyAndVisible];
}

/**
 * 接收到通知的回调函数
 */
- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo
{
	for (id key in userInfo) {
		NSLog(@"key: %@, value: %@", key, [userInfo objectForKey:key]);
	}
	NSLog(@"\napns -> didReceiveRemoteNotification,Receive Data:\n%@", userInfo);
	
	if([application applicationState] != UIApplicationStateActive){
		//若程序为非激活状态，由以消息通知为lauching函数的参数激活程序
		self.launchNotification = userInfo;
	}
	else{
		//通过键值对来获取推送信息的内容
		NSString *message = [[userInfo objectForKey:@"aps"] objectForKey:@"alert"];
		//定义一个字符串，字符串为js函数的名字，用于调用js
		NSString *JSCallBack = [NSString stringWithFormat:@"device.notify('%@')",message];
		[self.viewController.webView stringByEvaluatingJavaScriptFromString:JSCallBack];
	}
}


#pragma mark UIApplicationDelegate implementation

/**
 * init method
 */
- (id)init
{
	/** If you need to do any extra app-specific initialization, you can do it here
	 *  -jm
	 **/
	NSHTTPCookieStorage* cookieStorage = [NSHTTPCookieStorage sharedHTTPCookieStorage];
	
	[cookieStorage setCookieAcceptPolicy:NSHTTPCookieAcceptPolicyAlways];
	
	int cacheSizeMemory = 8 * 1024 * 1024; // 8MB
	int cacheSizeDisk = 32 * 1024 * 1024; // 32MB
#if __has_feature(objc_arc)
	NSURLCache* sharedCache = [[NSURLCache alloc] initWithMemoryCapacity:cacheSizeMemory diskCapacity:cacheSizeDisk diskPath:@"nsurlcache"];
#else
	NSURLCache* sharedCache = [[[NSURLCache alloc] initWithMemoryCapacity:cacheSizeMemory diskCapacity:cacheSizeDisk diskPath:@"nsurlcache"] autorelease];
#endif
	[NSURLCache setSharedURLCache:sharedCache];
	
	isDevelopmentMode = [@"true" isEqualToString:kIsDevelopmentMode];
	_versionCheckUtil = [[VersionCheckUtil alloc]init];
	self = [super init];
	return self;
}

/**
 * This is main kick off after the app inits, the views and Settings are setup here. (preferred - iOS4 and up)
 */
- (BOOL)application:(UIApplication*)application didFinishLaunchingWithOptions:(NSDictionary*)launchOptions
{
	//注册推送通知功能
	BOOL isRemoteNotificationEnabled = [@"true" isEqualToString:kIsRemoteNotificationEnabled];
	if ( isRemoteNotificationEnabled ) {
		[[UIApplication sharedApplication] registerForRemoteNotificationTypes:(
			UIRemoteNotificationTypeAlert | UIRemoteNotificationTypeBadge | UIRemoteNotificationTypeSound)];
		//设置是否需要重新注册bool值为真，当获取token值为空时再重新注册一次
		isRepeat = YES;
	} else {
		NSLog(@"load start page without remote notification.");
		[self loadStartPage];
	}
	return YES;
}

- (void)applicationDidBecomeActive:(UIApplication *)application
{
	//程序打开后把icon上的标记数字设清0
	application.applicationIconBadgeNumber = 0;
}

- (void)applicationWillEnterForeground:(UIApplication *)application
{
	//当程序由后台重新回到前台时，对程序版本进行检测，判断距离上次检查的时间是否超过一天，超过一天发送检查版本更新请求
	NSDate  *activeTime = [NSDate date];
	NSDateFormatter *formatters = [[NSDateFormatter alloc] init];
	[formatters setDateFormat:@"yyyy/M/d HH:mm:ss"];
	NSString *time2String = [formatters stringFromDate:activeTime];
	activeTime = [formatters dateFromString:time2String];
	NSDate *lastCheckUpdateTime= [[NSUserDefaults standardUserDefaults] objectForKey:@"lastCheckUpdateTime"];
	double timeDiff = [activeTime timeIntervalSinceDate:lastCheckUpdateTime];
	if ((timeDiff/(24*3600)) > 1.0) {
		[_versionCheckUtil versionCheckRequest];
		[[NSUserDefaults standardUserDefaults] setObject:activeTime forKey:@"lastCheckUpdateTime"];
	}
}

/**
 * 最早执行，将init方法替换成 swizzled_init
 * its dangerous to override a method from within a category.
 * Instead we will use method swizzling. we set this up in the load call.
 */
+ (void)load
{
	Method original, swizzled;
	
	original = class_getInstanceMethod(self, @selector(init));
	swizzled = class_getInstanceMethod(self, @selector(swizzled_init));
	method_exchangeImplementations(original, swizzled);
}

/**
 * 替换的 init 方法
 */
- (AppDelegate *)swizzled_init
{
	[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(createNotificationChecker:)
												 name:@"UIApplicationDidFinishLaunchingNotification" object:nil];
	
	// This actually calls the original init method over in AppDelegate. Equivilent to calling super
	// on an overrided method, this is not recursive, although it appears that way. neat huh?
	return [self swizzled_init];
	
}

/**
 * 启动的时候，如果是点击推送通知后打开的，则获取推送的消息，并赋值给 launchNotification
 * This code will be called immediately after application:didFinishLaunchingWithOptions:. We need
 * to process notifications in cold-start situations
 */
- (void)createNotificationChecker:(NSNotification *)notification
{
	if (notification)
	{
		NSDictionary *launchOptions = [notification userInfo];
		if (launchOptions)
			self.launchNotification = [launchOptions objectForKey: @"UIApplicationLaunchOptionsRemoteNotificationKey"];
	}
}

// this happens while we are running ( in the background, or from within our own app )
// only valid if HelloCordova-Info.plist specifies a protocol to handle
- (BOOL)application:(UIApplication*)application openURL:(NSURL*)url sourceApplication:(NSString*)sourceApplication annotation:(id)annotation
{
	if (!url) {
		return NO;
	}

	// all plugins will get the notification, and their handlers will be called
	[[NSNotificationCenter defaultCenter] postNotification:[NSNotification notificationWithName:CDVPluginHandleOpenURLNotification object:url]];

	return YES;
}

// repost all remote and local notification using the default NSNotificationCenter so multiple plugins may respond
- (void)            application:(UIApplication*)application
	didReceiveLocalNotification:(UILocalNotification*)notification
{
	// re-post ( broadcast )
	[[NSNotificationCenter defaultCenter] postNotificationName:CDVLocalNotification object:notification];
}

/*
#ifndef DISABLE_PUSH_NOTIFICATIONS

    - (void)                                 application:(UIApplication*)application
        didRegisterForRemoteNotificationsWithDeviceToken:(NSData*)deviceToken
    {
        // re-post ( broadcast )
        NSString* token = [[[[deviceToken description]
            stringByReplacingOccurrencesOfString:@"<" withString:@""]
            stringByReplacingOccurrencesOfString:@">" withString:@""]
            stringByReplacingOccurrencesOfString:@" " withString:@""];

        [[NSNotificationCenter defaultCenter] postNotificationName:CDVRemoteNotification object:token];
    }

    - (void)                                 application:(UIApplication*)application
        didFailToRegisterForRemoteNotificationsWithError:(NSError*)error
    {
        // re-post ( broadcast )
        [[NSNotificationCenter defaultCenter] postNotificationName:CDVRemoteNotificationError object:error];
    }
#endif
*/

- (NSUInteger)application:(UIApplication*)application supportedInterfaceOrientationsForWindow:(UIWindow*)window
{
	// iPhone doesn't support upside down by default, while the iPad does.  Override to allow all orientations always, and let the root view controller decide what's allowed (the supported orientations mask gets intersected).
	NSUInteger supportedInterfaceOrientations = (1 << UIInterfaceOrientationPortrait) | (1 << UIInterfaceOrientationLandscapeLeft) | (1 << UIInterfaceOrientationLandscapeRight) | (1 << UIInterfaceOrientationPortraitUpsideDown);
	
	return supportedInterfaceOrientations;
}

- (void)applicationDidReceiveMemoryWarning:(UIApplication*)application
{
	[[NSURLCache sharedURLCache] removeAllCachedResponses];
}

@end
