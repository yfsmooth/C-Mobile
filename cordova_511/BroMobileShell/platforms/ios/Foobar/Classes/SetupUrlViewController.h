/* Copyright © 2013-2014 北京博瑞开源软件有限公司版权所有。*/
//
//  SetupUrlViewController.h
//
//  Created by chenhao on 14-2-20.
//
//

#import <UIKit/UIKit.h>
@class MainViewController;

@interface SetupUrlViewController : UIViewController<UITextViewDelegate>

@property (weak, nonatomic) IBOutlet UITextView *updateTextView;
@property (weak, nonatomic) IBOutlet UITextView *startTextView;
@property (weak, nonatomic) IBOutlet UITextView *paramsTextView;

@property (strong, nonatomic) MainViewController *mainVC;

- (IBAction)commitBtn:(id)sender;


@end
