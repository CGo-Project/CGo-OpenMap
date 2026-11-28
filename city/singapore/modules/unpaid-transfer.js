(function () {
    'use strict';
    const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
    window.StationBoard.registerModule({
        id: 'singapore-unpaid-transfer', name: '出闸换乘', targetTab: 'body-top', order: 5, enabled: true,
        shouldRender: ({ station }) => Boolean(station?.paidAreaTransfer),
        render({ station }) {
            const transfer = station.paidAreaTransfer;
            return `<section class="sg-unpaid-transfer" data-sg-transfer-sid="${escape(station.id)}">
                <h3><cgo-icon name="route" size="18"></cgo-icon>付费区外换乘</h3>
                <p>需先出闸，前往 <strong>${escape(transfer.peerCode)}</strong>，再重新进闸。</p>
                <p>请使用<strong>同一张支付卡或同一设备</strong>，在 <strong>15 分钟内</strong>完成换乘。符合距离计费规则时不另收新的起乘费用，车程仍按规则计费；超时将按新行程计费。</p>
                <button type="button" class="transfer-link sg-transfer-button" data-jump-sid="${escape(transfer.peerId)}">查看 ${escape(transfer.peerCode)} · ${escape(station.cn)}</button>
                <a href="https://simplygo.com.sg/transfer-fare-rules/" target="_blank" rel="noopener noreferrer">SimplyGo 换乘计费条件</a>
            </section>`;
        }
    });
})();
