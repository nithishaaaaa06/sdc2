const PUBLIC_VAPID_KEY_PATH = '/api/push/public-key';

async function getPublicKey() {
  const res = await fetch(PUBLIC_VAPID_KEY_PATH);
  if(!res.ok) throw new Error('Failed to get VAPID key');
  const data = await res.json();
  return urlBase64ToUint8Array(data.publicKey);
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export async function isSubscribedToPush(){
  if(!('serviceWorker' in navigator)) return false;
  const reg = await navigator.serviceWorker.getRegistration();
  if(!reg || !reg.pushManager) return false;
  const sub = await reg.pushManager.getSubscription();
  return !!sub;
}

export async function enableNotifications(){
  if (!('serviceWorker' in navigator)) throw new Error('No SW');
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return false;
  const reg = await navigator.serviceWorker.ready;
  const publicKey = await getPublicKey();
  const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: publicKey });
  await fetch('/api/push/subscribe', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(sub) });
  return true;
}

export async function disableNotifications(){
  const reg = await navigator.serviceWorker.getRegistration();
  if(!reg) return;
  const sub = await reg.pushManager.getSubscription();
  if(sub){
    await fetch('/api/push/unsubscribe', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ endpoint: sub.endpoint }) });
    await sub.unsubscribe();
  }
}


