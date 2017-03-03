/* Copyright © 2013-2014 北京博瑞开源软件有限公司版权所有。*/
//
//  versionCheckUtil.h
//
//  Created by xuwb on 14-4-11.
//
//

#import <Foundation/Foundation.h>

@interface VersionCheckUtil : NSObject<HttpUtilDelegate>
@property (nonatomic, strong) HttpUtil *httpUtil;

@property (nonatomic, strong) NSString *serverVersion;

@property (nonatomic, strong) NSString *deviceToKen;

- (void)versionCheckRequest;
@end
