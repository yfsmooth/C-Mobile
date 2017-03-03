/* Copyright © 2013-2014 北京博瑞开源软件有限公司版权所有。*/
//
//  HTTPConnect.h
//  MobileApp
//
//  Created by chenhao on 13-9-3.
//

#import "HttpUtil.h"
#import "SVProgressHUD.h"
@interface HttpUtil()
@property (retain, nonatomic) id sender;
@end

@implementation HttpUtil

@synthesize delegate = _delegate;
@synthesize request = _request;
@synthesize sender = _sender;


#pragma mark Getter


//request的get函数
- (ASIFormDataRequest *)request
{
    if(_request==nil){
        _request=[[ASIFormDataRequest alloc] init];
    }
    [_request setTimeOutSeconds:kTimeoutSecond/1.5];
    return _request;
}

#pragma mark Send Request

//请求网络函数
- (void) requestURL:(NSURL *) url
     withDictionary:(NSDictionary *)dict
      receiveTarget:(id)target{
    if (![UIDevice networkAvailable]) {
     
        UIAlertView *alert = [[UIAlertView alloc]initWithTitle:NSLocalizedString(@"kNetWorkMessageTitle", @"")
                                                 message:NSLocalizedString(@"kNetWorkContentMessage", @"")
                                                 delegate:self
                                                 cancelButtonTitle:NSLocalizedString(@"kCancelButtonTitle", @"")
                                                 otherButtonTitles:NSLocalizedString(@"kConfirmButtonTitle", @"") , nil];
        [alert show];
        [alert release];
    } else {
        //设置提交地址
        [self setRequest:[ASIFormDataRequest requestWithURL:url]];
        [SVProgressHUD showWithStatus:NSLocalizedString(@"kSVProgressHUDLoadMessage", @"")];
        [_request setDelegate:self];
        //异步提交
        [_request startAsynchronous];
    }
}

#pragma mark HttpRequest Delegate

//网络请求结束，请求成功
- (void)requestFinished:(ASIHTTPRequest *)request{
    [SVProgressHUD dismiss];
    NSData *responseData = [request responseData];
    NSString *responseString = [[NSString alloc] initWithData:responseData encoding:NSUTF8StringEncoding];

    [self.delegate finishedRequest:responseString withSender:self.sender];
   
    [responseString release];
}

//网络请求失败
- (void)requestFailed:(ASIHTTPRequest *)request{
    [SVProgressHUD showWithStatus:NSLocalizedString(@"kSVProgressHUDMessage", @"")];
    self.sender = [request.userInfo objectForKey:@"sender"];
    [self.delegate errorRequest:[request error] withSender:self.sender];
}


#pragma mark dealloc
- (void) dealloc
{
    [_request release];
    [super dealloc];
}

@end
