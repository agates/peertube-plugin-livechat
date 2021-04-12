import { newResult, TestResult } from './utils'

export async function diagUri (test: string, settingsManager: PluginSettingsManager): Promise<TestResult> {
  const result = newResult(test)
  result.label = 'External Webchat using an iframe'
  const settings = await settingsManager.getSettings([
    'chat-uri'
  ])
  if (/^https:\/\//.test(settings['chat-uri'] as string)) {
    result.ok = true
  } else {
    result.messages.push('Incorrect value for the uri (it does not start with https://)')
  }
  return result
}
