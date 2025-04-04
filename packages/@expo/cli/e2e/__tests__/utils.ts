/* eslint-env jest */
import { ExpoConfig, getConfig, PackageJSONConfig } from '@expo/config';
import JsonFile from '@expo/json-file';
import { SpawnOptions, SpawnResult } from '@expo/spawn-async';
import execa from 'execa';
import fs from 'fs';
import os from 'os';
import path from 'path';

import { copySync } from '../../src/utils/dir';

export const bin = require.resolve('../../build/bin/cli');

export const projectRoot = getTemporaryPath();

export function getTemporaryPath() {
  return path.join(os.tmpdir(), Math.random().toString(36).substring(2));
}

export function execute(...args) {
  return execa('node', [bin, ...args], { cwd: projectRoot });
}

export function getRoot(...args) {
  return path.join(projectRoot, ...args);
}

export async function abortingSpawnAsync(
  cmd: string,
  args: string[],
  options?: SpawnOptions
): Promise<SpawnResult> {
  const spawnAsync = jest.requireActual(
    '@expo/spawn-async'
  ) as typeof import('@expo/spawn-async').default;

  const promise = spawnAsync(cmd, args, options);
  promise.child.stdout.pipe(process.stdout);
  promise.child.stderr.pipe(process.stderr);

  // TODO: Not sure how to do this yet...
  // const unsub = addJestInterruptedListener(() => {
  //   promise.child.kill('SIGINT');
  // });
  try {
    return await promise;
  } catch (error) {
    if (isSpawnResult(error)) {
      if (error.stdout) error.message += `\n------\nSTDOUT:\n${error.stdout}`;
      if (error.stderr) error.message += `\n------\nSTDERR:\n${error.stderr}`;
    }
    throw error;
  } finally {
    // unsub();
  }
}

function isSpawnResult(errorOrResult: Error): errorOrResult is Error & SpawnResult {
  return 'pid' in errorOrResult && 'stdout' in errorOrResult && 'stderr' in errorOrResult;
}

export async function installAsync(projectRoot: string, pkgs: string[] = []) {
  return abortingSpawnAsync('yarn', pkgs, {
    cwd: projectRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

/**
 * @param parentDir Directory to create the project folder in, i.e. os temp directory
 * @param props.dirName Name of the project folder, used to prevent recreating the project locally
 * @param props.reuseExisting Should reuse the existing project if possible, good for testing locally
 * @param props.fixtureName Name of the fixture folder to use, this must map to the directories in the `expo/e2e/fixtures/` folder
 * @param props.config Optional extra values to add inside the app.json `expo` object
 * @param props.pkg Optional extra values to add to the fixture package.json file before installing
 * @returns The project root that can be tested inside of
 */
export async function createFromFixtureAsync(
  parentDir: string,
  {
    dirName,
    reuseExisting,
    fixtureName,
    config,
    pkg,
  }: {
    dirName: string;
    reuseExisting?: boolean;
    fixtureName: string;
    config?: Partial<ExpoConfig>;
    pkg?: Partial<PackageJSONConfig>;
  }
): Promise<string> {
  const projectRoot = path.join(parentDir, dirName);

  if (fs.existsSync(projectRoot)) {
    if (reuseExisting) {
      console.log('[setup] Reusing existing fixture project:', projectRoot);
      // bail out early, this is good for local testing.
      return projectRoot;
    } else {
      console.log('[setup] Clearing existing fixture project:', projectRoot);
      await fs.promises.rm(projectRoot, { recursive: true, force: true });
    }
  }

  try {
    const fixturePath = path.join(__dirname, '../fixtures', fixtureName);

    if (!fs.existsSync(fixturePath)) {
      throw new Error('No fixture project named: ' + fixtureName);
    }

    // Create the project root
    fs.mkdirSync(projectRoot, { recursive: true });
    console.log('[setup] Created fixture project:', projectRoot);

    // Copy all files recursively into the temporary directory
    await copySync(fixturePath, projectRoot);

    // Add additional modifications to the package.json
    if (pkg) {
      const pkgPath = path.join(projectRoot, 'package.json');
      const fixturePkg = (await JsonFile.readAsync(pkgPath)) as PackageJSONConfig;

      await JsonFile.writeAsync(pkgPath, {
        ...pkg,
        ...fixturePkg,
        dependencies: {
          ...(fixturePkg.dependencies || {}),
          ...(pkg.dependencies || {}),
        },
        devDependencies: {
          ...(fixturePkg.devDependencies || {}),
          ...(pkg.devDependencies || {}),
        },
        scripts: {
          ...(fixturePkg.scripts || {}),
          ...(pkg.scripts || {}),
        },
      });
    }

    // Add additional modifications to the Expo config
    if (config) {
      const { rootConfig, staticConfigPath } = getConfig(projectRoot, {
        // pkgs not installed yet
        skipSDKVersionRequirement: true,
        skipPlugins: true,
      });

      const modifiedConfig = {
        ...rootConfig,
        expo: {
          ...(rootConfig.expo || {}),
          ...config,
        },
      };
      await JsonFile.writeAsync(staticConfigPath, modifiedConfig as any);
    }

    // Install the packages for e2e experience.
    await installAsync(projectRoot);
  } catch (error) {
    // clean up if something failed.
    // await fs.remove(projectRoot).catch(() => null);
    throw error;
  }

  return projectRoot;
}

// Set this to true to enable caching and prevent rerunning yarn installs
const testingLocally = !process.env.CI;

export async function setupTestProjectAsync(name: string, fixtureName: string): Promise<string> {
  // If you're testing this locally, you can set the projectRoot to a local project (you created with expo init) to save time.
  const projectRoot = await createFromFixtureAsync(os.tmpdir(), {
    dirName: name,
    reuseExisting: testingLocally,
    fixtureName,
  });

  // Many of the factors in this test are based on the expected SDK version that we're testing against.
  const { exp } = getConfig(projectRoot, { skipPlugins: true });
  expect(exp.sdkVersion).toBe('44.0.0');
  return projectRoot;
}

/** Returns a list of loaded modules relative to the repo root. Useful for preventing lazy loading from breaking unexpectedly.   */
export async function getLoadedModulesAsync(statement: string): Promise<string[]> {
  const repoRoot = path.join(__dirname, '../../../../');
  const results = await execa(
    'node',
    [
      '-e',
      [statement, `console.log(JSON.stringify(Object.keys(require('module')._cache)));`].join('\n'),
    ],
    { cwd: __dirname }
  );
  const loadedModules = JSON.parse(results.stdout.trim());
  return loadedModules.map((value) => path.relative(repoRoot, value)).sort();
}
