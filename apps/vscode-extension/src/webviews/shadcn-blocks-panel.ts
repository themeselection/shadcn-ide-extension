import * as fs from 'node:fs';
import * as vscode from 'vscode';
import { dispatchAgentCall } from '../utils/dispatch-agent-call';
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
          await vscode.env.clipboard.writeText(data.text);
          vscode.window.showInformationMessage('📋 Copied to clipboard!');
          break;
        case 'openBlock':
          await this._fetchBlockDetails(data.path, data.name);
          break;
        case 'copyBlockCode':
          await this._copyBlockCode(data.path);
          break;
        case 'sendToIDEAgent':
          await this._sendToIDEAgent(data.path, data.name);
          break;
        case 'previewBlock':
          await this._previewBlock(data.path, data.name);
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
      const terminal =
        vscode.window.activeTerminal || vscode.window.createTerminal();
      terminal.show();
      if (terminal) {
        const { email, licenseKey } = this._getUserConfig();

        const commandToSend =
          cliVersion === 'cli-v3'
            ? command
            : command + `?email=${email}&licenseKey=${licenseKey}"`;
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

  private async _previewBlock(path: string, _blockName: string) {
    try {
      // Open shadcn blocks preview in browser
      const previewUrl = `https://ui.shadcn.com/blocks#${path}`;
      vscode.env.openExternal(vscode.Uri.parse(previewUrl));
    } catch (_error) {
      vscode.window.showErrorMessage('Failed to open block preview');
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

  private async _fetchBlockDetails(dataPath: string, blockName: string) {
    // Show loading state
    if (this._view) {
      this._view.webview.postMessage({
        type: 'blockDetailsLoading',
        loading: true,
      });
    }

    try {
      // Fetch block details from shadcn API or registry
      const url = `https://ui.shadcn.com/registry/blocks/${dataPath}.json`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blockData: any = await response.json();

      // Send data to webview
      if (this._view) {
        this._view.webview.postMessage({
          type: 'blockDetailsReceived',
          data: blockData,
          blockName: blockName,
          blockPath: dataPath,
          loading: false,
        });
      }
    } catch (error) {
      console.error('Error fetching shadcn block data:', error);
      vscode.window.showErrorMessage(
        'Failed to fetch block data from shadcn registry',
      );

      if (this._view) {
        this._view.webview.postMessage({
          type: 'blockDetailsReceived',
          data: null,
          blockName: blockName,
          blockPath: dataPath,
          loading: false,
          error: 'Failed to fetch block data',
        });
      }
    }
  }

  private async _fetchBlockCodeFromRegistry(
    dataPath: string,
  ): Promise<string | null> {
    try {
      const url = `https://ui.shadcn.com/registry/blocks/${dataPath}.json`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blockData: any = await response.json();

      // Extract code from the block data
      if (blockData.files && blockData.files.length > 0) {
        const codeBlocks = blockData.files.map((file: any) => {
          return `// File: ${file.path}\n${file.content}`;
        });
        return codeBlocks.join('\n\n');
      }

      return null;
    } catch (error) {
      console.error('Error fetching block code from registry:', error);
      vscode.window.showErrorMessage(
        'Failed to fetch block code from shadcn registry',
      );
      return null;
    }
  }

  private async _copyBlockCode(dataPath: string): Promise<void> {
    try {
      vscode.window.showInformationMessage('⏳ Fetching block code...');

      const code = await this._fetchBlockCodeFromRegistry(dataPath);

      if (code) {
        await vscode.env.clipboard.writeText(code);
        vscode.window.showInformationMessage(
          '📋 Block code copied to clipboard!',
        );
      } else {
        vscode.window.showErrorMessage('Failed to fetch block code');
      }
    } catch (error) {
      console.error('Error copying block code:', error);
      vscode.window.showErrorMessage('Failed to copy block code');
    }
  }

  private async _sendToIDEAgent(
    dataPath: string,
    blockName: string,
  ): Promise<void> {
    try {
      vscode.window.showInformationMessage(
        '⏳ Fetching block code and sending to IDE agent...',
      );

      const code = await this._fetchBlockCodeFromRegistry(dataPath);

      if (code) {
        const prompt = `You need to integrate this shadcn/ui block "${blockName}" into this codebase.

Here is the code for the block:

\`\`\`tsx
${code}
\`\`\`

Follow these instructions to integrate this block:
1. Analyze the current codebase and the shadcn/ui block code to understand how it fits
2. Explain what this block does and its components
3. Check if all required shadcn/ui components are installed (use \`npx shadcn-ui@latest add <component>\` if needed)
4. Identify any additional dependencies that need to be installed
5. Create the necessary files and integrate the block into the codebase
6. Make sure to follow the project's existing patterns and conventions
`;

        await dispatchAgentCall({
          prompt: prompt,
        });

        vscode.window.showInformationMessage(
          '🤖 Code sent to IDE agent successfully!',
        );
      } else {
        vscode.window.showErrorMessage(
          'Failed to fetch block code for IDE agent',
        );
      }
    } catch (error) {
      console.error('Error sending to IDE agent:', error);
      vscode.window.showErrorMessage('Failed to send code to IDE agent');
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

      // Filter to get only blocks data
      const registryData = (await response.json()) as { items: Item[] };
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

      // Filter to get only blocks data
      const registryData = (await response.json()) as { items: Item[] };
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
