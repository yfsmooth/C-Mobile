/* Copyright © 2013-2014 北京博瑞开源软件有限公司版权所有。*/

//
//  MainViewController.h
//
//  Created by ___FULLUSERNAME___ on ___DATE___.
//  Copyright ___ORGANIZATIONNAME___ ___YEAR___. All rights reserved.
//

#import <Cordova/CDVViewController.h>
#import <Cordova/CDVCommandDelegateImpl.h>
#import <Cordova/CDVCommandQueue.h>
#import "LocationUtil.h"
#import "VersionCheckUtil.h"
@class SetupUrlViewController;

@interface MainViewController : CDVViewController <NSURLConnectionDelegate,UIGestureRecognizerDelegate,UIActionSheetDelegate>
{
    NSURLConnection *_urlConnection;
    NSURLRequest *_request;
    BOOL _authenticated;
}
@property (strong, nonatomic) UIActionSheet *setActionSheet;
@property (strong, nonatomic) SetupUrlViewController *setVc;
@property (strong, nonatomic) LocationUtil *locationUtil;
@property (strong, nonatomic) VersionCheckUtil *versionCheckUtil;
@end

@interface MainCommandDelegate : CDVCommandDelegateImpl
@end

@interface MainCommandQueue : CDVCommandQueue
@end
