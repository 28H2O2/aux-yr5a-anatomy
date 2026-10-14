import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const signatureFont = readFileSync(join(here, 'fonts/h2o2-mark.woff2')).toString('base64');
const escapeAttribute = text => text.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
function embedded(filename, id) {
  const resize = `<script>
  (() => {
    const main = document.querySelector('.iso-page');
    let pending = false;
    const measure = () => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        const height = Math.ceil(main.getBoundingClientRect().bottom + scrollY + parseFloat(getComputedStyle(main).marginBottom) + 4);
        parent.postMessage({kind:'aux-figure-height', id:'${id}', height}, '*');
      });
    };
    new ResizeObserver(measure).observe(main);
    addEventListener('resize', measure);
    addEventListener('load', measure);
    measure();
  })();
  </script>`;
  const html = readFileSync(join(here, filename), 'utf8').replace('</body>', resize + '</body>');
  return escapeAttribute(html);
}

const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="奥克斯 YR-5-A 温热饮水机：整机剖视与储水、加热、出水机制，两张离线交互图。">
<title>奥克斯 YR-5-A · 整机与热水原理</title>
<style>
*{box-sizing:border-box}html{scroll-behavior:smooth;scroll-padding-top:90px}body{margin:0;background:#f5f4f0;color:#343b3a;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif}.share-page{width:min(1280px,100%);margin:0 auto}.intro{padding:38px 36px 25px}.kicker{font-size:10px;letter-spacing:.15em;color:#7b8380;margin:0 0 12px}h1{font-size:29px;line-height:1.45;font-weight:550;letter-spacing:-.025em;margin:0 0 11px}.intro p:last-child{font-size:13px;line-height:1.85;color:#69716e;margin:0}.chapter-nav{position:sticky;top:0;z-index:2;display:flex;gap:12px;padding:13px 36px;background:rgba(245,244,240,.96);border-top:1px solid #e1e3dd;border-bottom:1px solid #e1e3dd}.chapter-nav a{font-size:12px;text-decoration:none;color:#344745;border:1px solid #cbd1c9;border-radius:5px;padding:9px 16px;background:#fffefa}.chapter-nav a:hover{border-color:#517b78}.chapter-nav a:focus-visible{outline:2px solid #517b78;outline-offset:3px}.chapter-nav span{font-size:10px;color:#83918c;margin-right:8px}.chapter{scroll-margin-top:0}.chapter+ .chapter{border-top:1px solid #cdd3cc}iframe{display:block;width:100%;height:1250px;border:0;background:#f5f4f0}.share-footer{padding:24px 36px 35px;border-top:1px solid #e1e3dd;font-size:11px;line-height:1.8;color:#7b8380}.share-footer a{color:#506c69;text-underline-offset:3px}@media(max-width:600px){.intro{padding:26px 20px 21px}h1{font-size:24px}.intro p:last-child{font-size:12px}.chapter-nav{padding:12px 14px;gap:9px}.chapter-nav a{padding:8px 12px}.share-footer{padding:22px 20px 28px}}@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
@font-face{font-family:"H2O2 Macintosh";src:url("data:font/woff2;base64,${signatureFont}") format("woff2");font-weight:400;font-style:normal;font-display:swap;unicode-range:U+0032,U+0048,U+004F}
.footer-note{margin:0;max-width:760px}.footer-bottom{display:flex;align-items:center;justify-content:space-between;gap:22px;margin-top:24px;padding-top:22px;border-top:1px solid #e1e3dd}.maker-signature{display:flex;align-items:center;gap:12px;color:#506c69}.made-by{font:12px/1.5 Arial,Helvetica,sans-serif;letter-spacing:.04em}.maker-name{font:400 42px/1.25 "H2O2 Macintosh",Arial,sans-serif;color:#344745}.share-footer .maker-name{text-decoration:none;color:#344745}.share-footer .maker-name:hover{text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:6px}.share-footer .maker-name:focus-visible{outline:2px solid #517b78;outline-offset:5px;border-radius:3px}.footer-bottom>a{white-space:nowrap;font-size:10px}@media(max-width:600px){.footer-bottom{gap:12px}.maker-signature{gap:9px}.maker-name{font-size:36px}}
</style>
<script>
addEventListener('message', event => {
  const data = event.data;
  if (!data || data.kind !== 'aux-figure-height' || !['overview-frame','waterway-frame'].includes(data.id)) return;
  const frame = document.getElementById(data.id);
  if (frame && event.source === frame.contentWindow && Number.isFinite(data.height) && data.height > 100 && data.height < 30000) {
    const height = Math.ceil(data.height) + 'px';
    if (frame.style.height !== height) frame.style.height = height;
  }
});
</script>
</head>
<body>
<main class="share-page">
<header class="intro">
<p class="kicker">AUX YR-5-A / TWO INTERACTIVE FIGURES</p>
<h1>奥克斯饮水机：整机与热水原理</h1>
<p>先看部件在整机中的位置，再看常温水与热水如何储存、加热和流出。两张图均可交互，这一个文件即可离线阅读和分享。</p>
</header>
<nav class="chapter-nav" aria-label="跳转到结构图">
<a href="#overview"><span>01</span>整机剖视</a>
<a href="#waterway"><span>02</span>热水与常温水路</a>
</nav>
<section id="overview" class="chapter" aria-label="第一张图：整机内部结构">
<iframe id="overview-frame" title="整机剖视交互图：选择部件、查看外壳和内部水路" srcdoc="${embedded('aux-overview-light.html','overview-frame')}"></iframe>
</section>
<section id="waterway" class="chapter" aria-label="第二张图：储水加热与取水机制">
<iframe id="waterway-frame" title="热水机制交互图：储水、加热、保温和热水常温水取水" srcdoc="${embedded('aux-yr5a-light.html','waterway-frame')}"></iframe>
</section>
<footer class="share-footer"><p class="footer-note">型号与温热功能由使用者确认；外形参考照片，内部布局依据同类结构绘制。各图附有资料来源与示意范围。</p><div class="footer-bottom"><div class="maker-signature" aria-label="made by H2O2"><span class="made-by">made by</span><a class="maker-name" href="https://github.com/28H2O2" target="_blank" rel="noopener noreferrer" aria-label="H2O2 的 GitHub（在新窗口打开）">H2O2</a></div><a href="#top">返回顶部 ↑</a></div></footer>
</main>
</body>
</html>`;
const output = join(here, '奥克斯YR-5-A-整机与热水原理.html');
writeFileSync(output, html);
console.log(`${output}\n${(Buffer.byteLength(html)/1024/1024).toFixed(2)} MiB · two embedded interactive figures`);
