// Copyright 2021-present 650 Industries. (AKA Expo) All rights reserved.

import ABI44_0_0ExpoModulesCore

public class ExpoSystemUIModule: Module {
  
  public func definition() -> ModuleDefinition {
    name("ExpoSystemUI")
    
    onCreate {
      // TODO: Maybe read from the app manifest instead of from Info.plist.
      // Set / reset the initial color on reload and app start.
      let color = Bundle.main.object(forInfoDictionaryKey: "ABI44_0_0RCTRootViewBackgroundColor") as? Int
      Self.setBackgroundColorAsync(color: color)
    }

    function("getBackgroundColorAsync") { () -> String? in
      Self.getBackgroundColor()
    }

    function("setBackgroundColorAsync") { (color: Int) in
      Self.setBackgroundColorAsync(color: color)
    }
  }

  static func getBackgroundColor() -> String? {
    var color: String? = nil
    ABI44_0_0EXUtilities.performSynchronously {
      // Get the root view controller of the delegate window.
      if let window = UIApplication.shared.delegate?.window, let backgroundColor = window?.rootViewController?.view.backgroundColor?.cgColor {
        color = ABI44_0_0EXUtilities.hexString(with: backgroundColor)
      }
    }
    return color
  }
  
  static func setBackgroundColorAsync(color: Int?) {
    ABI44_0_0EXUtilities.performSynchronously {
      if (color == nil) {
        if let window = UIApplication.shared.delegate?.window {
          window?.backgroundColor = nil
          window?.rootViewController?.view.backgroundColor = UIColor.white
        }
        return
      }
      let backgroundColor = ABI44_0_0EXUtilities.uiColor(color)
      // Set the app-wide window, this could have future issues when running multiple ABI44_0_0React apps,
      // i.e. dev client can't use expo-system-ui.
      // Without setting the window backgroundColor, native-stack modals will show the wrong color.
      if let window = UIApplication.shared.delegate?.window {
        window?.backgroundColor = backgroundColor
        window?.rootViewController?.view.backgroundColor = backgroundColor
      }
    }
  }
}
