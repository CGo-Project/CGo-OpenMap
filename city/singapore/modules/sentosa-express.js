(function () {
    'use strict';
    const access = {
        CC29: '<strong>怡丰城捷运站</strong> · L大厅3楼',
        SENTOSA_VIVO: '<strong>港湾地铁站</strong> · CC29 / NE1'
    };
    window.StationBoard.registerModule({
        id: 'singapore-sentosa', name: '出站换乘', targetTab: 'body-top', order: 7, enabled: true,
        shouldRender: ({ station }) => Boolean(access[station?.id]),
        render({ station }) {
            return `<section class="sg-sentosa-info" data-sg-sentosa-sid="${station.id}">
                <h3><cgo-icon name="route" size="16"></cgo-icon>出站换乘</h3>
                <p>${access[station.id]}</p>
                <p>需出闸步行，捷运单独计费。</p>
            </section>`;
        }
    });
    window.StationBoard.registerModule({
        id: 'singapore-sentosa-hours', name: '圣淘沙捷运运营时间', targetTab: 'station-info', order: 30, enabled: true,
        shouldRender: ({ station }) => Boolean(station?.sentosaExpress),
        render() {
            return `<div class="info-row sg-sentosa-hours"><span class="info-label">运营时间</span><span class="info-value"><a href="https://www.sentosa.com.sg/getting-around" target="_blank" rel="noopener noreferrer" aria-label="圣淘沙捷运官方运营时间">每日 07:00—24:00</a></span></div>`;
        }
    });
})();
