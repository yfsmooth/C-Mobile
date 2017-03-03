/* Copyright © 2013-2014 北京博瑞开源软件有限公司版权所有。*/

//
//  AppDelegate.h
//
//  Created by ___FULLUSERNAME___ on ___DATE___.
//  Copyright ___ORGANIZATIONNAME___ ___YEAR___. All rights reserved.
//

#import <UIKit/UIKit.h>

#import <Cordova/CDVViewController.h>

@class SetupUrlViewController;
@class VersionCheckUtil;
@interface AppDelegate : NSObject <UIApplicationDelegate>{}

// invoke string is passed to your app on launch, this is only valid if you
// edit Xxxxx-Info.plist to add a protocol
// a simple tutorial can be found here :
// http://iphonedevelopertips.com/cocoa/launching-your-own-application-via-a-custom-url-scheme.html

@property (nonatomic, strong) IBOutlet UIWindow* window;
@property (nonatomic, strong) IBOutlet CDVViewController* viewController;
@property (nonatomic, strong) IBOutlet SetupUrlViewController *setViewController;
@property (nonatomic, strong) NSString *deviceToKen;


@property (nonatomic, strong) NSDictionary *launchNotification;
@property (nonatomic, strong) VersionCheckUtil *versionCheckUtil;
@property (nonatomic,assign) BOOL isRepeat;
@property (nonatomic,assign) BOOL isDevelopmentMode;

@end
