/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI43_0_0React/ABI43_0_0RCTBridge.h>

@protocol ABI43_0_0RCTRootViewDelegate;

/**
 * This enum is used to define size flexibility type of the root view.
 * If a dimension is flexible, the view will recalculate that dimension
 * so the content fits. Recalculations are performed when the root's frame,
 * size flexibility mode or content size changes. After a recalculation,
 * rootViewDidChangeIntrinsicSize method of the ABI43_0_0RCTRootViewDelegate will be called.
 */
typedef NS_ENUM(NSInteger, ABI43_0_0RCTRootViewSizeFlexibility) {
  ABI43_0_0RCTRootViewSizeFlexibilityNone = 0,
  ABI43_0_0RCTRootViewSizeFlexibilityWidth = 1 << 0,
  ABI43_0_0RCTRootViewSizeFlexibilityHeight = 1 << 1,
  ABI43_0_0RCTRootViewSizeFlexibilityWidthAndHeight = ABI43_0_0RCTRootViewSizeFlexibilityWidth | ABI43_0_0RCTRootViewSizeFlexibilityHeight,
};

/**
 * This notification is sent when the first subviews are added to the root view
 * after the application has loaded. This is used to hide the `loadingView`, and
 * is a good indicator that the application is ready to use.
 */
#if defined(__cplusplus)
extern "C"
#else
extern
#endif

    NS_ASSUME_NONNULL_BEGIN

        NSString *const ABI43_0_0RCTContentDidAppearNotification;

/**
 * Native view used to host ABI43_0_0React-managed views within the app. Can be used just
 * like any ordinary UIView. You can have multiple ABI43_0_0RCTRootViews on screen at
 * once, all controlled by the same JavaScript application.
 */
@interface ABI43_0_0RCTRootView : UIView

/**
 * - Designated initializer -
 */
- (instancetype)initWithBridge:(ABI43_0_0RCTBridge *)bridge
                    moduleName:(NSString *)moduleName
             initialProperties:(nullable NSDictionary *)initialProperties NS_DESIGNATED_INITIALIZER;

/**
 * - Convenience initializer -
 * A bridge will be created internally.
 * This initializer is intended to be used when the app has a single ABI43_0_0RCTRootView,
 * otherwise create an `ABI43_0_0RCTBridge` and pass it in via `initWithBridge:moduleName:`
 * to all the instances.
 */
- (instancetype)initWithBundleURL:(NSURL *)bundleURL
                       moduleName:(NSString *)moduleName
                initialProperties:(nullable NSDictionary *)initialProperties
                    launchOptions:(nullable NSDictionary *)launchOptions;

/**
 * The name of the JavaScript module to execute within the
 * specified scriptURL (required). Setting this will not have
 * any immediate effect, but it must be done prior to loading
 * the script.
 */
@property (nonatomic, copy, readonly) NSString *moduleName;

/**
 * The bridge used by the root view. Bridges can be shared between multiple
 * root views, so you can use this property to initialize another ABI43_0_0RCTRootView.
 */
@property (nonatomic, strong, readonly) ABI43_0_0RCTBridge *bridge;

/**
 * The properties to apply to the view. Use this property to update
 * application properties and rerender the view. Initialized with
 * initialProperties argument of the initializer.
 *
 * Set this property only on the main thread.
 */
@property (nonatomic, copy, readwrite, nullable) NSDictionary *appProperties;

/**
 * The size flexibility mode of the root view.
 */
@property (nonatomic, assign) ABI43_0_0RCTRootViewSizeFlexibility sizeFlexibility;

/*
 * The minimum size of the root view, defaults to CGSizeZero.
 */
@property (nonatomic, assign) CGSize minimumSize;

/**
 * The delegate that handles intrinsic size updates.
 */
@property (nonatomic, weak, nullable) id<ABI43_0_0RCTRootViewDelegate> delegate;

/**
 * The backing view controller of the root view.
 */
@property (nonatomic, weak, nullable) UIViewController *ABI43_0_0ReactViewController;

/**
 * The ABI43_0_0React-managed contents view of the root view.
 */
@property (nonatomic, strong, readonly) UIView *contentView;

/**
 * A view to display while the JavaScript is loading, so users aren't presented
 * with a blank screen. By default this is nil, but you can override it with
 * (for example) a UIActivityIndicatorView or a placeholder image.
 */
@property (nonatomic, strong, nullable) UIView *loadingView;

/**
 * When set, any touches on the ABI43_0_0RCTRootView that are not matched up to any of the child
 * views will be passed to siblings of the ABI43_0_0RCTRootView. See -[UIView hitTest:withEvent:]
 * for details on iOS hit testing.
 *
 * Enable this to support a semi-transparent ABI43_0_0RN view that occupies the whole screen but
 * has visible content below it that the user can interact with.
 *
 * The default value is NO.
 */
@property (nonatomic, assign) BOOL passThroughTouches;

/**
 * Timings for hiding the loading view after the content has loaded. Both of
 * these values default to 0.25 seconds.
 */
@property (nonatomic, assign) NSTimeInterval loadingViewFadeDelay;
@property (nonatomic, assign) NSTimeInterval loadingViewFadeDuration;

@end

@interface ABI43_0_0RCTRootView (Deprecated)

/**
 * The intrinsic size of the root view's content. This is set right before the
 * `rootViewDidChangeIntrinsicSize` method of `ABI43_0_0RCTRootViewDelegate` is called.
 * This property is deprecated and will be removed in next releases.
 * Use UIKit `intrinsicContentSize` property instead.
 */
@property (readonly, nonatomic, assign) CGSize intrinsicSize __deprecated_msg("Use `intrinsicContentSize` instead.");

/**
 * This methods is deprecated and will be removed soon.
 * To interrupt a ABI43_0_0React Native gesture recognizer, use the standard
 * `UIGestureRecognizer` negotiation process.
 * See `UIGestureRecognizerDelegate` for more details.
 */
- (void)cancelTouches;

@end

NS_ASSUME_NONNULL_END
