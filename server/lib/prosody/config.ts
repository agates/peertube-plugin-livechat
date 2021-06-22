import * as fs from 'fs'
import * as path from 'path'
import { getBaseRouterRoute } from '../helpers'
import { ProsodyFilePaths } from './config/paths'
import { ProsodyConfigContent } from './config/content'
import { getProsodyDomain } from './config/domain'
import { getAPIKey } from '../apikey'
import type { ProsodyLogLevel } from './config/content'

async function getWorkingDir (options: RegisterServerOptions): Promise<string> {
  const peertubeHelpers = options.peertubeHelpers
  const logger = peertubeHelpers.logger
  logger.debug('Calling getWorkingDir')

  if (!peertubeHelpers.plugin) {
    throw new Error('Missing peertubeHelpers.plugin, have you the correct Peertube version?')
  }
  const dir = path.resolve(peertubeHelpers.plugin.getDataDirectoryPath(), 'prosody')
  logger.debug('getWorkingDir will return the dir ' + dir)
  return dir
}

/**
 * Creates the working dir if needed, and returns it.
 */
async function ensureWorkingDir (options: RegisterServerOptions): Promise<string> {
  const logger = options.peertubeHelpers.logger
  logger.debug('Calling ensureworkingDir')

  const paths = await getProsodyFilePaths(options)
  const dir = paths.dir
  if (!fs.existsSync(dir)) {
    logger.info(`The working dir ${dir} does not exists, trying to create it`)
    await fs.promises.mkdir(dir)
    logger.debug(`Working dir ${dir} was created`)
  }
  logger.debug(`Testing write access on ${dir}`)
  await fs.promises.access(dir, fs.constants.W_OK) // will throw an error if no access
  logger.debug(`Write access ok on ${dir}`)

  if (!fs.existsSync(paths.data)) {
    logger.info(`The data dir ${paths.data} does not exists, trying to create it`)
    await fs.promises.mkdir(paths.data)
    logger.debug(`Working dir ${paths.data} was created`)
  }

  return dir
}

async function getProsodyFilePaths (options: RegisterServerOptions): Promise<ProsodyFilePaths> {
  const logger = options.peertubeHelpers.logger
  logger.debug('Calling getProsodyFilePaths')

  const dir = await getWorkingDir(options)
  return {
    dir: dir,
    pid: path.resolve(dir, 'prosody.pid'),
    error: path.resolve(dir, 'prosody.err'),
    log: path.resolve(dir, 'prosody.log'),
    config: path.resolve(dir, 'prosody.cfg.lua'),
    data: path.resolve(dir, 'data'),
    modules: path.resolve(__dirname, '../../prosody-modules')
  }
}

interface ProsodyConfig {
  content: string
  paths: ProsodyFilePaths
  port: string
}
async function getProsodyConfig (options: RegisterServerOptions): Promise<ProsodyConfig> {
  const logger = options.peertubeHelpers.logger
  logger.debug('Calling getProsodyConfig')

  const port = (await options.settingsManager.getSetting('prosody-port') as string) || '52800'
  if (!/^\d+$/.test(port)) {
    throw new Error('Invalid port')
  }
  const prosodyDomain = await getProsodyDomain(options)
  const paths = await getProsodyFilePaths(options)

  const apikey = await getAPIKey(options)
  const baseApiUrl = options.peertubeHelpers.config.getWebserverUrl() +
    getBaseRouterRoute(options) +
    'api/'
  const authApiUrl = baseApiUrl + 'user' // FIXME: should be protected by apikey, but mod_auth_http cant handle params
  const roomApiUrl = baseApiUrl + 'room?apikey=' + apikey + '&jid={room.jid|jid_node}'

  const config = new ProsodyConfigContent(paths, prosodyDomain)
  config.useHttpAuthentication(authApiUrl)
  config.usePeertubeBosh(prosodyDomain, port)
  config.useMucHttpDefault(roomApiUrl)

  // TODO: add a settings so that admin can choose? (on/off and duration)
  config.useMam('1w') // Remove archived messages after 1 week
  // TODO: add a settings to choose?
  config.useDefaultPersistent()

  config.useTestModule(apikey)

  let logLevel: ProsodyLogLevel | undefined
  if (logger.level && (typeof logger.level === 'string')) {
    if (logger.level === 'error' || logger.level === 'info' || logger.level === 'debug') {
      logLevel = logger.level
    } else if (logger.level === 'warn' || logger.level === 'warning') {
      // Should be 'warn', but just in case... (this value was buggy with peertube <= 3.2.0-rc1)
      logLevel = 'warn'
    }
  }
  if (logLevel === undefined) {
    logger.info('No log level found in Peertube, will use default "info" for Prosody')
    logLevel = 'info'
  }
  config.setLog(logLevel)
  const content = config.write()

  return {
    content,
    paths,
    port
  }
}

async function writeProsodyConfig (options: RegisterServerOptions): Promise<ProsodyConfig> {
  const logger = options.peertubeHelpers.logger
  logger.debug('Calling writeProsodyConfig')

  logger.debug('Ensuring that the working dir exists')
  await ensureWorkingDir(options)
  logger.debug('Computing the Prosody config content')
  const config = await getProsodyConfig(options)
  const content = config.content
  const fileName = config.paths.config

  logger.info(`Writing prosody configuration file to ${fileName}`)
  await fs.promises.writeFile(fileName, content)
  logger.debug('Prosody configuration file writen')

  return config
}

export {
  getProsodyConfig,
  getWorkingDir,
  ensureWorkingDir,
  getProsodyFilePaths,
  writeProsodyConfig
}
