        // バイト列(base64)をブラウザでファイルとして保存させる（WASMにはOSのファイル書込が無いため）。
        // 要素にファイルのドラッグ&ドロップを受け付けさせ、最初のファイルをテキストとして .NET に渡す。
        window.erRegisterFileDrop = (el, dotNetRef) => {
            if (!el || el._erDrop) return;
            const stop = (e) => { e.preventDefault(); e.stopPropagation(); };
            el.addEventListener('dragover', stop);
            el.addEventListener('drop', async (e) => {
                stop(e);
                const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
                if (!f) return;
                try { const text = await f.text(); dotNetRef.invokeMethodAsync('OnErmlxFileDropped', text); } catch (err) { }
            });
            el._erDrop = true;
        };

        // 保存ダイアログ(ファイル名・保存先をユーザーが選ぶ)。File System Access API 対応時はネイティブ保存、
        // 非対応(Firefox/Safari等)はダウンロードにフォールバック。戻り値: true=保存 / false=キャンセル。
        window.erSaveFileAs = async (suggestedName, text, mime) => {
            try {
                if (window.showSaveFilePicker) {
                    const handle = await window.showSaveFilePicker({
                        suggestedName: suggestedName,
                        types: [{ description: 'ERML', accept: { [mime || 'application/xml']: ['.ermlx'] } }]
                    });
                    const w = await handle.createWritable();
                    await w.write(text);
                    await w.close();
                    return true;
                }
            } catch (e) {
                if (e && e.name === 'AbortError') return false;   // ユーザーがキャンセル
                console.warn('erSaveFileAs picker failed, fallback to download', e);
            }
            try {   // フォールバック: 既定のダウンロード
                const blob = new Blob([text], { type: mime || 'application/octet-stream' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = suggestedName;
                document.body.appendChild(a); a.click(); document.body.removeChild(a);
                URL.revokeObjectURL(url);
                return true;
            } catch (e2) { console.warn('erSaveFileAs download failed', e2); return false; }
        };

        window.erDownloadFile = (fileName, base64, contentType) => {
            const bin = atob(base64);
            const bytes = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
            const blob = new Blob([bytes], { type: contentType || 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        };

        // SVG の現在の画面変換行列(getScreenCTM)のスケール(px/ユーザー単位)を返す。
        // ドラッグ/パンの画面px→SVGユーザー座標変換に使う（viewBoxとCSSサイズの不一致・ズームを吸収）。
        window.erSvgScale = (el) => {
            const m = el && el.getScreenCTM ? el.getScreenCTM() : null;
            return m ? { a: m.a, d: m.d } : { a: 1, d: 1 };
        };

        // SVG 要素の実描画ピクセルサイズ（viewBox をこの縦横比に合わせるとレターボックスが出ない）。
        window.erClientSize = (el) => {
            if (!el) return { w: 0, h: 0 };
            const r = el.getBoundingClientRect();
            return { w: r.width, h: r.height };
        };

        // クライアント(画面)座標 → SVG ユーザー座標（矩形選択の始点/終点用。pan/zoom/scale を吸収）。
        window.erClientToUser = (el, cx, cy) => {
            if (!el || !el.getScreenCTM) return { x: 0, y: 0 };
            const m = el.getScreenCTM(); if (!m) return { x: 0, y: 0 };
            const p = el.createSVGPoint(); p.x = cx; p.y = cy;
            const u = p.matrixTransform(m.inverse());
            return { x: u.x, y: u.y };
        };

        // 列グリッドの Excel 風表貼り付け。フォーカス中セルが data-row/data-col を持つとき、
        // paste の clipboardData(同期・権限不要) を読んで C# の OnGridPasteJs へ渡す。
        window.erRegisterGridPaste = (dotNetRef) => {
            const handler = (e) => {
                const el = document.activeElement;
                if (!el || !el.dataset) return;
                const text = (e.clipboardData || window.clipboardData).getData('text');
                if (text == null) return;
                // 隠しキャッチャ(非テキストセル用)にフォーカスがある場合は選択アンカー起点で貼り付け。
                if (el.dataset.catcher !== undefined) {
                    e.preventDefault();
                    dotNetRef.invokeMethodAsync('OnGridPasteAnchorJs', text);
                    return;
                }
                if (el.dataset.row === undefined || el.dataset.col === undefined) return;
                e.preventDefault();
                dotNetRef.invokeMethodAsync('OnGridPasteJs', el.dataset.grid || 'col', text, parseInt(el.dataset.row), parseInt(el.dataset.col));
            };
            document.addEventListener('paste', handler);
            window._erGridPaste = handler;
        };
        // 非テキストセル(checkbox/select)を選んだとき、隠しテキスト入力へフォーカスを移し、
        // 同期の 'paste' イベント(clipboardData・権限不要)が発火するようにする。
        window.erFocusCatcher = () => { try { const c = document.querySelector('.er-paste-catcher'); if (c) c.focus(); } catch (_) { } };

        // グリッドのセル範囲コピー。グリッドセルにフォーカスがあり、そのセル内でテキスト選択が無いとき、
        // Ctrl/Cmd+C の既定コピー(空)を止めて C# の範囲コピーを呼ぶ（既定コピーによる上書きレースを回避）。
        window.erRegisterGridCopy = (dotNetRef) => {
            const inGrid = () => { const el = document.activeElement; return el && ((el.dataset && el.dataset.catcher !== undefined) || (el.closest && el.closest('.er-grid-wrap'))); };
            // セル内テキスト選択の有無。checkbox/select 等は selectionStart 参照で例外を投げるので try/catch。
            const noInCellText = () => {
                const el = document.activeElement;
                try { return !(el.selectionStart != null && el.selectionEnd != null && el.selectionStart !== el.selectionEnd); }
                catch (_) { return true; }
            };
            const keyHandler = (e) => {
                if ((e.key === 'c' || e.key === 'C') && (e.ctrlKey || e.metaKey) && inGrid() && noInCellText()) {
                    e.preventDefault();
                    // チェックボックス等を含む範囲をドラッグするとセル跨ぎの DOM 選択(HTML)ができ、
                    // 既定コピーが text/html を書いて Excel に枠の図形が入る。DOM 選択を消して防ぐ。
                    try { window.getSelection()?.removeAllRanges(); } catch (_) { }
                    dotNetRef.invokeMethodAsync('OnGridCopyJs');
                }
            };
            // 既定の copy イベント自体も止める(text/plain は C# 側の writeText が担当)。keydown の取りこぼし対策。
            const copyHandler = (e) => { if (inGrid() && noInCellText()) e.preventDefault(); };
            document.addEventListener('keydown', keyHandler);
            document.addEventListener('copy', copyHandler);
            window._erGridCopy = keyHandler;
        };

        // localStorage（列幅など UI 設定の保存）。
        window.erLocalGet = (key) => { try { return localStorage.getItem(key) || ""; } catch (e) { return ""; } };
        window.erLocalSet = (key, val) => { try { localStorage.setItem(key, val); } catch (e) { } };

        // OS クリップボード読み書き（コピー/貼り付けのセッション跨ぎ用。localhost は secure context）。
        window.erClipWrite = async (text) => {
            try { await navigator.clipboard.writeText(text); return true; } catch (e) { return false; }
        };
        window.erClipRead = async () => {
            try { return await navigator.clipboard.readText(); } catch (e) { return ""; }
        };

        // ホイールを passive:false で登録し、ページスクロールを抑えてズームに使う
        // （Blazor の @onwheel:preventDefault は passive 扱いで警告になるため JS 側で登録）。
        window.erRegisterWheel = (el, dotNetRef) => {
            if (!el) return;
            const handler = (e) => {
                e.preventDefault();
                dotNetRef.invokeMethodAsync('OnWheelJs', e.deltaY, e.deltaX, e.shiftKey, e.ctrlKey, e.clientX, e.clientY);
            };
            el.addEventListener('wheel', handler, { passive: false });
            el._erWheel = handler;
        };
        window.erUnregisterWheel = (el) => {
            if (el && el._erWheel) { el.removeEventListener('wheel', el._erWheel); el._erWheel = null; }
        };

        // ウィンドウリサイズを .NET へ通知（キャンバス高さ・下部ドックをビューポート高さに追従させる）。
        window.erRegisterResize = (dotNetRef) => {
            if (window.__erResize) window.removeEventListener('resize', window.__erResize);
            window.__erResize = () => { try { dotNetRef.invokeMethodAsync('OnViewportResize'); } catch (e) { } };
            window.addEventListener('resize', window.__erResize);
        };
        window.erUnregisterResize = () => {
            if (window.__erResize) { window.removeEventListener('resize', window.__erResize); window.__erResize = null; }
        };

        // キャンバスSVGの指定領域(x,y,w,h=ユーザー座標)を PNG 化してクリップボードへコピー。scale=解像度倍率。
        // SVGはベクタなので viewBox を差し替えるだけで全内容が入る。成否を bool で返す。
        // ページ内容の外接矩形から独立した SVG(罫線除外・白背景)を組み立てて文字列で返す。
        window.erBuildStandaloneSvg = (svgEl, x, y, w, h) => {
            const clone = svgEl.cloneNode(true);
            clone.querySelectorAll('[data-ergrid]').forEach(n => n.remove());   // 罫線(メッシュ)は除外(desktop 準拠)
            clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            clone.setAttribute('viewBox', `${x} ${y} ${w} ${h}`);
            clone.setAttribute('width', Math.round(w));
            clone.setAttribute('height', Math.round(h));
            clone.setAttribute('font-family', 'sans-serif');   // 独立SVGの既定フォントを明示
            clone.style.background = '#ffffff';
            return '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(clone);
        };
        // 領域を PNG Blob に描画する(白背景・scale 倍)。コピー/保存/PDF で共有。
        window.erRasterizeSvg = async (svgEl, x, y, w, h, scale) => {
            const xml = window.erBuildStandaloneSvg(svgEl, x, y, w, h);
            const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
            const img = new Image();
            await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.round(w * scale));
            canvas.height = Math.max(1, Math.round(h * scale));
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            return await new Promise((res, rej) => canvas.toBlob(b => b ? res(b) : rej(new Error('toBlob null')), 'image/png'));
        };
        const erTriggerDownload = (blob, filename) => {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = filename;
            document.body.appendChild(a); a.click();
            setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
        };

        window.erCopyCanvasPng = (svgEl, x, y, w, h, scale) => {
            if (!svgEl || w <= 0 || h <= 0 || !navigator.clipboard || !window.ClipboardItem) return false;
            // ClipboardItem に Promise<Blob> を渡し、write を即時呼び出し(ユーザー操作の activation を保持)。
            try {
                const item = new ClipboardItem({ 'image/png': window.erRasterizeSvg(svgEl, x, y, w, h, scale) });
                return navigator.clipboard.write([item]).then(() => true).catch(e => { console.warn('erCopyCanvasPng write', e); return false; });
            } catch (e) { console.warn('erCopyCanvasPng', e); return false; }
        };
        // PNG をファイル保存する。
        window.erSaveCanvasPng = async (svgEl, x, y, w, h, scale, filename) => {
            if (!svgEl || w <= 0 || h <= 0) return false;
            try { const blob = await window.erRasterizeSvg(svgEl, x, y, w, h, scale); erTriggerDownload(blob, filename || 'er-diagram.png'); return true; }
            catch (e) { console.warn('erSaveCanvasPng', e); return false; }
        };
        // SVG(ベクター)をファイル保存する。
        window.erSaveCanvasSvg = (svgEl, x, y, w, h, filename) => {
            if (!svgEl || w <= 0 || h <= 0) return false;
            try {
                const xml = window.erBuildStandaloneSvg(svgEl, x, y, w, h);
                erTriggerDownload(new Blob([xml], { type: 'image/svg+xml' }), filename || 'er-diagram.svg');
                return true;
            } catch (e) { console.warn('erSaveCanvasSvg', e); return false; }
        };
        // PDF をファイル保存する。jsPDF は初回のみ CDN から遅延ロード(オンライン時)。PNG を1ページに敷く。
        const erEnsureJsPdf = async () => {
            if (window.jspdf && window.jspdf.jsPDF) return window.jspdf.jsPDF;
            await new Promise((res, rej) => {
                const s = document.createElement('script');
                s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
                s.onload = res; s.onerror = rej; document.head.appendChild(s);
            });
            return window.jspdf.jsPDF;
        };
        window.erSaveCanvasPdf = async (svgEl, x, y, w, h, scale, filename) => {
            if (!svgEl || w <= 0 || h <= 0) return false;
            try {
                const jsPDF = await erEnsureJsPdf();
                const blob = await window.erRasterizeSvg(svgEl, x, y, w, h, scale);
                const dataUrl = await new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(blob); });
                const iw = Math.round(w * scale), ih = Math.round(h * scale);
                const pdf = new jsPDF({ orientation: iw >= ih ? 'l' : 'p', unit: 'px', format: [iw, ih] });
                pdf.addImage(dataUrl, 'PNG', 0, 0, iw, ih);
                pdf.save(filename || 'er-diagram.pdf');
                return true;
            } catch (e) { console.warn('erSaveCanvasPdf', e); return false; }
        };

        // 文字列の描画幅を計測（desktop の StringMeasure/FormattedText 相当）。エンティティ箱を内容にフィットさせる計算に使う。
        // font は CSS の font 指定（例 "10.5px monospace"）。同期呼び出し可。
        window.erMeasureText = (() => {
            const ctx = document.createElement('canvas').getContext('2d');
            return (font, text) => { ctx.font = font; return ctx.measureText(text || '').width; };
        })();

        // UI 言語の永続化(web/WebView2 共通の localStorage)。未設定時はブラウザ言語から ja/en を推定。
        window.erGetLang = () => {
            try {
                const v = localStorage.getItem('erLang');
                if (v === 'ja' || v === 'en') return v;
            } catch (e) { }
            return (navigator.language || '').toLowerCase().startsWith('en') ? 'en' : 'ja';
        };
        window.erSetLang = (lang) => {
            try { localStorage.setItem('erLang', lang === 'en' ? 'en' : 'ja'); } catch (e) { }
        };
        // 初回言語選択用: 保存済み値のみ(未設定は null)。/ ブラウザ言語からの推定。/ 保存。
        window.erLangStored = () => {
            try { const v = localStorage.getItem('erLang'); return (v === 'ja' || v === 'en') ? v : null; } catch (e) { return null; }
        };
        window.erLangDetect = () => (navigator.language || '').toLowerCase().startsWith('en') ? 'en' : 'ja';
        window.erLangSave = (lang) => {
            try { localStorage.setItem('erLang', lang === 'en' ? 'en' : 'ja'); } catch (e) { }
        };

        // テーマ(light/dark)。html 要素の data-theme を切り替え、CSS の [data-theme="dark"] で配色する。
        // 保存が無ければ OS の prefers-color-scheme に従う。localStorage 名前空間は erTheme。
        window.erThemeApply = (t) => {
            const dark = t === 'dark';
            try { document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light'); } catch (e) { }
            return dark ? 'dark' : 'light';
        };
        window.erThemeInit = () => {
            let t = null;
            try { t = localStorage.getItem('erTheme'); } catch (e) { }
            if (t !== 'dark' && t !== 'light') {
                try { t = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; } catch (e) { t = 'light'; }
            }
            return window.erThemeApply(t);
        };
        window.erThemeSet = (t) => {
            const applied = window.erThemeApply(t);
            try { localStorage.setItem('erTheme', applied); } catch (e) { }
            return applied;
        };

        // 自動保存(Web版): IndexedDB に現在の ermlx を1スロット保存し、リロード後に復元する。
        // オリジン共有(github.io の複数プロジェクトページ)対策で DB 名を名前空間化。失敗しても落ちない。
        window.erAutoDb = () => new Promise((resolve, reject) => {
            try {
                const req = indexedDB.open('ercreator', 1);
                req.onupgradeneeded = () => { try { req.result.createObjectStore('kv'); } catch (_) { } };
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error);
            } catch (e) { reject(e); }
        });
        window.erAutoSaveWrite = async (text) => {
            try {
                const db = await window.erAutoDb();
                await new Promise((res, rej) => {
                    const tx = db.transaction('kv', 'readwrite');
                    tx.objectStore('kv').put(text, 'autosave');
                    tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error);
                });
                return true;
            } catch (e) { return false; }
        };
        window.erAutoSaveLoad = async () => {
            try {
                const db = await window.erAutoDb();
                return await new Promise((res, rej) => {
                    const tx = db.transaction('kv', 'readonly');
                    const r = tx.objectStore('kv').get('autosave');
                    r.onsuccess = () => res(r.result || null); r.onerror = () => rej(r.error);
                });
            } catch (e) { return null; }
        };
        window.erAutoSaveClear = async () => {
            try {
                const db = await window.erAutoDb();
                await new Promise((res, rej) => {
                    const tx = db.transaction('kv', 'readwrite');
                    tx.objectStore('kv').delete('autosave');
                    tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error);
                });
                return true;
            } catch (e) { return false; }
        };
        // タブが隠れる直前(visibilitychange:hidden)に最新を保存するため .NET のフラッシュを呼ぶ。
        window.erRegisterAutoFlush = (dotNetRef) => {
            if (!dotNetRef) return;
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'hidden') { try { dotNetRef.invokeMethodAsync('OnAutoFlush'); } catch (_) { } }
            });
        };

        // スプリッターのドラッグを window レベルの pointermove/up で追従する。
        // 要素の setPointerCapture に頼るとカーソルがスプリッターから出た瞬間に途切れる環境
        // (WebView2 で顕著)があるため、pointerdown を起点に window で拾って .NET へ返す。
        window.erBeginDrag = (dotNetRef, kind) => {
            if (!dotNetRef) return;
            const move = (e) => { try { dotNetRef.invokeMethodAsync('OnDragMoveJs', kind, e.clientX, e.clientY); } catch (_) { } };
            const end = (e) => {
                window.removeEventListener('pointermove', move, true);
                window.removeEventListener('pointerup', end, true);
                window.removeEventListener('pointercancel', end, true);
                try { dotNetRef.invokeMethodAsync('OnDragEndJs', kind); } catch (_) { }
            };
            window.addEventListener('pointermove', move, true);
            window.addEventListener('pointerup', end, true);
            window.addEventListener('pointercancel', end, true);
        };
