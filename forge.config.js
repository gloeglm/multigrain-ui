const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  packagerConfig: {
    asar: {
      unpack: '**/@ffmpeg-installer/**/*',
    },
    icon: './assets/icons/icons/icon', // Electron will auto-select .ico, .icns, or .png
    executableName: 'multigrain-sample-manager',
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'multigrain-sample-manager',
        setupIcon: './assets/icons/icons/icon.ico',
      },
    },
    {
      name: '@electron-forge/maker-dmg',
      config: {
        name: 'Multigrain Sample Manager',
        format: 'ULFO',
        additionalDMGOptions: {
          window: {
            size: {
              width: 660,
              height: 400,
            },
          },
        },
        icon: './assets/icons/icons/icon.icns',
        contents: (opts) => [
          {
            x: 180,
            y: 170,
            type: 'file',
            path: opts.appPath,
          },
          {
            x: 480,
            y: 170,
            type: 'link',
            path: '/Applications',
          },
          {
            x: 330,
            y: 340,
            type: 'file',
            path: './MACOS_INSTALL.md',
            name: 'INSTALLATION INSTRUCTIONS.md',
          },
        ],
      },
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          name: 'multigrain-sample-manager',
          bin: 'multigrain-sample-manager',
          productName: 'Multigrain Sample Manager',
        },
      },
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {
        options: {
          name: 'multigrain-sample-manager',
          bin: 'multigrain-sample-manager',
          productName: 'Multigrain Sample Manager',
        },
      },
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    {
      name: '@electron-forge/plugin-webpack',
      config: {
        mainConfig: './webpack.main.config.js',
        renderer: {
          config: './webpack.renderer.config.js',
          entryPoints: [
            {
              html: './src/renderer/index.html',
              js: './src/renderer/index.tsx',
              name: 'main_window',
              preload: {
                js: './src/main/preload.ts',
              },
            },
          ],
        },
      },
    },
    {
      name: '@timfish/forge-externals-plugin',
      config: {
        externals: ['@ffmpeg-installer/ffmpeg'],
        includeDeps: true,
      },
    },
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'gloeglm',
          name: 'multigrain-ui'
        },
        prerelease: true,
        draft: true
      }
    }
  ]
};
