/* Copyright © 2013-2014 北京博瑞开源软件有限公司版权所有。*/
//
//  LocationUtil.m
//
//  Created by xuwb on 14-4-11.
//
//

#import "LocationUtil.h"

@implementation LocationUtil
- (id)init
{
    self = [super init];
    if (self) {
        // 初始化位置类
        _locationManager = [[CLLocationManager alloc] init];
        _locationManager.delegate = self;
        _locationManager.desiredAccuracy = kCLLocationAccuracyBest;
        _locationManager.distanceFilter = 100.0f;
    }
    return self;
}

- (void)getLocation
{
    //开始获取位置信息
    [_locationManager startUpdatingLocation];
}

#pragma mark Core Location委托方法用于实现位置的更新

- (void)locationManager:(CLLocationManager *)manager didUpdateLocations:(NSArray *)locations
{
    CLLocation *currentLocation = [locations lastObject];
    NSString *location = [NSString stringWithFormat:@"纬度:%f\n 经度:%f\n高度:%f",currentLocation.coordinate.latitude,currentLocation.coordinate.longitude,currentLocation.altitude];
    UIAlertView *alert = [[UIAlertView alloc]initWithTitle:@"当前位置" message:location delegate:self cancelButtonTitle:@"OK" otherButtonTitles:Nil, nil];
    [alert show];
}

#pragma mark AlertView　delegate method

- (void)alertView:(UIAlertView *)alertView clickedButtonAtIndex:(NSInteger)buttonIndex
{
    if (buttonIndex ==0) {
        // 停止位置更新
        [_locationManager stopUpdatingLocation];
    }
}
@end
