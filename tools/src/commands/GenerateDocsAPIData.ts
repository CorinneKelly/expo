import { Command } from '@expo/commander';
import chalk from 'chalk';
import { PromisyClass, TaskQueue } from 'cwait';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import recursiveOmitBy from 'recursive-omit-by';
import { Application, TSConfigReader, TypeDocReader } from 'typedoc';

import { EXPO_DIR, PACKAGES_DIR } from '../Constants';
import logger from '../Logger';

type ActionOptions = {
  packageName?: string;
  version?: string;
};

type EntryPoint = string | string[];

type CommandAdditionalParams = [entryPoint: EntryPoint, packageName?: string];

const MINIFY_JSON = true;

const PACKAGES_MAPPING: Record<string, CommandAdditionalParams> = {
  'expo-analytics-amplitude': ['Amplitude.ts'],
  'expo-analytics-segment': ['Segment.ts'],
  'expo-app-loading': ['index.ts'],
  'expo-apple-authentication': ['index.ts'],
  'expo-application': ['Application.ts'],
  'expo-auth-session': ['AuthSession.ts'],
  'expo-asset': [['Asset.ts', 'AssetHooks.ts']],
  'expo-background-fetch': ['BackgroundFetch.ts'],
  'expo-battery': ['Battery.ts'],
  'expo-barcode-scanner': ['BarCodeScanner.tsx'],
  'expo-blur': ['index.ts'],
  'expo-brightness': ['Brightness.ts'],
  'expo-build-properties': [['withBuildProperties.ts', 'pluginConfig.ts']],
  'expo-calendar': ['Calendar.ts'],
  'expo-camera': ['index.ts'],
  'expo-cellular': ['Cellular.ts'],
  'expo-checkbox': ['Checkbox.ts'],
  'expo-clipboard': [['Clipboard.ts', 'Clipboard.types.ts']],
  'expo-constants': [['Constants.ts', 'Constants.types.ts']],
  'expo-crypto': ['Crypto.ts'],
  'expo-document-picker': ['index.ts'],
  'expo-error-recovery': ['ErrorRecovery.ts'],
  'expo-face-detector': ['FaceDetector.ts'],
  'expo-firebase-analytics': ['Analytics.ts'],
  'expo-firebase-core': ['FirebaseCore.ts'],
  'expo-facebook': [['Facebook.ts', 'Facebook.types.ts']],
  'expo-font': ['index.ts'],
  'expo-haptics': ['Haptics.ts'],
  'expo-image-manipulator': ['ImageManipulator.ts'],
  'expo-image-picker': ['ImagePicker.ts'],
  'expo-in-app-purchases': ['InAppPurchases.ts'],
  'expo-intent-launcher': ['IntentLauncher.ts'],
  'expo-keep-awake': ['index.ts'],
  'expo-linking': ['Linking.ts'],
  'expo-linear-gradient': ['LinearGradient.tsx'],
  'expo-local-authentication': ['LocalAuthentication.ts'],
  'expo-localization': ['Localization.ts'],
  'expo-location': ['Location.ts'],
  'expo-mail-composer': ['MailComposer.ts'],
  'expo-media-library': ['MediaLibrary.ts'],
  'expo-navigation-bar': ['NavigationBar.ts'],
  'expo-network': ['Network.ts'],
  'expo-pedometer': ['Pedometer.ts', 'expo-sensors'],
  'expo-print': ['Print.ts'],
  'expo-random': ['Random.ts'],
  'expo-screen-capture': ['ScreenCapture.ts'],
  'expo-screen-orientation': ['ScreenOrientation.ts'],
  'expo-secure-store': ['SecureStore.ts'],
  'expo-sharing': ['Sharing.ts'],
  'expo-sms': ['SMS.ts'],
  'expo-speech': ['Speech/Speech.ts'],
  'expo-splash-screen': ['SplashScreen.ts'],
  'expo-sqlite': ['index.ts'],
  'expo-status-bar': ['StatusBar.ts'],
  'expo-store-review': ['StoreReview.ts'],
  'expo-system-ui': ['SystemUI.ts'],
  'expo-task-manager': ['TaskManager.ts'],
  'expo-tracking-transparency': ['TrackingTransparency.ts'],
  'expo-updates': ['index.ts'],
  'expo-video': [['Video.tsx', 'Video.types.ts'], 'expo-av'],
  'expo-video-thumbnails': ['VideoThumbnails.ts'],
  'expo-web-browser': ['WebBrowser.ts'],
};

const executeCommand = async (
  jsonFileName: string,
  version: string,
  entryPoint: EntryPoint = 'index.ts',
  packageName: string = jsonFileName
) => {
  const app = new Application();

  app.options.addReader(new TSConfigReader());
  app.options.addReader(new TypeDocReader());

  const dataPath = path.join(EXPO_DIR, 'docs', 'public', 'static', 'data', version);
  const basePath = path.join(PACKAGES_DIR, packageName);
  const entriesPath = path.join(basePath, 'src');
  const tsConfigPath = path.join(basePath, 'tsconfig.json');
  const jsonOutputPath = path.join(dataPath, `${jsonFileName}.json`);

  const entryPoints = Array.isArray(entryPoint)
    ? entryPoint.map((entry) => path.join(entriesPath, entry))
    : [path.join(entriesPath, entryPoint)];

  app.bootstrap({
    entryPoints,
    tsconfig: tsConfigPath,
    disableSources: true,
    hideGenerator: true,
    excludePrivate: true,
    excludeProtected: true,
  });

  const project = app.convert();

  if (project) {
    await app.generateJson(project, jsonOutputPath);
    const output = await fs.readJson(jsonOutputPath);
    output.name = jsonFileName;

    if (Array.isArray(entryPoint)) {
      const filterEntries = entryPoint.map((entry) => entry.substring(0, entry.lastIndexOf('.')));
      output.children = output.children
        .filter((entry) => filterEntries.includes(entry.name))
        .map((entry) => entry.children)
        .flat()
        .sort((a, b) => a.name.localeCompare(b.name));
    }

    if (MINIFY_JSON) {
      const minifiedJson = recursiveOmitBy(
        output,
        ({ key, node }) =>
          ['id', 'groups', 'target'].includes(key) || (key === 'flags' && !Object.keys(node).length)
      );
      await fs.writeFile(jsonOutputPath, JSON.stringify(minifiedJson, null, 0));
    } else {
      await fs.writeFile(jsonOutputPath, JSON.stringify(output));
    }
  } else {
    throw new Error(`💥 Failed to extract API data from source code for '${packageName}' package.`);
  }
};

async function action({ packageName, version = 'unversioned' }: ActionOptions) {
  const taskQueue = new TaskQueue(Promise as PromisyClass, os.cpus().length);

  try {
    if (packageName) {
      const packagesEntries = Object.entries(PACKAGES_MAPPING)
        .filter(([key, value]) => key === packageName || value.includes(packageName))
        .map(([key, value]) => taskQueue.add(() => executeCommand(key, version, ...value)));
      if (packagesEntries.length) {
        await Promise.all(packagesEntries);
        logger.log(
          chalk.green(`\n🎉 Successful extraction of docs API data for the selected package!`)
        );
      } else {
        logger.warn(`🚨 Package '${packageName}' API data generation is not supported yet!`);
      }
    } else {
      const packagesEntries = Object.entries(PACKAGES_MAPPING).map(([key, value]) =>
        taskQueue.add(() => executeCommand(key, version, ...value))
      );
      await Promise.all(packagesEntries);
      logger.log(
        chalk.green(`\n🎉 Successful extraction of docs API data for all available packages!`)
      );
    }
  } catch (error) {
    logger.error(error);
  }
}

export default (program: Command) => {
  program
    .command('generate-docs-api-data')
    .alias('gdad')
    .description(`Extract API data JSON files for docs using TypeDoc.`)
    .option('-p, --packageName <packageName>', 'Extract API data only for the specific package.')
    .option(
      '-v, --version <version>',
      'Set the data output path to the specific version.',
      'unversioned'
    )
    .asyncAction(action);
};
