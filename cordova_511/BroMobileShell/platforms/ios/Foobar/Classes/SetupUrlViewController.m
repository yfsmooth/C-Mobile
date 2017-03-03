/* Copyright © 2013-2014 北京博瑞开源软件有限公司版权所有。*/
//
//  SetupUrlViewController.m
//
//  Created by chenhao on 14-2-20.
//
//

#import "SetupUrlViewController.h"
#import <QuartzCore/QuartzCore.h>
#import "MainViewController.h"

@interface SetupUrlViewController ()

@end

@implementation SetupUrlViewController

#pragma mark TextViewDelegate method

- (void)textViewDidChange:(UITextView *)textView
{
    [self setTextViewFrame:textView];
}

/**
 * 点击屏幕空白处隐藏软键盘
 */
- (void)touchesBegan:(NSSet *)touches withEvent:(UIEvent *)event
{
    UITouch *touch = [touches anyObject];
    
    if (![[touch view] isKindOfClass:[UITextField class]] && ![[touch view] isKindOfClass:[UITextView class]]) {
        for (UIView* view in self.view.subviews) {
            if ([view isKindOfClass:[UITextView class]]) {
                [view resignFirstResponder];
            } else if ([view isKindOfClass:[UITextField class]]) {
                [view resignFirstResponder];
            }
        }
    }
}
#pragma mark setViewController method

- (BOOL)shouldAutorotate
{
    [super shouldAutorotate];
    return NO;
}

- (id)initWithNibName:(NSString *)nibNameOrNil bundle:(NSBundle *)nibBundleOrNil
{
    self = [super initWithNibName:nibNameOrNil bundle:nibBundleOrNil];
    if (self) {
        // Custom initialization
    }
    return self;
}

/**
 * 根据textView里在内容设置textView的高度
 */

- (void)setTextViewFrame:(UITextView *)textView
{
    CGRect frame = textView.frame;
    frame.size.height = textView.contentSize.height;
    textView.frame = frame;
}

/**
 * 给textView设置边框
 */

- (void)setTextView:(UITextView *)textView
{
    textView.layer.borderColor = [UIColor grayColor].CGColor;
    textView.layer.borderWidth =1.0;
    textView.layer.cornerRadius =5.0;
}

/**
 * 所有在textView填入内容后，设置为相应在高度
 */
- (void)setAllTextView
{
    self.updateTextView.text = [[NSUserDefaults standardUserDefaults] objectForKey:@"kUpdateUrl"];
    self.startTextView.text = [[NSUserDefaults standardUserDefaults] objectForKey:@"kStartUrl"];
    self.paramsTextView.text = [[NSUserDefaults standardUserDefaults] objectForKey:@"kStartParams"];
    if ( [self.updateTextView.text isEqualToString:@""] ) {
        self.updateTextView.text = kUpdateUrl;
    }
    if ( [self.startTextView.text isEqualToString:@""] ) {
        self.startTextView.text = kStartUrl;
    }
    if ( [self.paramsTextView.text isEqualToString:@""] ) {
        self.paramsTextView.text = kStartParams;
    }
    
    [self setTextViewFrame:self.updateTextView];
    [self setTextViewFrame:self.startTextView];
    [self setTextViewFrame:self.paramsTextView];
}

- (void)viewWillAppear:(BOOL)animated
{
    [super viewWillAppear:animated];
    [self setAllTextView];
}

- (void)viewDidAppear:(BOOL)animated
{
    [super viewDidAppear:animated];
    //self.updateTextView.text = [[NSUserDefaults standardUserDefaults] objectForKey:@"kUpdateUrl"];
    //self.paramsTextView.text = [[NSUserDefaults standardUserDefaults] objectForKey:@"kStartParams"];
    [self setAllTextView];
    [self setTextView:self.updateTextView];
    [self setTextView:self.startTextView];
    [self setTextView:self.paramsTextView];
}

- (void)viewDidLoad
{
    [super viewDidLoad];
    self.updateTextView.delegate = self;
    self.startTextView.delegate = self;
    self.paramsTextView.delegate = self;
    
    // Do any additional setup after loading the view from its nib.
}

- (void)didReceiveMemoryWarning
{
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

/**
 * Apply 按钮点击方法
 */
- (IBAction)commitBtn:(id)sender
{
    [[NSUserDefaults standardUserDefaults] setObject:self.updateTextView.text forKey:@"kUpdateUrl"];
    [[NSUserDefaults standardUserDefaults] setObject:self.startTextView.text forKey:@"kStartUrl"];
    [[NSUserDefaults standardUserDefaults] setObject:self.paramsTextView.text forKey:@"kStartParams"];
    
    if ([[[NSUserDefaults standardUserDefaults] objectForKey:@"kStartUrl"] isEqualToString:@""]) {
        UIAlertView *alert = [[UIAlertView alloc] initWithTitle:nil message:@"url不能为空" delegate:self cancelButtonTitle:@"OK" otherButtonTitles:nil, nil];
        [alert show];
    } else {
        [self loadStartPage];
    }
}

/**
 * 加载MainVIewController 来显示首页
 */
- (void)loadStartPage
{
    if ( !_mainVC ) {
        _mainVC = [[MainViewController alloc] init];
    }
    [self presentViewController:_mainVC animated:YES completion:nil];
}
@end
