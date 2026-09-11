// 考公 APP Service Worker
// 策略：网络优先（network-first）
//   - 有网：永远拿服务器最新版本（保证每次迭代用户立刻看到更新）
//   - 断网：回退到缓存（保证添加到主屏幕后离线也能打开）

const CACHE = "kaogong-v3";
const ASSETS = ["./", "./index.html"];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  // 只处理 GET 请求
  if (e.request.method !== "GET") return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // 拿到新资源后更新缓存
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => {
        // 断网：优先精确匹配，其次回退到首页
        return caches.match(e.request).then(r => r || caches.match("./index.html"));
      })
  );
});
