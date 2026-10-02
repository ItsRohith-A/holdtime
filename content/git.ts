import type { Card } from '../types'

/** Git. Written for Holdtime; MIT, like the rest. */
export const GIT: readonly Card[] = [
  { id: 'git-switch', topic: 'git', kind: 'fact', text: '`git switch -c name` creates a branch and moves to it; it is the newer form of `git checkout -b`.' },
  { id: 'git-restore', topic: 'git', kind: 'fact', text: '`git restore file` throws away unstaged changes; `git restore --staged file` unstages without losing them.' },
  { id: 'git-amend', topic: 'git', kind: 'fact', text: '`git commit --amend` replaces the last commit with a new one, which gets a new hash.' },
  { id: 'git-reflog', topic: 'git', kind: 'fact', text: '`git reflog` lists where HEAD has been, so you can find "lost" commits after a bad reset or rebase.' },
  { id: 'git-stash-message', topic: 'git', kind: 'fact', text: '`git stash push -m "wip login"` labels a stash; `git stash pop` reapplies the latest and drops it.' },
  { id: 'git-log-graph', topic: 'git', kind: 'fact', text: '`git log --oneline --graph --all` draws every branch\'s history as a compact graph.' },
  { id: 'git-bisect', topic: 'git', kind: 'fact', text: '`git bisect` binary-searches your history to find the commit that introduced a bug.' },
  { id: 'git-blame-w', topic: 'git', kind: 'fact', text: '`git blame -w` ignores whitespace-only changes when deciding who last changed a line.' },
  { id: 'git-force-lease', topic: 'git', kind: 'fact', text: '`git push --force-with-lease` refuses to overwrite the remote if someone pushed since you fetched.' },
  { id: 'git-cherry-pick', topic: 'git', kind: 'fact', text: '`git cherry-pick <hash>` applies the changes of one commit on top of your current branch.' },
  { id: 'git-ignore-tracked', topic: 'git', kind: 'fact', text: '`.gitignore` does not affect files Git already tracks. Stop tracking one with `git rm --cached file`.' },
  { id: 'git-diff-staged', topic: 'git', kind: 'fact', text: '`git diff --staged` shows exactly what will go into your next commit.' },
  { id: 'git-worktree', topic: 'git', kind: 'fact', text: '`git worktree add ../hotfix main` checks out a second branch in another folder, sharing one repository.' },
  { id: 'git-fetch-pull', topic: 'git', kind: 'fact', text: '`git pull` is `git fetch` followed by a merge (or a rebase, with `--rebase`).' },
  { id: 'git-head-parents', topic: 'git', kind: 'fact', text: '`HEAD~2` goes two commits back along first parents; `HEAD^2` is the second parent of a merge commit.' },
  { id: 'git-add-p', topic: 'git', kind: 'fact', text: '`git add -p` stages a file piece by piece, so one commit can take only part of your changes.' },
  { id: 'git-fixup', topic: 'git', kind: 'fact', text: '`git commit --fixup <hash>`, then `git rebase -i --autosquash`, folds a fix into an earlier commit.' },
  { id: 'git-range', topic: 'git', kind: 'fact', text: '`git log main..feature` lists the commits on feature that are not on main.' },
  {
    id: 'git-rebase-hashes', topic: 'git', kind: 'yesno', answer: true,
    text: 'Does `git rebase` give the rebased commits new hashes?',
    explain: 'Yes. Each commit gets a new parent, and the parent is part of the hash, so every hash changes.',
  },
  {
    id: 'git-fetch-files', topic: 'git', kind: 'yesno', answer: false,
    text: 'Does `git fetch` change the files in your working folder?',
    explain: 'No. It only updates remote-tracking branches like origin/main. Merging or rebasing changes files.',
  },
  {
    id: 'git-revert-delete', topic: 'git', kind: 'yesno', answer: false,
    text: 'Does `git revert` remove the original commit from history?',
    explain: 'No. It adds a new commit that undoes it, which is why it is safe on shared branches.',
  },
  {
    id: 'git-reset-soft', topic: 'git', kind: 'yesno', answer: true,
    text: 'After `git reset --soft HEAD~1`, are the last commit\'s changes still staged?',
    explain: 'Yes. `--soft` moves the branch back and leaves the changes staged, ready to commit again.',
  },
  {
    id: 'git-reset-hard', topic: 'git', kind: 'yesno', answer: false,
    text: 'Does `git reset --hard` keep your uncommitted changes?',
    explain: 'No, it discards them. Stash first (`git stash`) if you might need them.',
  },
  {
    id: 'git-hash-parent', topic: 'git', kind: 'yesno', answer: true,
    text: 'Does a commit\'s hash depend on its parent commit?',
    explain: 'Yes. The parent\'s hash is part of what gets hashed, which chains history together.',
  },
  {
    id: 'git-empty-dirs', topic: 'git', kind: 'yesno', answer: false,
    text: 'Does Git track empty directories?',
    explain: 'No, Git tracks files only. A common trick is to add a placeholder file such as `.gitkeep`.',
  },
  {
    id: 'git-ff-only', topic: 'git', kind: 'yesno', answer: false,
    text: 'Can `git merge --ff-only` create a merge commit?',
    explain: 'No. It fast-forwards or stops with an error; it never makes a merge commit.',
  },
  {
    id: 'git-stash-untracked', topic: 'git', kind: 'yesno', answer: false,
    text: 'Does plain `git stash` save untracked files?',
    explain: 'No. Add `-u` (`--include-untracked`) to stash new files too.',
  },
  {
    id: 'git-shallow-clone', topic: 'git', kind: 'yesno', answer: false,
    text: 'Does `git clone --depth 1` download the full history?',
    explain: 'No, only the latest commit. It is a shallow clone; `git fetch --unshallow` gets the rest.',
  },
  {
    id: 'git-origin-keyword', topic: 'git', kind: 'yesno', answer: false,
    text: 'Is `origin` a special keyword built into Git?',
    explain: 'No. It is just the default name `git clone` gives the remote; you can rename it.',
  },
  {
    id: 'git-commit-a', topic: 'git', kind: 'yesno', answer: false,
    text: 'Does `git commit -a` include brand-new, untracked files?',
    explain: 'No. `-a` stages changes to files Git already tracks; new files still need `git add`.',
  },
  {
    id: 'git-cherry-pick-hash', topic: 'git', kind: 'yesno', answer: false,
    text: 'Does a cherry-picked commit keep its original hash?',
    explain: 'No. It is a new commit with a new parent, so it gets a new hash.',
  },
  {
    id: 'git-push-tags', topic: 'git', kind: 'yesno', answer: false,
    text: 'Does a plain `git push` send your tags too?',
    explain: 'No. Push a tag by name (`git push origin v1.0`) or all of them with `--tags`.',
  },
  {
    id: 'git-branch-d', topic: 'git', kind: 'yesno', answer: false,
    text: 'Does `git branch -d` delete a branch that has unmerged commits?',
    explain: 'No, it refuses. `-D` forces it, and the commits stay findable in the reflog for a while.',
  },
  {
    id: 'git-checkout-file', topic: 'git', kind: 'yesno', answer: true,
    text: 'Can `git checkout -- file` throw away your unstaged changes to that file?',
    explain: 'Yes, without asking. The newer `git restore file` does the same.',
  },
  {
    id: 'git-revert-merge', topic: 'git', kind: 'yesno', answer: true,
    text: 'Does reverting a merge commit need `-m 1` to say which parent to keep?',
    explain: 'Yes. A merge has two parents, so `git revert -m 1 <hash>` says to keep the first parent\'s side.',
  },
  {
    id: 'git-tag-annotated', topic: 'git', kind: 'yesno', answer: true,
    text: 'Does `git tag -a v1.0 -m "msg"` store the tagger and date?',
    explain: 'Yes, that is an annotated tag: a full object with tagger, date and message. A plain tag is just a name.',
  },
]
