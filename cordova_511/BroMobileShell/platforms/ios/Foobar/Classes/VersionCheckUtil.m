/* Copyright © 2013-2014 北京博瑞开源软件有限公司版权所有。*/
//
//  versionCheckUtil.m
//
//  Created by xuwb on 14-4-11.
//
//

#import "VersionCheckUtil.h"
#import "SVProgressHUD.h"

#define alert_tag_default    10
#define alert_tag_update     20
#define alert_tag_mustUpdate 30

@implementation VersionCheckUtil

- (id)init
{
    self = [super init];
    if (self) {
        _httpUtil = [[HttpUtil alloc]init];
        _httpUtil.delegate = self;
    }
    return self;
}
/**
 * 版本检测请求
 */
- (void)versionCheckRequest
{
    // 获取系统当前时间
    NSDate *now = [NSDate date];
    NSDateFormatter *formatters = [[NSDateFormatter alloc] init];
    [formatters setDateFormat:@"yyyy/M/d HH:mm:ss"];
    NSString *lastCheckUpdateTimeString = [formatters stringFromDate:now];
    NSDate *lastCheckUpdateTime = [formatters dateFromString:lastCheckUpdateTimeString];
    [[NSUserDefaults standardUserDefaults] setObject:lastCheckUpdateTime forKey:@"lastCheckUpdateTime"];
    // 发送检查版本更新请求
    BOOL isDevelopmentMode = [@"true" isEqualToString:kIsDevelopmentMode];
    NSString *updateUrl = kUpdateUrl;
    if (isDevelopmentMode) {
        updateUrl = [[NSUserDefaults standardUserDefaults] objectForKey:@"kUpdateUrl"];
    }
    if (![updateUrl isEqualToString:@""]) {
        NSString *updateUrlString = [updateUrl stringByAppendingString:@"version_ios.txt"];
        [_httpUtil requestURL:[NSURL URLWithString:updateUrlString] withDictionary:nil
                receiveTarget:@"checkVersion"];
        [SVProgressHUD dismiss];
    }
}

#pragma mark httpUtil delegate method

/**
 * 网络请求失败后的回调函数
 */
- (void)errorRequest:(NSError *)error withSender:(id)sender
{
	[SVProgressHUD dismiss];
    UIAlertView *alert = [[UIAlertView alloc]initWithTitle:nil
                                                   message:NSLocalizedString(@"kServerConectionMessage", @"")
                                                  delegate:self
                                         cancelButtonTitle:nil
                                         otherButtonTitles:NSLocalizedString(@"kConfirmButtonTitle", @"") , nil];
    [alert show];
}

/**
 * 网络请求成功后的回调函数：进行版本检查
 */
- (void)finishedRequest:(NSString *)receiveString withSender:(id)sender
{
    // 去除掉localVersion首尾的空白字符和换行字符
    NSString *localVersion = [[[NSBundle mainBundle] infoDictionary] objectForKey:(NSString *)kCFBundleVersionKey];
    localVersion = [localVersion stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];
    // 去除掉serverVersion首尾的空白字符和换行字符
    _serverVersion = receiveString;
    _serverVersion = [_serverVersion stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];
    NSLog(@"local = %@ server = %@",localVersion,_serverVersion);
    // 把当前版本号转化为数组，赋值给localVersionArr
    NSArray *localVersionArr = [localVersion componentsSeparatedByString:@"."];
    // 把服务器版本号转化为数组，赋值给serverVersionArr
    NSArray *serverVersionArr = [_serverVersion componentsSeparatedByString:@"."];
    // 判断服务器版本号是否以 .F 结尾
    if ( [[serverVersionArr lastObject] isEqualToString:@"F"] ) {
        // 若服务器版本号高于当前版本号，弹出必须更新提示框
        for ( int i=0; i<localVersionArr.count; i++ ) {
            if ( [[serverVersionArr objectAtIndex:i] intValue] > [[localVersionArr objectAtIndex:i] intValue] ) {
                UIAlertView *alert = [[UIAlertView alloc] initWithTitle:NSLocalizedString(@"kServerVersion", @"")
                                                                message:NSLocalizedString(@"kMustUpdate", @"")
                                                               delegate:self
                                                      cancelButtonTitle:nil
                                                      otherButtonTitles:NSLocalizedString(@"kVersionConfirmButtonTitle", @"") , nil];
                alert.tag = alert_tag_mustUpdate;
                [alert show];
                break;
            }
        }
    } else {
        for ( int i=0; i<localVersionArr.count; i++ ) {
            // 判断服务器上是否高于当前版本号，若高于当前版本号弹出更新提示框，用户可以选择更新或暂不更新
            if ( [[serverVersionArr objectAtIndex:i] intValue] > [[localVersionArr objectAtIndex:i] intValue] ) {
                UIAlertView *alert = [[UIAlertView alloc] initWithTitle:NSLocalizedString(@"kServerVersion", @"")
                                                                message:NSLocalizedString(@"kIsUpdate", @"")
                                                               delegate:self
                                                      cancelButtonTitle:NSLocalizedString(@"kVersionCancelButtonTitle", @"")
                                                      otherButtonTitles:NSLocalizedString(@"kVersionConfirmButtonTitle", @"") , nil];
                alert.tag = alert_tag_update;
                [alert show];
                break;
            }
        }
    }
}

//alertView代理方法
- (void)alertView:(UIAlertView *)alertView clickedButtonAtIndex:(NSInteger)buttonIndex
{
    if (buttonIndex == 0) {
        if ( alertView.tag == alert_tag_mustUpdate ) {
            //点击必须更新提示框的更新按钮后，打开程序更新的下载网页，并退出程序
            NSString *updateString = [kUpdateUrl stringByAppendingFormat:@"%@_%@.plist", kAppName, _serverVersion];
            updateString = [[[NSString alloc] init] stringByAppendingFormat:@"itms-services://?action=download-manifest&url=%@",updateString];
            [[UIApplication sharedApplication] openURL:[NSURL URLWithString:updateString]];
			exit(0);
        }
    }
    if (buttonIndex==1) {
        if( alertView.tag == alert_tag_update ){
            // 点击是否更是提示框的更新按钮后，打开程序更新的下载网页，并退出程序
            NSString *updateString = [kUpdateUrl stringByAppendingFormat:@"%@_%@.plist", kAppName, _serverVersion];
            updateString = [[[NSString alloc] init] stringByAppendingFormat:@"itms-services://?action=download-manifest&url=%@",updateString];
            [[UIApplication sharedApplication] openURL:[NSURL URLWithString:updateString]];
			exit(0);
        }
    }
}
@end
