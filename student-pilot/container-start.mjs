import { chmod, chown, realpath, stat } from "node:fs/promises";

if (process.getuid?.() === 0) {
  const { uid, gid } = await stat("/home/node");
  // Railway mounts this dedicated volume as root. Give its directory to the app user.
  if (process.env.RAILWAY_VOLUME_MOUNT_PATH === "/data") {
    if (await realpath("/data") !== "/data") throw new Error("Unexpected student data mount.");
    await chown("/data", uid, gid);
    await chmod("/data", 0o700);
  }
  process.initgroups("node", gid);
  process.setgid(gid);
  process.setuid(uid);
}

await import("../preview.mjs");
