import webpush from "web-push";

let initialized = false;

export function getWebPush() {
  if (!initialized) {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT;

    if (!publicKey || !privateKey || !subject) {
      throw new Error("VAPID 환경 변수가 설정되지 않았습니다");
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);
    initialized = true;
  }
  return webpush;
}
