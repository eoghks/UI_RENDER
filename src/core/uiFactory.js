import * as utils from "../utils/utils.js";
import {ListView, MetricCard} from "../index.js";
import {createLucideEngine} from "../plugins/lucide/lucideEngine.js";

/**
 * UI Factory v1.1
 * - 클래스 기반 컴포넌트를 new 없이 DOM 선택자로 초기화
 * - JSP/브라우저 환경에서 사용 가능
 * TODO: v2.0이상 공용 DOM Builder 유틸, Fragment 랜더링 or Virtual DOM
 */
if (!window.UI) {
    window.UI = {}; // window.UI에 객체 초기화
}

const UI = window.UI;

/**
 * 공통 CSS 로드
 */
(function () {
    const base = new URL(".", import.meta.url).href;
    utils.injectCss(base + "../styles/uiCommon.css");
})();

/**
 * 기본 Icon Engine 설정
 */
UI.iconEngine = createLucideEngine();

/**
 * 아이콘 엔진 교체 가능
 */
UI.setIconEngine = function (engine) {
    UI.iconEngine = engine;
};

/**
 * 특정 listView를 생성하고 렌더링합니다.
 *
 * - 내부적으로 `listView를`를 통해 ListView 인스턴스를 사용합니다.
 * - 패널 ID로 DOM 요소를 찾아서 렌더링하며, 커스텀 옵션과 후처리도 지원합니다.
 *
 * @param {string} id - 렌더링할 ListView의 DOM ID
 * @param {string} title - ListView의 Header 정보
 * @param {Array<Object>} data - 렌더링할 데이터 배열
 * @param {Object} [schema] - 데이터 매핑 스키마 (옵션)
 * @param {Object} [options={}] - ListView 전달할 추가 옵션
 * @param {Object} [custom={}] - 커스텀 렌더링 함수
 * @param {Function} [custom.header] - 헤더 커스텀 함수 (panelEl 인자)
 * @param {Function} [custom.body] - 바디 커스텀 함수 (panelEl, viewData 인자)
 * @param {Function} [custom.footer] - 푸터 커스텀 함수 (panelEl 인자)
 */
UI.initListView = function ({id, title, data, schema, options = {}, custom = {}} = {}) {
    // ListView 인스턴스 생성
    const lv = new ListView({id, title, schema, options, custom, iconEngine: UI.iconEngine});

    // ListView Render
    lv.init(data);

    return lv;
}

/**
 * MetricCard를 생성하고 렌더링합니다.
 *
 * - 내부적으로 {@link MetricCard} 인스턴스를 생성합니다.
 * - 지정한 DOM ID 요소에 카드 형태의 메트릭 UI를 렌더링합니다.
 * - footer 링크, 커스텀 영역, 이벤트 및 후처리를 지원합니다.
 *
 * @param {Object} params
 * @param {string} params.id - 렌더링할 MetricCard의 DOM ID
 * @param {Object} params.title - 카드 header 정보
 * @param {string} [params.title.value] - 카드 제목 텍스트
 * @param {string} [params.title.icon] - header 아이콘 이름
 * @param {"left"|"right"} [params.title.iconPosition="right"] - 아이콘 위치
 * @param {string} [params.title.backgroundColor] - header 배경 클래스
 *
 * @param {Object} params.data - 카드에 표시할 메트릭 데이터
 * @param {string|number} params.data.value - 메인 수치 값
 * @param {string} [params.data.unit] - 단위 표시
 * @param {Object} [params.data.delta] - 증감 정보
 * @param {"up"|"down"} params.data.delta.type - 증감 방향
 * @param {string|number} params.data.delta.value - 증감 수치
 *
 * @param {Object} [params.footer] - footer 설정
 * @param {string} [params.footer.value] - footer 링크 텍스트
 * @param {string} [params.footer.url] - 이동 URL
 *
 * @param {Object} [params.options={}] - MetricCard 추가 옵션
 * @param {string} [params.options.emptyText="데이터 없음"] - 데이터가 없을 때 표시 문구
 * @param {Array<Object>} [params.options.events] - 이벤트 바인딩 목록
 * @param {Function} [params.options.afterDraw] - 렌더링 완료 후 실행 콜백
 *
 * @param {Object} [params.custom={}] - 커스텀 렌더링 함수
 * @param {Function} [params.custom.header] - header 커스텀 렌더링
 * @param {Function} [params.custom.body] - body 커스텀 렌더링
 * @param {Function} [params.custom.footer] - footer 커스텀 렌더링
 *
 * @returns {MetricCard} 생성된 MetricCard 인스턴스
 */
UI.initMatricCard = function ({id, title, data, footer, options = {}, custom = {}} = {}) {
    // MetricCard를 인스턴스 생성
    const mc = new MetricCard({id, title, footer, options, custom, iconEngine: UI.iconEngine});

    // MetricCard를 Render
    mc.init(data);

    return mc;
}

export default UI;