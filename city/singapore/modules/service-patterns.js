(function () {
    'use strict';
    const chosen = new Map();
    const lineOf = context => linesData.find(line => line.id === context.lineInfo?.id);
    const visits = (way, stationId, labels = []) => {
        const calls = way.ids.flatMap((id, index) => id === stationId ? [index] : []);
        const end = way.ids.length - 1;
        if (calls.length === 2 && calls[0] === 0 && calls[1] === end) {
            return [{ prev: way.ids[end - 1], next: way.ids[1], label: '' }];
        }
        return calls.map((index, occurrence) => ({
            prev: way.ids[index - 1], next: way.ids[index + 1],
            label: calls.length > 1 ? labels[occurrence] || `第${occurrence + 1}次经过` : ''
        }));
    };
    window.SingaporeServicePatterns = { visits };
    window.StationBoard.registerModule({
        id: 'singapore-service-patterns', name: '运营交路', targetTab: 'line-tab', order: 20, enabled: true,
        shouldRender: context => Boolean(lineOf(context)?.serviceSelector),
        render(context) {
            const line = lineOf(context), escape = window.CGoA11y.escapeHtml;
            const ways = window.CGoLineRouting.waysOfStation(line, context.station.id);
            const active = ways.some(way => way.key === chosen.get(line.id)) ? chosen.get(line.id) : ways[0]?.key;
            const neighbor = id => id && stationsData[id]
                ? `<button type="button" class="sg-service-neighbor" data-service-station="${escape(id)}">${escape(stationsData[id].cn)}</button>` : '无';
            const buttons = ways.map(way => `<button type="button" data-service-way="${escape(way.key)}" aria-pressed="${way.key === active}">${escape(way.name)}</button>`).join('');
            const panels = ways.map(way => {
                const calls = visits(way, context.station.id, line.serviceVisitLabels), multiple = calls.length > 1;
                return `<div class="sg-service-panel" data-service-panel="${escape(way.key)}"${way.key === active ? '' : ' hidden'}><table class="sg-service-neighbors" aria-label="${escape(way.name)}相邻站"><thead><tr>${multiple ? '<th scope="col">方向</th>' : ''}<th scope="col">上一站</th><th scope="col">下一站</th></tr></thead><tbody>${calls.map(call => `<tr>${multiple ? `<th scope="row">${escape(call.label)}</th>` : ''}<td>${neighbor(call.prev)}</td><td>${neighbor(call.next)}</td></tr>`).join('')}</tbody></table></div>`;
            }).join('');
            return `<section class="sg-service-patterns" data-service-line="${escape(line.id)}"><div class="sg-service-choices" role="group" aria-label="选择运营交路">${buttons}</div>${panels}<p class="sg-service-note">${escape(line.serviceNote || '')}</p></section>`;
        },
        onMounted(infoPanel, context) {
            const line = lineOf(context);
            const pane = infoPanel.querySelector(`.tab-pane[data-tab-index="${context.tabIndex}"]`);
            const section = pane?.querySelector('.sg-service-patterns');
            if (!section) return;
            section.querySelectorAll('[data-service-way]').forEach(button => button.addEventListener('click', event => {
                event.stopPropagation();
                chosen.set(line.id, button.dataset.serviceWay);
                section.querySelectorAll('[data-service-way]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
                section.querySelectorAll('[data-service-panel]').forEach(panel => { panel.hidden = panel.dataset.servicePanel !== button.dataset.serviceWay; });
            }));
            section.querySelectorAll('[data-service-station]').forEach(button => button.addEventListener('click', event => {
                event.stopPropagation();
                context.helpers.selectStation(button.dataset.serviceStation);
                const tab = [...infoPanel.querySelectorAll('.tab-item')].find(item => item.textContent.trim() === line.name);
                tab?.click();
            }));
        }
    });
})();
