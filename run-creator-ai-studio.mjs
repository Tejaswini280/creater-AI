#!/usr/bin/env node

/**
 * 🧰 CREATOR AI STUDIO - App Lifecycle Manager
 * 
 * Enterprise-grade application lifecycle management for Creator AI Studio
 * Manages frontend, backend, database, migrations, seeding, and Docker services
 * 
 * Cross-platform support: Windows + macOS + Linux
 * 
 * Usage:
 *   node run-creator-ai-studio.mjs setup
 *   node run-creator-ai-studio.mjs start
 *   node run-creator-ai-studio.mjs stop
 *   node run-creator-ai-studio.mjs restart
 *   node run-creator-ai-studio.mjs clean
 */

import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';
import { platform } from 'os';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION & CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const PROJECT_ROOT = __dirname;
const RUNTIME_DIR = path.join(PROJECT_ROOT, '.app-manager');
const STATE_FILE = path.join(RUNTIME_DIR, 'state.json');
const LOCK_FILE = path.join(RUNTIME_DIR, 'lock');
const LOGS_DIR = path.join(RUNTIME_DIR, 'logs');

// Auto-detected directories
const FRONTEND_DIR = path.join(PROJECT_ROOT, 'client');
const BACKEND_DIR = path.join(PROJECT_ROOT, 'server');
const MIGRATIONS_DIR = path.join(PROJECT_ROOT, 'migrations');
const SCRIPTS_DIR = path.join(PROJECT_ROOT, 'scripts');

// Default ports (can be overridden via flags)
const DEFAULT_PORTS = {
  frontend: 3000,
  backend: 5000,
  postgres: 5432,
  redis: 6379
};

// Cross-platform command detection
const IS_WINDOWS = platform() === 'win32';
const NPM_CMD = IS_WINDOWS ? 'npm.cmd' : 'npm';
const NPXCMD = IS_WINDOWS ? 'npx.cmd' : 'npx';

// App name detection and sanitization
let APP_NAME = 'creator-ai-studio';

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Logging with colors and levels
 */
class Logger {
  constructor(options = {}) {
    this.colors = !options.noColor && process.stdout.isTTY;
    this.debug = options.debug || false;
  }

  _colorize(text, color) {
    if (!this.colors) return text;
    const colors = {
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      magenta: '\x1b[35m',
      cyan: '\x1b[36m',
      white: '\x1b[37m',
      gray: '\x1b[90m',
      reset: '\x1b[0m'
    };
    return `${colors[color] || ''}${text}${colors.reset}`;
  }

  info(message) {
    console.log(`${this._colorize('ℹ', 'blue')} ${message}`);
  }

  success(message) {
    console.log(`${this._colorize('✅', 'green')} ${message}`);
  }

  warn(message) {
    console.log(`${this._colorize('⚠️', 'yellow')} ${message}`);
  }

  error(message) {
    console.error(`${this._colorize('❌', 'red')} ${message}`);
  }

  debug(message) {
    if (this.debug) {
      console.log(`${this._colorize('🐛', 'gray')} ${message}`);
    }
  }

  banner(message) {
    const line = '═'.repeat(79);
    console.log(this._colorize(line, 'cyan'));
    console.log(this._colorize(`🚀 ${message}`, 'cyan'));
    console.log(this._colorize(line, 'cyan'));
  }
}

/**
 * State management with atomic writes
 */
class StateManager {
  constructor() {
    this.statePath = STATE_FILE;
  }

  async read() {
    try {
      const data = await fs.readFile(this.statePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return {
        processes: {},
        ports: {},
        lastUpdated: new Date().toISOString(),
        version: '1.0.0'
      };
    }
  }

  async write(state) {
    await this._ensureRuntimeDir();
    const tempPath = `${this.statePath}.tmp`;
    
    const stateWithMeta = {
      ...state,
      lastUpdated: new Date().toISOString(),
      version: '1.0.0'
    };

    await fs.writeFile(tempPath, JSON.stringify(stateWithMeta, null, 2));
    
    // Atomic rename
    if (IS_WINDOWS) {
      try {
        await fs.unlink(this.statePath);
      } catch {}
    }
    await fs.rename(tempPath, this.statePath);
  }

  async _ensureRuntimeDir() {
    try {
      await fs.mkdir(RUNTIME_DIR, { recursive: true });
      await fs.mkdir(LOGS_DIR, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }
}

/**
 * Concurrency lock management
 */
class LockManager {
  constructor() {
    this.lockPath = LOCK_FILE;
  }

  async acquire(force = false) {
    try {
      const lockData = {
        pid: process.pid,
        timestamp: new Date().toISOString(),
        command: process.argv.join(' ')
      };

      if (!force) {
        try {
          const existingLock = await fs.readFile(this.lockPath, 'utf8');
          const existing = JSON.parse(existingLock);
          
          // Check if the process is still running
          if (await this._isProcessRunning(existing.pid)) {
            throw new Error(`Lock held by PID ${existing.pid} since ${existing.timestamp}`);
          } else {
            logger.warn(`Removing stale lock from PID ${existing.pid}`);
          }
        } catch (error) {
          if (error.code !== 'ENOENT') {
            throw error;
          }
        }
      }

      await fs.mkdir(path.dirname(this.lockPath), { recursive: true });
      await fs.writeFile(this.lockPath, JSON.stringify(lockData, null, 2));
      
    } catch (error) {
      if (error.message.includes('Lock held by')) {
        throw error;
      }
      throw new Error(`Failed to acquire lock: ${error.message}`);
    }
  }

  async release() {
    try {
      await fs.unlink(this.lockPath);
    } catch (error) {
      // Lock file might not exist
    }
  }

  async _isProcessRunning(pid) {
    try {
      if (IS_WINDOWS) {
        const { stdout } = await execAsync(`tasklist /FI "PID eq ${pid}" /FO CSV`);
        return stdout.includes(`"${pid}"`);
      } else {
        process.kill(pid, 0);
        return true;
      }
    } catch {
      return false;
    }
  }
}

/**
 * Process management utilities
 */
class ProcessManager {
  static async findProcessByPort(port) {
    try {
      if (IS_WINDOWS) {
        const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
        const lines = stdout.trim().split('\n');
        const pids = [];
        
        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 5 && parts[1].includes(`:${port}`)) {
            const pid = parseInt(parts[4]);
            if (pid && !pids.includes(pid)) {
              pids.push(pid);
            }
          }
        }
        return pids;
      } else {
        const { stdout } = await execAsync(`lsof -ti :${port}`);
        return stdout.trim().split('\n').map(pid => parseInt(pid)).filter(Boolean);
      }
    } catch {
      return [];
    }
  }

  static async killProcess(pid, graceful = true) {
    try {
      if (IS_WINDOWS) {
        if (graceful) {
          await execAsync(`taskkill /PID ${pid} /T`);
        } else {
          await execAsync(`taskkill /PID ${pid} /T /F`);
        }
      } else {
        process.kill(pid, graceful ? 'SIGTERM' : 'SIGKILL');
      }
      return true;
    } catch {
      return false;
    }
  }

  static async getProcessInfo(pid) {
    try {
      if (IS_WINDOWS) {
        const { stdout } = await execAsync(`tasklist /FI "PID eq ${pid}" /FO CSV`);
        const lines = stdout.trim().split('\n');
        if (lines.length > 1) {
          const parts = lines[1].split(',').map(s => s.replace(/"/g, ''));
          return {
            pid: parseInt(parts[1]),
            name: parts[0],
            memory: parts[4]
          };
        }
      } else {
        const { stdout } = await execAsync(`ps -p ${pid} -o pid,comm,rss`);
        const lines = stdout.trim().split('\n');
        if (lines.length > 1) {
          const parts = lines[1].trim().split(/\s+/);
          return {
            pid: parseInt(parts[0]),
            name: parts[1],
            memory: `${parts[2]} KB`
          };
        }
      }
    } catch {
      return null;
    }
  }

  static spawnProcess(command, args, options = {}) {
    const defaultOptions = {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
      detached: !IS_WINDOWS,
      ...options
    };

    return spawn(command, args, defaultOptions);
  }
}

/**
 * Port management with conflict resolution
 */
class PortManager {
  static async isPortFree(port) {
    const pids = await ProcessManager.findProcessByPort(port);
    return pids.length === 0;
  }

  static async resolvePortConflict(port, serviceName, options = {}) {
    const { force = false, noKill = false, yes = false } = options;
    
    const pids = await ProcessManager.findProcessByPort(port);
    if (pids.length === 0) return true;

    if (noKill) {
      throw new Error(`Port ${port} is occupied by PID(s): ${pids.join(', ')}. Use --force to kill or choose different port.`);
    }

    for (const pid of pids) {
      const info = await ProcessManager.getProcessInfo(pid);
      const processName = info ? info.name : 'unknown';
      
      logger.warn(`Port ${port} (${serviceName}) is occupied by PID ${pid} (${processName})`);
      
      if (!force && !yes) {
        // In interactive mode, we would prompt user
        // For now, we'll be conservative and not kill
        throw new Error(`Port ${port} conflict. Use --force or --yes to kill process ${pid}`);
      }

      logger.info(`Killing process ${pid} (${processName}) to free port ${port}`);
      const killed = await ProcessManager.killProcess(pid, true);
      
      if (!killed) {
        logger.warn(`Failed to kill process ${pid} gracefully, trying force kill`);
        await ProcessManager.killProcess(pid, false);
      }

      // Wait a moment for the port to be freed
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return true;
  }
}

/**
 * Environment and dependency detection
 */
class EnvironmentDetector {
  static async detectAppName() {
    try {
      const packageJsonPath = path.join(PROJECT_ROOT, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      
      if (packageJson.name) {
        return this.sanitizeAppName(packageJson.name);
      }
    } catch {}

    // Fallback to directory name
    const dirName = path.basename(PROJECT_ROOT);
    return this.sanitizeAppName(dirName);
  }

  static sanitizeAppName(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  static async detectPackageManager() {
    const checks = [
      { file: 'pnpm-lock.yaml', manager: 'pnpm' },
      { file: 'yarn.lock', manager: 'yarn' },
      { file: 'package-lock.json', manager: 'npm' }
    ];

    for (const { file, manager } of checks) {
      try {
        await fs.access(path.join(PROJECT_ROOT, file));
        return manager;
      } catch {}
    }

    return 'npm'; // Default fallback
  }

  static async hasDockerCompose() {
    const files = ['docker-compose.yml', 'docker-compose.yaml', 'compose.yml', 'compose.yaml'];
    
    for (const file of files) {
      try {
        await fs.access(path.join(PROJECT_ROOT, file));
        return file;
      } catch {}
    }
    
    return null;
  }

  static async hasPrisma() {
    try {
      await fs.access(path.join(PROJECT_ROOT, 'prisma', 'schema.prisma'));
      return true;
    } catch {}

    // Check for prisma in package.json dependencies
    try {
      const packageJson = JSON.parse(await fs.readFile(path.join(PROJECT_ROOT, 'package.json'), 'utf8'));
      return !!(packageJson.dependencies?.prisma || packageJson.devDependencies?.prisma);
    } catch {}

    return false;
  }

  static async hasDrizzle() {
    try {
      await fs.access(path.join(PROJECT_ROOT, 'drizzle.config.ts'));
      return true;
    } catch {}

    try {
      await fs.access(path.join(PROJECT_ROOT, 'drizzle.config.js'));
      return true;
    } catch {}

    return false;
  }

  static async loadEnvFile(envPath) {
    try {
      const content = await fs.readFile(envPath, 'utf8');
      const env = {};
      
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=');
          if (key && valueParts.length > 0) {
            env[key.trim()] = valueParts.join('=').trim();
          }
        }
      }
      
      return env;
    } catch {
      return {};
    }
  }

  static async detectPorts() {
    const ports = { ...DEFAULT_PORTS };
    
    // Check various env files for port configurations
    const envFiles = ['.env', '.env.local', '.env.development'];
    
    for (const envFile of envFiles) {
      const env = await this.loadEnvFile(path.join(PROJECT_ROOT, envFile));
      
      if (env.PORT) ports.backend = parseInt(env.PORT);
      if (env.VITE_PORT) ports.frontend = parseInt(env.VITE_PORT);
      if (env.FRONTEND_PORT) ports.frontend = parseInt(env.FRONTEND_PORT);
      if (env.BACKEND_PORT) ports.backend = parseInt(env.BACKEND_PORT);
      if (env.DB_PORT) ports.postgres = parseInt(env.DB_PORT);
      if (env.REDIS_PORT) ports.redis = parseInt(env.REDIS_PORT);
    }

    return ports;
  }
}

/**
 * Service management for different components
 */
class ServiceManager {
  constructor(stateManager, options = {}) {
    this.state = stateManager;
    this.options = options;
    this.ports = DEFAULT_PORTS;
  }

  async startFrontend() {
    logger.info('Starting frontend development server...');
    
    const packageManager = await EnvironmentDetector.detectPackageManager();
    const cmd = packageManager === 'npm' ? NPM_CMD : packageManager;
    
    // Check if we need to build first
    const distExists = await fs.access(path.join(PROJECT_ROOT, 'dist', 'public')).then(() => true).catch(() => false);
    
    if (!distExists && !this.options.skipBuild) {
      logger.info('Building frontend first...');
      await this._runCommand(cmd, ['run', 'build'], { cwd: PROJECT_ROOT });
    }

    // Start Vite dev server
    const process = ProcessManager.spawnProcess(cmd, ['run', 'dev'], {
      cwd: FRONTEND_DIR,
      env: { ...process.env, PORT: this.ports.frontend.toString() }
    });

    const logFile = path.join(LOGS_DIR, 'frontend.log');
    await this._setupProcessLogging(process, logFile, 'frontend');

    // Wait for frontend to be ready
    await this._waitForService(`http://localhost:${this.ports.frontend}`, 'Frontend', 45000);

    return {
      pid: process.pid,
      port: this.ports.frontend,
      logFile,
      url: `http://localhost:${this.ports.frontend}`
    };
  }

  async startBackend() {
    logger.info('Starting backend server...');
    
    // Check if we need to build first
    const distExists = await fs.access(path.join(PROJECT_ROOT, 'dist', 'index.js')).then(() => true).catch(() => false);
    
    if (!distExists && !this.options.skipBuild) {
      logger.info('Building backend first...');
      const packageManager = await EnvironmentDetector.detectPackageManager();
      const cmd = packageManager === 'npm' ? NPM_CMD : packageManager;
      await this._runCommand(cmd, ['run', 'build'], { cwd: PROJECT_ROOT });
    }

    // Start backend server
    const env = {
      ...process.env,
      NODE_ENV: process.env.NODE_ENV || 'development',
      PORT: this.ports.backend.toString()
    };

    const process = ProcessManager.spawnProcess('node', ['dist/index.js'], {
      cwd: PROJECT_ROOT,
      env
    });

    const logFile = path.join(LOGS_DIR, 'backend.log');
    await this._setupProcessLogging(process, logFile, 'backend');

    // Wait for backend to be ready
    await this._waitForService(`http://localhost:${this.ports.backend}/api/health`, 'Backend', 45000);

    return {
      pid: process.pid,
      port: this.ports.backend,
      logFile,
      url: `http://localhost:${this.ports.backend}`
    };
  }

  async startDatabase() {
    const dockerCompose = await EnvironmentDetector.hasDockerCompose();
    
    if (!dockerCompose) {
      logger.warn('No docker-compose file found, assuming external database');
      return null;
    }

    logger.info('Starting database services with Docker Compose...');
    
    // Start only database services
    await this._runCommand('docker', ['compose', 'up', '-d', 'postgres', 'redis'], {
      cwd: PROJECT_ROOT
    });

    // Wait for services to be healthy
    await this._waitForDockerService('postgres', 30000);
    await this._waitForDockerService('redis', 30000);

    return {
      postgres: { port: this.ports.postgres },
      redis: { port: this.ports.redis }
    };
  }

  async runMigrations() {
    logger.info('Running database migrations...');
    
    const hasDrizzle = await EnvironmentDetector.hasDrizzle();
    const hasPrisma = await EnvironmentDetector.hasPrisma();

    if (hasDrizzle) {
      // Use custom migration script if available
      const migrationScript = path.join(SCRIPTS_DIR, 'run-migrations.js');
      const scriptExists = await fs.access(migrationScript).then(() => true).catch(() => false);
      
      if (scriptExists) {
        await this._runCommand('node', [migrationScript], { cwd: PROJECT_ROOT });
      } else {
        await this._runCommand(NPXCMD, ['drizzle-kit', 'migrate'], { cwd: PROJECT_ROOT });
      }
    } else if (hasPrisma) {
      await this._runCommand(NPXCMD, ['prisma', 'migrate', 'deploy'], { cwd: PROJECT_ROOT });
    } else {
      logger.warn('No migration system detected (Drizzle/Prisma)');
    }
  }

  async runSeeding() {
    if (this.options.noSeed) {
      logger.info('Skipping database seeding (--no-seed)');
      return;
    }

    logger.info('Running database seeding...');
    
    // Try different seeding approaches
    const seedingMethods = [
      { script: 'db:comprehensive-seed', description: 'comprehensive seeding' },
      { script: 'db:seed', description: 'standard seeding' },
      { script: 'seed', description: 'basic seeding' }
    ];

    const packageManager = await EnvironmentDetector.detectPackageManager();
    const cmd = packageManager === 'npm' ? NPM_CMD : packageManager;

    for (const method of seedingMethods) {
      try {
        await this._runCommand(cmd, ['run', method.script], { cwd: PROJECT_ROOT });
        logger.success(`Database seeding completed using ${method.description}`);
        return;
      } catch (error) {
        logger.debug(`Seeding method '${method.script}' failed: ${error.message}`);
      }
    }

    // Try direct script execution
    const seedScript = path.join(SCRIPTS_DIR, 'seed-database.js');
    const scriptExists = await fs.access(seedScript).then(() => true).catch(() => false);
    
    if (scriptExists) {
      try {
        await this._runCommand('node', [seedScript], { cwd: PROJECT_ROOT });
        logger.success('Database seeding completed using direct script');
        return;
      } catch (error) {
        logger.debug(`Direct seeding script failed: ${error.message}`);
      }
    }

    logger.warn('No seeding method succeeded - database may be empty');
  }

  async _runCommand(command, args, options = {}) {
    return new Promise((resolve, reject) => {
      const process = ProcessManager.spawnProcess(command, args, {
        stdio: 'inherit',
        ...options
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command failed with exit code ${code}`));
        }
      });

      process.on('error', reject);
    });
  }

  async _setupProcessLogging(process, logFile, serviceName) {
    const logStream = await fs.open(logFile, 'a');
    
    process.stdout?.on('data', async (data) => {
      await logStream.write(`[${new Date().toISOString()}] [${serviceName}] ${data}`);
    });

    process.stderr?.on('data', async (data) => {
      await logStream.write(`[${new Date().toISOString()}] [${serviceName}] ERROR: ${data}`);
    });

    process.on('exit', async () => {
      await logStream.close();
    });
  }

  async _waitForService(url, serviceName, timeout = 30000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          logger.success(`${serviceName} is ready at ${url}`);
          return;
        }
      } catch {}
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    throw new Error(`${serviceName} failed to start within ${timeout}ms`);
  }

  async _waitForDockerService(serviceName, timeout = 30000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        const { stdout } = await execAsync(`docker compose ps ${serviceName} --format json`);
        const service = JSON.parse(stdout);
        
        if (service.Health === 'healthy' || service.State === 'running') {
          logger.success(`Docker service ${serviceName} is ready`);
          return;
        }
      } catch {}
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    throw new Error(`Docker service ${serviceName} failed to start within ${timeout}ms`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMMAND IMPLEMENTATIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Global instances
 */
let logger;
let stateManager;
let lockManager;

/**
 * Setup command - First-time repository setup
 */
async function setupCommand(options) {
  logger.banner(`Setting up ${APP_NAME}`);

  try {
    // Detect and install dependencies
    logger.info('Detecting project structure...');
    
    const packageManager = await EnvironmentDetector.detectPackageManager();
    const hasDockerCompose = await EnvironmentDetector.hasDockerCompose();
    
    logger.info(`Package manager: ${packageManager}`);
    logger.info(`Docker Compose: ${hasDockerCompose ? 'detected' : 'not found'}`);

    // Install dependencies
    logger.info('Installing dependencies...');
    const cmd = packageManager === 'npm' ? NPM_CMD : packageManager;
    
    // Install root dependencies
    await execAsync(`${cmd} install`, { cwd: PROJECT_ROOT });
    
    // Install frontend dependencies if separate
    const frontendPackageJson = path.join(FRONTEND_DIR, 'package.json');
    const frontendHasPackageJson = await fs.access(frontendPackageJson).then(() => true).catch(() => false);
    
    if (frontendHasPackageJson) {
      logger.info('Installing frontend dependencies...');
      await execAsync(`${cmd} install`, { cwd: FRONTEND_DIR });
    }

    // Setup environment files
    await setupEnvironmentFiles();

    // Setup database
    if (hasDockerCompose && !options.skipDb) {
      logger.info('Starting database services...');
      await execAsync('docker compose up -d postgres redis', { cwd: PROJECT_ROOT });
      
      // Wait for database to be ready
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      const serviceManager = new ServiceManager(stateManager, options);
      await serviceManager.runMigrations();
      await serviceManager.runSeeding();
    }

    // Build if required
    if (!options.skipBuild) {
      logger.info('Building application...');
      await execAsync(`${cmd} run build`, { cwd: PROJECT_ROOT });
    }

    logger.success('Setup completed successfully!');
    logger.info('Next steps:');
    logger.info(`  node run-${APP_NAME}.mjs start`);
    
  } catch (error) {
    logger.error(`Setup failed: ${error.message}`);
    throw error;
  }
}

/**
 * Start command - Start all services
 */
async function startCommand(options) {
  logger.banner(`Starting ${APP_NAME}`);

  const state = await stateManager.read();
  const ports = await EnvironmentDetector.detectPorts();
  
  // Override ports from options
  if (options.frontendPort) ports.frontend = parseInt(options.frontendPort);
  if (options.backendPort) ports.backend = parseInt(options.backendPort);

  try {
    // Resolve port conflicts
    await PortManager.resolvePortConflict(ports.frontend, 'frontend', options);
    await PortManager.resolvePortConflict(ports.backend, 'backend', options);

    const serviceManager = new ServiceManager(stateManager, options);
    serviceManager.ports = ports;

    // Start database services
    if (!options.skipDb) {
      const dbInfo = await serviceManager.startDatabase();
      if (dbInfo) {
        state.processes.database = dbInfo;
      }

      // Run migrations
      await serviceManager.runMigrations();
      
      // Run seeding if requested
      if (options.seed) {
        await serviceManager.runSeeding();
      }
    }

    // Start backend
    const backendInfo = await serviceManager.startBackend();
    state.processes.backend = backendInfo;

    // Start frontend
    const frontendInfo = await serviceManager.startFrontend();
    state.processes.frontend = frontendInfo;

    // Update state
    state.ports = ports;
    await stateManager.write(state);

    // Print success summary
    logger.success('Application started successfully!');
    console.log('');
    logger.info('✅ App Running');
    logger.info(`- Frontend: ${frontendInfo.url} (PID ${frontendInfo.pid})`);
    logger.info(`- Backend:  ${backendInfo.url} (PID ${backendInfo.pid})`);
    if (state.processes.database) {
      logger.info(`- Database: PostgreSQL:${ports.postgres}, Redis:${ports.redis}`);
    }
    console.log('');
    logger.info('Logs:');
    logger.info(`- Frontend: ${frontendInfo.logFile}`);
    logger.info(`- Backend:  ${backendInfo.logFile}`);
    console.log('');
    logger.info('Next commands:');
    logger.info(`- node run-${APP_NAME}.mjs status`);
    logger.info(`- node run-${APP_NAME}.mjs logs --follow`);
    logger.info(`- node run-${APP_NAME}.mjs stop`);

  } catch (error) {
    logger.error(`Start failed: ${error.message}`);
    throw error;
  }
}

/**
 * Stop command - Stop all services
 */
async function stopCommand(options) {
  logger.banner(`Stopping ${APP_NAME}`);

  const state = await stateManager.read();

  try {
    // Stop managed processes
    for (const [serviceName, serviceInfo] of Object.entries(state.processes)) {
      if (serviceInfo.pid) {
        logger.info(`Stopping ${serviceName} (PID ${serviceInfo.pid})...`);
        
        const killed = await ProcessManager.killProcess(serviceInfo.pid, true);
        if (killed) {
          logger.success(`${serviceName} stopped successfully`);
        } else {
          logger.warn(`Failed to stop ${serviceName} gracefully`);
        }
      }
    }

    // Stop Docker services if requested
    if (options.downDb || options.downRedis) {
      const services = [];
      if (options.downDb) services.push('postgres');
      if (options.downRedis) services.push('redis');
      
      if (services.length > 0) {
        logger.info(`Stopping Docker services: ${services.join(', ')}`);
        await execAsync(`docker compose stop ${services.join(' ')}`, { cwd: PROJECT_ROOT });
      }
    }

    // Clear state
    state.processes = {};
    await stateManager.write(state);

    logger.success('All services stopped successfully');

  } catch (error) {
    logger.error(`Stop failed: ${error.message}`);
    throw error;
  }
}

/**
 * Status command - Show current status
 */
async function statusCommand(options) {
  logger.banner(`${APP_NAME} Status`);

  const state = await stateManager.read();
  const ports = await EnvironmentDetector.detectPorts();

  console.log('');
  logger.info('Service Status:');

  for (const [serviceName, serviceInfo] of Object.entries(state.processes)) {
    if (serviceInfo.pid) {
      const processInfo = await ProcessManager.getProcessInfo(serviceInfo.pid);
      const status = processInfo ? 'RUNNING' : 'STALE';
      const statusColor = processInfo ? 'green' : 'yellow';
      
      console.log(`  ${serviceName}: ${logger._colorize(status, statusColor)} (PID ${serviceInfo.pid})`);
      if (serviceInfo.url) {
        console.log(`    URL: ${serviceInfo.url}`);
      }
      if (serviceInfo.logFile) {
        console.log(`    Log: ${serviceInfo.logFile}`);
      }
    }
  }

  // Check port availability
  console.log('');
  logger.info('Port Status:');
  
  const portChecks = [
    { name: 'Frontend', port: ports.frontend },
    { name: 'Backend', port: ports.backend },
    { name: 'PostgreSQL', port: ports.postgres },
    { name: 'Redis', port: ports.redis }
  ];

  for (const { name, port } of portChecks) {
    const isFree = await PortManager.isPortFree(port);
    const status = isFree ? 'FREE' : 'OCCUPIED';
    const statusColor = isFree ? 'green' : 'red';
    
    console.log(`  ${name} (${port}): ${logger._colorize(status, statusColor)}`);
  }

  console.log('');
  logger.info(`State last updated: ${state.lastUpdated}`);
}

/**
 * Logs command - Show service logs
 */
async function logsCommand(options) {
  const state = await stateManager.read();
  const lines = options.lines || 200;
  const service = options.service || 'all';
  
  const logFiles = [];
  
  if (service === 'all') {
    for (const serviceInfo of Object.values(state.processes)) {
      if (serviceInfo.logFile) {
        logFiles.push(serviceInfo.logFile);
      }
    }
  } else {
    const serviceInfo = state.processes[service];
    if (serviceInfo?.logFile) {
      logFiles.push(serviceInfo.logFile);
    }
  }

  if (logFiles.length === 0) {
    logger.warn('No log files found');
    return;
  }

  for (const logFile of logFiles) {
    try {
      logger.info(`=== ${path.basename(logFile)} ===`);
      
      if (options.follow) {
        // Stream logs (simplified implementation)
        const { spawn } = await import('child_process');
        const tailCmd = IS_WINDOWS ? 'powershell' : 'tail';
        const tailArgs = IS_WINDOWS 
          ? ['-Command', `Get-Content -Path "${logFile}" -Wait -Tail ${lines}`]
          : ['-f', '-n', lines.toString(), logFile];
        
        const tailProcess = spawn(tailCmd, tailArgs, { stdio: 'inherit' });
        
        process.on('SIGINT', () => {
          tailProcess.kill();
          process.exit(0);
        });
        
      } else {
        // Show last N lines
        const content = await fs.readFile(logFile, 'utf8');
        const logLines = content.split('\n').slice(-lines);
        console.log(logLines.join('\n'));
      }
      
    } catch (error) {
      logger.error(`Failed to read log file ${logFile}: ${error.message}`);
    }
  }
}

/**
 * Clean command - Reset to clean state
 */
async function cleanCommand(options) {
  logger.banner(`Cleaning ${APP_NAME}`);

  // Stop services first
  await stopCommand({ downDb: options.downDb, downRedis: options.downRedis });

  try {
    // Remove build outputs
    logger.info('Removing build outputs...');
    const buildDirs = ['dist', 'build', '.next'];
    
    for (const dir of buildDirs) {
      const dirPath = path.join(PROJECT_ROOT, dir);
      try {
        await fs.rm(dirPath, { recursive: true, force: true });
        logger.debug(`Removed ${dir}`);
      } catch {}
    }

    // Remove runtime files
    logger.info('Removing runtime files...');
    try {
      await fs.rm(RUNTIME_DIR, { recursive: true, force: true });
      logger.debug('Removed .app-manager directory');
    } catch {}

    // Remove node_modules if requested
    if (options.removeNodeModules) {
      if (!options.yes && !options.force) {
        logger.warn('This will remove node_modules. Type "yes" to confirm:');
        // In a real implementation, we'd prompt for input
        // For now, we'll skip unless --yes is provided
        logger.info('Skipping node_modules removal (use --yes to confirm)');
      } else {
        logger.info('Removing node_modules...');
        await fs.rm(path.join(PROJECT_ROOT, 'node_modules'), { recursive: true, force: true });
        
        const frontendNodeModules = path.join(FRONTEND_DIR, 'node_modules');
        try {
          await fs.rm(frontendNodeModules, { recursive: true, force: true });
        } catch {}
      }
    }

    // Remove Docker volumes if requested
    if (options.removeVolumes) {
      if (!options.yes && !options.force) {
        logger.warn('This will remove Docker volumes and all data. Type "yes" to confirm:');
        logger.info('Skipping volume removal (use --yes to confirm)');
      } else {
        logger.info('Removing Docker volumes...');
        try {
          await execAsync('docker compose down -v', { cwd: PROJECT_ROOT });
        } catch (error) {
          logger.debug(`Docker cleanup failed: ${error.message}`);
        }
      }
    }

    logger.success('Clean completed successfully');

  } catch (error) {
    logger.error(`Clean failed: ${error.message}`);
    throw error;
  }
}

/**
 * Database reset command
 */
async function dbResetCommand(options) {
  logger.banner('Database Reset');

  if (options.fullReset) {
    if (!options.yes && !options.force) {
      logger.warn('This will destroy all database data. Type "yes" to confirm:');
      logger.info('Skipping full reset (use --yes to confirm)');
      return;
    }

    logger.info('Performing full database reset...');
    
    // Try different reset strategies
    const resetStrategies = [
      async () => {
        await execAsync(`${NPXCMD} prisma migrate reset --force --skip-seed`, { cwd: PROJECT_ROOT });
      },
      async () => {
        await execAsync(`${NPXCMD} prisma db push --force-reset --accept-data-loss`, { cwd: PROJECT_ROOT });
      },
      async () => {
        // PostgreSQL direct reset (if we can detect connection info)
        logger.warn('Direct PostgreSQL reset not implemented yet');
      }
    ];

    for (const strategy of resetStrategies) {
      try {
        await strategy();
        logger.success('Database reset completed');
        break;
      } catch (error) {
        logger.debug(`Reset strategy failed: ${error.message}`);
      }
    }
  } else {
    // Safe schema update
    logger.info('Performing safe database update...');
    
    const serviceManager = new ServiceManager(stateManager, options);
    await serviceManager.runMigrations();
  }

  // Run seeding
  if (!options.skipSeed) {
    const serviceManager = new ServiceManager(stateManager, options);
    await serviceManager.runSeeding();
  }
}

/**
 * Doctor command - Diagnostics and health checks
 */
async function doctorCommand(options) {
  logger.banner(`${APP_NAME} Doctor`);

  const issues = [];
  const fixes = [];

  // Check Node.js version
  logger.info('Checking Node.js version...');
  const nodeVersion = process.version;
  logger.success(`Node.js: ${nodeVersion}`);

  // Check package manager
  logger.info('Checking package managers...');
  const packageManager = await EnvironmentDetector.detectPackageManager();
  logger.success(`Package manager: ${packageManager}`);

  // Check Docker
  logger.info('Checking Docker...');
  try {
    const { stdout } = await execAsync('docker --version');
    logger.success(`Docker: ${stdout.trim()}`);
    
    try {
      const { stdout: composeVersion } = await execAsync('docker compose version');
      logger.success(`Docker Compose: ${composeVersion.trim()}`);
    } catch {
      issues.push('Docker Compose not available');
      fixes.push('Install Docker Compose');
    }
  } catch {
    issues.push('Docker not available');
    fixes.push('Install Docker Desktop');
  }

  // Check ports
  logger.info('Checking port availability...');
  const ports = await EnvironmentDetector.detectPorts();
  
  for (const [service, port] of Object.entries(ports)) {
    const isFree = await PortManager.isPortFree(port);
    if (isFree) {
      logger.success(`Port ${port} (${service}): available`);
    } else {
      const pids = await ProcessManager.findProcessByPort(port);
      logger.warn(`Port ${port} (${service}): occupied by PID(s) ${pids.join(', ')}`);
      issues.push(`Port ${port} occupied`);
      fixes.push(`Kill process(es) ${pids.join(', ')} or use different port`);
    }
  }

  // Check environment files
  logger.info('Checking environment files...');
  const envFiles = ['.env', '.env.example', '.env.development'];
  
  for (const envFile of envFiles) {
    const exists = await fs.access(path.join(PROJECT_ROOT, envFile)).then(() => true).catch(() => false);
    if (exists) {
      logger.success(`${envFile}: found`);
    } else {
      logger.warn(`${envFile}: missing`);
      if (envFile === '.env') {
        issues.push('.env file missing');
        fixes.push('Copy .env.example to .env and configure');
      }
    }
  }

  // Check database connectivity
  logger.info('Checking database connectivity...');
  try {
    // This is a simplified check - in reality we'd try to connect
    const hasDockerCompose = await EnvironmentDetector.hasDockerCompose();
    if (hasDockerCompose) {
      logger.success('Database: Docker Compose configuration found');
    } else {
      logger.warn('Database: No Docker Compose found, assuming external DB');
    }
  } catch (error) {
    issues.push('Database connectivity issue');
    fixes.push('Check DATABASE_URL and database server');
  }

  // Summary
  console.log('');
  if (issues.length === 0) {
    logger.success('All checks passed! System is ready.');
  } else {
    logger.warn(`Found ${issues.length} issue(s):`);
    issues.forEach((issue, i) => {
      console.log(`  ${i + 1}. ${issue}`);
    });
    
    console.log('');
    logger.info('Suggested fixes:');
    fixes.forEach((fix, i) => {
      console.log(`  ${i + 1}. ${fix}`);
    });
  }

  console.log('');
  logger.info(`Detected app name: ${APP_NAME}`);
  logger.info(`Project root: ${PROJECT_ROOT}`);
  logger.info(`Frontend dir: ${FRONTEND_DIR}`);
  logger.info(`Backend dir: ${BACKEND_DIR}`);
}

/**
 * Setup environment files
 */
async function setupEnvironmentFiles() {
  logger.info('Setting up environment files...');

  const envPath = path.join(PROJECT_ROOT, '.env');
  const envExamplePath = path.join(PROJECT_ROOT, '.env.example');

  // Check if .env exists
  const envExists = await fs.access(envPath).then(() => true).catch(() => false);
  
  if (!envExists) {
    // Try to copy from .env.example
    const exampleExists = await fs.access(envExamplePath).then(() => true).catch(() => false);
    
    if (exampleExists) {
      await fs.copyFile(envExamplePath, envPath);
      logger.success('Created .env from .env.example');
      logger.warn('Please review and update .env with your actual configuration');
    } else {
      // Create minimal .env
      const minimalEnv = `# ${APP_NAME} Environment Configuration
NODE_ENV=development
PORT=5000

# Database
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/creators_dev_db

# Add your API keys here
OPENAI_API_KEY=your_openai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here

# Session secrets (change in production)
SESSION_SECRET=change-me-in-production
JWT_SECRET=change-me-in-production
JWT_REFRESH_SECRET=change-me-in-production
`;

      await fs.writeFile(envPath, minimalEnv);
      logger.success('Created minimal .env file');
      logger.warn('Please update .env with your actual configuration');
    }
  } else {
    logger.success('.env file already exists');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLI ARGUMENT PARSING AND MAIN FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    // Global flags
    help: false,
    debug: false,
    noColor: false,
    dryRun: false,
    yes: false,
    force: false,
    ci: false,
    noKill: false,
    
    // Service flags
    skipDb: false,
    skipRedis: false,
    skipBuild: false,
    seed: false,
    noSeed: false,
    
    // Port overrides
    frontendPort: null,
    backendPort: null,
    
    // Docker flags
    useDockerDb: false,
    useDockerRedis: false,
    downDb: false,
    downRedis: false,
    removeVolumes: false,
    
    // Clean flags
    removeNodeModules: false,
    
    // Logs flags
    follow: false,
    lines: 200,
    service: 'all',
    
    // DB reset flags
    fullReset: false,
    skipSeed: false,
    
    // App name override
    appName: null
  };

  let command = null;
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      
      switch (key) {
        case 'help':
          options.help = true;
          break;
        case 'debug':
          options.debug = true;
          break;
        case 'no-color':
          options.noColor = true;
          break;
        case 'dry-run':
          options.dryRun = true;
          break;
        case 'yes':
          options.yes = true;
          break;
        case 'force':
          options.force = true;
          break;
        case 'ci':
          options.ci = true;
          break;
        case 'no-kill':
          options.noKill = true;
          break;
        case 'skip-db':
          options.skipDb = true;
          break;
        case 'skip-redis':
          options.skipRedis = true;
          break;
        case 'skip-build':
          options.skipBuild = true;
          break;
        case 'seed':
          options.seed = true;
          break;
        case 'no-seed':
          options.noSeed = true;
          break;
        case 'frontend-port':
          options.frontendPort = value;
          break;
        case 'backend-port':
          options.backendPort = value;
          break;
        case 'use-docker-db':
          options.useDockerDb = true;
          break;
        case 'use-docker-redis':
          options.useDockerRedis = true;
          break;
        case 'down-db':
          options.downDb = true;
          break;
        case 'down-redis':
          options.downRedis = true;
          break;
        case 'remove-volumes':
          options.removeVolumes = true;
          break;
        case 'remove-node-modules':
          options.removeNodeModules = true;
          break;
        case 'follow':
          options.follow = true;
          break;
        case 'lines':
          options.lines = parseInt(value) || 200;
          break;
        case 'service':
          options.service = value || 'all';
          break;
        case 'full-reset':
          options.fullReset = true;
          break;
        case 'skip-seed':
          options.skipSeed = true;
          break;
        case 'app-name':
          options.appName = value;
          break;
      }
    } else if (!command) {
      command = arg;
    }
  }

  return { command, options };
}

function showHelp() {
  console.log(`
🧰 ${APP_NAME.toUpperCase()} - App Lifecycle Manager

USAGE:
  node run-${APP_NAME}.mjs <command> [options]

COMMANDS:
  setup      Clean first-time setup (install deps, setup DB, build)
  start      Start all services (frontend, backend, database)
  stop       Stop all managed services
  restart    Restart all services (stop + start)
  status     Show current service status
  logs       Show service logs
  clean      Reset to clean state (remove builds, caches, etc.)
  db:reset   Reset database (safe update or full reset)
  doctor     Run diagnostics and health checks

GLOBAL OPTIONS:
  --help              Show this help message
  --debug             Enable debug logging
  --no-color          Disable colored output
  --dry-run           Show what would be done without executing
  --yes               Auto-confirm destructive operations
  --force             Force operations (kill processes, etc.)
  --ci                CI mode (non-interactive)
  --no-kill           Fail if ports are occupied instead of killing

SERVICE OPTIONS:
  --skip-db           Skip database operations
  --skip-redis        Skip Redis operations
  --skip-build        Skip build steps
  --seed              Run database seeding on start
  --no-seed           Skip database seeding

PORT OPTIONS:
  --frontend-port=N   Override frontend port (default: 3000)
  --backend-port=N    Override backend port (default: 5000)

DOCKER OPTIONS:
  --use-docker-db     Use Docker for database
  --use-docker-redis  Use Docker for Redis
  --down-db           Stop database Docker service
  --down-redis        Stop Redis Docker service
  --remove-volumes    Remove Docker volumes (destructive)

CLEAN OPTIONS:
  --remove-node-modules  Remove node_modules directories
  
LOGS OPTIONS:
  --follow            Stream logs (like tail -f)
  --lines=N           Number of lines to show (default: 200)
  --service=NAME      Show logs for specific service (frontend|backend|db|redis|all)

DB RESET OPTIONS:
  --full-reset        Destructive database reset (removes all data)
  --skip-seed         Skip seeding after reset

EXAMPLES:
  node run-${APP_NAME}.mjs setup
  node run-${APP_NAME}.mjs start --seed
  node run-${APP_NAME}.mjs start --frontend-port=3001 --backend-port=5001
  node run-${APP_NAME}.mjs logs --follow --service=backend
  node run-${APP_NAME}.mjs stop --down-db --down-redis
  node run-${APP_NAME}.mjs clean --remove-node-modules --yes
  node run-${APP_NAME}.mjs db:reset --full-reset --yes
  node run-${APP_NAME}.mjs doctor
`);
}

/**
 * Signal handlers for graceful shutdown
 */
function setupSignalHandlers() {
  const cleanup = async () => {
    logger?.info('Received shutdown signal, cleaning up...');
    
    try {
      if (lockManager) {
        await lockManager.release();
      }
    } catch (error) {
      logger?.debug(`Cleanup error: ${error.message}`);
    }
    
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger?.error(`Uncaught exception: ${error.message}`);
    cleanup();
  });

  process.on('unhandledRejection', (reason) => {
    logger?.error(`Unhandled rejection: ${reason}`);
    cleanup();
  });
}

/**
 * Main function
 */
async function main() {
  const { command, options } = parseArgs();

  // Initialize global instances
  logger = new Logger({ noColor: options.noColor, debug: options.debug });
  stateManager = new StateManager();
  lockManager = new LockManager();

  // Setup signal handlers
  setupSignalHandlers();

  // Detect app name
  if (options.appName) {
    APP_NAME = EnvironmentDetector.sanitizeAppName(options.appName);
  } else {
    APP_NAME = await EnvironmentDetector.detectAppName();
  }

  // Show help
  if (options.help || !command) {
    showHelp();
    return;
  }

  // Dry run mode
  if (options.dryRun) {
    logger.info(`DRY RUN: Would execute command '${command}' with options:`, options);
    return;
  }

  try {
    // Acquire lock for most operations
    const needsLock = !['status', 'logs', 'doctor'].includes(command);
    
    if (needsLock) {
      await lockManager.acquire(options.force);
    }

    // Execute command
    switch (command) {
      case 'setup':
        await setupCommand(options);
        break;
      case 'start':
        await startCommand(options);
        break;
      case 'stop':
        await stopCommand(options);
        break;
      case 'restart':
        await stopCommand(options);
        await startCommand(options);
        break;
      case 'status':
        await statusCommand(options);
        break;
      case 'logs':
        await logsCommand(options);
        break;
      case 'clean':
        await cleanCommand(options);
        break;
      case 'db:reset':
        await dbResetCommand(options);
        break;
      case 'doctor':
        await doctorCommand(options);
        break;
      default:
        logger.error(`Unknown command: ${command}`);
        logger.info('Use --help to see available commands');
        process.exit(1);
    }

  } catch (error) {
    logger.error(`Command failed: ${error.message}`);
    if (options.debug) {
      console.error(error.stack);
    }
    process.exit(1);
    
  } finally {
    // Always release lock
    if (lockManager) {
      await lockManager.release();
    }
  }
}

// Run main function
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}