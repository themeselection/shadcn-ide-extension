import * as fs from 'node:fs';
import * as vscode from 'vscode';
import {
  getItemsBySection,
  getSections,
  type Item,
} from './utils/section-utils';

interface LicenseData {
  email: string;
  licenseKey: string;
}

export class ShadcnBlocksProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'shadcn.blocksView';

  private _view?: vscode.WebviewView;
  private static readonly LICENSE_KEY = 'shadcn.licenseData';

  private _licenseValidationCache: {
    isValid: boolean;
    timestamp: number;
    email: string;
    licenseKey: string;
  } | null = null;

  private readonly VALIDATION_CACHE_DURATION = 3600000; // 1 hour

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // Listen for messages from the webview
    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case 'refresh':
          this._refreshData();
          break;
        case 'fetchSectionsData':
          await this._fetchSectionsData();
          break;
        case 'openSectionDetails':
          await this._fetchSectionDetails(data.id, data.name);
          break;
        case 'copyToClipboard':
          await this._copyInstallationCommand(data.text, data.cliVersion);
          vscode.window.showInformationMessage('📋 Copied to clipboard!');
          break;
        case 'openExternalUrl':
          vscode.env.openExternal(vscode.Uri.parse(data.url));
          break;
        case 'getLicenseData':
          await this._sendLicenseData();
          break;
        case 'saveLicenseData':
          await this._saveLicenseData(data.data);
          break;
        case 'openTerminalandInstall':
          await this._openTerminalandInstall(data.command, data.cliVersion);
          break;
        case 'fetchThemesData':
          await this._fetchThemesData();
          break;
      }
    });
  }

  private async _isLicenseValid(
    email: string,
    licenseKey: string,
  ): Promise<boolean> {
    // Check cache first
    if (
      this._licenseValidationCache &&
      this._licenseValidationCache.email === email &&
      this._licenseValidationCache.licenseKey === licenseKey &&
      Date.now() - this._licenseValidationCache.timestamp <
        this.VALIDATION_CACHE_DURATION
    ) {
      return this._licenseValidationCache.isValid;
    }

    // Validate with server
    const isValid = await this._validateLicenseData(email, licenseKey);

    // Update cache
    this._licenseValidationCache = {
      isValid,
      timestamp: Date.now(),
      email,
      licenseKey,
    };

    return isValid;
  }

  private _getUserConfig = () => {
    const email = vscode.workspace
      .getConfiguration('shadcn')
      .get<string>('licenseEmail', '');
    const licenseKey = vscode.workspace
      .getConfiguration('shadcn')
      .get<string>('licenseKey', '');

    return { email, licenseKey };
  };

  private async _sendLicenseData() {
    const licenseData: LicenseData = this._getUserConfig();

    if (this._view) {
      this._view.webview.postMessage({
        type: 'licenseDataReceived',
        data: licenseData,
      });
    }
  }

  private async _saveLicenseData(data: LicenseData) {
    try {
      const config = vscode.workspace.getConfiguration('shadcn');

      const isLicenseValid = await this._validateLicenseData(
        data.email,
        data.licenseKey,
      );

      console.log('License validation result:', isLicenseValid);

      if (isLicenseValid) {
        await config.update(
          'licenseEmail',
          data.email,
          vscode.ConfigurationTarget.Global,
        );

        await config.update(
          'licenseKey',
          data.licenseKey,
          vscode.ConfigurationTarget.Global,
        );

        if (this._view) {
          this._view.webview.postMessage({
            type: 'licenseSaved',
            success: true,
          });
        }
        vscode.window.showInformationMessage('License saved successfully!');
      } else {
        throw new Error('Invalid license data');
      }
    } catch (error) {
      console.error('Error saving license data:', error);
      vscode.window.showErrorMessage('Failed to save license data');

      if (this._view) {
        this._view.webview.postMessage({
          type: 'licenseSaved',
          success: false,
        });
      }
    }
  }

  private async _openTerminalandInstall(command: string, cliVersion: string) {
    try {
      // Always open a new terminal to avoid conflicts
      const terminal = vscode.window.createTerminal();
      terminal.show();
      if (terminal) {
        const { email, licenseKey } = this._getUserConfig();

        const commandToSend =
          cliVersion === 'cli-v3'
            ? command
            : email && licenseKey
              ? command + `?email=${email}&license_key=${licenseKey}"`
              : command + `"`;
        terminal.sendText(commandToSend, true);
        vscode.window.showInformationMessage(
          'Terminal opened and command sent!',
        );
      }
    } catch (error) {
      console.error('Error opening terminal and sending command:', error);
      vscode.window.showErrorMessage(
        'Failed to open terminal and send command',
      );
    }
  }

  private async _validateLicenseData(
    email: string,
    licenseKey: string,
  ): Promise<boolean> {
    // Basic validation: check if email contains "@" and licenseKey is non-empty

    try {
      const validateLicenseDataUrl = `https://shadcnstudio.com/api/validate-user?email=${email}&license_key=${licenseKey}`;

      const response = await fetch(validateLicenseDataUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      } else {
        const result = await response.json();
        console.log('License validated:', result);
        return true;
      }
    } catch (error) {
      console.error('Error validating license data:', error);
      return false;
    }
  }

  private async _fetchGenericThemes() {
    try {
      const themesUrl =
        'https://shadcnstudio.com/r/themes/registry.json?is_extension=true';
      // Fetch shadcn themes from the shadcn studio registry
      const response = await fetch(themesUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const shadcnThemesData = await response.json();
      console.log('Generic themes data:', shadcnThemesData);

      const shadcnThemesDataItems = (
        shadcnThemesData as { items: any[]; name: string }
      ).items.map((item) => {
        return {
          ...item,
          type: 'generic',
        };
      });

      return shadcnThemesDataItems;
    } catch (error) {
      console.error('Error fetching ShadcnStudio themes:', error);
      return null;
    }
  }

  private async _fetchUserThemes() {
    try {
      const { email, licenseKey } = this._getUserConfig();

      const themesUrl = `https://shadcnstudio.com/api/user-themes?email=${email}&license_key=${licenseKey}&is_extension=true`;
      console.log('Fetching user themes from URL:', themesUrl);
      // Fetch shadcn themes from the shadcn studio registry
      const response = await fetch(themesUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const userThemesData = await response.json();

      const userThemesDataItems = (
        userThemesData as {
          themes: { name: string; cssVars?: Record<string, string> }[];
        }
      ).themes.map((item) => {
        return {
          ...item,
          type: 'user',
        };
      });

      return userThemesDataItems;
    } catch (error) {
      console.error('Error fetching user-specific ShadcnStudio themes:', error);
      return null;
    }
  }

  private async _fetchThemesData() {
    try {
      // Show loading state
      if (this._view) {
        this._view.webview.postMessage({
          type: 'themesDataLoading',
          loading: true,
        });
      }

      // Fetch both generic and user-specific themes
      const genericThemes = await this._fetchGenericThemes();
      const userThemes = await this._fetchUserThemes();

      // Combine themes, prioritizing user-specific themes
      const themesData = {
        items: [...(userThemes || []), ...(genericThemes || [])],
        name: 'All Themes',
      };

      console.log('Combined themes data:', themesData);

      // Send data to webview
      if (this._view) {
        this._view.webview.postMessage({
          type: 'themesDataReceived',
          data: (themesData as { items: string[]; name: string }).items,
          loading: false,
        });
      }

      vscode.window.showInformationMessage(
        'Shadcn studio themes fetched successfully!',
      );
    } catch (error) {
      console.error('Error fetching shadcn themes data:', error);

      let errorMessage =
        'Failed to fetch themes data from shadcn studio registry';
      if (error instanceof Error) {
        errorMessage = `Registry Error: ${error.message}`;
      }

      vscode.window.showErrorMessage(errorMessage);

      // Hide loading state
      if (this._view) {
        this._view.webview.postMessage({
          type: 'themesDataReceived',
          data: null,
          error: errorMessage,
          loading: false,
        });
      }
    }
  }

  private async _copyInstallationCommand(
    command: string,
    CLIVersion: string,
  ): Promise<void> {
    if (CLIVersion === 'cli-v3') {
      const installationCommand = command;
      await vscode.env.clipboard.writeText(installationCommand);
    } else {
      const { email, licenseKey } = this._getUserConfig();
      const installationCommand =
        email && licenseKey
          ? command + `?email=${email}&license_key=${licenseKey}"`
          : command + `"`;
      await vscode.env.clipboard.writeText(installationCommand);
    }
  }

  private async _fetchSectionsData() {
    try {
      // Show loading state
      if (this._view) {
        this._view.webview.postMessage({
          type: 'sectionsDataLoading',
          loading: true,
        });
      }

      const registryBlocksUrl =
        'https://shadcnstudio.com/r/blocks/registry.json?is_extension=true';
      // Fetch shadcn blocks from the shadcn studio registry
      const response = await fetch(registryBlocksUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const registryData = (await response.json()) as { items: Item[] };

      const { email, licenseKey } = this._getUserConfig();

      // Determine whether we have credentials and whether they're valid.
      const hasCredentials = Boolean(email && licenseKey);
      const isValid = hasCredentials
        ? await this._isLicenseValid(email, licenseKey)
        : false;

      // If there are no credentials or the credentials are invalid, filter out pro blocks
      if (!hasCredentials || !isValid) {
        registryData.items = registryData.items.filter((item: Item) => {
          return item.meta?.isPro === false;
        });
      }

      const sectionsData = getSections(registryData.items);

      // Send data to webview
      if (this._view) {
        this._view.webview.postMessage({
          type: 'sectionsDataReceived',
          data: sectionsData,
          loading: false,
        });
      }

      vscode.window.showInformationMessage(
        'Shadcn studio sections fetched successfully!',
      );
    } catch (error) {
      console.error('Error fetching shadcn blocks data:', error);

      let errorMessage = 'Failed to fetch data from shadcn studio registry';
      if (error instanceof Error) {
        errorMessage = `Registry Error: ${error.message}`;
      }

      vscode.window.showErrorMessage(errorMessage);

      // Hide loading state
      if (this._view) {
        this._view.webview.postMessage({
          type: 'blocksDataReceived',
          data: null,
          error: errorMessage,
          loading: false,
        });
      }
    }
  }

  private async _fetchSectionDetails(sectionId: string, sectionName: string) {
    try {
      // Show loading state
      if (this._view) {
        this._view.webview.postMessage({
          type: 'sectionsDataLoading',
          loading: true,
        });
      }
      // get user details
      const { email, licenseKey } = this._getUserConfig();

      // Fetch section details from shadcn API or registry
      const registryBlocksUrl =
        'https://shadcnstudio.com/r/blocks/registry.json?is_extension=true';

      // Fetch shadcn blocks from the shadcn studio registry
      const response = await fetch(registryBlocksUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const registryData = (await response.json()) as { items: Item[] };

      // Determine whether we have credentials and whether they're valid.
      const hasCredentials = Boolean(email && licenseKey);
      const isValid = hasCredentials
        ? await this._isLicenseValid(email, licenseKey)
        : false;

      // If there are no credentials or the credentials are invalid, filter out pro blocks
      if (!hasCredentials || !isValid) {
        registryData.items = registryData.items.filter((item: Item) => {
          return item.meta?.isPro === false;
        });
      }

      const sectionItems = getItemsBySection(registryData.items, sectionId);

      // Send data to webview
      if (this._view) {
        this._view.webview.postMessage({
          type: 'sectionDetailsReceived',
          data: sectionItems,
          sectionName: sectionName,
          loading: false,
        });
      }
    } catch (error) {
      console.error('Error fetching shadcn blocks data:', error);

      let errorMessage = 'Failed to fetch data from shadcn studio registry';
      if (error instanceof Error) {
        errorMessage = `Registry Error: ${error.message}`;
      }

      vscode.window.showErrorMessage(errorMessage);

      // Hide loading state
      if (this._view) {
        this._view.webview.postMessage({
          type: 'sectionDetailsReceived',
          data: null,
          error: errorMessage,
          loading: false,
        });
      }
    }
  }

  private _refreshData() {
    if (this._view) {
      this._view.webview.postMessage({
        type: 'updateData',
        data: this._fetchSectionsData(),
      });
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    // Get path to media directory
    const mediaPath = vscode.Uri.joinPath(
      this._extensionUri,
      'out',
      'src',
      'webviews',
      'media',
    );

    // Get URIs for CSS and JS files
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(mediaPath, 'shadcn-blocks-panel.css'),
    );
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(mediaPath, 'shadcn-blocks-panel.js'),
    );
    const themesScriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(mediaPath, 'shadcn-themes-panel.js'),
    );

    // Read HTML template
    const htmlPath = vscode.Uri.joinPath(mediaPath, 'shadcn-blocks-panel.html');
    let htmlContent: string;

    try {
      const htmlBytes = fs.readFileSync(htmlPath.fsPath);
      htmlContent = htmlBytes.toString();
    } catch (error) {
      console.error('Error reading HTML template:', error);
      return this._getErrorHtml('Failed to load HTML template');
    }

    // Replace placeholders with actual URIs
    htmlContent = htmlContent
      .replace('{{styleUri}}', styleUri.toString())
      .replace('{{scriptUri}}', scriptUri.toString())
      .replace('{{themesScriptUri}}', themesScriptUri.toString());

    return htmlContent;
  }

  private _getErrorHtml(errorMessage: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Error</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-errorForeground);
            background-color: var(--vscode-editor-background);
            padding: 20px;
            text-align: center;
        }
    </style>
</head>
<body>
    <h2>Error Loading Panel</h2>
    <p>${errorMessage}</p>
</body>
</html>`;
  }
}
