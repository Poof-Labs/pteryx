import chalk from "chalk";

const timestamp = () => chalk.dim(`${new Date().toISOString()}`);

export const logger = {
  info: (message: string, ...args: any[]) => {
    console.log(`${timestamp()} ${chalk.blue("INFO")} ${message}`, ...args);
  },
  debug: (message: string, ...args: any[]) => {
    console.log(`${timestamp()} ${chalk.magenta("DEBUG")} ${message}`, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    console.log(`${timestamp()} ${chalk.yellow("WARN")} ${message}`, ...args);
  },
  error: (message: string, ...args: any[]) => {
    console.log(`${timestamp()} ${chalk.red("ERROR")} ${message}`, ...args);
  },
  bot: (message: string, ...args: any[]) => {
    console.log(`${timestamp()} ${chalk.cyan("BOT")} ${message}`, ...args);
  },
  fatal: (message: string, ...args: any[]) => {
    console.log(`${timestamp()} ${chalk.red.bold("FATAL")} ${message}`, ...args);
    process.exit(1);
  },
  startup: (message: string, ...args: any[]) => {
    console.log(`${timestamp()} ${chalk.green.bold("STARTUP")} ${message}`, ...args);
  },
  shutdown: (message: string, ...args: any[]) => {
    console.log(`${timestamp()} ${chalk.yellow.bold("SHUTDOWN")} ${message}`, ...args);
  },
  nodestatus: (message: string, ...args: any[]) => {
    console.log(`${timestamp()} ${chalk.blue.bold("NODE_STATUS")} ${message}`, ...args);
  },
  deploy: (message: string, ...args: any[]) => {
    console.log(`${timestamp()} ${chalk.green.bold("DEPLOY")} ${message}`, ...args);
  }
};
