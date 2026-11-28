(function () {
    'use strict';
    window.StationBoard.registerModule({
        id: 'singapore-airport-shuttle', name: '樟宜机场支线换乘', targetTab: 'body-top', order: 7, enabled: true,
        shouldRender: ({ station }) => station?.id === 'EW4',
        render() {
            return `<section class="sg-airport-shuttle" data-sg-airport-sid="EW4">
                <h3><cgo-icon name="route" size="16"></cgo-icon>机场支线换乘</h3>
                <p>往机场请在本站转乘樟宜机场支线；往市区请换乘东西线主线。</p>
            </section>`;
        }
    });
})();
