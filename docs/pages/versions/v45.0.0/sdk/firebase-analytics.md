---
title: FirebaseAnalytics
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-45/packages/expo-firebase-analytics'
packageName: 'expo-firebase-analytics'
---

import APISection from '~/components/plugins/APISection';
import {APIInstallSection} from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';

import { InlineCode } from '~/components/base/code';

> **This is the only Firebase Analytics package for React Native that has universal platform support (iOS, Android, Web, and Electron).**

**`expo-firebase-analytics`** enables the use of native Google Analytics for Firebase. Google Analytics for Firebase is a free app measurement solution that provides insight on app usage and user engagement.
Learn more in the official [Firebase Docs](https://firebase.google.com/docs/analytics/).

<PlatformsSection android emulator ios simulator web />

## Installation

<APIInstallSection />

When using the web-platform, you'll also need to run `expo install firebase`, which install the Firebase JS SDK.

## Configuration

To use this package, the native Firebase configurations need to be added to your app.
[Please follow this guide on how to set up native Firebase.](/guides/setup-native-firebase)

## Expo Go: Limitations & configuration

The use of Native Firebase Analytics requires that the google-services configuration is bundled and linked into your app. Since Expo Go loads projects on demand, it does not have the google-services configuration linked into its app-bundle.

Instead, Expo Go relies on a JavaScript-based implementation of Firebase Analytics to log events. This means that certain native life-cycle events are not recorded in the standard client, but you can still use `logEvent` to record events.

You may want to use Firebase Analytics in Expo Go to verify that you are logging events at the time you intend to and with the data that you want to attach without having to do a standalone app build. To set this up, ensure that the Firebase web configuration is set in **app.json** and that `measurementId` exists in your firebase config. If `measurementId` doesn't exist, then you need to enable or update Google Analytics in your Firebase project.

**app.json**

```json
{
  "expo": {
    "web": {
      "config": {
        "firebase": {
          "apiKey": "AIzaXXXXXXXX-xxxxxxxxxxxxxxxxxxx",
          ...
          "measurementId": "G-XXXXXXXXX"
        }
      }
    }
  }
}
```

> This limitation only applies to the Expo Go app in the App and Play stores; standalone builds, custom clients & bare apps support the full native Firebase Analytics experience.

## Optional: Enable AdSupport in Bare Workflow

To get extra features like `audiences`, `campaign attribution`, and some `user properties`, such as `Age` and `Interests`, you will need to include AdSupport. This is currently only possible in the Bare Workflow and not enabled by default because Apple & Google are strict with allowing apps to use this library.

To enable the AdSupport framework:

- In your Xcode project, select your project's target
- Select the General tab for your target
- Expand the Linked Frameworks and Libraries section
- Click `+` to add a framework
- Select `AdSupport.framework`

[Learn more in the Firebase Docs](https://firebase.google.com/support/guides/analytics-adsupport)

# Examples

## How do people use my app?

You can gain deeper insight into what works and what doesn't by using the `logEvent` property. Also it's just a lot of fun to see that people actually use the features you work hard on! 😍

```ts
/*
 * Say we are in a tinder clone, and a user presses the card to view more
 * information on a user. We should track this event so we can see if people
 * are even using it.
 *
 * If lots of users are opening the card then swiping through photos, just
 * to dismiss again, then we should consider making it possible to look
 * through photos without having to enter the profile.
 */
onPressProfileButton = uid => {
  Analytics.logEvent('ExpandProfile', {
    /*
     * We want to know if the user came from from the swipe card as
     * opposed to from chat or a deep link.
     */
    sender: 'card',
    /*
     * This may be too specific and not very useful, but maybe down the line * we could investigate why a certain user is more popular than others.
     */
    user: uid,
    /*
     * We can use this information later to compare against other events.
     */
    screen: 'profile',
    purpose: 'Viewing more info on a user',
  });
};
```

## React Navigation

You can track the screens your users are interacting with by integrating the best navigation library: `react-navigation`

[Read more about how this works](https://reactnavigation.org/docs/en/screen-tracking.html)

```js
import React from 'react';
// Import Navigation
import { createBottomTabNavigator } from 'react-navigation';
// Import Firebase
import * as Analytics from 'expo-firebase-analytics';
// Import some screens
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
// Create a generic Navigator
const AppNavigator = createBottomTabNavigator({
  // The name `Profile` or `Home` are what will appear in Firebase Analytics.
  Profile: ProfileScreen,
  Home: HomeScreen,
});
// Get the current screen from the navigation state
function getActiveRouteName(navigationState) {
  if (!navigationState) return null;
  const route = navigationState.routes[navigationState.index];
  // Parse the nested navigators
  if (route.routes) return getActiveRouteName(route);
  return route.routeName;
}

export default () => (
  <AppNavigator
    onNavigationStateChange={(prevState, currentState) => {
      const currentScreen = getActiveRouteName(currentState);
      const prevScreen = getActiveRouteName(prevState);
      if (prevScreen !== currentScreen) {
        // Update Firebase with the name of your screen
        Analytics.logEvent('screen view', { currentScreen });
      }
    }}
  />
);
```

## API

```js
import * as Analytics from 'expo-firebase-analytics';
```

To use web analytics, you'll also need to install the peer dependency **firebase** with `expo install firebase`.

<APISection packageName="expo-firebase-analytics" apiName="Analytics" />
