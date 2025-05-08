document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('polygonCanvas');
    const ctx = canvas.getContext('2d');
    const sidesSlider = document.getElementById('sidesSlider');
    const sidesValueDisplay = document.getElementById('sidesValue');

    let currentAnimationFrameId = null; // アニメーションフレームIDを管理

    // 最大公約数を計算する関数
    function gcd(a, b) {
        a = Math.abs(Math.round(a));
        b = Math.abs(Math.round(b));
        while (b) {
            let t = b;
            b = a % b;
            a = t;
        }
        return a;
    }

    // 多角形を描画するメイン関数
    function drawPolygon() {
        if (currentAnimationFrameId) {
            cancelAnimationFrame(currentAnimationFrameId); // 前のアニメーションをキャンセル
        }

        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const centerX = canvas.width / (2 * dpr);
        const centerY = canvas.height / (2 * dpr);
        
        const n_str = sidesSlider.value;
        const n = parseFloat(n_str);
        sidesValueDisplay.textContent = n.toFixed(2);

        if (n < 2) return;

        const valTimes100 = Math.round(n * 100);
        const denominatorFixed = 100;
        const commonDivisor = gcd(valTimes100, denominatorFixed);
        const p = valTimes100 / commonDivisor; // 星型多角形の頂点数 (p)

        // 半径の動的調整
        const decimal = n - Math.floor(n);
        let radiusScale = 0.85;
        let lineWidth = 1;

        // 小数点第二位が0.05付近、または辺の数が多い場合の調整
        if ((Math.round(decimal * 20) % 2 === 1) || n > 10) {
            lineWidth = 0.75;     // 線を細く
        }
        const radius = Math.min(centerX, centerY) * radiusScale;

        // 頂点の座標を計算
        const points = [];
        const initialAngleOffset = -Math.PI / 2; // 真上から開始
        const angleIncrement = (2 * Math.PI) / n;

        for (let i = 0; i < p; i++) {
            const angle = initialAngleOffset + i * angleIncrement;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            points.push({ x, y });
        }

        if (points.length < 2) return; // 描画に必要な頂点が足りない場合

        // グラデーションの設定をより華やかに
        const gradient = ctx.createLinearGradient(centerX - radius, centerY - radius, centerX + radius, centerY + radius);
        gradient.addColorStop(0, '#f472b6');    // pink-400
        gradient.addColorStop(0.2, '#2dd4bf');  // teal-400
        gradient.addColorStop(0.4, '#60a5fa');  // blue-400
        gradient.addColorStop(0.6, '#c084fc');  // purple-400
        gradient.addColorStop(0.8, '#34d399');  // emerald-400
        gradient.addColorStop(1, '#fbbf24');    // amber-400

        ctx.strokeStyle = gradient;
        ctx.lineWidth = lineWidth; // 動的に設定された線の太さ
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        // 頂点数の表示要素を追加
        const vertexCount = document.getElementById('vertexCount');
        vertexCount.textContent = `頂点数: ${p}`;

        // アニメーション処理を修正
        let startTime = null;
        const duration = 1500; // 1.5秒

        function animate(currentTime) {
            if (!startTime) startTime = currentTime;
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);

            // 進捗に応じて頂点を描画
            const pointsToDraw = Math.ceil(progress * points.length);
            for (let i = 1; i <= pointsToDraw; i++) {
                if (i === pointsToDraw && i < points.length) {
                    // 最後の点は補間
                    const lastProgress = (progress * points.length) % 1;
                    const current = points[i - 1];
                    const next = points[i % points.length];
                    const x = current.x + (next.x - current.x) * lastProgress;
                    const y = current.y + (next.y - current.y) * lastProgress;
                    ctx.lineTo(x, y);
                } else {
                    ctx.lineTo(points[i % points.length].x, points[i % points.length].y);
                }
            }

            if (progress === 1) {
                ctx.closePath();
            }
            ctx.stroke();

            if (progress < 1) {
                currentAnimationFrameId = requestAnimationFrame(animate);
            } else {
                // アニメーション完了後、回転アニメーションを開始
                rotatePolygon();
            }
        }

        // 図形の回転アニメーション
        let rotation = 0;
        function rotatePolygon() {
            ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(rotation);
            ctx.translate(-centerX, -centerY);

            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < p; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.closePath();
            ctx.stroke();

            ctx.restore();
            rotation += 0.001; // 回転速度
            requestAnimationFrame(rotatePolygon);
        }

        // アニメーション開始
        currentAnimationFrameId = requestAnimationFrame(animate);
    }

    sidesSlider.addEventListener('input', () => {
        drawPolygon();
    });

    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(drawPolygon, 150);
    });

    drawPolygon(); // 初期描画
});