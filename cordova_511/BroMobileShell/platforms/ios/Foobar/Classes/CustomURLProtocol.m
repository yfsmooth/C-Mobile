/* Copyright © 2013-2014 北京博瑞开源软件有限公司版权所有。*/
//
//  CustomURLProtocol.m
//
//  Created by chenhao on 14-2-12.
//
//

#import "CustomURLProtocol.h"

@interface CustomHTTPURLResponse : NSHTTPURLResponse

@property (nonatomic) NSInteger statusCode;

@end

@implementation CustomURLProtocol

/**
 * @Override
 * 覆盖父类的方法，注册自定义的CustomURLProtocol协议类
 */
+ (void)registerViewController:(CDVViewController*)viewController
{
    [super registerViewController:viewController];
    [NSURLProtocol registerClass:[CustomURLProtocol class]];
}

/**
 * @Override
 * @Deprecated 在 js 端自动处理
 * 覆盖父类的方法，自定义网络资源加载方式，当请求的地址为kPluginsUrl及kCordovaIos和kCordovaAnroid时进行拦截，不加载。
 */
+ (BOOL)canInitWithRequest:(NSURLRequest *)theRequest
{
    return NO;

    NSURL *theUrl = [theRequest URL];
    if ( [[theUrl absoluteString] rangeOfString:@"/cordova/ios/plugins"].location != NSNotFound ) {
        return YES;
    } else if ( [[theUrl absoluteString] rangeOfString:@"/cordova/ios/cordova.js"].location != NSNotFound ) {
        return YES;
    } else if([[theUrl absoluteString] rangeOfString:@"/cordova/android/cordova.js"].location != NSNotFound) {
        return YES;
    }
    
    // 测试
    //if ( [[theUrl absoluteString] rangeOfString:@".js"].location != NSNotFound ) {
    //    return YES;
    //}
    
    [super canInitWithRequest:theRequest];
    return NO;
}

/**
 * @Override
 * 覆盖父类的方法，自定义拦截后资源的加载方式，用本地的资源代替
 */
- (void)startLoading
{
    NSURL *theUrl = [[self request] URL];
    if ( [[theUrl absoluteString] rangeOfString:@"/cordova/ios/plugins"].location != NSNotFound ) {
        NSString *pluginJSPath = [NSString stringWithFormat:@"plugins%@", [[[theUrl absoluteString] componentsSeparatedByString:@"plugins"] objectAtIndex:1]];
        [self changeJsSourceWith:pluginJSPath];
    } else if ( [[theUrl absoluteString] rangeOfString:@"/cordova/ios/cordova.js"].location != NSNotFound ) {
        [self changeJsSourceWith:@"cordova.js"];
    }
    
    // 测试
    //if ( [[theUrl absoluteString] rangeOfString:@".js"].location != NSNotFound ) {
    //    NSData *jsData =  [@"alert(1)" dataUsingEncoding:NSUTF8StringEncoding];
    //    [self sendResponseWithResponseCode:200 sourceData:jsData mimeType:nil];
    //}
    
    [super startLoading];
}

/**
 * 用本地的资源路径代替
 */
- (void)changeJsSourceWith:(NSString *)fileName
{
    NSString *executableFile = [[[NSBundle mainBundle] infoDictionary] objectForKey:(NSString *)kCFBundleExecutableKey];
    NSString *sourcePath = [NSString stringWithFormat:@"%@/%@.app/www/%@",NSHomeDirectory(), executableFile,fileName];
    NSData *jsData = [self getDataFromPath:sourcePath];
    [self sendResponseWithResponseCode:200 sourceData:jsData mimeType:nil];
}

/**
 * 把获取的资源传递到client
 */
- (void)sendResponseWithResponseCode:(NSInteger)statusCode sourceData:(NSData*)data mimeType:(NSString*)mimeType
{
    if ( mimeType == nil ) {
        mimeType = @"text/plain";
    }
    NSString* encodingName = [@"text/plain" isEqualToString : mimeType] ? @"UTF-8" : nil;
    CustomHTTPURLResponse* response =
    [[CustomHTTPURLResponse alloc] initWithURL:[[self request] URL]
                                      MIMEType:mimeType
                         expectedContentLength:[data length]
                              textEncodingName:encodingName];
    
    response.statusCode = statusCode;
    
    [[self client] URLProtocol:self didReceiveResponse:response cacheStoragePolicy:NSURLCacheStorageNotAllowed];
    if ( data != nil ) {
        [[self client] URLProtocol:self didLoadData:data];
    }
    [[self client] URLProtocolDidFinishLoading:self];
}

/**
 * 获取filePath路径下的资源，并转化为data格式
 */
- (NSData *)getDataFromPath:(NSString *)filePath
{
    NSFileManager *fileManager = [NSFileManager defaultManager];
    NSData *sourceData = [fileManager contentsAtPath:filePath];
    return sourceData;
}
@end

@implementation CustomHTTPURLResponse

@synthesize statusCode;

@end
