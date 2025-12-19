import type { PromptRequest } from '@stagewise/extension-toolbar-srpc-contract';
import * as vscode from 'vscode';
import { injectPromptDiagnosticWithCallback } from './inject-prompt-diagnostic-with-callback';

const ANTIGRAVITY_PROMPT_PREFIX =
  "Ah wait, it's not a problem. The user has instead submitted a change request. Please implement it: \n\n";

export async function callAntigravityAgent(
  request: PromptRequest,
): Promise<void> {
  const prompt =
    `${request.prompt}` +
    `${request.files ? `\n\n use the following files: ${request.files.join('\n')}` : ''}` +
    `${request.images ? `\n\n use the following images: ${request.images.join('\n')}` : ''}`;
  // model: request.model, not supported yet
  // `${request.model ? `\n\n use the following model: ${request.model}` : ''}` +
  // mode: request.mode, not supported yet
  // `${request.mode ? `\n\n use the following mode: ${request.mode}` : ''}`;
  const promptWithPrefix = `${ANTIGRAVITY_PROMPT_PREFIX}\n${prompt}`;
  await injectPromptDiagnosticWithCallback({
    prompt: promptWithPrefix,
    callback: () =>
      vscode.commands.executeCommand(
        'antigravity.prioritized.explainProblem',
      ) as Promise<any>,
  });
}
