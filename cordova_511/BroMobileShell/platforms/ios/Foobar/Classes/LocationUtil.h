/* Copyright © 2013-2014 北京博瑞开源软件有限公司版权所有。*/
//
//  LocationUtil.h
//
//  Created by xuwb on 14-4-11.
//
//

#import <Foundation/Foundation.h>
#import <CoreLocation/CoreLocation.h>
#import <CoreLocation/CLLocationManagerDelegate.h>
@interface LocationUtil : NSObject<CLLocationManagerDelegate,UIAlertViewDelegate>

@property (strong, nonatomic) CLLocationManager *locationManager;
- (void)getLocation;
@end
