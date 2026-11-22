# Earth from Space 0.6.22 candidate: native macOS run of the caller suite (22 Nov 2026)

Closes the one item left open in runbook rev 2 section 5 and in GPT's hold on the operational package.
Filed 22 Nov 2026 07:02 UTC (clock reading). Docs only; nothing deployed, stored or enabled.

## What was run, and by whom

Chad, in an ordinary Terminal on his Mac, from the review copy of branch `earth-from-space-rc` at `b8e55e8`
(`~/Documents/Mother Earth/_review/earth-from-space-0.6.22-candidate`):

    node --no-warnings phase1/earthview-admin.test.mjs 2>&1 | tee NATIVE-CALLER-RUN.txt

He confirmed in the thread that he ran it himself. A few minutes later, in the same Terminal, he appended the versions:

    { sw_vers; bash --version | head -1; curl --version | head -1; node -v; } >> NATIVE-CALLER-RUN.txt

## The output (byte-identical copy: `NATIVE-CALLER-RUN.txt` in this folder)

    earthview-admin: 80 passed, 0 failed
    ProductName:    macOS
    ProductVersion: 26.5.2
    BuildVersion:   25F84
    GNU bash, version 3.2.57(1)-release (arm64-apple-darwin25)
    curl 8.7.1 (x86_64-apple-darwin25.0) libcurl/8.7.1 (SecureTransport) LibreSSL/3.3.6 zlib/1.2.12 nghttp2/1.68.1
    v24.14.1

The suite prints a line only for a failing check, then a blank line and the summary, so a one-line result is its
normal passing output.

| Fact | Value |
|---|---|
| File as first written (run output only, 38 bytes), Mac modification time | 2026-11-22T06:58:37Z; sha256 `9b93f968042760a2e368e1e916f83212105b355724b50232d11b7bc603adfa73` |
| File with the versions appended (282 bytes), Mac modification time | 2026-11-22T07:00:32Z; sha256 `5572e62ecca279dd7bc98246b17ab2a407267dfd284f2e19274f4e840ee26808` |
| `phase1/earthview-admin.sh` in the Mac folder (read by Claude after the run) | sha256 `2072653464c830ea5f0b2ad3d76a9d28c378896ccd4dcd95b3db27dd6ab5407b`, equal to the branch |
| `phase1/earthview-admin.test.mjs` in the Mac folder | sha256 `d6d95179ebd2da992f1081b53080e46ebc1ac9aefef6e9d20f3c5fde21cb7c1b`, equal to the branch |

## Limits (stated, not glossed)

- The 38-byte file's first line is the suite's blank line; the earlier 38-byte state was read and hashed by Claude
  before the append, and its two lines are the first two lines of the filed file.
- The versions were captured by a second command, after the run, in the same Terminal. That they are the programs the
  run used rests on that (the suite starts `bash` and `curl` by name from the same PATH); it was not recorded by
  the run itself.
- The 18 breaks were NOT run on macOS. They were run on Linux only (`suites-2026-11-22.md`).
- Node on the Mac is v24.14.1; the Linux runs used v22.
- The run used a made-up key and a local stand-in. It shows the caller script behaves as tested under macOS bash 3.2
  and the Mac's curl. It shows nothing about the hub, the real key file or the network.
- Claude did not watch the run. The evidence is the file, its times, the matching script hashes and Chad's word.
