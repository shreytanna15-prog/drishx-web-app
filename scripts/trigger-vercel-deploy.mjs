import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { config as loadEnv } from "dotenv";

const ROOT = process.cwd();
const ENV_FILE = path.join(ROOT, ".env.deploy");
const COMMIT_LOG = path.join(ROOT, "commit.txt");

function log(step, message) {
  console.log(`[deploy:trigger] ${step} — ${message}`);
}

function fail(step, message) {
  console.error(`[deploy:trigger] FAIL @ ${step} — ${message}`);
  process.exit(1);
}

function runGit(args, options = {}) {
  const result = spawnSync("git", args, {
    cwd: ROOT,
    encoding: "utf8",
    shell: false,
    ...options,
    env: {
      ...process.env,
      ...(options.env ?? {}),
    },
  });

  if (result.error) {
    return { ok: false, stdout: "", stderr: result.error.message, status: 1 };
  }

  return {
    ok: result.status === 0,
    stdout: (result.stdout ?? "").trim(),
    stderr: (result.stderr ?? "").trim(),
    status: result.status ?? 1,
  };
}

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    fail("env", `Missing ${name}. Copy .env.deploy.example to .env.deploy and fill it in.`);
  }
  return value;
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function formatStamp(date = new Date()) {
  const dd = pad2(date.getDate());
  const mm = pad2(date.getMonth() + 1);
  const yyyy = date.getFullYear();
  const hh = pad2(date.getHours());
  const min = pad2(date.getMinutes());
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

function nextLogIndex(contents) {
  const matches = [...contents.matchAll(/^\s*(\d+)\./gm)];
  if (matches.length === 0) return 1;
  return Math.max(...matches.map((m) => Number(m[1]))) + 1;
}

function parseHttpsRemote(remoteUrl) {
  // https://github.com/owner/repo.git
  // https://github.com/owner/repo
  const match = remoteUrl.match(
    /^https:\/\/(?:[^@]+@)?github\.com\/([^/]+)\/([^/.]+)(?:\.git)?\/?$/i,
  );
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}

function rejectCachedDeployToken() {
  // Best-effort: drop any GCM entry created from x-access-token URL pushes.
  const input = "protocol=https\nhost=github.com\nusername=x-access-token\n\n";
  spawnSync("git", ["credential", "reject"], {
    cwd: ROOT,
    encoding: "utf8",
    shell: false,
    input,
  });
}

function main() {
  log("start", "Manual Vercel trigger commit (Person X identity)");

  if (!existsSync(ENV_FILE)) {
    fail("env", `.env.deploy not found. Copy .env.deploy.example → .env.deploy`);
  }

  loadEnv({ path: ENV_FILE, override: true, quiet: true });

  const token = requireEnv("DEPLOY_GH_TOKEN");
  const deployName = requireEnv("DEPLOY_GIT_NAME");
  const deployEmail = requireEnv("DEPLOY_GIT_EMAIL");
  const branch = (process.env.DEPLOY_BRANCH ?? "main").trim();
  const syncBranch = (process.env.DEPLOY_SYNC_BRANCH ?? "dev").trim();
  const remote = (process.env.DEPLOY_REMOTE ?? "origin").trim();
  const skipSync =
    process.env.DEPLOY_SKIP_SYNC === "1" ||
    process.env.DEPLOY_SKIP_SYNC === "true";

  log(
    "env",
    `Loaded .env.deploy (branch=${branch}, sync=${skipSync ? "skipped" : syncBranch}, remote=${remote})`,
  );

  const branchResult = runGit(["branch", "--show-current"]);
  if (!branchResult.ok) {
    fail("branch", branchResult.stderr || "Could not read current branch");
  }
  if (branchResult.stdout !== branch) {
    fail(
      "branch",
      `Must be on '${branch}' (currently '${branchResult.stdout}'). Merge/push your work first, then run this.`,
    );
  }
  log("branch", `On ${branch}`);

  const statusResult = runGit(["status", "--porcelain"]);
  if (!statusResult.ok) {
    fail("clean", statusResult.stderr || "git status failed");
  }

  const dirtyLines = statusResult.stdout
    ? statusResult.stdout.split("\n").filter(Boolean)
    : [];
  const blocking = dirtyLines.filter((line) => {
    const file = line.slice(3).trim().replace(/\\/g, "/");
    // Allow commit.txt itself to be modified/untracked; block everything else.
    return file !== "commit.txt" && !file.endsWith("/commit.txt");
  });

  if (blocking.length > 0) {
    fail(
      "clean",
      `Working tree has unrelated changes:\n${blocking.join("\n")}\nCommit/stash them first.`,
    );
  }
  log("clean", "Working tree OK (only commit.txt may change)");

  log("pull", `Fetching/updating ${remote}/${branch} (ff-only)`);
  const pullResult = runGit(["pull", "--ff-only", remote, branch]);
  if (!pullResult.ok) {
    fail("pull", pullResult.stderr || pullResult.stdout || "git pull --ff-only failed");
  }
  log("pull", "Up to date");

  const msgResult = runGit(["log", "-1", "--pretty=%s"]);
  if (!msgResult.ok || !msgResult.stdout) {
    fail("message", msgResult.stderr || "Could not read last commit message");
  }
  const lastMessage = msgResult.stdout;
  log("message", `Last commit: "${lastMessage}"`);

  const existing = existsSync(COMMIT_LOG) ? readFileSync(COMMIT_LOG, "utf8") : "";
  const index = nextLogIndex(existing);
  const line = `${index}. ${formatStamp()} : "${lastMessage}"`;
  const nextContents = existing
    ? `${existing.replace(/\s*$/, "")}\n${line}\n`
    : `${line}\n`;

  writeFileSync(COMMIT_LOG, nextContents, "utf8");
  log("log", `Appended to commit.txt → ${line}`);

  const addResult = runGit(["add", "--", "commit.txt"]);
  if (!addResult.ok) {
    fail("add", addResult.stderr || "git add commit.txt failed");
  }
  log("add", "Staged commit.txt");

  const commitEnv = {
    GIT_AUTHOR_NAME: deployName,
    GIT_AUTHOR_EMAIL: deployEmail,
    GIT_COMMITTER_NAME: deployName,
    GIT_COMMITTER_EMAIL: deployEmail,
  };

  const commitMessage = `chore: deploy trigger log #${index}`;
  const commitResult = runGit(["commit", "-m", commitMessage], { env: commitEnv });
  if (!commitResult.ok) {
    fail("commit", commitResult.stderr || commitResult.stdout || "git commit failed");
  }
  log("commit", `Created as ${deployName} <${deployEmail}> — ${commitMessage}`);

  const remoteUrlResult = runGit(["remote", "get-url", remote]);
  if (!remoteUrlResult.ok) {
    fail("remote", remoteUrlResult.stderr || `Could not read ${remote} URL`);
  }

  const parsed = parseHttpsRemote(remoteUrlResult.stdout);
  if (!parsed) {
    fail(
      "remote",
      `Expected https://github.com/owner/repo remote, got: ${remoteUrlResult.stdout}`,
    );
  }

  const pushUrl = `https://x-access-token:${token}@github.com/${parsed.owner}/${parsed.repo}.git`;
  log("push", `Pushing ${branch} as deploy account (token auth, one-shot, no credential store)`);

  // Disable credential.helper so Git Credential Manager does not save x-access-token.
  const pushResult = runGit(
    ["-c", "credential.helper=", "push", pushUrl, `HEAD:${branch}`],
    {
      env: {
        GIT_TERMINAL_PROMPT: "0",
        GCM_INTERACTIVE: "never",
      },
    },
  );

  // Always try to scrub a cached deploy token, even if push failed mid-way.
  rejectCachedDeployToken();

  if (!pushResult.ok) {
    fail(
      "push",
      pushResult.stderr || pushResult.stdout || "git push failed — check DEPLOY_GH_TOKEN scopes (repo)",
    );
  }

  log("push", `Pushed to ${remote}/${branch}`);
  log("creds", "Cleared any cached x-access-token GitHub credential (best-effort)");

  if (skipSync) {
    log(
      "done",
      `Trigger pushed on ${branch} (sync skipped — DEPLOY_SKIP_SYNC). Check Vercel for Ready (not Blocked).`,
    );
    console.log(
      `[deploy:trigger] Left on '${branch}'. Your git user config was not changed.`,
    );
    return;
  }

  // Keep work branch in sync with the trigger commit (your credentials, not Person X).
  log("sync", `Checking out ${syncBranch} to merge ${branch}`);
  const checkoutSync = runGit(["checkout", syncBranch]);
  if (!checkoutSync.ok) {
    fail(
      "sync-checkout",
      checkoutSync.stderr || checkoutSync.stdout || `Could not checkout ${syncBranch}`,
    );
  }
  log("sync-checkout", `On ${syncBranch}`);

  log("sync-pull", `Updating ${remote}/${syncBranch} (ff-only)`);
  const pullSync = runGit(["pull", "--ff-only", remote, syncBranch]);
  if (!pullSync.ok) {
    fail(
      "sync-pull",
      pullSync.stderr || pullSync.stdout || `git pull --ff-only ${remote} ${syncBranch} failed`,
    );
  }
  log("sync-pull", `${syncBranch} up to date`);

  log("sync-merge", `Merging ${branch} into ${syncBranch}`);
  const mergeResult = runGit([
    "merge",
    branch,
    "--no-edit",
    "-m",
    `chore: sync ${branch} into ${syncBranch} after deploy trigger`,
  ]);
  if (!mergeResult.ok) {
    fail(
      "sync-merge",
      mergeResult.stderr ||
        mergeResult.stdout ||
        `Merge conflict merging ${branch} into ${syncBranch}. Resolve manually, then push.`,
    );
  }
  log("sync-merge", mergeResult.stdout || `Merged ${branch} → ${syncBranch}`);

  log("sync-push", `Pushing ${syncBranch} with your normal git credentials`);
  const pushSync = runGit(["push", remote, syncBranch]);
  if (!pushSync.ok) {
    fail(
      "sync-push",
      pushSync.stderr ||
        pushSync.stdout ||
        `git push ${remote} ${syncBranch} failed — pick your own GitHub account if prompted (not x-access-token)`,
    );
  }
  log("sync-push", `Pushed ${remote}/${syncBranch}`);

  log(
    "done",
    `Trigger on ${branch} + ${syncBranch} synced. Check Vercel for Ready (not Blocked).`,
  );
  console.log(
    `[deploy:trigger] Left on '${syncBranch}'. Your git user config was not changed.`,
  );
}

main();
