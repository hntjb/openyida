#!/usr/bin/env node
/**
 * OpenYida CLI - 宜搭命令行工具
 *
 * 安装：npm install -g openyida
 * 用法：yida <命令> [参数]
 *
 * 通过调用 .claude/skills/ 下的脚本复用 yida-skills 的能力。
 * Skills 安装位置：<项目根目录>/.claude/skills/
 */

"use strict";

const { Command } = require("commander");
const { execSync, spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const program = new Command();

// ── 工具函数 ──────────────────────────────────────────────────────────

/**
 * 查找项目根目录（向上查找 config.json 或 .git）
 * CLI 在项目目录内运行时，需要定位到包含 .claude/skills 的根目录
 */
function findProjectRoot() {
  let currentDir = process.cwd();
  while (currentDir !== path.dirname(currentDir)) {
    if (
      fs.existsSync(path.join(currentDir, "config.json")) ||
      fs.existsSync(path.join(currentDir, ".git"))
    ) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }
  return process.cwd();
}

/**
 * 获取 skill 脚本路径，并检查是否已安装
 */
function getSkillScript(skillName, scriptFile) {
  const projectRoot = findProjectRoot();
  const scriptPath = path.join(projectRoot, ".claude", "skills", skillName, "scripts", scriptFile);

  if (!fs.existsSync(scriptPath)) {
    console.error(`\n❌ 未找到 skill 脚本：${scriptPath}`);
    console.error(`\n请先运行安装脚本：`);
    console.error(`  bash install-skills.sh`);
    console.error(`\n或手动克隆 skills：`);
    console.error(`  git clone https://github.com/openyida/yida-skills.git .cache/yida-skills`);
    console.error(`  mv .cache/yida-skills/skills .claude/skills`);
    process.exit(1);
  }

  return scriptPath;
}

/**
 * 运行 Node.js skill 脚本，将 stdout/stderr 透传到终端
 */
function runNodeScript(scriptPath, args = []) {
  const child = spawn("node", [scriptPath, ...args], {
    stdio: "inherit",
    cwd: findProjectRoot(),
  });

  child.on("close", (exitCode) => {
    process.exit(exitCode ?? 0);
  });

  child.on("error", (error) => {
    console.error(`\n❌ 执行失败：${error.message}`);
    process.exit(1);
  });
}

/**
 * 运行 Python skill 脚本，将 stdout/stderr 透传到终端
 */
function runPythonScript(scriptPath, args = []) {
  const child = spawn("python3", [scriptPath, ...args], {
    stdio: "inherit",
    cwd: findProjectRoot(),
  });

  child.on("close", (exitCode) => {
    process.exit(exitCode ?? 0);
  });

  child.on("error", (error) => {
    if (error.code === "ENOENT") {
      console.error(`\n❌ 未找到 python3，请先安装 Python 3.8+`);
    } else {
      console.error(`\n❌ 执行失败：${error.message}`);
    }
    process.exit(1);
  });
}

// ── CLI 配置 ──────────────────────────────────────────────────────────

program
  .name("yida")
  .description("OpenYida CLI - 宜搭命令行工具")
  .version("0.1.0");

// ── yida login ────────────────────────────────────────────────────────

program
  .command("login")
  .description("扫码登录宜搭（打开浏览器扫码）")
  .action(() => {
    console.log("🔐 正在启动登录流程，请扫码...\n");
    const scriptPath = getSkillScript("yida-login", "login.py");
    runPythonScript(scriptPath);
  });

// ── yida logout ───────────────────────────────────────────────────────

program
  .command("logout")
  .description("退出登录，清除本地登录态")
  .action(() => {
    console.log("👋 正在退出登录...\n");
    const scriptPath = getSkillScript("yida-logout", "logout.py");
    runPythonScript(scriptPath);
  });

// ── yida create-app ───────────────────────────────────────────────────

program
  .command("create-app <name>")
  .description("创建宜搭应用")
  .option("-d, --description <desc>", "应用描述（默认同应用名称）")
  .option("-i, --icon <icon>", "图标标识（默认 xian-yingyong）", "xian-yingyong")
  .option("-c, --color <color>", "图标颜色（默认 #0089FF）", "#0089FF")
  .addHelpText("after", `
示例：
  $ yida create-app "考勤管理"
  $ yida create-app "考勤管理" -d "员工考勤打卡系统" -i xian-daka -c "#00B853"

可用图标：
  xian-xinwen, xian-zhengfu, xian-yingyong, xian-xueshimao, xian-qiye,
  xian-danju, xian-shichang, xian-jingli, xida-falv, xian-baogao,
  huoche, xian-shenbao, xian-diqiu, xian-qiche, xian-feiji,
  xian-diannao, xian-gongzuozheng, xian-gouwuche, xian-xinyongka,
  xian-huodong, xian-jiangbei, xian-liucheng, xian-chaxun, xian-daka

可用颜色：
  #0089FF #00B853 #FFA200 #FF7357 #5C72FF
  #85C700 #FFC505 #FF6B7A #8F66FF #14A9FF`)
  .action((name, options) => {
    const scriptPath = getSkillScript("yida-create-app", "create-app.js");
    const args = [name];
    if (options.description) args.push(options.description);
    else args.push(name); // 默认 description 同 name
    args.push(options.icon);
    args.push(options.color);
    runNodeScript(scriptPath, args);
  });

// ── yida create-page ──────────────────────────────────────────────────

program
  .command("create-page")
  .description("在指定应用中创建自定义展示页面")
  .argument("<app>", "应用 ID（如 APP_XXXXXXXXXXXXX）")
  .argument("<name>", "页面名称")
  .addHelpText("after", `
示例：
  $ yida create-page APP_XXXXXXXXXXXXX "游戏主页"
  $ yida create-page APP_XXXXXXXXXXXXX "数据看板"`)
  .action((app, name) => {
    const scriptPath = getSkillScript("yida-create-page", "create-page.js");
    runNodeScript(scriptPath, [app, name]);
  });

// ── yida create-form ──────────────────────────────────────────────────

program
  .command("create-form")
  .description("在指定应用中创建表单页面")
  .argument("<app>", "应用 ID（如 APP_XXXXXXXXXXXXX）")
  .argument("<name>", "表单名称")
  .argument("<fields>", "字段定义（JSON 字符串或 JSON 文件路径）")
  .addHelpText("after", `
示例：
  $ yida create-form APP_XXX "客户信息" fields.json
  $ yida create-form APP_XXX "客户信息" '[{"type":"TextField","label":"姓名"}]'`)
  .action((app, name, fields) => {
    const scriptPath = getSkillScript("yida-create-form-page", "create-form-page.js");
    runNodeScript(scriptPath, [app, name, fields]);
  });

// ── yida publish ──────────────────────────────────────────────────────

program
  .command("publish")
  .description("编译并发布自定义页面到宜搭")
  .argument("<file>", "源文件路径（如 pages/src/myapp.js）")
  .argument("<app>", "应用 ID（如 APP_XXXXXXXXXXXXX）")
  .argument("<form>", "表单/页面 UUID（如 FORM-XXXXXXXXXXXXX）")
  .addHelpText("after", `
示例：
  $ yida publish pages/src/myapp.js APP_XXXXXXXXXXXXX FORM-XXXXXXXXXXXXX`)
  .action((file, app, form) => {
    const scriptPath = getSkillScript("yida-publish-page", "publish.js");
    runNodeScript(scriptPath, [app, form, file]);
  });

// ── yida get-schema ───────────────────────────────────────────────────

program
  .command("get-schema")
  .description("获取表单/页面的完整 Schema 结构")
  .argument("<app>", "应用 ID（如 APP_XXXXXXXXXXXXX）")
  .argument("<form>", "表单 UUID（如 FORM-XXXXXXXXXXXXX）")
  .addHelpText("after", `
示例：
  $ yida get-schema APP_XXXXXXXXXXXXX FORM-XXXXXXXXXXXXX
  $ yida get-schema APP_XXXXXXXXXXXXX FORM-XXXXXXXXXXXXX > schema.json`)
  .action((app, form) => {
    const scriptPath = getSkillScript("yida-get-schema", "get-schema.js");
    runNodeScript(scriptPath, [app, form]);
  });

// ── yida config ───────────────────────────────────────────────────────

program
  .command("config")
  .description("查看当前项目配置")
  .action(() => {
    const projectRoot = findProjectRoot();
    const configPath = path.join(projectRoot, "config.json");

    console.log(`📁 项目根目录：${projectRoot}`);
    console.log(`📄 配置文件：${configPath}`);
    console.log("");

    if (!fs.existsSync(configPath)) {
      console.log("⚠️  未找到 config.json，使用默认配置");
      console.log("   defaultBaseUrl: https://www.aliwork.com");
      return;
    }

    try {
      const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      console.log("当前配置：");
      Object.entries(config).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });
    } catch {
      console.error("❌ 读取配置文件失败");
    }

    // 检查登录态
    const cookiePath = path.join(projectRoot, ".cache", "cookies.json");
    console.log("");
    if (fs.existsSync(cookiePath)) {
      try {
        const cookieData = JSON.parse(fs.readFileSync(cookiePath, "utf-8"));
        const cookies = Array.isArray(cookieData) ? cookieData : cookieData.cookies || [];
        const hasToken = cookies.some((c) => c.name === "tianshu_csrf_token");
        console.log(`🔑 登录态：${hasToken ? "✅ 已登录" : "⚠️  Cookie 存在但可能已过期"}`);
      } catch {
        console.log("🔑 登录态：⚠️  Cookie 文件损坏");
      }
    } else {
      console.log("🔑 登录态：❌ 未登录（运行 yida login 登录）");
    }

    // 检查 skills 安装
    const skillsPath = path.join(projectRoot, ".claude", "skills");
    console.log("");
    if (fs.existsSync(skillsPath)) {
      const skills = fs.readdirSync(skillsPath).filter((name) =>
        fs.statSync(path.join(skillsPath, name)).isDirectory()
      );
      console.log(`📦 已安装 Skills（${skills.length} 个）：`);
      skills.forEach((skill) => console.log(`  - ${skill}`));
    } else {
      console.log("📦 Skills：❌ 未安装（运行 bash install-skills.sh 安装）");
    }
  });

// ── yida shell ────────────────────────────────────────────────────────

program
  .command("shell")
  .description("进入交互式 REPL 模式")
  .action(() => {
    const readline = require("readline");

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: "yida> ",
      historySize: 100,
    });

    console.log("🤖 OpenYida Shell（输入 help 查看命令，输入 exit 退出）\n");
    rl.prompt();

    rl.on("line", (line) => {
      const input = line.trim();

      if (!input) {
        rl.prompt();
        return;
      }

      if (input === "exit" || input === "quit") {
        console.log("👋 再见！");
        rl.close();
        return;
      }

      if (input === "help") {
        console.log(`
可用命令：
  login                          扫码登录
  logout                         退出登录
  create-app <name>              创建应用
  create-page <app> <name>       创建自定义页面
  create-form <app> <name> <fields>  创建表单页面
  publish <file> <app> <form>    发布页面
  get-schema <app> <form>        获取表单 Schema
  config                         查看配置
  exit / quit                    退出 Shell
`);
        rl.prompt();
        return;
      }

      // 将输入解析为 argv 并交给 Commander 处理
      const args = parseShellArgs(input);
      try {
        // 暂停 readline，等待子命令完成后恢复
        rl.pause();
        const child = spawn(process.execPath, [process.argv[1], ...args], {
          stdio: "inherit",
          cwd: process.cwd(),
        });
        child.on("close", () => {
          rl.resume();
          rl.prompt();
        });
        child.on("error", (error) => {
          console.error(`\n❌ 执行失败：${error.message}`);
          rl.resume();
          rl.prompt();
        });
      } catch (error) {
        console.error(`\n❌ 错误：${error.message}`);
        rl.prompt();
      }
    });

    rl.on("close", () => {
      process.exit(0);
    });
  });

/**
 * 简单的 shell 参数解析（支持引号包裹的参数）
 */
function parseShellArgs(input) {
  const args = [];
  let current = "";
  let inQuote = false;
  let quoteChar = "";

  for (const char of input) {
    if (inQuote) {
      if (char === quoteChar) {
        inQuote = false;
      } else {
        current += char;
      }
    } else if (char === '"' || char === "'") {
      inQuote = true;
      quoteChar = char;
    } else if (char === " ") {
      if (current) {
        args.push(current);
        current = "";
      }
    } else {
      current += char;
    }
  }

  if (current) {
    args.push(current);
  }

  return args;
}

// ── 解析并执行 ────────────────────────────────────────────────────────

program.parse(process.argv);
