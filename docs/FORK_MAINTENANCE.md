# Keeping this fork current

The default branch is `master`. HA, peer setup and upstream-error preservation
are retained as commits, with the original project's history merged underneath.

For a fresh clone of `rareba/9router`, configure the original repository once:

```sh
git remote add upstream https://github.com/decolua/9router.git
```

Start with a clean working tree, then merge and check upstream updates:

```sh
git switch master
git fetch upstream
git merge --no-ff upstream/master
npm install
npm --prefix tests install
cd tests
npx vitest run ha- upstream-sse-error claude-forced-sse-json openai-responses-nonstream
cd ..
npm run build
git push origin master
```

Keep the HA persistence/security contracts, provider error framing and tool/effort
forwarding when resolving conflicts. Do not reset the fork to upstream or force
push to synchronize it. Integration worktrees use `fork` for the public fork;
there, publish with `git push fork HEAD:master`.

Deploy a self-contained release with a consistent SQLite backup and retained
previous runtime. Build with isolated DATA_DIR. Roll one peer at a time, verify
client gateway readiness and matching replica checkpoints, then prove a real
coding/tool request. Preserve production combos and node-local credentials.
