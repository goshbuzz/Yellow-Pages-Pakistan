#!/usr/bin/env python3
"""Drive `bubblewrap init` through a real PTY, answering its interactive prompts."""
import pty, os, sys, time, select

CWD = "/home/user/yellowpagespk"
APP_DIR = "android/app"

ARGS = [
    "npx", "bubblewrap", "init",
    "--manifest=http://localhost:4173/manifest-prod.webmanifest",
    "--directory=" + APP_DIR,
    "--packageId=com.goshbuzz.yellowpagespk",
    "--appName=Yellow Pages Pakistan",
    "--shortName=YellowPages PK",
    "--display=standalone",
    "--orientation=portrait",
    "--themeColor=#F5B301",
    "--backgroundColor=#FFFBEF",
    "--signingKeyPath=/home/user/yellowpagespk/android/ypk-release.jks",
    "--signingKeyAlias=ypk",
    "--signingKeyPass=ypk-gb-2026",
    "--skipPwaValidation",
]

ANSWERS = [
    ("Domain:", "yellowpagespk.goshbuzz.com"),
    ("URL path:", "/"),
]

def main():
    pid, fd = pty.fork()
    if pid == 0:
        os.chdir(CWD)
        os.environ["PATH"] = "/home/user/.bubblewrap/jdk/jdk-17.0.11+9/bin:" + os.environ["PATH"]
        os.execvp("npx", ARGS)

    buf = ""
    answered = 0
    done = False
    deadline = time.time() + 600
    while time.time() < deadline:
        r, _, _ = select.select([fd], [], [], 1.0)
        if r:
            try:
                chunk = os.read(fd, 4096).decode("utf-8", "replace")
            except OSError:
                break
            if not chunk:
                break
            buf += chunk
            sys.stdout.write(chunk)
            sys.stdout.flush()
        while answered < len(ANSWERS):
            needle, ans = ANSWERS[answered]
            if needle in buf:
                time.sleep(0.4)
                os.write(fd, (ans + "\r").encode())
                answered += 1
                buf = ""
                time.sleep(0.3)
            else:
                break
        p, status = os.waitpid(pid, os.WNOHANG)
        if p:
            done = True
            break
    if not done:
        os.kill(pid, 9)
    print("\n[driver] answered prompts:", answered)

if __name__ == "__main__":
    main()
