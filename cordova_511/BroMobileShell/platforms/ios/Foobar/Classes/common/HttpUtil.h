/* Copyright © 2013-2014 北京博瑞开源软件有限公司版权所有。*/
//
//  HTTPConnect.h
//  MobileApp
//
//  Created by chenhao on 13-9-3.
//

#import <Foundation/Foundation.h>
#import "ASIFormDataRequest.h"
#import "ASINetworkQueue.h"
#import "UIDevice-Reachability.h"
#define kTimeoutSecond 120

@class HttpUtil;

@protocol HttpUtilDelegate <NSObject>

@optional
-(void) finishedRequest:(id)receiveData withSender:(id)sender;
-(void) errorRequest:(NSError*)error withSender:(id)sender;
@end


@interface HttpUtil : NSObject<ASIHTTPRequestDelegate>
@property (assign, nonatomic) id<HttpUtilDelegate>delegate;
@property (retain, nonatomic) ASIFormDataRequest *request;


- (void) requestURL:(NSURL *) url  
     withDictionary:(NSDictionary *)dict
      receiveTarget:(id)target;  // 单个请求


@end
