/** CGo OpenMap - 沈阳示意图装饰物配置 (city/shenyang/data_scattered.js)
 * 反斜线摆放位置：X增减10，Y增减20
 * 下划线摆放位置：X增减48以上，Y增减39
 *
 * 注：国铁车站（沈阳站 / 沈阳北站 / 沈阳南站）的铁路徽标已改由车站图元承担
 * （见 shenyang.js 的 renderStationIcon 对 rdot 的处理），不再在此叠加。
*/
const SCATTERED_DATA = [
    {
        id: "airport",
        file: "./city/shenyang/assets/airport.svg",
        x: 980,
        y: 1560,
        width: 20,
        height: 20,
        opacity: 1,
        zIndex: 15
    },
    {
        id: "compass",
        file: "./city/shenyang/assets/compass.svg",
        x: 1800,
        y: 200,
        width: 100,
        height: 100,
        opacity: 1,
        zIndex: 4
    },
];
