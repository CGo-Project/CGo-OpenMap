const LEGEND_CONFIG = [
    { type: 'title', title: '澳門輕軌', subtitle: 'Macau LRT', marginTop: 8 },
    { type: 'grid', cols: 1, items: [
            { targets: ['MC-TAIPA'], name: '氹仔線<br>Linha da Taipa<br>Taipa Line' },
            { targets: ['MC-SEAC'], name: '石排灣線<br>Linha Seac Pai Van<br>Seac Pai Van Line' },
            { targets: ['MC-HENGQIN'], name: '橫琴線<br>Linha de Hengqin<br>Hengqin Line' }
    ] }
];
window.LEGEND_CONFIG = LEGEND_CONFIG;
