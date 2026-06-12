/**
 * 資産形成ナビ — つみたて投資シミュレーター
 *
 * 一定の年利回りが毎月続いた場合の「年金終価」（期末払い）で将来額を試算する。
 * 未来の予測ではなく、仮定に基づく目安の計算であることに注意。
 */

/**
 * つみたて投資の将来額を計算する。
 * @param {number} monthlyYen        毎月の積立額（円）
 * @param {number} years             積立期間（年）
 * @param {number} annualRatePercent 想定年利回り（%）
 * @returns {{principal: number, fv: number, gain: number, rate: number}}
 */
function simulate(monthlyYen, years, annualRatePercent) {
  const months = years * 12;
  const principal = monthlyYen * months; // 元本合計
  const mr = annualRatePercent / 100 / 12; // 月利
  const fv = (mr === 0)
    ? principal
    : monthlyYen * ((Math.pow(1 + mr, months) - 1) / mr); // 期末払い年金終価
  return {
    principal: Math.floor(principal),
    fv: Math.floor(fv),
    gain: Math.floor(fv - principal),
    rate: annualRatePercent
  };
}

const formatYen = v => v.toLocaleString('ja-JP') + ' 円';

// ===== ブラウザ実行時のみ（テスト環境では DOM がない） =====
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('sim-form');
    if (!form) return;

    const errorEl = document.getElementById('form-error');
    const resultArea = document.getElementById('result');
    const cardsEl = document.getElementById('result-cards');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      errorEl.textContent = '';

      const monthly = parseFloat(document.getElementById('monthly').value);
      const years = parseFloat(document.getElementById('years').value);
      const rate = parseFloat(document.getElementById('rate').value);

      if (!Number.isFinite(monthly) || !Number.isFinite(years) || !Number.isFinite(rate)) {
        errorEl.textContent = 'すべての項目に数値を入力してください。';
        return;
      }
      if (monthly <= 0 || years <= 0 || rate <= 0) {
        errorEl.textContent = '0より大きい値を入力してください。';
        return;
      }

      // 3シナリオ：低め（−2%、下限0%）／想定／高め（＋2%）
      const scenarios = [
        { name: '低め', r: Math.max(0, rate - 2) },
        { name: '想定', r: rate },
        { name: '高め', r: rate + 2 }
      ];

      cardsEl.innerHTML = '';
      scenarios.forEach((s, i) => {
        const res = simulate(monthly, years, s.r);
        cardsEl.appendChild(buildCard(s.name, res, i === 1));
      });

      resultArea.hidden = false;
      // hidden 解除直後はトランジションが効かないため1フレーム待つ
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resultArea.classList.add('visible'));
      });
    });

    /**
     * 1シナリオ分の結果カードを生成する。
     * @param {string} name 「低め」「想定」「高め」
     * @param {{principal:number, fv:number, gain:number, rate:number}} res
     * @param {boolean} highlight 想定シナリオを強調するか
     */
    function buildCard(name, res, highlight) {
      const card = document.createElement('div');
      card.className = 'result-card' + (highlight ? ' highlight' : '');

      const principalPct = res.fv > 0 ? (res.principal / res.fv) * 100 : 100;
      const gainPct = 100 - principalPct;

      card.innerHTML =
        '<h3 class="scenario-title"></h3>' +
        '<p class="fv-label">将来額</p>' +
        '<p class="fv-value"></p>' +
        '<div class="stack-bar" role="img">' +
          '<div class="principalBar"></div>' +
          '<div class="gainBar"></div>' +
        '</div>' +
        '<dl class="breakdown">' +
          '<div class="breakdown-row"><dt><span class="dot dot-principal"></span>元本合計</dt><dd class="bd-principal"></dd></div>' +
          '<div class="breakdown-row"><dt><span class="dot dot-gain"></span>運用益</dt><dd class="bd-gain"></dd></div>' +
        '</dl>';

      card.querySelector('.scenario-title').textContent = name + '（年' + res.rate + '%）';
      card.querySelector('.fv-value').textContent = formatYen(res.fv);
      card.querySelector('.bd-principal').textContent = formatYen(res.principal);
      card.querySelector('.bd-gain').textContent = formatYen(res.gain);

      const bar = card.querySelector('.stack-bar');
      bar.setAttribute('aria-label',
        '元本 ' + principalPct.toFixed(1) + '%、運用益 ' + gainPct.toFixed(1) + '%');
      card.querySelector('.principalBar').style.width = principalPct.toFixed(2) + '%';
      card.querySelector('.gainBar').style.width = gainPct.toFixed(2) + '%';

      return card;
    }
  });
}

// テスト用エクスポート（Node.js から require できるように）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { simulate };
}
