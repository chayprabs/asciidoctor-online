import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

interface CompileRequest {
  root: string;
  entry: string;
  format: "html5" | "pdf" | "epub" | "docbook";
  output: string;
  attributesFile: string;
}

interface CompileResponse {
  ok: boolean;
  error?: string;
  warnings: string[];
}

interface PendingRequest {
  resolve: (response: CompileResponse) => void;
  reject: (error: Error) => void;
}

class PersistentJrubyRunner {
  private process: ChildProcessWithoutNullStreams | null = null;
  private readonly pending: PendingRequest[] = [];
  private stderr = "";
  private scriptPath = "";

  private ensureProcess(): ChildProcessWithoutNullStreams {
    if (this.process) {
      return this.process;
    }

    const scriptPath =
      process.env.JRUBY_COMPILE_SERVER_PATH ??
      fileURLToPath(new URL("../runtime/compile_server.rb", import.meta.url));
    this.scriptPath = scriptPath;
    const child = spawn("jruby", [scriptPath], {
      cwd: dirname(scriptPath),
      stdio: "pipe",
      shell: process.platform === "win32",
    });

    let stdoutBuffer = "";
    child.stdout.on("data", (chunk) => {
      stdoutBuffer += chunk.toString();
      let newlineIndex = stdoutBuffer.indexOf("\n");
      while (newlineIndex >= 0) {
        const line = stdoutBuffer.slice(0, newlineIndex).trim();
        stdoutBuffer = stdoutBuffer.slice(newlineIndex + 1);
        if (line) {
          this.handleResponseLine(line);
        }
        newlineIndex = stdoutBuffer.indexOf("\n");
      }
    });

    child.stderr.on("data", (chunk) => {
      this.stderr += chunk.toString();
    });

    child.on("exit", (code) => {
      const error = new Error(
        `Persistent JRuby runner exited with code ${code ?? 1} using ${this.scriptPath}: ${this.stderr}`,
      );
      while (this.pending.length) {
        this.pending.shift()?.reject(error);
      }
      this.process = null;
      this.stderr = "";
    });

    this.process = child;
    return child;
  }

  private handleResponseLine(line: string) {
    const pending = this.pending.shift();
    if (!pending) {
      return;
    }

    try {
      const response = JSON.parse(line) as CompileResponse;
      pending.resolve(response);
    } catch (error) {
      pending.reject(
        error instanceof Error ? error : new Error("Invalid JRuby response"),
      );
    }
  }

  compile(request: CompileRequest): Promise<CompileResponse> {
    return new Promise((resolve, reject) => {
      const child = this.ensureProcess();
      this.pending.push({ resolve, reject });
      child.stdin.write(`${JSON.stringify(request)}\n`);
    });
  }
}

let runner: PersistentJrubyRunner | null = null;

export function getPersistentJrubyRunner(): PersistentJrubyRunner {
  if (!runner) {
    runner = new PersistentJrubyRunner();
  }
  return runner;
}
