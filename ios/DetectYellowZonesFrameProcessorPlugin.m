#import <Foundation/Foundation.h>
#import <CoreMedia/CoreMedia.h>
#import <CoreVideo/CoreVideo.h>
#import <math.h>

#import <VisionCamera/FrameProcessorPlugin.h>
#import <VisionCamera/FrameProcessorPluginRegistry.h>
#import <VisionCamera/Frame.h>

static inline CGFloat clampCGFloat(CGFloat value, CGFloat minValue, CGFloat maxValue) {
  return MAX(minValue, MIN(maxValue, value));
}

static inline CGRect zonePercentToRect(
  CGFloat zoneX,
  CGFloat zoneY,
  CGFloat zoneRx,
  CGFloat zoneRy,
  size_t width,
  size_t height
) {
  // Camera buffer is rotated 90° clockwise vs screen
  // Screen x% → buffer y%
  // Screen y% → buffer (100 - x)%
  CGFloat bufferX = zoneY;
  CGFloat bufferY = (100.0 - zoneX);
  CGFloat bufferRx = zoneRy;
  CGFloat bufferRy = zoneRx;

  CGFloat left = ((bufferX - bufferRx) / 100.0) * (CGFloat)width;
  CGFloat top = ((bufferY - bufferRy) / 100.0) * (CGFloat)height;
  CGFloat rectWidth = ((bufferRx * 2.0) / 100.0) * (CGFloat)width;
  CGFloat rectHeight = ((bufferRy * 2.0) / 100.0) * (CGFloat)height;

  left = clampCGFloat(left, 0, (CGFloat)width);
  top = clampCGFloat(top, 0, (CGFloat)height);
  rectWidth = clampCGFloat(rectWidth, 0, (CGFloat)width - left);
  rectHeight = clampCGFloat(rectHeight, 0, (CGFloat)height - top);

  return CGRectMake(left, top, rectWidth, rectHeight);
}

//static inline CGRect zonePercentToRect(
  //CGFloat zoneX,
  //CGFloat zoneY,
  //CGFloat zoneRx,
  //CGFloat zoneRy,
  //size_t width,
  //size_t height
                                       
//) {
  //CGFloat left = ((zoneX - zoneRx) / 100.0) * (CGFloat)width;
  //CGFloat top = ((zoneY - zoneRy) / 100.0) * (CGFloat)height;
  //CGFloat rectWidth = ((zoneRx * 2.0) / 100.0) * (CGFloat)width;
  //CGFloat rectHeight = ((zoneRy * 2.0) / 100.0) * (CGFloat)height;

  //left = clampCGFloat(left, 0, (CGFloat)width);
  //top = clampCGFloat(top, 0, (CGFloat)height);
  //rectWidth = clampCGFloat(rectWidth, 0, (CGFloat)width - left);
  //rectHeight = clampCGFloat(rectHeight, 0, (CGFloat)height - top);

  //return CGRectMake(left, top, rectWidth, rectHeight);
//}

static inline BOOL pointInRect(CGFloat x, CGFloat y, CGRect rect) {
  return x >= CGRectGetMinX(rect) &&
         x <= CGRectGetMaxX(rect) &&
         y >= CGRectGetMinY(rect) &&
         y <= CGRectGetMaxY(rect);
}

// Hue output scale: 0..180
static inline void rgbToHsv180(
  uint8_t r,
  uint8_t g,
  uint8_t b,
  CGFloat* hOut,
  CGFloat* sOut,
  CGFloat* vOut
) {
  CGFloat rf = r / 255.0;
  CGFloat gf = g / 255.0;
  CGFloat bf = b / 255.0;

  CGFloat maxVal = MAX(rf, MAX(gf, bf));
  CGFloat minVal = MIN(rf, MIN(gf, bf));
  CGFloat delta = maxVal - minVal;

  CGFloat h = 0.0;
  if (delta > 0.00001) {
    if (maxVal == rf) {
      h = 60.0 * fmod(((gf - bf) / delta), 6.0);
    } else if (maxVal == gf) {
      h = 60.0 * (((bf - rf) / delta) + 2.0);
    } else {
      h = 60.0 * (((rf - gf) / delta) + 4.0);
    }
  }

  if (h < 0.0) {
    h += 360.0;
  }

  CGFloat s = (maxVal <= 0.00001) ? 0.0 : (delta / maxVal);
  CGFloat v = maxVal;

  *hOut = h / 2.0;     // 0..180
  *sOut = s * 255.0;   // 0..255
  *vOut = v * 255.0;   // 0..255
}

static BOOL detectYellowInRect(
  CVPixelBufferRef pixelBuffer,
  CGRect rect,
  CGFloat hMin,
  CGFloat hMax,
  CGFloat sMin,
  CGFloat sMax,
  CGFloat vMin,
  CGFloat vMax,
  double* confidenceOut
) {
  uint8_t* yPlane = (uint8_t*)CVPixelBufferGetBaseAddressOfPlane(pixelBuffer, 0);
  uint8_t* uvPlane = (uint8_t*)CVPixelBufferGetBaseAddressOfPlane(pixelBuffer, 1);

  if (yPlane == NULL || uvPlane == NULL) {
    *confidenceOut = 0.0;
    return NO;
  }

  size_t yBytesPerRow = CVPixelBufferGetBytesPerRowOfPlane(pixelBuffer, 0);
  size_t uvBytesPerRow = CVPixelBufferGetBytesPerRowOfPlane(pixelBuffer, 1);

  const int step = 2;
  NSUInteger matchCount = 0;
  NSUInteger sampleCount = 0;

  size_t startX = (size_t)CGRectGetMinX(rect);
  size_t endX = (size_t)CGRectGetMaxX(rect);
  size_t startY = (size_t)CGRectGetMinY(rect);
  size_t endY = (size_t)CGRectGetMaxY(rect);

  for (size_t y = startY; y < endY; y += step) {
    for (size_t x = startX; x < endX; x += step) {
      uint8_t Y = yPlane[y * yBytesPerRow + x];

      size_t uvIndex = (y / 2) * uvBytesPerRow + (x / 2) * 2;
      uint8_t U = uvPlane[uvIndex];
      uint8_t V = uvPlane[uvIndex + 1];

      float yf = (float)Y;
      float uf = (float)U - 128.0f;
      float vf = (float)V - 128.0f;

      int r = (int)(yf + 1.402f * vf);
      int g = (int)(yf - 0.344f * uf - 0.714f * vf);
      int b = (int)(yf + 1.772f * uf);

      r = r < 0 ? 0 : (r > 255 ? 255 : r);
      g = g < 0 ? 0 : (g > 255 ? 255 : g);
      b = b < 0 ? 0 : (b > 255 ? 255 : b);

      CGFloat h, s, v;
      rgbToHsv180((uint8_t)r, (uint8_t)g, (uint8_t)b, &h, &s, &v);

      BOOL isMatch =
        h >= hMin && h <= hMax &&
        s >= sMin && s <= sMax &&
        v >= vMin && v <= vMax;

      if (isMatch) {
        matchCount++;
      }

      sampleCount++;
    }
  }

  *confidenceOut = (double)matchCount;

  return matchCount >= 12;
}



@interface DetectYellowZonesFrameProcessorPlugin : FrameProcessorPlugin {
  BOOL _hasLastCenter;
  CGFloat _lastCenterX;
  CGFloat _lastCenterY;
}
@end

@implementation DetectYellowZonesFrameProcessorPlugin

- (instancetype)initWithProxy:(VisionCameraProxyHolder*)proxy
                  withOptions:(NSDictionary* _Nullable)options {
  self = [super initWithProxy:proxy withOptions:options];
  if (self) {
    _hasLastCenter = NO;
    _lastCenterX = 0;
    _lastCenterY = 0;
  }
  return self;
}

- (id)callback:(Frame*)frame withArguments:(NSDictionary* _Nullable)arguments {
  if (arguments == nil) {
    return @{
      @"startPresent": @NO,
      @"finishPresent": @NO,
      @"moving": @NO,
      @"confidence": @0
    };
  }

  NSNumber* startX = arguments[@"startX"];
  NSNumber* startY = arguments[@"startY"];
  NSNumber* startRx = arguments[@"startRx"];
  NSNumber* startRy = arguments[@"startRy"];

  NSNumber* finishX = arguments[@"finishX"];
  NSNumber* finishY = arguments[@"finishY"];
  NSNumber* finishRx = arguments[@"finishRx"];
  NSNumber* finishRy = arguments[@"finishRy"];

  NSNumber* hMin = arguments[@"hMin"];
  NSNumber* hMax = arguments[@"hMax"];
  NSNumber* sMin = arguments[@"sMin"];
  NSNumber* sMax = arguments[@"sMax"];
  NSNumber* vMin = arguments[@"vMin"];
  NSNumber* vMax = arguments[@"vMax"];

  if (
    startX == nil || startY == nil || startRx == nil || startRy == nil ||
    finishX == nil || finishY == nil || finishRx == nil || finishRy == nil ||
    hMin == nil || hMax == nil || sMin == nil || sMax == nil || vMin == nil || vMax == nil
  ) {
    return @{
      @"startPresent": @NO,
      @"finishPresent": @NO,
      @"moving": @NO,
      @"confidence": @0
    };
  }

  CMSampleBufferRef sampleBuffer = frame.buffer;
  CVPixelBufferRef pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer);
  if (pixelBuffer == NULL) {
    return @{
      @"startPresent": @NO,
      @"finishPresent": @NO,
      @"moving": @NO,
      @"confidence": @0
    };
  }
  OSType format = CVPixelBufferGetPixelFormatType(pixelBuffer);

  CVPixelBufferLockBaseAddress(pixelBuffer, kCVPixelBufferLock_ReadOnly);

  size_t width = CVPixelBufferGetWidth(pixelBuffer);
  size_t height = CVPixelBufferGetHeight(pixelBuffer);

  CGRect startRect = zonePercentToRect(
    (CGFloat)[startX doubleValue],
    (CGFloat)[startY doubleValue],
    (CGFloat)[startRx doubleValue],
    (CGFloat)[startRy doubleValue],
    width,
    height
  );

  CGRect finishRect = zonePercentToRect(
    (CGFloat)[finishX doubleValue],
    (CGFloat)[finishY doubleValue],
    (CGFloat)[finishRx doubleValue],
    (CGFloat)[finishRy doubleValue],
    width,
    height
  );
  
  double startConfidence = 0.0;
  double finishConfidence = 0.0;

  BOOL startPresent = detectYellowInRect(
    pixelBuffer,
    startRect,
    (CGFloat)[hMin doubleValue],
    (CGFloat)[hMax doubleValue],
    (CGFloat)[sMin doubleValue],
    (CGFloat)[sMax doubleValue],
    (CGFloat)[vMin doubleValue],
    (CGFloat)[vMax doubleValue],
    &startConfidence
  );

  BOOL finishPresent = detectYellowInRect(
    pixelBuffer,
    finishRect,
    (CGFloat)[hMin doubleValue],
    (CGFloat)[hMax doubleValue],
    (CGFloat)[sMin doubleValue],
    (CGFloat)[sMax doubleValue],
    (CGFloat)[vMin doubleValue],
    (CGFloat)[vMax doubleValue],
    &finishConfidence
  );

  BOOL moving = NO;
  double confidence = fmax(startConfidence, finishConfidence);

  
  CVPixelBufferUnlockBaseAddress(pixelBuffer, kCVPixelBufferLock_ReadOnly);

  return @{
    @"startPresent": @(startPresent),
    @"finishPresent": @(finishPresent),
    @"moving": @(moving),
    @"confidence": @(confidence),
    @"pixelFormat": @((unsigned int)format)
  };
}

@end

@interface DetectYellowZonesFrameProcessorPluginLoader : NSObject
@end

@implementation DetectYellowZonesFrameProcessorPluginLoader

+ (void)load {
  [FrameProcessorPluginRegistry addFrameProcessorPlugin:@"detectYellowZones"
                                        withInitializer:^FrameProcessorPlugin* _Nullable(VisionCameraProxyHolder* proxy, NSDictionary* _Nullable options) {
    return [[DetectYellowZonesFrameProcessorPlugin alloc] initWithProxy:proxy
                                                            withOptions:options];
  }];
}

@end
