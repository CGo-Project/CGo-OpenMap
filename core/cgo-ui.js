var pt=Object.defineProperty;var gt=(a,e,t)=>e in a?pt(a,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):a[e]=t;var g=(a,e,t)=>gt(a,typeof e!="symbol"?e+"":e,t);/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const p1=globalThis,pe=p1.ShadowRoot&&(p1.ShadyCSS===void 0||p1.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,ge=Symbol(),me=new WeakMap;let De=class{constructor(e,t,o){if(this._$cssResult$=!0,o!==ge)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o;const t=this.t;if(pe&&e===void 0){const o=t!==void 0&&t.length===1;o&&(e=me.get(t)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),o&&me.set(t,e))}return e}toString(){return this.cssText}};const bt=a=>new De(typeof a=="string"?a:a+"",void 0,ge),m=(a,...e)=>{const t=a.length===1?a[0]:e.reduce((o,r,i)=>o+(s=>{if(s._$cssResult$===!0)return s.cssText;if(typeof s=="number")return s;throw Error("Value passed to 'css' function must be a 'css' function result: "+s+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(r)+a[i+1],a[0]);return new De(t,a,ge)},ft=(a,e)=>{if(pe)a.adoptedStyleSheets=e.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const t of e){const o=document.createElement("style"),r=p1.litNonce;r!==void 0&&o.setAttribute("nonce",r),o.textContent=t.cssText,a.appendChild(o)}},xe=pe?a=>a:a=>a instanceof CSSStyleSheet?(e=>{let t="";for(const o of e.cssRules)t+=o.cssText;return bt(t)})(a):a;/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const{is:vt,defineProperty:ut,getOwnPropertyDescriptor:mt,getOwnPropertyNames:xt,getOwnPropertySymbols:yt,getPrototypeOf:wt}=Object,C=globalThis,ye=C.trustedTypes,kt=ye?ye.emptyScript:"",k1=C.reactiveElementPolyfillSupport,t1=(a,e)=>a,A1={toAttribute(a,e){switch(e){case Boolean:a=a?kt:null;break;case Object:case Array:a=a==null?a:JSON.stringify(a)}return a},fromAttribute(a,e){let t=a;switch(e){case Boolean:t=a!==null;break;case Number:t=a===null?null:Number(a);break;case Object:case Array:try{t=JSON.parse(a)}catch{t=null}}return t}},Re=(a,e)=>!vt(a,e),we={attribute:!0,type:String,converter:A1,reflect:!1,useDefault:!1,hasChanged:Re};Symbol.metadata??(Symbol.metadata=Symbol("metadata")),C.litPropertyMetadata??(C.litPropertyMetadata=new WeakMap);let R=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??(this.l=[])).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=we){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){const o=Symbol(),r=this.getPropertyDescriptor(e,o,t);r!==void 0&&ut(this.prototype,e,r)}}static getPropertyDescriptor(e,t,o){const{get:r,set:i}=mt(this.prototype,e)??{get(){return this[t]},set(s){this[t]=s}};return{get:r,set(s){const n=r==null?void 0:r.call(this);i==null||i.call(this,s),this.requestUpdate(e,n,o)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??we}static _$Ei(){if(this.hasOwnProperty(t1("elementProperties")))return;const e=wt(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(t1("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(t1("properties"))){const t=this.properties,o=[...xt(t),...yt(t)];for(const r of o)this.createProperty(r,t[r])}const e=this[Symbol.metadata];if(e!==null){const t=litPropertyMetadata.get(e);if(t!==void 0)for(const[o,r]of t)this.elementProperties.set(o,r)}this._$Eh=new Map;for(const[t,o]of this.elementProperties){const r=this._$Eu(t,o);r!==void 0&&this._$Eh.set(r,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){const t=[];if(Array.isArray(e)){const o=new Set(e.flat(1/0).reverse());for(const r of o)t.unshift(xe(r))}else e!==void 0&&t.push(xe(e));return t}static _$Eu(e,t){const o=t.attribute;return o===!1?void 0:typeof o=="string"?o:typeof e=="string"?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){var e;this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),(e=this.constructor.l)==null||e.forEach(t=>t(this))}addController(e){var t;(this._$EO??(this._$EO=new Set)).add(e),this.renderRoot!==void 0&&this.isConnected&&((t=e.hostConnected)==null||t.call(e))}removeController(e){var t;(t=this._$EO)==null||t.delete(e)}_$E_(){const e=new Map,t=this.constructor.elementProperties;for(const o of t.keys())this.hasOwnProperty(o)&&(e.set(o,this[o]),delete this[o]);e.size>0&&(this._$Ep=e)}createRenderRoot(){const e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return ft(e,this.constructor.elementStyles),e}connectedCallback(){var e;this.renderRoot??(this.renderRoot=this.createRenderRoot()),this.enableUpdating(!0),(e=this._$EO)==null||e.forEach(t=>{var o;return(o=t.hostConnected)==null?void 0:o.call(t)})}enableUpdating(e){}disconnectedCallback(){var e;(e=this._$EO)==null||e.forEach(t=>{var o;return(o=t.hostDisconnected)==null?void 0:o.call(t)})}attributeChangedCallback(e,t,o){this._$AK(e,o)}_$ET(e,t){var i;const o=this.constructor.elementProperties.get(e),r=this.constructor._$Eu(e,o);if(r!==void 0&&o.reflect===!0){const s=(((i=o.converter)==null?void 0:i.toAttribute)!==void 0?o.converter:A1).toAttribute(t,o.type);this._$Em=e,s==null?this.removeAttribute(r):this.setAttribute(r,s),this._$Em=null}}_$AK(e,t){var i,s;const o=this.constructor,r=o._$Eh.get(e);if(r!==void 0&&this._$Em!==r){const n=o.getPropertyOptions(r),c=typeof n.converter=="function"?{fromAttribute:n.converter}:((i=n.converter)==null?void 0:i.fromAttribute)!==void 0?n.converter:A1;this._$Em=r;const h=c.fromAttribute(t,n.type);this[r]=h??((s=this._$Ej)==null?void 0:s.get(r))??h,this._$Em=null}}requestUpdate(e,t,o,r=!1,i){var s;if(e!==void 0){const n=this.constructor;if(r===!1&&(i=this[e]),o??(o=n.getPropertyOptions(e)),!((o.hasChanged??Re)(i,t)||o.useDefault&&o.reflect&&i===((s=this._$Ej)==null?void 0:s.get(e))&&!this.hasAttribute(n._$Eu(e,o))))return;this.C(e,t,o)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(e,t,{useDefault:o,reflect:r,wrapped:i},s){o&&!(this._$Ej??(this._$Ej=new Map)).has(e)&&(this._$Ej.set(e,s??t??this[e]),i!==!0||s!==void 0)||(this._$AL.has(e)||(this.hasUpdated||o||(t=void 0),this._$AL.set(e,t)),r===!0&&this._$Em!==e&&(this._$Eq??(this._$Eq=new Set)).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){var o;if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??(this.renderRoot=this.createRenderRoot()),this._$Ep){for(const[i,s]of this._$Ep)this[i]=s;this._$Ep=void 0}const r=this.constructor.elementProperties;if(r.size>0)for(const[i,s]of r){const{wrapped:n}=s,c=this[i];n!==!0||this._$AL.has(i)||c===void 0||this.C(i,void 0,s,c)}}let e=!1;const t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),(o=this._$EO)==null||o.forEach(r=>{var i;return(i=r.hostUpdate)==null?void 0:i.call(r)}),this.update(t)):this._$EM()}catch(r){throw e=!1,this._$EM(),r}e&&this._$AE(t)}willUpdate(e){}_$AE(e){var t;(t=this._$EO)==null||t.forEach(o=>{var r;return(r=o.hostUpdated)==null?void 0:r.call(o)}),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&(this._$Eq=this._$Eq.forEach(t=>this._$ET(t,this[t]))),this._$EM()}updated(e){}firstUpdated(e){}};R.elementStyles=[],R.shadowRootOptions={mode:"open"},R[t1("elementProperties")]=new Map,R[t1("finalized")]=new Map,k1==null||k1({ReactiveElement:R}),(C.reactiveElementVersions??(C.reactiveElementVersions=[])).push("2.1.2");/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const a1=globalThis,ke=a=>a,u1=a1.trustedTypes,Me=u1?u1.createPolicy("lit-html",{createHTML:a=>a}):void 0,Fe="$lit$",E=`lit$${Math.random().toFixed(9).slice(2)}$`,Ge="?"+E,Mt=`<${Ge}>`,q=document,o1=()=>q.createComment(""),r1=a=>a===null||typeof a!="object"&&typeof a!="function",be=Array.isArray,_t=a=>be(a)||typeof(a==null?void 0:a[Symbol.iterator])=="function",M1=`[ 	
\f\r]`,W=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,_e=/-->/g,$e=/>/g,L=RegExp(`>|${M1}(?:([^\\s"'>=/]+)(${M1}*=${M1}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),ze=/'/g,Ze=/"/g,Ye=/^(?:script|style|textarea|title)$/i,$t=a=>(e,...t)=>({_$litType$:a,strings:e,values:t}),l=$t(1),A=Symbol.for("lit-noChange"),k=Symbol.for("lit-nothing"),Se=new WeakMap,P=q.createTreeWalker(q,129);function Ke(a,e){if(!be(a)||!a.hasOwnProperty("raw"))throw Error("invalid template strings array");return Me!==void 0?Me.createHTML(e):e}const zt=(a,e)=>{const t=a.length-1,o=[];let r,i=e===2?"<svg>":e===3?"<math>":"",s=W;for(let n=0;n<t;n++){const c=a[n];let h,b,d=-1,f=0;for(;f<c.length&&(s.lastIndex=f,b=s.exec(c),b!==null);)f=s.lastIndex,s===W?b[1]==="!--"?s=_e:b[1]!==void 0?s=$e:b[2]!==void 0?(Ye.test(b[2])&&(r=RegExp("</"+b[2],"g")),s=L):b[3]!==void 0&&(s=L):s===L?b[0]===">"?(s=r??W,d=-1):b[1]===void 0?d=-2:(d=s.lastIndex-b[2].length,h=b[1],s=b[3]===void 0?L:b[3]==='"'?Ze:ze):s===Ze||s===ze?s=L:s===_e||s===$e?s=W:(s=L,r=void 0);const p=s===L&&a[n+1].startsWith("/>")?" ":"";i+=s===W?c+Mt:d>=0?(o.push(h),c.slice(0,d)+Fe+c.slice(d)+E+p):c+E+(d===-2?n:p)}return[Ke(a,i+(a[t]||"<?>")+(e===2?"</svg>":e===3?"</math>":"")),o]};class i1{constructor({strings:e,_$litType$:t},o){let r;this.parts=[];let i=0,s=0;const n=e.length-1,c=this.parts,[h,b]=zt(e,t);if(this.el=i1.createElement(h,o),P.currentNode=this.el.content,t===2||t===3){const d=this.el.content.firstChild;d.replaceWith(...d.childNodes)}for(;(r=P.nextNode())!==null&&c.length<n;){if(r.nodeType===1){if(r.hasAttributes())for(const d of r.getAttributeNames())if(d.endsWith(Fe)){const f=b[s++],p=r.getAttribute(d).split(E),u=/([.?@])?(.*)/.exec(f);c.push({type:1,index:i,name:u[2],strings:p,ctor:u[1]==="."?St:u[1]==="?"?Et:u[1]==="@"?Ct:x1}),r.removeAttribute(d)}else d.startsWith(E)&&(c.push({type:6,index:i}),r.removeAttribute(d));if(Ye.test(r.tagName)){const d=r.textContent.split(E),f=d.length-1;if(f>0){r.textContent=u1?u1.emptyScript:"";for(let p=0;p<f;p++)r.append(d[p],o1()),P.nextNode(),c.push({type:2,index:++i});r.append(d[f],o1())}}}else if(r.nodeType===8)if(r.data===Ge)c.push({type:2,index:i});else{let d=-1;for(;(d=r.data.indexOf(E,d+1))!==-1;)c.push({type:7,index:i}),d+=E.length-1}i++}}static createElement(e,t){const o=q.createElement("template");return o.innerHTML=e,o}}function G(a,e,t=a,o){var s,n;if(e===A)return e;let r=o!==void 0?(s=t._$Co)==null?void 0:s[o]:t._$Cl;const i=r1(e)?void 0:e._$litDirective$;return(r==null?void 0:r.constructor)!==i&&((n=r==null?void 0:r._$AO)==null||n.call(r,!1),i===void 0?r=void 0:(r=new i(a),r._$AT(a,t,o)),o!==void 0?(t._$Co??(t._$Co=[]))[o]=r:t._$Cl=r),r!==void 0&&(e=G(a,r._$AS(a,e.values),r,o)),e}class Zt{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){const{el:{content:t},parts:o}=this._$AD,r=((e==null?void 0:e.creationScope)??q).importNode(t,!0);P.currentNode=r;let i=P.nextNode(),s=0,n=0,c=o[0];for(;c!==void 0;){if(s===c.index){let h;c.type===2?h=new K(i,i.nextSibling,this,e):c.type===1?h=new c.ctor(i,c.name,c.strings,this,e):c.type===6&&(h=new At(i,this,e)),this._$AV.push(h),c=o[++n]}s!==(c==null?void 0:c.index)&&(i=P.nextNode(),s++)}return P.currentNode=q,r}p(e){let t=0;for(const o of this._$AV)o!==void 0&&(o.strings!==void 0?(o._$AI(e,o,t),t+=o.strings.length-2):o._$AI(e[t])),t++}}class K{get _$AU(){var e;return((e=this._$AM)==null?void 0:e._$AU)??this._$Cv}constructor(e,t,o,r){this.type=2,this._$AH=k,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=o,this.options=r,this._$Cv=(r==null?void 0:r.isConnected)??!0}get parentNode(){let e=this._$AA.parentNode;const t=this._$AM;return t!==void 0&&(e==null?void 0:e.nodeType)===11&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=G(this,e,t),r1(e)?e===k||e==null||e===""?(this._$AH!==k&&this._$AR(),this._$AH=k):e!==this._$AH&&e!==A&&this._(e):e._$litType$!==void 0?this.$(e):e.nodeType!==void 0?this.T(e):_t(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==k&&r1(this._$AH)?this._$AA.nextSibling.data=e:this.T(q.createTextNode(e)),this._$AH=e}$(e){var i;const{values:t,_$litType$:o}=e,r=typeof o=="number"?this._$AC(e):(o.el===void 0&&(o.el=i1.createElement(Ke(o.h,o.h[0]),this.options)),o);if(((i=this._$AH)==null?void 0:i._$AD)===r)this._$AH.p(t);else{const s=new Zt(r,this),n=s.u(this.options);s.p(t),this.T(n),this._$AH=s}}_$AC(e){let t=Se.get(e.strings);return t===void 0&&Se.set(e.strings,t=new i1(e)),t}k(e){be(this._$AH)||(this._$AH=[],this._$AR());const t=this._$AH;let o,r=0;for(const i of e)r===t.length?t.push(o=new K(this.O(o1()),this.O(o1()),this,this.options)):o=t[r],o._$AI(i),r++;r<t.length&&(this._$AR(o&&o._$AB.nextSibling,r),t.length=r)}_$AR(e=this._$AA.nextSibling,t){var o;for((o=this._$AP)==null?void 0:o.call(this,!1,!0,t);e!==this._$AB;){const r=ke(e).nextSibling;ke(e).remove(),e=r}}setConnected(e){var t;this._$AM===void 0&&(this._$Cv=e,(t=this._$AP)==null||t.call(this,e))}}class x1{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,o,r,i){this.type=1,this._$AH=k,this._$AN=void 0,this.element=e,this.name=t,this._$AM=r,this.options=i,o.length>2||o[0]!==""||o[1]!==""?(this._$AH=Array(o.length-1).fill(new String),this.strings=o):this._$AH=k}_$AI(e,t=this,o,r){const i=this.strings;let s=!1;if(i===void 0)e=G(this,e,t,0),s=!r1(e)||e!==this._$AH&&e!==A,s&&(this._$AH=e);else{const n=e;let c,h;for(e=i[0],c=0;c<i.length-1;c++)h=G(this,n[o+c],t,c),h===A&&(h=this._$AH[c]),s||(s=!r1(h)||h!==this._$AH[c]),h===k?e=k:e!==k&&(e+=(h??"")+i[c+1]),this._$AH[c]=h}s&&!r&&this.j(e)}j(e){e===k?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}}class St extends x1{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===k?void 0:e}}class Et extends x1{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==k)}}class Ct extends x1{constructor(e,t,o,r,i){super(e,t,o,r,i),this.type=5}_$AI(e,t=this){if((e=G(this,e,t,0)??k)===A)return;const o=this._$AH,r=e===k&&o!==k||e.capture!==o.capture||e.once!==o.once||e.passive!==o.passive,i=e!==k&&(o===k||r);r&&this.element.removeEventListener(this.name,this,o),i&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){var t;typeof this._$AH=="function"?this._$AH.call(((t=this.options)==null?void 0:t.host)??this.element,e):this._$AH.handleEvent(e)}}class At{constructor(e,t,o){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=o}get _$AU(){return this._$AM._$AU}_$AI(e){G(this,e)}}const Ht={I:K},_1=a1.litHtmlPolyfillSupport;_1==null||_1(i1,K),(a1.litHtmlVersions??(a1.litHtmlVersions=[])).push("3.3.3");const Tt=(a,e,t)=>{const o=(t==null?void 0:t.renderBefore)??e;let r=o._$litPart$;if(r===void 0){const i=(t==null?void 0:t.renderBefore)??null;o._$litPart$=r=new K(e.insertBefore(o1(),i),i,void 0,t??{})}return r._$AI(a),r};/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const O=globalThis;let x=class extends R{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){var t;const e=super.createRenderRoot();return(t=this.renderOptions).renderBefore??(t.renderBefore=e.firstChild),e}update(e){const t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=Tt(t,this.renderRoot,this.renderOptions)}connectedCallback(){var e;super.connectedCallback(),(e=this._$Do)==null||e.setConnected(!0)}disconnectedCallback(){var e;super.disconnectedCallback(),(e=this._$Do)==null||e.setConnected(!1)}render(){return A}};var Ue;x._$litElement$=!0,x.finalized=!0,(Ue=O.litElementHydrateSupport)==null||Ue.call(O,{LitElement:x});const $1=O.litElementPolyfillSupport;$1==null||$1({LitElement:x});(O.litElementVersions??(O.litElementVersions=[])).push("4.2.2");/*!
 * CGo UI — 图标数据与 SVG 构建器（单一数据源）
 * 迁移自 cgoui/cgo_icons.js 的 ICONS 注册表。
 * <cgo-icon> 组件与 window.CGO.icon 兼容垫片共享本模块。
 *
 * 每个 key → { d, type?, viewBox? }
 *   d       : SVG 内部内容（path/circle/polygon… 字符串）
 *   type    : 'fill'(默认) | 'stroke'（fill:none stroke:currentColor）
 *   viewBox : 自定义视窗（默认 '0 0 24 24'）
 */const v={back:{d:'<path d="M14.62,19h-2.81c-.13,0-.25-.05-.34-.13l-7.41-6.72c-.09-.08-.09-.22,0-.3l7.41-6.72c.09-.08.21-.13.34-.13h2.81c.14,0,.2.17.1.26l-6.12,5.54h11.19c.11,0,.2.09.2.2v1.99c0,.11-.09.2-.2.2h-11.19l6.12,5.54c.1.09.04.26-.1.26Z"/>'},forward:{d:'<path d="M9.38,5h2.81c.13,0,.25.05.34.13l7.41,6.72c.09.08.09.22,0,.3l-7.41,6.72c-.09.08-.21.13-.34.13h-2.81c-.14,0-.2-.17-.1-.26l6.12-5.54H4.2c-.11,0-.2-.09-.2-.2v-1.99c0-.11.09-.2.2-.2h11.19l-6.12-5.54c-.1-.09-.04-.26.1-.26Z"/>'},home:{d:'<path d="M9.93,20.54v-5.79c0-.11.09-.21.21-.21h3.72c.11,0,.21.09.21.21v5.79c0,.11.09.21.21.21h4.75c.11,0,.21-.09.21-.21v-7.86c0-.11.09-.21.21-.21h2.35c.19,0,.28-.23.14-.36L12.14,3.3c-.08-.07-.2-.07-.28,0L2.07,12.12c-.14.13-.05.36.14.36h2.35c.11,0,.21.09.21.21v7.86c0,.11.09.21.21.21h4.75c.11,0,.21-.09.21-.21Z"/>'},"home-dots":{d:'<circle cx="6" cy="6" r="2"/><circle cx="12" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="6" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="18" cy="12" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="12" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>'},external:{d:'<path d="M5.3,17V7.7c0-.11-.09-.2-.2-.2h-1.9c-.11,0-.2.09-.2.2v9.5h0c0,1.27,1.03,2.3,2.3,2.3h12.5c.11,0,.2-.09.2-.2v-1.9c0-.11-.09-.2-.2-.2H5.5c-.11,0-.2-.09-.2-.2Z"/><path d="M7.3,13.38v1.62c0,.11.09.2.2.2h1.9c.11,0,.2-.09.2-.2v-1.77c0-1.27,1.03-2.3,2.3-2.3h4.85l-4.55,4.04c-.09.08-.03.23.09.23h2.61c.11,0,.21-.04.3-.11l5.74-5.1c.08-.07.08-.2,0-.27l-5.74-5.1c-.08-.07-.19-.11-.3-.11h-2.61c-.12,0-.18.15-.09.23l4.55,4.04h-4.85c-2.54,0-4.6,2.06-4.6,4.6Z"/>'},menu:{d:'<rect x="3" y="15.7" width="18" height="2.3" rx=".2" ry=".2"/><rect x="3" y="10.85" width="18" height="2.3" rx=".2" ry=".2"/><rect x="3" y="6" width="18" height="2.3" rx=".2" ry=".2"/>'},sun:{d:'<circle cx="12" cy="12" r="5"/><path d="M2,13h2c.55,0,1-.45,1-1s-.45-1-1-1h-2c-.55,0-1,.45-1,1s.45,1,1,1Z"/><path d="M20,13h2c.55,0,1-.45,1-1s-.45-1-1-1h-2c-.55,0-1,.45-1,1s.45,1,1,1Z"/><path d="M11,2v2c0,.55.45,1,1,1s1-.45,1-1v-2c0-.55-.45-1-1-1s-1,.45-1,1Z"/><path d="M11,20v2c0,.55.45,1,1,1s1-.45,1-1v-2c0-.55-.45-1-1-1s-1,.45-1,1Z"/><path d="M5.99,4.58c-.39-.39-1.03-.39-1.41,0-.39.39-.39,1.03,0,1.41l1.06,1.06c.39.39,1.03.39,1.41,0s.39-1.03,0-1.41l-1.06-1.06Z"/><path d="M18.36,16.95c-.39-.39-1.03-.39-1.41,0-.39.39-.39,1.03,0,1.41l1.06,1.06c.39.39,1.03.39,1.41,0,.39-.39.39-1.03,0-1.41l-1.06-1.06Z"/><path d="M19.42,5.99c.39-.39.39-1.03,0-1.41-.39-.39-1.03-.39-1.41,0l-1.06,1.06c-.39.39-.39,1.03,0,1.41s1.03.39,1.41,0l1.06-1.06Z"/><path d="M7.05,18.36c.39-.39.39-1.03,0-1.41-.39-.39-1.03-.39-1.41,0l-1.06,1.06c-.39.39-.39,1.03,0,1.41s1.03.39,1.41,0l1.06-1.06Z"/>'},moon:{d:'<path d="M14.86,14.44c-2.79-.2-5.1-2.51-5.29-5.3-.19-2.63,1.41-4.91,3.7-5.77.14-.05.12-.27-.03-.29-.92-.13-1.89-.11-2.89.07-3.72.68-6.68,3.73-7.24,7.47-.9,6.06,4.24,11.19,10.3,10.27,3.74-.56,6.77-3.53,7.45-7.25.18-.99.19-1.95.06-2.88-.02-.15-.23-.17-.29-.03-.86,2.29-3.14,3.89-5.77,3.7Z"/>'},add:{d:'<path d="M19.3,10.8h-6.1v-6.1c0-.11-.09-.2-.2-.2h-2c-.11,0-.2.09-.2.2v6.1h-6.1c-.11,0-.2.09-.2.2v2c0,.11.09.2.2.2h6.1v6.1c0,.11.09.2.2.2h2c.11,0,.2-.09.2-.2v-6.1h6.1c.11,0,.2-.09.2-.2v-2c0-.11-.09-.2-.2-.2Z"/>'},addone:{d:'<circle cx="12" cy="12" r="4"/><path d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10,10-4.48,10-10S17.52,2,12,2ZM12,19.33c-4.05,0-7.33-3.28-7.33-7.33s3.28-7.33,7.33-7.33,7.33,3.28,7.33,7.33-3.28,7.33-7.33,7.33Z"/>'},edit:{d:'<path d="M20.71,5.63l-2.34-2.34c-.39-.39-1.02-.39-1.41,0l-1.69,1.69c-.08.08-.08.2,0,.28l3.47,3.47c.08.08.2.08.28,0l1.69-1.69c.39-.39.39-1.02,0-1.41Z"/><path d="M3,17.33v3.47c0,.11.09.2.2.2h3.47c.05,0,.1-.02.14-.06l10.86-10.86c.08-.08.08-.2,0-.28l-3.47-3.47c-.08-.08-.2-.08-.28,0L3.06,17.19s-.06.09-.06.14Z"/>'},delete:{d:'<path d="M6,19c0,1.1.9,2,2,2h8c1.1,0,2-.9,2-2V7.2c0-.11-.09-.2-.2-.2H6.2c-.11,0-.2.09-.2.2v11.8Z"/><path d="M18.8,4h-3.22c-.05,0-.1-.02-.14-.06l-.88-.88s-.09-.06-.14-.06h-4.83c-.05,0-.1.02-.14.06l-.88.88s-.09.06-.14.06h-3.22c-.11,0-.2.09-.2.2v1.6c0,.11.09.2.2.2h13.6c.11,0,.2-.09.2-.2v-1.6c0-.11-.09-.2-.2-.2Z"/>'},save:{d:'<path d="M20.85,6.85l-3.71-3.71c-.09-.09-.22-.15-.35-.15H5c-1.11,0-2,.9-2,2v14c0,1.1.9,2,2,2h14c1.1,0,2-.9,2-2V7.21c0-.13-.05-.26-.15-.35ZM12,19c-1.66,0-3-1.34-3-3s1.34-3,3-3,3,1.34,3,3-1.34,3-3,3ZM15,8.8c0,.11-.09.2-.2.2H5.2c-.11,0-.2-.09-.2-.2v-3.6c0-.11.09-.2.2-.2h9.6c.11,0,.2.09.2.2v3.6Z"/>'},copy:{d:'<path d="M20.5,2h-12c-.83,0-1.5.67-1.5,1.5v1.5h8.5c1.93,0,3.5,1.57,3.5,3.5v8.5h1.5c.83,0,1.5-.67,1.5-1.5V3.5c0-.83-.67-1.5-1.5-1.5Z"/><path d="M15.5,7H3.5c-.83,0-1.5.67-1.5,1.5v12c0,.83.67,1.5,1.5,1.5h12c.83,0,1.5-.67,1.5-1.5v-12c0-.83-.67-1.5-1.5-1.5ZM14.5,15.3c0,.11-.09.2-.2.2h-3.8v3.8c0,.11-.09.2-.2.2h-1.6c-.11,0-.2-.09-.2-.2v-3.8h-3.8c-.11,0-.2-.09-.2-.2v-1.6c0-.11.09-.2.2-.2h3.8v-3.8c0-.11.09-.2.2-.2h1.6c.11,0,.2.09.2.2v3.8h3.8c.11,0,.2.09.2.2v1.6Z"/>'},close:{d:'<path d="M13.7,12l4.99-4.99c.08-.08.08-.2,0-.28l-1.41-1.41c-.08-.08-.2-.08-.28,0l-4.99,4.99-4.99-4.99c-.08-.08-.2-.08-.28,0l-1.41,1.41c-.08.08-.08.2,0,.28l4.99,4.99-4.99,4.99c-.08.08-.08.2,0,.28l1.41,1.41c.08.08.2.08.28,0l4.99-4.99,4.99,4.99c.08.08.2.08.28,0l1.41-1.41c.08-.08.08-.2,0-.28l-4.99-4.99Z"/>'},refresh:{d:'<path d="M20.99,4.89c0-.13-.06-.24-.14-.33l-2.06-2.02c-.1-.09-.26-.02-.25.12l.49,6.74-1.94-1.92-.57-.57c-1.47-1.33-3.42-2.15-5.56-2.17h-.08c-3.58,0-6.87,2.23-7.95,5.65-1.84,5.79,2.43,11.11,7.95,11.11,3.63,0,6.73-2.32,7.88-5.55.05-.13-.05-.26-.18-.27l-2.09-.12c-.08,0-.15.04-.19.11-1.05,2.25-3.45,3.73-6.17,3.41s-4.91-2.54-5.22-5.25c-.42-3.64,2.42-6.71,5.96-6.71,1.66,0,3.16.67,4.24,1.76l2.21,2.19-.84-.06-6.01-.42c-.14-.01-.21.15-.12.25l2.06,2.02c.09.08.2.14.32.14l4.13.24,2.38.14,2.04.12c.12.01.22-.09.21-.21l-.51-8.4Z"/>'},undo:{d:'<path d="M7.17,15.07l5.17-5.1c1.22-1.2,3.19-1.2,4.4,0l2.5,2.46c.09.09.23.09.32,0l1.38-1.36c.09-.09.09-.23,0-.31l-2.5-2.46c-1.65-1.63-4.1-2.01-6.11-1.13-.61.26-1.18.64-1.68,1.13l-5.17,5.1.49-6.71c.01-.15-.18-.24-.29-.13l-2.01,1.98c-.1.1-.15.22-.16.36l-.5,8.38c0,.13.1.24.24.23l8.5-.49c.14,0,.27-.07.36-.16l2.01-1.98c.11-.11.02-.29-.13-.28l-6.81.48Z"/>'},redo:{d:'<path d="M16.83,15.07l-5.17-5.1c-1.22-1.2-3.19-1.2-4.4,0l-2.5,2.46c-.09.09-.23.09-.32,0l-1.38-1.36c-.09-.09-.09-.23,0-.31l2.5-2.46c1.65-1.63,4.1-2.01,6.11-1.13.61.26,1.18.64,1.68,1.13l5.17,5.1-.49-6.71c-.01-.15.18-.24.29-.13l2.01,1.98c.1.1.15.22.16.36l.5,8.38c0,.13-.1.24-.24.23l-8.5-.49c-.14,0-.27-.07-.36-.16l-2.01-1.98c-.11-.11-.02-.29.13-.28l6.81.48Z"/>'},file:{d:'<path d="M19.85,7.85l-5.71-5.71c-.09-.09-.22-.15-.35-.15h-7.79c-1.1,0-1.99.9-1.99,2v16c-.01,1.1.88,2,1.98,2h12.01c1.1,0,2-.9,2-2v-11.79c0-.13-.05-.26-.15-.35ZM16,17.8c0,.11-.09.2-.2.2h-7.6c-.11,0-.2-.09-.2-.2v-1.6c0-.11.09-.2.2-.2h7.6c.11,0,.2.09.2.2v1.6ZM16,13.8c0,.11-.09.2-.2.2h-7.6c-.11,0-.2-.09-.2-.2v-1.6c0-.11.09-.2.2-.2h7.6c.11,0,.2.09.2.2v1.6ZM18.02,9h-4.82c-.11,0-.2-.09-.2-.2V3.98c0-.18.22-.27.34-.14l4.82,4.82c.13.13.04.34-.14.34Z"/>'},folder:{d:'<path d="M10.15,4.15c-.09-.09-.22-.15-.35-.15h-5.79c-1.1,0-1.99.9-1.99,2v12c0,1.1.89,2,1.99,2h16c1.1,0,2-.9,2-2v-10c0-1.1-.9-2-2-2h-7.79c-.13,0-.26-.05-.35-.15l-1.71-1.71Z"/>'},upload:{d:'<rect x="6" y="18.1" width="12" height="2.4" rx=".2" ry=".2"/><path d="M6,13.27v-2.93c0-.12.04-.24.13-.33l5.72-6.44c.08-.09.22-.09.3,0l5.72,6.44c.08.09.13.21.13.33v2.93c0,.14-.17.2-.26.1l-4.53-5.1v9.05c0,.11-.09.2-.2.2h-2.01c-.11,0-.2-.09-.2-.2v-9.05l-4.53,5.1c-.09.1-.26.04-.26-.1Z"/>'},download:{d:'<rect x="6" y="18.1" width="12" height="2.4" rx=".2" ry=".2"/><path d="M18,7.74v2.93c0,.12-.04.24-.13.33l-5.72,6.44c-.08.09-.22.09-.3,0l-5.72-6.44c-.08-.09-.13-.21-.13-.33v-2.93c0-.14.17-.2.26-.1l4.53,5.1V3.7c0-.11.09-.2.2-.2h2.01c.11,0,.2.09.2.2v9.05l4.53-5.1c.09-.1.26-.04.26.1Z"/>'},"export-img":{d:'<path d="M19,3H5c-1.1,0-2,.9-2,2v14c0,1.1.9,2,2,2h14c1.1,0,2-.9,2-2V5c0-1.1-.9-2-2-2ZM18.59,18.79H5.41c-.11,0-.2-.09-.2-.2V5.41c0-.11.09-.2.2-.2h13.18c.11,0,.2.09.2.2v10.16l-3.03-4.59c-.08-.12-.25-.12-.33,0l-3.03,4.45c-.08.11-.25.12-.33,0l-2.07-2.83c-.08-.11-.25-.11-.33,0l-2.96,4.33c-.1.14,0,.35.15.35h11.92v1.31c0,.11-.09.2-.2.2Z"/><circle cx="8.22" cy="8.48" r="1.54"/>'},"export-svg":{d:'<path d="M20.71,5.63l-2.34-2.34c-.39-.39-1.02-.39-1.41,0l-1.69,1.69c-.08.08-.08.2,0,.28l3.47,3.47c.08.08.2.08.28,0l1.69-1.69c.39-.39.39-1.02,0-1.41Z"/><path d="M3,17.33v3.47c0,.11.09.2.2.2h3.47c.05,0,.1-.02.14-.06l10.86-10.86c.08-.08.08-.2,0-.28l-3.47-3.47c-.08-.08-.2-.08-.28,0L3.06,17.19s-.06.09-.06.14Z"/>'},"export-json":{d:'<path d="M9.87,17.5h-2.32c-.1,0-.2-.04-.28-.12l-5.21-5.24c-.07-.07-.07-.19,0-.27l5.21-5.25c.08-.08.18-.12.28-.12h2.33c.11,0,.17.16.08.24l-5.18,5.19s-.04.1,0,.14l5.17,5.19c.08.08.03.24-.08.24Z"/><path d="M14.13,6.5h2.32c.1,0,.2.04.28.12l5.21,5.24c.07.07.07.19,0,.27l-5.21,5.25c-.08.08-.18.12-.28.12h-2.33c-.11,0-.17-.16-.08-.24l5.18-5.19s.04-.1,0-.14l-5.17-5.19c-.08-.08-.03-.24.08-.24Z"/>'},"export-zip":{d:'<rect x="6.62" y="15.82" width="2.74" height="1.37" rx=".2" ry=".2"/><path d="M19.85,7.85l-5.71-5.71c-.09-.09-.22-.15-.35-.15h-7.79c-1.1,0-1.99.9-1.99,2v16c-.01,1.1.88,2,1.98,2h12.01c1.1,0,2-.9,2-2v-11.79c0-.13-.05-.26-.15-.35ZM5.94,5.07c0-.11.09-.2.2-.2h1.65c.11,0,.2.09.2.2v.97c0,.11-.09.2-.2.2h-1.65c-.11,0-.2-.09-.2-.2v-.97ZM5.94,7.81c0-.11.09-.2.2-.2h1.65c.11,0,.2.09.2.2v.97c0,.11-.09.2-.2.2h-1.65c-.11,0-.2-.09-.2-.2v-.97ZM5.94,10.54c0-.11.09-.2.2-.2h1.65c.11,0,.2.09.2.2v.97c0,.11-.09.2-.2.2h-1.65c-.11,0-.2-.09-.2-.2v-.97ZM10.04,12.88s0,0,0,0v4.98c0,.38-.3.69-.68.69h-2.74c-.38,0-.68-.31-.68-.69v-4.59c0-.11.09-.2.2-.2h1.85v-1.17c0-.11.09-.2.2-.2h1.04s0,0,0,0h.61c.11,0,.2.09.2.2v.97ZM10.04,10.14c0,.11-.09.2-.2.2h-1.65c-.11,0-.2-.09-.2-.2v-.97c0-.11.09-.2.2-.2h1.65c.11,0,.2.09.2.2v.97ZM10.04,7.41c0,.11-.09.2-.2.2h-1.65c-.11,0-.2-.09-.2-.2v-.97c0-.11.09-.2.2-.2h1.65c.11,0,.2.09.2.2v.97ZM10.04,4.67c0,.11-.09.2-.2.2h-1.65c-.11,0-.2-.09-.2-.2v-.97c0-.11.09-.2.2-.2h1.65c.11,0,.2.09.2.2v.97Z"/>'},"export-pdf":{d:'<path d="M7.38,13.14h-.54v1.73h.58c.65,0,.76-.33.76-.92s-.16-.81-.8-.81Z"/><path d="M11.59,13.15h-.18v3.69h.18c.9,0,1.33-.44,1.33-1.87s-.43-1.82-1.33-1.82Z"/><path d="M14,2H6c-1.1,0-1.99.9-1.99,2v16c-.01,1.1.88,2,1.98,2h12.01c1.1,0,2-.9,2-2v-12l-6-6ZM7.49,16.01h-.65v1.99h-1.34v-5.8c0-.11.09-.2.2-.2h1.76c1.22,0,2.02.48,2.02,1.96s-.82,2.05-1.99,2.05ZM11.74,18h-1.47c-.11,0-.2-.09-.2-.2v-5.6c0-.11.09-.2.2-.2h1.4c1.69,0,2.61.89,2.61,2.97s-.92,3.03-2.54,3.03ZM18.5,13.2h-2.21v1.31h1.9v1.2h-1.9v2.29h-1.34v-5.8c0-.11.09-.2.2-.2h3.35v1.2ZM13,9V3.5l5.5,5.5h-5.5Z"/>'},search:{d:'<path d="M20.6,19.11l-4.85-4.86h-.79l-.28-.27c1.2-1.4,1.82-3.31,1.48-5.34-.47-2.78-2.79-5-5.59-5.34-4.23-.52-7.79,3.04-7.27,7.27.34,2.8,2.56,5.12,5.34,5.59,2.03.34,3.94-.28,5.34-1.48l.27.28v.79l4.86,4.85c.08.08.2.08.28,0l1.21-1.21c.08-.08.08-.2,0-.28ZM9.76,14.26c-2.49,0-4.5-2.01-4.5-4.5s2.01-4.5,4.5-4.5,4.5,2.01,4.5,4.5-2.01,4.5-4.5,4.5Z"/>'},filter:{d:'<path d="M4.25,5.61c2.02,2.59,5.75,7.39,5.75,7.39v6c0,.55.45,1,1,1h2c.55,0,1-.45,1-1v-6s3.72-4.8,5.74-7.39c.34-.44.26-1.07-.18-1.4-.17-.13-.39-.21-.61-.21H5.04c-.55,0-1,.45-1,1,0,.22.07.43.21.61Z"/>'},sort:{d:'<rect x="3" y="15.7" width="6" height="2.3" rx=".2" ry=".2"/><rect x="3" y="10.85" width="12" height="2.3" rx=".2" ry=".2"/><rect x="3" y="6" width="18" height="2.3" rx=".2" ry=".2"/>'},"view-list":{d:'<rect x="3.5" y="6" width="2.5" height="2.5" rx="1.25" ry="1.25"/><path d="M8,6.2v2.1c0,.11.08.2.18.2h11.13c.1,0,.18-.09.18-.2v-2.1c0-.11-.08-.2-.18-.2h-11.13c-.1,0-.18.09-.18.2Z"/><rect x="3.5" y="15.5" width="2.5" height="2.5" rx="1.25" ry="1.25"/><path d="M8,15.7v2.1c0,.11.08.2.18.2h11.13c.1,0,.18-.09.18-.2v-2.1c0-.11-.08-.2-.18-.2h-11.13c-.1,0-.18.09-.18.2Z"/><rect x="3.5" y="10.75" width="2.5" height="2.5" rx="1.25" ry="1.25"/><path d="M8,10.95v2.1c0,.11.08.2.18.2h11.13c.1,0,.18-.09.18-.2v-2.1c0-.11-.08-.2-.18-.2h-11.13c-.1,0-.18.09-.18.2Z"/>'},"view-grid":{d:'<rect x="3" y="3" width="8" height="8" rx="3" ry="3"/><rect x="13" y="3" width="8" height="8" rx="3" ry="3"/><rect x="3" y="13" width="8" height="8" rx="3" ry="3"/><rect x="13" y="13" width="8" height="8" rx="3" ry="3"/>'},"arrow-left":{d:'<path d="M14.62,19h-2.81c-.13,0-.25-.05-.34-.13l-7.41-6.72c-.09-.08-.09-.22,0-.3l7.41-6.72c.09-.08.21-.13.34-.13h2.81c.14,0,.2.17.1.26l-6.12,5.54h11.19c.11,0,.2.09.2.2v1.99c0,.11-.09.2-.2.2h-11.19l6.12,5.54c.1.09.04.26-.1.26Z"/>'},"arrow-right":{d:'<path d="M9.38,5h2.81c.13,0,.25.05.34.13l7.41,6.72c.09.08.09.22,0,.3l-7.41,6.72c-.09.08-.21.13-.34.13h-2.81c-.14,0-.2-.17-.1-.26l6.12-5.54H4.2c-.11,0-.2-.09-.2-.2v-1.99c0-.11.09-.2.2-.2h11.19l-6.12-5.54c-.1-.09-.04-.26.1-.26Z"/>'},"arrow-up":{d:'<path d="M5,14.62v-2.81c0-.13.05-.25.13-.34l6.72-7.41c.08-.09.22-.09.3,0l6.72,7.41c.08.09.13.21.13.34v2.81c0,.14-.17.2-.26.1l-5.54-6.12v11.19c0,.11-.09.2-.2.2h-1.99c-.11,0-.2-.09-.2-.2v-11.19l-5.54,6.12c-.09.1-.26.04-.26-.1Z"/>'},"arrow-down":{d:'<path d="M19,9.38v2.81c0,.13-.05.25-.13.34l-6.72,7.41c-.08.09-.22.09-.3,0l-6.72-7.41c-.08-.09-.13-.21-.13-.34v-2.81c0-.14.17-.2.26-.1l5.54,6.12V4.2c0-.11.09-.2.2-.2h1.99c.11,0,.2.09.2.2v11.19l5.54-6.12c.09-.1.26-.04.26.1Z"/>'},"chevron-left":{d:'<path d="M16.68,18h-2.81c-.12,0-.24-.05-.34-.13l-6.31-5.72c-.09-.08-.09-.21,0-.29l6.31-5.73c.09-.08.21-.13.34-.13h2.82c.14,0,.2.17.1.26l-6.27,5.66s-.04.11,0,.15l6.26,5.66c.1.09.04.26-.1.26Z"/>'},"chevron-right":{d:'<path d="M7.32,6h2.81c.12,0,.24.05.34.13l6.31,5.72c.09.08.09.21,0,.29l-6.31,5.73c-.09.08-.21.13-.34.13h-2.82c-.14,0-.2-.17-.1-.26l6.27-5.66s.04-.11,0-.15l-6.26-5.66c-.1-.09-.04-.26.1-.26Z"/>'},"chevron-up":{d:'<path d="M6,16.68v-2.81c0-.12.05-.24.13-.34l5.72-6.31c.08-.09.21-.09.29,0l5.73,6.31c.08.09.13.21.13.34v2.82c0,.14-.17.2-.26.1l-5.66-6.27s-.11-.04-.15,0l-5.66,6.26c-.09.1-.26.04-.26-.1Z"/>'},"chevron-down":{d:'<path d="M18,7.32v2.81c0,.12-.05.24-.13.34l-5.72,6.31c-.08.09-.21.09-.29,0l-5.73-6.31c-.08-.09-.13-.21-.13-.34v-2.82c0-.14.17-.2.26-.1l5.66,6.27s.11.04.15,0l5.66-6.26c.09-.1.26-.04.26.1Z"/>'},"expand-more":{d:'<path d="M18,7.32v2.81c0,.12-.05.24-.13.34l-5.72,6.31c-.08.09-.21.09-.29,0l-5.73-6.31c-.08-.09-.13-.21-.13-.34v-2.82c0-.14.17-.2.26-.1l5.66,6.27s.11.04.15,0l5.66-6.26c.09-.1.26-.04.26.1Z"/>'},"expand-less":{d:'<path d="M6,16.68v-2.81c0-.12.05-.24.13-.34l5.72-6.31c.08-.09.21-.09.29,0l5.73,6.31c.08.09.13.21.13.34v2.82c0,.14-.17.2-.26.1l-5.66-6.27s-.11-.04-.15,0l-5.66,6.26c-.09.1-.26.04-.26-.1Z"/>'},unfold:{d:'<path d="M6.5,9.87v-2.32c0-.1.04-.2.12-.28l5.24-5.21c.07-.07.19-.07.27,0l5.25,5.21c.08.08.12.18.12.28v2.33c0,.11-.16.17-.24.08l-5.19-5.18s-.1-.04-.14,0l-5.19,5.17c-.08.08-.24.03-.24-.08Z"/><path d="M17.5,14.13v2.32c0,.1-.04.2-.12.28l-5.24,5.21c-.07.07-.19.07-.27,0l-5.25-5.21c-.08-.08-.12-.18-.12-.28v-2.33c0-.11.16-.17.24-.08l5.19,5.18s.1.04.14,0l5.19-5.17c.08-.08.24-.03.24.08Z"/>'},"flip-h":{d:'<path d="M8.14,6v12.01c0,.17-.17.28-.32.2l-4.69-2.29c-.08-.04-.13-.12-.13-.2v-7.43c0-.09.05-.16.13-.2l4.69-2.29c.15-.07.32.04.32.2Z"/><path d="M15.86,6v12.01c0,.17.17.28.32.2l4.69-2.29c.08-.04.13-.12.13-.2v-7.43c0-.09-.05-.16-.13-.2l-4.69-2.29c-.15-.07-.32.04-.32.2Z"/><rect x="10.88" y="3" width="2.25" height="18" rx=".2" ry=".2"/>'},"flip-v":{d:'<path d="M6,15.86h12.01c.17,0,.28.17.2.32l-2.29,4.69c-.04.08-.12.13-.2.13h-7.43c-.09,0-.16-.05-.2-.13l-2.29-4.69c-.07-.15.04-.32.2-.32Z"/><path d="M6,8.14h12.01c.17,0,.28-.17.2-.32l-2.29-4.69c-.04-.08-.12-.13-.2-.13h-7.43c-.09,0-.16.05-.2.13l-2.29,4.69c-.07.15.04.32.2.32Z"/><rect x="10.88" y="3" width="2.25" height="18" rx=".2" ry=".2" transform="translate(0 24) rotate(-90)"/>'},check:{d:'<path d="M19.09,5.26l-10.09,10.09-4.09-4.09c-.08-.08-.2-.08-.28,0l-1.48,1.48c-.08.08-.08.2,0,.28l4.09,4.09,1.62,1.62c.08.08.2.08.28,0l1.62-1.62,10.09-10.09c.08-.08.08-.2,0-.28l-1.48-1.48c-.08-.08-.2-.08-.28,0Z"/>'},"check-circle":{d:'<path d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10,10-4.48,10-10S17.52,2,12,2ZM17.86,8.85l-7.72,7.72c-.08.08-.2.08-.28,0l-3.72-3.72c-.08-.08-.08-.2,0-.28l1.13-1.13c.08-.08.2-.08.28,0l2.45,2.44,6.45-6.45c.08-.08.21-.08.28,0l1.13,1.14c.08.08.08.2,0,.28Z"/>'},warning:{d:'<path d="M22.72,21.2L12.17,2.6c-.08-.13-.27-.13-.34,0L1.28,21.2c-.08.13.02.3.17.3h21.1c.15,0,.25-.17.17-.3ZM13.1,19.22c0,.11-.09.2-.2.2h-1.8c-.11,0-.2-.09-.2-.2v-1.8c0-.11.09-.2.2-.2h1.8c.11,0,.2.09.2.2v1.8ZM13.1,14.82c0,.11-.09.2-.2.2h-1.8c-.11,0-.2-.09-.2-.2v-6.2c0-.11.09-.2.2-.2h1.8c.11,0,.2.09.2.2v6.2Z"/>'},error:{d:'<path d="M12,2C6.47,2,2,6.47,2,12s4.47,10,10,10,10-4.47,10-10S17.53,2,12,2ZM16.86,15.45c.08.08.08.2,0,.28l-1.13,1.13c-.08.08-.2.08-.28,0l-3.45-3.45-3.45,3.45c-.08.08-.2.08-.28,0l-1.13-1.13c-.08-.08-.08-.2,0-.28l3.45-3.45-3.45-3.45c-.08-.08-.08-.2,0-.28l1.13-1.13c.08-.08.2-.08.28,0l3.45,3.45,3.45-3.45c.08-.08.2-.08.28,0l1.13,1.13c.08.08.08.2,0,.28l-3.45,3.45,3.45,3.45Z"/>'},"error-outline":{d:'<path d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10,10-4.48,10-10S17.52,2,12,2ZM13.1,17.3c0,.11-.09.2-.2.2h-1.8c-.11,0-.2-.09-.2-.2v-1.8c0-.11.09-.2.2-.2h1.8c.11,0,.2.09.2.2v1.8ZM13.1,12.9c0,.11-.09.2-.2.2h-1.8c-.11,0-.2-.09-.2-.2v-6.2c0-.11.09-.2.2-.2h1.8c.11,0,.2.09.2.2v6.2Z"/>'},info:{d:'<path d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10,10-4.48,10-10S17.52,2,12,2ZM13.1,17.3c0,.11-.09.2-.2.2h-1.8c-.11,0-.2-.09-.2-.2v-6.2c0-.11.09-.2.2-.2h1.8c.11,0,.2.09.2.2v6.2ZM13.1,8.5c0,.11-.09.2-.2.2h-1.8c-.11,0-.2-.09-.2-.2v-1.8c0-.11.09-.2.2-.2h1.8c.11,0,.2.09.2.2v1.8Z"/>'},help:{d:'<path d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10,10-4.48,10-10S17.52,2,12,2ZM12.94,18.13c0,.34-.28.62-.63.62h-.79c-.35,0-.63-.28-.63-.62v-1.11c0-.34.28-.62.63-.62h.79c.35,0,.63.28.63.62v1.11ZM15.82,10.71c-.28.51-.89,1.19-1.83,2.07-.48.45-.78.81-.9,1.09-.08.19-.13.49-.15.89-.02.33-.29.58-.62.58h-.85c-.34,0-.62-.27-.62-.61,0-.76.11-1.38.33-1.87.22-.49.67-1.04,1.34-1.65.67-.61,1.07-1.01,1.2-1.2.3-.44.37-.95.23-1.52-.01-.04-.03-.09-.05-.13-.35-.77-.97-1.16-1.86-1.16-.58,0-1.07.19-1.46.56-.3.28-.52.67-.68,1.18-.09.3-.38.49-.69.44l-.94-.13c-.34-.05-.59-.37-.53-.7.16-.83.55-1.55,1.17-2.16.77-.76,1.78-1.14,3.02-1.14,1.31,0,2.36.39,3.13,1.16.78.77,1.16,1.67,1.16,2.69,0,.57-.14,1.1-.43,1.61Z"/>'},notification:{d:'<path d="M12,21.75c1.03,0,1.88-.78,1.99-1.78.01-.12-.09-.22-.21-.22h-3.57c-.12,0-.22.1-.21.22.11,1,.96,1.78,1.99,1.78Z"/><path d="M18.06,15.81s-.06-.09-.06-.14v-4.92c0-3.07-1.64-5.64-4.5-6.32v-.68c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5,1.5v.68c-2.87.68-4.5,3.24-4.5,6.32v4.92c0,.05-.02.1-.06.14l-1.94,1.94v1h16v-1l-1.94-1.94Z"/>'},settings:{d:'<path d="M19.43,12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49,1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65c-.03-.24-.24-.42-.49-.42h-4c-.25,0-.46.18-.49.42l-.38,2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49,0-.61.22l-2,3.46c-.13.22-.07.49.12.64l2.11,1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11,1.65c-.19.15-.24.42-.12.64l2,3.46c.12.22.39.3.61.22l2.49-1c.52.4,1.08.73,1.69.98l.38,2.65c.03.24.24.42.49.42h4c.25,0,.46-.18.49-.42l.38-2.65c.61-.25,1.17-.59,1.69-.98l2.49,1c.23.09.49,0,.61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65ZM12,15.5c-1.93,0-3.5-1.57-3.5-3.5s1.57-3.5,3.5-3.5,3.5,1.57,3.5,3.5-1.57,3.5-3.5,3.5Z"/>'},"more-vert":{d:'<circle cx="12" cy="6" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="18" r="2"/>'},"more-horiz":{d:'<circle cx="6" cy="12" r="2"/><circle cx="18" cy="12" r="2"/><circle cx="12" cy="12" r="2"/>'},drag:{d:'<circle cx="9" cy="18" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="9" cy="6" r="2"/><circle cx="15" cy="6" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="15" cy="18" r="2"/>'},pin:{d:'<path d="M16.06,12.06s-.06-.09-.06-.14v-7.92h1v-1.8c0-.11-.09-.2-.2-.2H7.2c-.11,0-.2.09-.2.2v1.8h1v7.92c0,.05-.02.1-.06.14l-1.88,1.88s-.06.09-.06.14v1.72c0,.11.09.2.2.2h4.8c.11,0,.2.09.2.2v5c0,.44.36.8.8.8h0c.44,0,.8-.36.8-.8v-5c0-.11.09-.2.2-.2h4.8c.11,0,.2-.09.2-.2v-1.72c0-.05-.02-.1-.06-.14l-1.88-1.88Z"/>'},fullscn:{d:'<path d="M6.8,14h-1.6c-.11,0-.2.09-.2.2v4.6c0,.11.09.2.2.2h4.6c.11,0,.2-.09.2-.2v-1.6c0-.11-.09-.2-.2-.2h-2.6c-.11,0-.2-.09-.2-.2v-2.6c0-.11-.09-.2-.2-.2Z"/><path d="M5.2,10h1.6c.11,0,.2-.09.2-.2v-2.6c0-.11.09-.2.2-.2h2.6c.11,0,.2-.09.2-.2v-1.6c0-.11-.09-.2-.2-.2h-4.6c-.11,0-.2.09-.2.2v4.6c0,.11.09.2.2.2Z"/><path d="M16.8,17h-2.6c-.11,0-.2.09-.2.2v1.6c0,.11.09.2.2.2h4.6c.11,0,.2-.09.2-.2v-4.6c0-.11-.09-.2-.2-.2h-1.6c-.11,0-.2.09-.2.2v2.6c0,.11-.09.2-.2.2Z"/><path d="M14,5.2v1.6c0,.11.09.2.2.2h2.6c.11,0,.2.09.2.2v2.6c0,.11.09.2.2.2h1.6c.11,0,.2-.09.2-.2v-4.6c0-.11-.09-.2-.2-.2h-4.6c-.11,0-.2.09-.2.2Z"/>'},"fullscn-exit":{d:'<path d="M5.2,16h2.6c.11,0,.2.09.2.2v2.6c0,.11.09.2.2.2h1.6c.11,0,.2-.09.2-.2v-4.6c0-.11-.09-.2-.2-.2h-4.6c-.11,0-.2.09-.2.2v1.6c0,.11.09.2.2.2Z"/><path d="M7.8,8h-2.6c-.11,0-.2.09-.2.2v1.6c0,.11.09.2.2.2h4.6c.11,0,.2-.09.2-.2v-4.6c0-.11-.09-.2-.2-.2h-1.6c-.11,0-.2.09-.2.2v2.6c0,.11-.09.2-.2.2Z"/><path d="M14.2,19h1.6c.11,0,.2-.09.2-.2v-2.6c0-.11.09-.2.2-.2h2.6c.11,0,.2-.09.2-.2v-1.6c0-.11-.09-.2-.2-.2h-4.6c-.11,0-.2.09-.2.2v4.6c0,.11.09.2.2.2Z"/><path d="M16,7.8v-2.6c0-.11-.09-.2-.2-.2h-1.6c-.11,0-.2.09-.2.2v4.6c0,.11.09.2.2.2h4.6c.11,0,.2-.09.2-.2v-1.6c0-.11-.09-.2-.2-.2h-2.6c-.11,0-.2-.09-.2-.2Z"/>'},"zoom-in":{d:'<path d="M19.3,10.8h-6.1v-6.1c0-.11-.09-.2-.2-.2h-2c-.11,0-.2.09-.2.2v6.1h-6.1c-.11,0-.2.09-.2.2v2c0,.11.09.2.2.2h6.1v6.1c0,.11.09.2.2.2h2c.11,0,.2-.09.2-.2v-6.1h6.1c.11,0,.2-.09.2-.2v-2c0-.11-.09-.2-.2-.2Z"/>'},"zoom-out":{d:'<rect x="10.8" y="4.5" width="2.4" height="15" rx=".2" ry=".2" transform="translate(24) rotate(90)"/>'},"zoom-reset":{d:'<path d="M20.99,4.89c0-.13-.06-.24-.14-.33l-2.06-2.02c-.1-.09-.26-.02-.25.12l.49,6.74-1.94-1.92-.57-.57c-1.47-1.33-3.42-2.15-5.56-2.17h-.08c-3.58,0-6.87,2.23-7.95,5.65-1.84,5.79,2.43,11.11,7.95,11.11,3.63,0,6.73-2.32,7.88-5.55.05-.13-.05-.26-.18-.27l-2.09-.12c-.08,0-.15.04-.19.11-1.05,2.25-3.45,3.73-6.17,3.41s-4.91-2.54-5.22-5.25c-.42-3.64,2.42-6.71,5.96-6.71,1.66,0,3.16.67,4.24,1.76l2.21,2.19-.84-.06-6.01-.42c-.14-.01-.21.15-.12.25l2.06,2.02c.09.08.2.14.32.14l4.13.24,2.38.14,2.04.12c.12.01.22-.09.21-.21l-.51-8.4Z"/>'},reverse:{d:'<path d="M15.64,8.78H7.25l4.55-4.04c.09-.08.03-.23-.09-.23h-2.61c-.11,0-.21.04-.3.11l-5.74,5.1c-.08.07-.08.2,0,.27l5.74,5.1c.08.07.19.11.3.11h2.61c.12,0,.18-.15.09-.23l-4.55-4.04h8.31c1.73,0,3.14,1.4,3.14,3.14h0c0,1.73-1.4,3.14-3.14,3.14h-.09c-.64,0-1.15.51-1.15,1.15h0c0,.64.51,1.15,1.15,1.15h.17c2.96,0,5.36-2.4,5.36-5.36h0c0-2.96-2.4-5.36-5.36-5.36Z"/><rect x="4.88" y="17.2" width="2.3" height="2.3" rx="1.15" ry="1.15"/><rect x="11.17" y="17.2" width="2.3" height="2.3" rx="1.15" ry="1.15"/><rect x="8.03" y="17.2" width="2.3" height="2.3" rx="1.15" ry="1.15"/>'},user:{d:'<path d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10,10-4.48,10-10S17.52,2,12,2ZM12,5c1.66,0,3,1.34,3,3s-1.34,3-3,3-3-1.34-3-3,1.34-3,3-3ZM12,19.2c-2.47,0-4.66-1.25-5.96-3.15-.03-.04-.04-.09-.04-.15.13-1.94,4.02-3,6-3s5.86,1.06,6,3c0,.05-.01.1-.04.15-1.3,1.9-3.48,3.15-5.96,3.15Z"/>'},admin:{d:'<path d="M19.5,3H4.5c-1.1,0-2,.9-2,2v14c0,1.1.9,2,2,2h15c1.1,0,2-.9,2-2V5c0-1.1-.9-2-2-2ZM14.4,7c0-.64.51-1.15,1.15-1.15s1.15.51,1.15,1.15v3.7c0,.64-.51,1.15-1.15,1.15s-1.15-.51-1.15-1.15v-3.7ZM4.5,7.85c0-.08.09-.15.2-.15h8.8c.11,0,.2.09.2.2v1.9c0,.11-.09.2-.2.2H4.7c-.11,0-.2-.07-.2-.15v-1.99ZM6.6,16.1c0,.11-.09.2-.2.2h-1.7c-.11,0-.2-.07-.2-.15v-1.99c0-.08.09-.15.2-.15h1.7c.11,0,.2.09.2.2v1.9ZM9.6,17c0,.64-.51,1.15-1.15,1.15s-1.15-.51-1.15-1.15v-3.7c0-.64.51-1.15,1.15-1.15s1.15.51,1.15,1.15v3.7ZM19.5,16.15c0,.08-.09.15-.2.15h-8.8c-.11,0-.2-.09-.2-.2v-1.9c0-.11.09-.2.2-.2h8.8c.11,0,.2.07.2.15v1.99ZM19.5,9.85c0,.08-.09.15-.2.15h-1.7c-.11,0-.2-.09-.2-.2v-1.9c0-.11.09-.2.2-.2h1.7c.11,0,.2.07.2.15v1.99Z"/>'},logout:{d:'<path d="M12.23,6h2.93c.12,0,.24.04.33.13l6.44,5.72c.09.08.09.22,0,.3l-6.44,5.72c-.09.08-.21.13-.33.13h-2.93c-.14,0-.2-.17-.1-.26l5.1-4.53h-9.05c-.11,0-.2-.09-.2-.2v-2.01c0-.11.09-.2.2-.2h9.05l-5.1-4.53c-.1-.09-.04-.26.1-.26Z"/><path d="M10.8,3h-6.8c-1.1,0-2,.9-2,2v14c0,1.1.9,2,2,2h6.8c.11,0,.2-.09.2-.2v-1.9c0-.11-.09-.2-.2-.2h-6.3c-.11,0-.2-.09-.2-.2V5.5c0-.11.09-.2.2-.2h6.3c.11,0,.2-.09.2-.2v-1.9c0-.11-.09-.2-.2-.2Z"/>'},login:{d:'<path d="M6.24,6h2.93c.12,0,.24.04.33.13l6.44,5.72c.09.08.09.22,0,.3l-6.44,5.72c-.09.08-.21.13-.33.13h-2.93c-.14,0-.2-.17-.1-.26l5.1-4.53H2.2c-.11,0-.2-.09-.2-.2v-2.01c0-.11.09-.2.2-.2h9.05l-5.1-4.53c-.1-.09-.04-.26.1-.26Z"/><path d="M13.2,21h6.8c1.1,0,2-.9,2-2V5c0-1.1-.9-2-2-2h-6.8c-.11,0-.2.09-.2.2v1.9c0,.11.09.2.2.2h6.3c.11,0,.2.09.2.2v13c0,.11-.09.2-.2.2h-6.3c-.11,0-.2.09-.2.2v1.9c0,.11.09.2.2.2Z"/>'},card:{d:'<path d="M20,4H4c-1.11,0-1.99.89-1.99,2v12c-.01,1.11.88,2,1.99,2h16c1.11,0,2-.89,2-2V6c0-1.11-.89-2-2-2ZM19.6,17.4c0,.11-.09.2-.2.2H4.6c-.11,0-.2-.09-.2-.2v-6c0-.11.09-.2.2-.2h14.8c.11,0,.2.09.2.2v6ZM19.6,8.6c0,.11-.09.2-.2.2H4.6c-.11,0-.2-.09-.2-.2v-2c0-.11.09-.2.2-.2h14.8c.11,0,.2.09.2.2v2Z"/>'},lock:{d:'<path d="M18,8.5h-1v-2c0-2.76-2.24-5-5-5s-5,2.24-5,5v2h-1c-1.1,0-2,.9-2,2v10c0,1.1.9,2,2,2h12c1.1,0,2-.9,2-2v-10c0-1.1-.9-2-2-2ZM12,17.5c-1.1,0-2-.9-2-2s.9-2,2-2,2,.9,2,2-.9,2-2,2ZM15.1,8.5h-6.2v-2c0-1.71,1.39-3.1,3.1-3.1s3.1,1.39,3.1,3.1v2Z"/>'},unlock:{d:'<circle cx="12" cy="15.5" r="2"/><path d="M18,8.5h-1v-1.79c0-2.58-1.86-4.89-4.42-5.18-2.44-.28-4.67,1.23-5.36,3.51-.03.11.04.23.15.26l1.55.38c.1.03.2-.04.23-.13.46-1.41,1.96-2.33,3.53-1.97,1.39.31,2.32,1.64,2.32,3.07v1.86H6c-1.1,0-2,.9-2,2v10c0,1.1.9,2,2,2h12c1.1,0,2-.9,2-2v-10c0-1.1-.9-2-2-2ZM18,20.3c0,.11-.09.2-.2.2H6.2c-.11,0-.2-.09-.2-.2v-9.6c0-.11.09-.2.2-.2h11.6c.11,0,.2.09.2.2v9.6Z"/>'},key:{d:'<path d="M22.8,10h-10.15c-.95-2.69-3.75-4.5-6.88-3.88-2.29.45-4.15,2.29-4.64,4.57-.82,3.88,2.13,7.3,5.86,7.3,2.61,0,4.83-1.67,5.65-4h4.35v3.8c0,.11.09.2.2.2h3.6c.11,0,.2-.09.2-.2v-3.8h1.8c.11,0,.2-.09.2-.2v-3.6c0-.11-.09-.2-.2-.2ZM7,14c-1.1,0-2-.9-2-2s.9-2,2-2,2,.9,2,2-.9,2-2,2Z"/>'},location:{d:'<path d="M12,1.95c-3.87,0-7,3.15-7,7.03,0,4.82,5.85,11.75,6.85,12.9.08.09.21.09.29,0,1-1.15,6.85-8.07,6.85-12.9,0-3.89-3.13-7.03-7-7.03ZM14.42,9.61c-.21.87-.93,1.59-1.8,1.8-1.86.45-3.5-1.19-3.05-3.05.21-.87.93-1.59,1.8-1.8,1.86-.45,3.5,1.19,3.05,3.05Z"/>'},map:{d:'<path d="M20.5,3l-.16.03-5.17,2c-.11.04-.23.05-.35,0l-5.66-1.98c-.11-.04-.22-.04-.32,0l-5.48,1.85c-.22.07-.36.27-.36.5v15.1c0,.28.22.5.5.5l.16-.03,5.17-2c.11-.04.23-.05.35,0l5.66,1.98c.11.04.22.04.32,0l5.5-1.85c.2-.07.34-.26.34-.47V3.5c0-.28-.22-.5-.5-.5ZM15,18.79c0,.1-.1.18-.2.14l-5.47-1.92c-.2-.07-.33-.26-.33-.47V5.21c0-.1.1-.18.2-.14l5.47,1.92c.2.07.33.26.33.47v11.32Z"/>'},route:{d:'<path d="M9,6c0,1.39-.95,2.57-2.25,2.9-.24.07-.49.1-.75.1s-.51-.03-.75-.1c-1.3-.33-2.25-1.51-2.25-2.9,0-1.66,1.34-3,3-3s3,1.34,3,3Z"/><path d="M21,18c0,1.66-1.34,3-3,3s-3-1.34-3-3c0-1.39.95-2.57,2.25-2.9.24-.07.49-.1.75-.1s.51.03.75.1c1.3.33,2.25,1.51,2.25,2.9Z"/><path d="M19,7v7.13c-.32-.09-.65-.13-1-.13s-.68.04-1,.13v-7.13c0-1.1-.9-2-2-2s-2,.9-2,2v10c0,2.21-1.79,4-4,4s-4-1.79-4-4v-7.13c.32.09.65.13,1,.13s.68-.04,1-.13v7.13c0,1.1.9,2,2,2s2-.9,2-2V7c0-2.21,1.79-4,4-4s4,1.79,4,4Z"/>'},transfer:{d:'<path d="M12,2C6.49,2,2,6.49,2,12s4.49,10,10,10,10-4.49,10-10S17.51,2,12,2ZM12,20.25c-4.55,0-8.25-3.7-8.25-8.25S7.45,3.75,12,3.75s8.25,3.7,8.25,8.25-3.7,8.25-8.25,8.25Z"/><path d="M8.9,11.1h2.17c-.9.95-1.8,1.91-2.71,2.86-.08.08-.21.08-.29,0l-2.72-2.86h1.71c.25-3.03,3.05-5.43,6.46-5.43.76,0,1.48.12,2.16.33-.27-.03-.55-.05-.83-.05-3.19,0-5.8,2.28-5.95,5.14h0Z"/><path d="M15.09,12.9h-2.17c.9-.95,1.8-1.91,2.71-2.86.08-.08.21-.08.29,0l2.72,2.86h-1.71c-.25,3.03-3.05,5.43-6.46,5.43-.76,0-1.48-.12-2.16-.33.27.03.55.05.83.05,3.19,0,5.8-2.28,5.95-5.14h0Z"/>'},train:{d:'<path d="M7.53,6.4h3.2c.11,0,.2.09.2.2v5.14c0,.11-.09.2-.2.2h-3.88c-.11,0-.2-.09-.2-.2,0-.31.01-1.01.17-2.39.17-1.42.42-2.44.52-2.8.02-.09.1-.15.19-.15Z"/><path d="M16.47,6.4h-3.2c-.11,0-.2.09-.2.2v5.14c0,.11.09.2.2.2h3.88c.11,0,.2-.09.2-.2,0-.31-.01-1.01-.17-2.39-.17-1.42-.42-2.44-.52-2.8-.02-.09-.1-.15-.19-.15Z"/><path d="M20.18,9.23h.01c-.1-1.17-.29-4.72-2.99-6.3-1.46-.85-4.57-.93-5.21-.93s-3.75.08-5.21.93c-2.68,1.58-2.87,5.12-2.97,6.3-.17,1.91-.55,6.73-.08,8.36.23.79,1.04,1.77,2.86,1.77h10.81c1.82,0,2.63-.98,2.86-1.77.48-1.64.1-6.45-.08-8.36ZM5.35,9.11c.09-.97.24-3.9,2.42-5.21,1.18-.71,3.7-.77,4.22-.77s3.04.07,4.22.77c2.19,1.31,2.34,4.24,2.42,5.21.08.93.22,2.67.24,4.23H5.11c.02-1.56.16-3.31.24-4.23ZM18.71,16.02c-.19.65-.85,1.47-2.32,1.47H7.61c-1.48,0-2.14-.81-2.32-1.47-.13-.44-.18-1.17-.19-2h13.79c0,.83-.06,1.56-.19,2h.01Z"/><path d="M8.79,15.76c0,.57-.46,1.03-1.04,1.03s-1.04-.46-1.04-1.03.46-1.03,1.04-1.03,1.04.46,1.04,1.03Z"/><path d="M17.28,15.76c0,.57-.46,1.03-1.04,1.03s-1.04-.46-1.04-1.03.46-1.03,1.04-1.03,1.04.46,1.04,1.03Z"/><path d="M7.75,19.92h-1.41c-.06,0-.11.02-.15.06l-1.87,2.02h2.21c.07,0,.14-.04.18-.11l1.04-1.97Z"/><path d="M16.25,19.92h1.41c.06,0,.11.02.15.06l1.87,2.02h-2.21c-.07,0-.14-.04-.18-.11l-1.04-1.97Z"/>'},gate:{d:'<path d="M19.3,2H4.7c-.11,0-.2.09-.2.2v19.6c0,.11.09.2.2.2h14.6c.11,0,.2-.09.2-.2V2.2c0-.11-.09-.2-.2-.2ZM9.48,19.33h-2.31v-3.3h2.25v.56h-1.64v.73h1.52v.56h-1.52v.9h1.7v.55ZM11.99,19.33h-.01s-.67-1.14-.67-1.14l-.68,1.14h-.74l1.04-1.72-.94-1.58h.72l.61,1.06.6-1.06h.71l-.94,1.6,1.04,1.7h-.74ZM13.84,19.33h-.61v-3.3h.61v3.3ZM16.83,16.59h-.9v2.74h-.61v-2.74h-.9v-.56h2.41v.56ZM16.85,14.93H7.37c-.11,0-.2-.09-.2-.2v-3.85c0-.11.09-.2.2-.2h1.24c.11,0,.2.09.2.2v2.13c0,.11.09.2.2.2h1.96c.11,0,.2-.09.2-.2v-3.17c0-.11-.09-.2-.2-.2h-3.46c-.11,0-.2-.09-.2-.2v-3.87c0-.11.09-.2.2-.2h1.24c.11,0,.2.09.2.2v2.08c0,.11.09.2.2.2h1.82c.11,0,.2-.09.2-.2v-2.78c0-.11.09-.2.2-.2h1.28c.11,0,.2.09.2.2v2.78c0,.11.09.2.2.2h1.96c.11,0,.2-.09.2-.2v-2.08c0-.11.09-.2.2-.2h1.1c.11,0,.2.09.2.2v3.87c0,.11-.09.2-.2.2h-3.46c-.11,0-.2.09-.2.2v3.17c0,.11.09.2.2.2h1.96c.11,0,.2-.09.2-.2v-2.13c0-.11.09-.2.2-.2h1.24c.11,0,.2.09.2.2v4.05Z"/>'},chat:{d:'<path d="M20,2H4c-1.1,0-2,.91-2,2.03v17.77c0,.18.22.27.34.14l3.51-3.56c.09-.1.22-.15.36-.15h13.79c1.1,0,2-.91,2-2.03V4.03c0-1.12-.9-2.03-2-2.03ZM18,15.13c0,.11-.09.2-.2.2H6.2c-.11,0-.2-.09-.2-.2v-2c0-.11.09-.2.2-.2h11.6c.11,0,.2.09.2.2v2ZM18,11.11c0,.11-.09.2-.2.2H6.2c-.11,0-.2-.09-.2-.2v-2c0-.11.09-.2.2-.2h11.6c.11,0,.2.09.2.2v2ZM18,7.1c0,.11-.09.2-.2.2H6.2c-.11,0-.2-.09-.2-.2v-2c0-.11.09-.2.2-.2h11.6c.11,0,.2.09.2.2v2Z"/>'},"chat-bubble":{d:'<path d="M20,2H4c-1.1,0-2,.91-2,2.03v17.77c0,.18.22.27.34.14l3.51-3.56c.09-.1.22-.15.36-.15h13.79c1.1,0,2-.91,2-2.03V4.03c0-1.12-.9-2.03-2-2.03Z"/>'},send:{d:'<path d="M2.28,20.73l19.6-8.55c.16-.07.16-.29,0-.36L2.28,3.27c-.13-.06-.27.04-.27.18v6.41c0,.1.06.18.16.2l14.33,1.94-14.33,1.94c-.1.01-.17.1-.17.2v6.41c0,.14.15.24.28.18Z"/>'},mail:{d:'<path d="M20,4H4c-1.1,0-1.99.89-1.99,1.99h0c0,.18.09.34.23.43l9.49,6.28c.16.1.37.1.53,0l9.5-6.28c.15-.09.24-.25.24-.42h0c0-1.1-.9-2-2-2Z"/><path d="M11.73,14.91L2.24,8.63c-.1-.06-.23,0-.23.13v9.24c0,1.1.89,2,1.99,2h16c1.1,0,2-.9,2-2v-9.24c0-.12-.13-.19-.23-.13l-9.51,6.28c-.16.1-.37.1-.53,0Z"/>'},"bar-chart":{d:'<rect x="5" y="9.2" width="2.5" height="9.8" rx=".2" ry=".2"/><rect x="16.5" y="13" width="2.5" height="6" rx=".2" ry=".2"/><rect x="10.75" y="5" width="2.5" height="14" rx=".2" ry=".2"/>'},"pie-chart":{d:'<path d="M11.1,3.23v17.54c0,.12-.11.22-.23.2-4.45-.55-7.87-4.36-7.87-8.97S6.42,3.58,10.87,3.03c.12-.02.23.08.23.2Z"/><path d="M12.93,3.23v7.66c0,.11.09.2.2.2h7.64c.12,0,.22-.11.2-.23-.51-4.08-3.74-7.33-7.82-7.84-.12-.02-.23.08-.23.2Z"/><path d="M12.93,13.11v7.66c0,.12.11.22.23.2,4.08-.51,7.31-3.75,7.82-7.84.02-.12-.08-.23-.2-.23h-7.64c-.11,0-.2.09-.2.2Z"/>'},table:{d:'<path d="M19.5,3H4.5c-1.1,0-2,.9-2,2v14c0,1.1.9,2,2,2h15c1.1,0,2-.9,2-2V5c0-1.1-.9-2-2-2ZM10.5,18.8c0,.11-.09.2-.2.2h-5.6c-.11,0-.2-.09-.2-.2v-8.6c0-.11.09-.2.2-.2h5.6c.11,0,.2.09.2.2v8.6ZM19.5,18.8c0,.11-.09.2-.2.2h-6.6c-.11,0-.2-.09-.2-.2v-8.6c0-.11.09-.2.2-.2h6.6c.11,0,.2.09.2.2v8.6ZM19.5,7.8c0,.11-.09.2-.2.2H4.7c-.11,0-.2-.09-.2-.2v-2.6c0-.11.09-.2.2-.2h14.6c.11,0,.2.09.2.2v2.6Z"/>'},compare:{d:'<path d="M11.8,1h-1.6c-.11,0-.2.09-.2.2v1.8h-5c-1.1,0-2,.9-2,2v14c0,1.1.9,2,2,2h5v1.8c0,.11.09.2.2.2h1.6c.11,0,.2-.09.2-.2V1.2c0-.11-.09-.2-.2-.2ZM10,18h-5l5-6v6Z"/><path d="M19,3h-4.8c-.11,0-.2.09-.2.2v1.6c0,.11.09.2.2.2h4.6c.11,0,.2.09.2.2v12.8l-5-6v8.8c0,.11.09.2.2.2h4.8c1.1,0,2-.9,2-2V5c0-1.1-.9-2-2-2Z"/>'},image:{d:'<path d="M19,3H5c-1.1,0-2,.9-2,2v14c0,1.1.9,2,2,2h14c1.1,0,2-.9,2-2V5c0-1.1-.9-2-2-2ZM18.59,18.79H5.41c-.11,0-.2-.09-.2-.2V5.41c0-.11.09-.2.2-.2h13.18c.11,0,.2.09.2.2v10.16l-3.03-4.59c-.08-.12-.25-.12-.33,0l-3.03,4.45c-.08.11-.25.12-.33,0l-2.07-2.83c-.08-.11-.25-.11-.33,0l-2.96,4.33c-.1.14,0,.35.15.35h11.92v1.31c0,.11-.09.2-.2.2Z"/><circle cx="8.22" cy="8.48" r="1.54"/>'},camera:{d:'<path d="M20,5.39h-3c-.11,0-.21-.04-.29-.12l-1.59-1.65c-.08-.08-.18-.12-.29-.12h-5.66c-.11,0-.21.04-.29.12l-1.59,1.65c-.08.08-.18.12-.29.12h-3c-1.1,0-2,.85-2,1.89v11.33c0,1.04.9,1.89,2,1.89h16c1.1,0,2-.85,2-1.89V7.28c0-1.04-.9-1.89-2-1.89ZM12,17.94c-2.76,0-5-2.24-5-5s2.24-5,5-5,5,2.24,5,5-2.24,5-5,5Z"/><circle cx="12" cy="12.94" r="3"/>'},play:{d:'<path d="M6.41,5.21v13.59c0,.16.18.26.31.17l10.59-6.79c.13-.08.13-.27,0-.35L6.73,5.03c-.14-.09-.31.01-.31.17Z"/>'},pause:{d:'<rect x="6" y="5" width="4" height="14" rx=".2" ry=".2"/><rect x="14" y="5" width="4" height="14" rx=".2" ry=".2"/>'},plugin:{d:'<path d="M11.9,8.83l-5.22-3.04,4.31-2.51c.63-.37,1.41-.37,2.03,0l4.31,2.51-5.22,3.04s-.06.03-.1.03-.07,0-.1-.03Z"/><path d="M9.32,13.68v6.08l-4.31-2.51c-.63-.36-1.02-1.04-1.02-1.78v-5.02l5.22,3.04c.06.04.1.1.1.18Z"/><path d="M20,8.53v.11l-6,3.5c-.55.32-.88.9-.88,1.54v6.99l-.1.06c-.2.11-.41.19-.62.24-.13.02-.26.04-.39.04s-.26-.01-.39-.04c-.22-.04-.43-.12-.62-.24l-.1-.06v-6.99c0-.63-.33-1.22-.88-1.54l-6-3.5v-.11c0-.14.01-.27.04-.4.02-.09.04-.18.07-.26.06-.17.14-.33.23-.47.04-.05.08-.11.12-.16h0c.04-.05.09-.1.13-.15.12-.13.27-.24.42-.33l.1-.06,6,3.5c.27.16.58.24.88.24s.61-.08.88-.24l6-3.5.1.06c.16.09.3.2.42.33.05.05.09.09.13.15h0c.04.05.08.11.12.16.1.15.17.31.23.47.03.08.05.17.07.26.03.13.04.27.04.4Z"/><path d="M14.78,13.5l5.22-3.04v5.02c0,.73-.39,1.41-1.02,1.78l-4.31,2.51v-6.08c0-.07.04-.14.1-.18Z"/><path d="M20,8.53v.11l-6,3.5c-.55.32-.88.9-.88,1.54v6.99l-.1.06c-.2.11-.41.19-.62.24-.13.02-.26.04-.39.04s-.26-.01-.39-.04c-.22-.04-.43-.12-.62-.24l-.1-.06v-6.99c0-.63-.33-1.22-.88-1.54l-6-3.5v-.11c0-.14.01-.27.04-.4.02-.09.04-.18.07-.26.06-.17.14-.33.23-.47.04-.05.08-.11.12-.16h0c.04-.05.09-.1.13-.15.12-.13.27-.24.42-.33l.1-.06,6,3.5c.27.16.58.24.88.24s.61-.08.88-.24l6-3.5.1.06c.16.09.3.2.42.33.05.05.09.09.13.15h0c.04.05.08.11.12.16.1.15.17.31.23.47.03.08.05.17.07.26.03.13.04.27.04.4Z"/>'},bookmark:{d:'<path d="M17,3H7c-1.1,0-1.99.91-1.99,2.01v15.79c0,.14.14.24.27.19l6.52-2.81c.13-.05.27-.05.39,0l6.52,2.81c.13.06.28-.04.28-.18V5.01c0-1.11-.9-2.01-2-2.01Z"/>'},share:{d:'<path d="M18,16.12c-.76,0-1.44.3-1.96.77l-7.13-4.15c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5,1.25.81,2.04.81,1.66,0,3-1.34,3-3s-1.34-3-3-3-3,1.34-3,3c0,.24.04.47.09.7l-7.05,4.11c-.54-.5-1.25-.81-2.04-.81-1.66,0-3,1.34-3,3s1.34,3,3,3c.79,0,1.5-.31,2.04-.81l7.12,4.16c-.05.21-.08.43-.08.65,0,1.61,1.31,2.92,2.92,2.92s2.92-1.31,2.92-2.92-1.31-2.92-2.92-2.92Z"/>'},preset:{d:'<path d="M18.7,17V7.7c0-.11.09-.2.2-.2h1.9c.11,0,.2.09.2.2v9.5s0,0,0,0c0,1.27-1.03,2.3-2.3,2.3H6.2c-.11,0-.2-.09-.2-.2v-1.9c0-.11.09-.2.2-.2h12.3c.11,0,.2-.09.2-.2Z"/><path d="M3,13.38v1.62c0,.11.09.2.2.2h1.9c.11,0,.2-.09.2-.2v-1.77c0-1.27,1.03-2.3,2.3-2.3h4.85l-4.55,4.04c-.09.08-.03.23.09.23h2.61c.11,0,.21-.04.3-.11l5.74-5.1c.08-.07.08-.2,0-.27l-5.74-5.1c-.08-.07-.19-.11-.3-.11h-2.61c-.12,0-.18.15-.09.23l4.55,4.04h-4.85c-2.54,0-4.6,2.06-4.6,4.6Z"/>'},puzzle:{d:'<path d="M20.5 11H19V7c0-1.1-.9-2-2-2h-4V3.5C13 2.12 11.88 1 10.5 1S8 2.12 8 3.5V5H4c-1.1 0-1.99.9-1.99 2v3.8H3.5c1.49 0 2.7 1.21 2.7 2.7s-1.21 2.7-2.7 2.7H2V20c0 1.1.9 2 2 2h3.8v-1.5c0-1.49 1.21-2.7 2.7-2.7 1.49 0 2.7 1.21 2.7 2.7V22H17c1.1 0 2-.9 2-2v-4h1.5c1.38 0 2.5-1.12 2.5-2.5S21.88 11 20.5 11z"/>'},star:{d:'<path d="M16.66,14.35c-.06.04-.08.12-.07.19l1.51,6.46c.04.18-.15.31-.3.22l-5.7-3.43c-.06-.04-.14-.04-.2,0l-5.7,3.43c-.15.09-.34-.04-.3-.22l1.51-6.46c.02-.07,0-.15-.06-.19l-5.03-4.35c-.13-.12-.06-.34.11-.35l6.63-.56c.07-.01.14-.06.17-.12l2.58-6.1c.07-.16.31-.16.37,0l2.59,6.09c.03.06.1.11.17.12l6.63.57c.17.01.24.23.11.35l-5.02,4.35Z"/>'},"star-outline":{d:'<path d="M21.68,10c.13-.12.06-.34-.11-.35l-6.63-.57c-.07,0-.14-.05-.17-.12l-2.59-6.08c-.07-.16-.3-.16-.37,0l-2.59,6.09c-.03.07-.09.12-.17.12l-6.62.56c-.18.01-.25.23-.11.35l5.03,4.35c.06.05.08.12.06.2l-1.51,6.46c-.04.17.15.31.3.22l5.69-3.43c.06-.04.14-.04.21,0l5.69,3.43c.15.09.34-.04.3-.22l-1.5-6.46c-.02-.07,0-.15.06-.2l5.02-4.35ZM15.68,17.68c.04.17-.15.31-.3.22l-3.27-1.97c-.06-.04-.14-.04-.21,0l-3.26,1.97c-.15.09-.34-.04-.3-.22l.87-3.71c.02-.07,0-.15-.06-.2l-2.88-2.5c-.13-.12-.06-.34.11-.35l3.8-.33c.07,0,.14-.05.17-.12l1.47-3.49c.07-.16.3-.16.37,0l1.48,3.5c.03.07.09.12.17.12l3.8.33c.18.02.25.23.11.35l-2.88,2.5c-.06.05-.08.12-.06.2l.87,3.71Z"/>'},link:{d:'<path d="M3.96,11.38c.29-1.47,1.66-2.48,3.16-2.48h3.68c.11,0,.2-.09.2-.2v-1.5c0-.11-.09-.2-.2-.2h-3.58c-2.61,0-4.94,1.91-5.19,4.51-.29,2.98,2.05,5.49,4.98,5.49h3.8c.11,0,.2-.09.2-.2v-1.5c0-.11-.09-.2-.2-.2h-3.8c-1.91,0-3.42-1.74-3.04-3.72Z"/><rect x="8" y="11" width="8" height="2" rx=".2" ry=".2"/><path d="M16.78,7h-3.58c-.11,0-.2.09-.2.2v1.5c0,.11.09.2.2.2h3.68c1.5,0,2.88,1.01,3.16,2.48.38,1.98-1.13,3.72-3.04,3.72h-3.8c-.11,0-.2.09-.2.2v1.5c0,.11.09.2.2.2h3.8c2.92,0,5.26-2.51,4.98-5.49-.25-2.6-2.58-4.51-5.19-4.51Z"/>'},code:{d:'<path d="M9.87,17.5h-2.32c-.1,0-.2-.04-.28-.12l-5.21-5.24c-.07-.07-.07-.19,0-.27l5.21-5.25c.08-.08.18-.12.28-.12h2.33c.11,0,.17.16.08.24l-5.18,5.19s-.04.1,0,.14l5.17,5.19c.08.08.03.24-.08.24Z"/><path d="M14.13,6.5h2.32c.1,0,.2.04.28.12l5.21,5.24c.07.07.07.19,0,.27l-5.21,5.25c-.08.08-.18.12-.28.12h-2.33c-.11,0-.17-.16-.08-.24l5.18-5.19s-.04-.1,0-.14l-5.17-5.19c-.08-.08-.03-.24.08-.24Z"/>'},layer:{d:'<path d="M11.87,18.92l-7.23-5.55c-.07-.06-.18-.06-.25,0l-1.31,1.01c-.1.08-.1.24,0,.32l8.8,6.76c.07.06.18.06.25,0l8.8-6.76c.1-.08.1-.24,0-.32l-1.32-1.02c-.07-.06-.18-.06-.25,0l-7.24,5.56c-.07.06-.18.06-.25,0Z"/><path d="M11.88,16.38c.07.06.18.06.25,0l7.34-5.65,1.46-1.11c.1-.08.1-.24,0-.32L12.12,2.54c-.07-.06-.18-.06-.25,0L3.08,9.3c-.1.08-.1.24,0,.32l1.45,1.11,7.35,5.65Z"/>'},sparkle:{d:'<path d="M19.04,8.67l1.02-2.24s.05-.08.1-.1l2.24-1.02c.15-.07.15-.29,0-.36l-2.24-1.02s-.08-.05-.1-.1l-1.02-2.24c-.07-.15-.29-.15-.36,0l-1.02,2.24s-.05.08-.1.1l-2.24,1.02c-.15.07-.15.29,0,.36l2.24,1.02s.08.05.1.1l1.02,2.24c.07.15.29.15.36,0Z"/><path d="M11.48,9.48l-2.24-4.93c-.07-.15-.29-.15-.36,0l-2.24,4.93s-.05.08-.1.1l-4.93,2.24c-.15.07-.15.29,0,.36l4.93,2.24s.08.05.1.1l2.24,4.93c.07.15.29.15.36,0l2.24-4.93s.05-.08.1-.1l4.93-2.24c.15-.07.15-.29,0-.36l-4.93-2.24s-.08-.05-.1-.1Z"/><path d="M18.68,15.33l-1.02,2.24s-.05.08-.1.1l-2.24,1.02c-.15.07-.15.29,0,.36l2.24,1.02s.08.05.1.1l1.02,2.24c.07.15.29.15.36,0l1.02-2.24s.05-.08.1-.1l2.24-1.02c.15-.07.15-.29,0,.36l-2.24-1.02s-.08-.05-.1-.1l-1.02-2.24c-.07-.15-.29-.15-.36,0Z"/>'},tag:{d:'<path d="M21.41,11.58L12.41,2.58c-.36-.36-.86-.58-1.41-.58h-7c-1.1,0-2,.9-2,2v7c0,.55.22,1.05.59,1.42l9,9c.36.36.86.58,1.41.58s1.05-.22,1.41-.59l7-7c.37-.36.59-.86.59-1.41s-.23-1.06-.59-1.42ZM5.5,7c-.83,0-1.5-.67-1.5-1.5s.67-1.5,1.5-1.5,1.5.67,1.5,1.5-.67,1.5-1.5,1.5Z"/>'},palette:{d:'<path d="M12,3c4.97,0,9,3.58,9,8,0,2.76-2.24,5-5,5h-1.77c-.83,0-1.5.67-1.5,1.5,0,.38.15.73.38.99.24.27.39.62.39,1.01,0,.83-.69,1.5-1.5,1.5-4.97,0-9-4.03-9-9S7.03,3,12,3ZM7.95,12c.75,0,1.35-.6,1.35-1.35s-.6-1.35-1.35-1.35-1.35.6-1.35,1.35.6,1.35,1.35,1.35ZM16.05,12c.75,0,1.35-.6,1.35-1.35s-.6-1.35-1.35-1.35-1.35.6-1.35,1.35.6,1.35,1.35,1.35ZM12,9.3c.75,0,1.35-.6,1.35-1.35s-.6-1.35-1.35-1.35-1.35.6-1.35,1.35.6,1.35,1.35,1.35Z"/>'},design:{d:'<path d="M20.71,5.63l-2.34-2.34c-.39-.39-1.02-.39-1.41,0l-4,4,3.75,3.75,4-4c.39-.39.39-1.02,0-1.41Z"/><path d="M7.3,12.95l-4.24,4.24s-.06.09-.06.14v3.47c0,.11.09.2.2.2h3.47c.05,0,.1-.02.14-.06l4.24-4.24-3.75-3.75Z"/><path d="M4.5,4.5l-1.17,1.17c-.39.39-.39,1.02,0,1.41l.54.54c.08.08.2.08.28,0l1.73-1.73.88.88-1.73,1.73c-.08.08-.08.2,0,.28l1.1,1.1c.08.08.2.08.28,0l1.73-1.73.88.88-1.73,1.73c-.08.08-.08.2,0,.28l1.1,1.1c.08.08.2.08.28,0l1.73-1.73.88.88-1.73,1.73c-.08.08-.08.2,0,.28l1.1,1.1c.08.08.2.08.28,0l1.73-1.73.88.88-1.73,1.73c-.08.08-.08.2,0,.28l1.1,1.1c.08.08.2.08.28,0l1.73-1.73.88.88-1.73,1.73c-.08.08-.08.2,0,.28l1.1,1.1c.08.08.2.08.28,0l1.73-1.73.88.88-1.73,1.73c-.08.08-.08.2,0,.28l.54.54c.39.39,1.02.39,1.41,0l1.17-1.17,1.17-1.17c.39-.39.39-1.02,0-1.41L7.08,3.33c-.39-.39-1.02-.39-1.41,0l-1.17,1.17Z"/>'},eye:{d:'<path d="M21.32,11.38c-2.73-4.22-5.83-6.38-9.32-6.38s-6.59,2.16-9.32,6.38c-.25.38-.25.86,0,1.24,2.73,4.22,5.83,6.38,9.32,6.38s6.59-2.16,9.32-6.38c.25-.38.25-.86,0-1.24ZM12,16.25c-2.35,0-4.25-1.9-4.25-4.25s1.9-4.25,4.25-4.25,4.25,1.9,4.25,4.25-1.9,4.25-4.25,4.25Z"/><circle cx="12" cy="12" r="2.8"/>'},loading:{d:'<path d="M20.34,9.69h0c-.61.17-.98.76-.9,1.39.31,2.47-.61,5.08-2.82,6.84-2.37,1.88-5.76,2.12-8.37.58-4.21-2.49-4.93-8.01-1.85-11.48,1.49-1.68,3.56-2.53,5.64-2.52.63,0,1.17-.43,1.27-1.06h0c.11-.74-.45-1.43-1.2-1.44-3.15-.03-6.3,1.41-8.31,4.27-2.64,3.75-2.32,8.99.76,12.39,4.07,4.51,11.01,4.38,14.93-.03,2-2.25,2.79-5.16,2.43-7.93-.1-.74-.85-1.22-1.57-1.02Z"/>'},tabs:{d:'<path d="M20,4H4c-1.11,0-1.99.89-1.99,2v12c-.01,1.11.88,2,1.99,2h16c1.11,0,2-.89,2-2V6c0-1.11-.89-2-2-2ZM10.25,6.6c0-.11.09-.2.2-.2h3.05c.11,0,.2.09.2.2v2c0,.11-.09.2-.2.2h-3.05c-.11,0-.2-.09-.2-.2v-2ZM4.4,6.6c0-.11.09-.2.2-.2h3.06c.11,0,.2.09.2.2v2c0,.11-.09.2-.2.2h-3.06c-.11,0-.2-.09-.2-.2v-2ZM19.6,17.4c0,.11-.09.2-.2.2H4.6c-.11,0-.2-.09-.2-.2v-6c0-.11.09-.2.2-.2h14.8c.11,0,.2.09.2.2v6ZM19.6,8.6c0,.11-.09.2-.2.2h-3.11c-.11,0-.2-.09-.2-.2v-2c0-.11.09-.2.2-.2h3.11c.11,0,.2.09.2.2v2Z"/>'},touch:{d:'<path d="M20,14.99s0-.05,0-.07v-4.61c0-.8-.65-1.45-1.45-1.45-.68,0-1.26.48-1.41,1.11v-.18c0-.8-.65-1.45-1.45-1.45-.69,0-1.26.48-1.41,1.12v-.34c0-.8-.65-1.45-1.45-1.45-.68,0-1.26.48-1.41,1.11V3.95c0-.8-.65-1.45-1.45-1.45s-1.45.65-1.45,1.45v9.8l-1.87-2.67c-.22-.31-.55-.52-.94-.59-.38-.07-.77.02-1.08.24-.32.22-.53.56-.6.95-.07.39.02.77.24,1.08l3.86,5.54.07.1c.55.92,1.33,1.69,2.25,2.23.97.57,2.07.87,3.2.87,3.49,0,6.33-2.84,6.35-6.33,0-.02,0-.04,0-.07v-.06s0-.06,0-.06Z"/>'},window:{d:'<rect x="2.5" y="18.5" width="19" height="2.5" rx=".2" ry=".2"/><path d="M19.11,3H4.89c-1.04,0-1.89.9-1.89,2v10c0,1.1.85,2,1.89,2h14.21c1.04,0,1.89-.9,1.89-2V5c0-1.1-.85-2-1.89-2ZM19.5,15.3c0,.11-.09.2-.2.2H4.7c-.11,0-.2-.09-.2-.2V4.7c0-.11.09-.2.2-.2h14.6c.11,0,.2.09.2.2v10.6Z"/><rect x="7.5" y="7" width="9" height="6" rx=".2" ry=".2"/>'},"pin-angle":{d:'<path d="M5.36,20.56l4.6-4.6c.08-.08.21-.09.29,0l2.59,2.59c.08.08.2.07.28,0l.95-.87c.22-.2.35-.48.36-.77l.06-1.69c.01-.43.16-.85.43-1.21l2.69-3.68c.26-.35.61-.62,1.01-.78l2.01-.77c.36-.14.48-.6.22-.86l-2.39-2.39-2.39-2.39c-.26-.26-.72-.14-.86.22l-.77,2.01c-.15.4-.42.75-.78,1.01l-3.68,2.69c-.36.26-.78.41-1.21.43l-1.69.06c-.29.01-.57.14-.77.36l-.87.95c-.08.08-.08.21,0,.28l2.59,2.59c.08.08.07.21,0,.29l-4.6,4.6c-.56.56-.59,1.45-.06,1.98h0c.53.53,1.41.5,1.98-.06Z"/>'},"unpin-angle":{d:'<path d="M14.92,14h0s-4.92-4.92-4.92-4.92h0l-4.28-4.28c-.08-.08-.2-.08-.28,0l-1.42,1.42c-.08.08-.08.2,0,.28l3.06,3.06c-.28.02-.56.14-.75.36l-.87.95c-.08.08-.08.21,0,.28l2.59,2.59c.08.08.07.21,0,.29l-4.6,4.6c-.56.56-.59,1.45-.06,1.98h0c.53.53,1.41.5,1.98-.06l4.6-4.6c.08-.08.21-.09.29,0l2.59,2.59c.08.08.2.07.28,0l.95-.87c.22-.2.34-.47.36-.75l3.06,3.06c.08.08.2.08.28,0l1.42-1.42c.08-.08.08-.2,0,.28l-4.28-4.28Z"/><path d="M20.86,7.91l-2.39-2.39-2.39-2.39c-.26-.26-.72-.14-.86.22l-.77,2.01c-.15.4-.42.75-.78,1.01l-2.09,1.53,4.5,4.5,1.53-2.09c.26-.35.61-.62,1.01-.78l2.01-.77c.36-.14.48-.6.22-.86Z"/>'},"vi-clss":{d:'<path d="M71.81,17.09c2.12,0,3.84,1.73,3.84,3.84v39.98c0,1.09-.9,1.99-1.99,1.99H6.35c-1.09,0-1.99-.9-1.99-1.99V19.08c0-1.09.9-1.99,1.99-1.99h65.44M73.34,12.52H6.66C2.98,12.52,0,15.51,0,19.18v41.63c0,3.68,2.99,6.66,6.66,6.66h66.67c3.68,0,6.66-2.99,6.66-6.66V19.18c0-3.68-2.99-6.66-6.66-6.66h0Z"/><path d="M14.65,48.82h-3.32v-5.27h4.39l1.46-7.07h-5.85v-5.29h6.95l1.93-9.34h5.46l-1.93,9.34h5.39l1.88-9.34h5.66l-1.95,9.34h3.37v5.29h-4.46l-1.46,7.07h5.93v5.27h-7.03l-1.93,9.34h-5.44l1.88-9.34h-5.42l-1.93,9.34h-5.51s1.93-9.34,1.93-9.34ZM22.67,36.48l-1.44,7.07h5.42l1.41-7.07h-5.39Z"/><path d="M45.23,48.82h-3.32v-5.27h4.39l1.46-7.07h-5.85v-5.29h6.95l1.93-9.34h5.46l-1.93,9.34h5.39l1.88-9.34h5.66l-1.95,9.34h3.37v5.29h-4.46l-1.46,7.07h5.93v5.27h-7.03l-1.93,9.34h-5.44l1.88-9.34h-5.42l-1.93,9.34h-5.51l1.93-9.34h0ZM53.25,36.48l-1.44,7.07h5.42l1.41-7.07h-5.39Z"/>',viewBox:"0 0 80 80"},"vi-line":{d:'<rect x="3" y="15.83" width="18" height="4.67" rx=".2" ry=".2"/><path d="M4.54,11.22h-.98v-1.51h1.29l.43-2.02h-1.72v-1.51h2.05l.57-2.68h1.61l-.57,2.67h1.59l.55-2.67h1.67l-.57,2.67h.99v1.51h-1.31l-.43,2.02h1.74v1.51h-2.07l-.57,2.67h-1.6l.55-2.67h-1.59l-.57,2.67h-1.62l.57-2.67h0ZM6.9,7.69l-.42,2.02h1.59l.42-2.02h-1.59Z"/><path d="M13.54,11.22h-.98v-1.51h1.29l.43-2.02h-1.72v-1.51h2.05l.57-2.67h1.61l-.57,2.67h1.59l.55-2.67h1.67l-.57,2.67h.99v1.51h-1.31l-.43,2.02h1.74v1.51h-2.07l-.57,2.67h-1.6l.55-2.67h-1.59l-.57,2.67h-1.62l.57-2.67h0ZM15.9,7.69l-.42,2.02h1.59l.42-2.02h-1.59Z"/>'},"vi-nbr":{d:'<path d="M3.99,14.91h-.99v-1.74h1.31l.44-2.34h-1.75v-1.75h2.08l.58-3.09h1.63l-.58,3.09h1.61l.56-3.09h1.69l-.58,3.09h1.01v1.75h-1.33l-.44,2.34h1.77v1.74h-2.1l-.58,3.09h-1.63l.56-3.09h-1.62l-.58,3.09h-1.65l.58-3.09h0ZM6.39,10.84l-.43,2.34h1.62l.42-2.34h-1.61Z"/><path d="M19,6h-5c-1.1,0-2,.9-2,2v4.91c0,1.1.9,2,2,2h5c1.1,0,2-.9,2-2v-4.91c0-1.1-.9-2-2-2ZM19.24,12.97c0,.11-.09.2-.2.2h-5.08c-.11,0-.2-.09-.2-.2v-5.03c0-.11.09-.2.2-.2h5.08c.11,0,.2.09.2.2v5.03Z"/>'},"vi-oth":{d:'<path d="M12.25,12.26h-1.92l-.76-2.1h-3.49l-.72,2.1h-1.87L6.9,3h1.86s3.49,9.26,3.49,9.26ZM9.01,8.6l-1.2-3.44-1.18,3.44h2.38Z"/><path d="M13.19,3h3.49c.69,0,1.21.03,1.54.09.34.06.64.19.91.38s.49.45.67.77c.18.32.27.68.27,1.08,0,.43-.11.83-.33,1.19-.22.36-.52.63-.89.81.53.16.94.45,1.23.84s.43.86.43,1.4c0,.42-.09.83-.28,1.23s-.44.72-.76.95c-.32.24-.71.38-1.18.44-.29.03-1,.05-2.12.06h-2.97V3h0ZM14.95,4.54v2.14h1.15c.69,0,1.11-.01,1.28-.03.3-.04.54-.15.71-.33s.26-.43.26-.72-.07-.52-.22-.7c-.15-.18-.37-.29-.66-.33-.17-.02-.68-.03-1.51-.03,0,0-1.01,0-1.01,0ZM14.95,8.22v2.48h1.63c.63,0,1.04-.02,1.21-.06.26-.05.47-.17.64-.37.16-.2.25-.46.25-.79,0-.28-.06-.51-.19-.71-.13-.19-.31-.34-.55-.42-.24-.09-.76-.13-1.56-.13,0,0-1.42,0-1.42,0Z"/><path d="M7.24,20.88h-1.42v-5.21c-.52.47-1.13.82-1.84,1.05v-1.25c.37-.12.77-.34,1.21-.67s.73-.71.9-1.15h1.16v7.24h0Z"/><path d="M14.17,19.59v1.28h-4.99c.05-.49.22-.94.49-1.38s.8-1.01,1.6-1.73c.64-.58,1.04-.97,1.18-1.18.2-.29.29-.57.29-.85,0-.31-.09-.54-.26-.71s-.41-.25-.71-.25-.53.09-.71.26-.28.46-.3.87l-1.42-.14c.08-.76.35-1.31.79-1.64s1-.5,1.67-.5c.73,0,1.31.19,1.73.58.42.38.63.86.63,1.43,0,.32-.06.63-.18.93-.12.29-.31.6-.57.92-.17.21-.48.52-.93.92-.45.4-.73.67-.85.8s-.22.26-.29.38h2.83s0,0,0,0h0Z"/><path d="M15.09,18.96l1.38-.16c.04.34.16.6.35.78s.42.27.7.27c.29,0,.54-.11.74-.32s.3-.51.3-.88c0-.35-.1-.62-.29-.83s-.43-.31-.7-.31c-.18,0-.4.03-.65.1l.16-1.13c.39,0,.68-.07.88-.24s.3-.4.3-.69c0-.24-.07-.44-.22-.58s-.35-.22-.59-.22-.45.08-.62.25-.28.4-.31.72l-1.31-.22c.09-.44.23-.79.41-1.05s.44-.47.77-.61.7-.22,1.11-.22c.7,0,1.26.22,1.68.65.35.35.52.75.52,1.2,0,.63-.36,1.14-1.07,1.51.42.09.77.29,1.02.6.25.31.38.68.38,1.12,0,.63-.24,1.17-.72,1.62s-1.07.67-1.78.67-1.23-.19-1.67-.56-.7-.87-.77-1.47Z"/>'},"vi-stn":{d:'<path d="M9.04,5.97c-.92.15-1.53,1.02-1.36,1.95l.84,5.1.25,1.42c.1.6.59,1.02,1.19,1.02h5.99c.17,0,.35.12.4.27l1.98,5.37c.22.6.87.9,1.44.67h0c.59-.22.89-.87.67-1.45l-1.78-4.87-.52-1.4c-.22-.62-.84-1.05-1.51-1.05h-4.43c-.17,0-.35-.12-.37-.3l-.22-1.4c0-.1.07-.22.17-.22h3.04c.42,0,.74-.35.74-.75h0c0-.42-.35-.75-.74-.75h-3.22c-.15,0-.3-.12-.32-.27l-.32-1.95c-.15-.92-.99-1.57-1.91-1.4Z"/><path d="M8.59,3.63c0,.9.73,1.62,1.62,1.62s1.63-.72,1.63-1.62-.72-1.63-1.63-1.63-1.63.73-1.62,1.63Z"/><path d="M13.8,16.97c-.53,1.75-2.13,3.03-4.05,3.03-2.35,0-4.25-1.9-4.25-4.25,0-1.27.57-2.39,1.45-3.17l-.36-2.21c-1.84,1.09-3.08,3.09-3.08,5.38,0,3.45,2.8,6.25,6.25,6.25,3.03,0,5.56-2.16,6.13-5.03h-2.08Z"/>'},"vi-sub":{d:'<rect x="3" y="16.02" width="18" height="4.73" rx=".2" ry=".2"/><path d="M13.09,4.65h2.58l.43,1.69h.8l-.08-2.9c0-.11-.09-.19-.2-.19H7.37c-.11,0-.2.09-.2.2l-.07,2.9h.8l.43-1.69h2.58c.02,1.25.02,2.51.02,3.76v.71c0,1.52,0,2.6-.03,4.09l-1.6.13v.93h5.4v-.93l-1.6-.13c-.03-1.5-.03-2.59-.03-4.1v-.7c0-1.27,0-2.52.02-3.76h0Z"/>'},"vi-text":{d:'<path d="M3.86,4.36v15.29h16.29V4.36H3.86ZM19.15,18.65H4.85V5.35h14.29v13.29h0Z"/><rect x="3" y="3.5" width="2.57" height="2.57"/><rect x="3" y="17.93" width="2.57" height="2.57"/><rect x="18.43" y="3.5" width="2.57" height="2.57"/><rect x="18.43" y="17.93" width="2.57" height="2.57"/><path d="M12.89,8.59h2.11l.36,1.41h.65l-.07-2.57h-7.89l-.06,2.57h.65l.36-1.41h2.11c.01,1.04.02,2.08.02,3.12v.59c0,1.26,0,2.16-.02,3.39l-1.31.11v.77h4.42v-.77l-1.31-.11c-.02-1.25-.02-2.14-.02-3.4v-.58c0-1.05,0-2.09.02-3.12Z"/>'},"vi-way":{d:'<path d="M11.22,13h-2.61c-.11,0-.21-.04-.3-.11L2.56,7.88c-.08-.07-.08-.19,0-.26l5.75-5.01c.08-.07.19-.11.3-.11h2.61c.12,0,.18.15.09.23l-4.55,3.96h8.07c.1,0,.18.08.18.18v1.76c0,.1-.08.18-.18.18H6.76l4.55,3.97c.09.08.04.23-.09.23Z"/><path d="M12.78,11h2.61c.11,0,.21.04.3.11l5.75,5.01c.08.07.08.19,0,.26l-5.75,5.01c-.08.07-.19.11-.3.11h-2.61c-.12,0-.18-.15-.09-.23l4.55-3.96h-8.07c-.1,0-.18-.08-.18-.17v-1.76c0-.1.08-.18.18-.18h8.07s-4.55-3.97-4.55-3.97c-.09-.08-.04-.23.09-.23Z"/>'},calendar:{d:'<path d="M17.39,6.4v-3.2c0-.11-.09-.2-.2-.2h-2.03c-.11,0-.2.09-.2.2v3.2c0,.11-.09.2-.2.2h-5.51c-.11,0-.2-.09-.2-.2v-3.2c0-.11-.09-.2-.2-.2h-2.03c-.11,0-.2.09-.2.2v3.2c0,.11-.09.2-.2.2h-2.72c-.11,0-.2.09-.2.2v14c0,.11.09.2.2.2h16.6c.11,0,.2-.09.2-.2V6.8c0-.11-.09-.2-.2-.2h-2.71c-.11,0-.2-.09-.2-.2ZM17.8,18.72H6.2c-.11,0-.2-.09-.2-.2v-7.75c0-.11.09-.2.2-.2h11.6c.11,0,.2.09.2.2v7.75c0,.11-.09.2-.2.2Z"/><circle cx="8.38" cy="12.95" r="1.24"/><circle cx="8.38" cy="16.4" r="1.24"/><circle cx="12" cy="12.95" r="1.24"/><circle cx="12" cy="16.4" r="1.24"/><circle cx="15.62" cy="12.95" r="1.24"/><circle cx="15.62" cy="16.4" r="1.24"/>'},payment:{d:'<path d="M18.61,14.98l.77.75-.99.97-1.61-1.58c2.73-.78,4.72-3.25,4.72-6.18,0-3.56-2.93-6.44-6.55-6.44-2.98,0-5.5,1.96-6.29,4.64l-1.61-1.58.99-.97.77.75c.2-.33.43-.64.68-.93l-1.4-1.38-.81.8-1.8,1.77,12.88,12.66,1.8-1.77.81-.8-1.4-1.38c-.3.25-.61.47-.95.67ZM15.73,12.53h-1.63s0-1.45,0-1.45h-1.87v-1.06s1.87,0,1.87,0v-.79s-1.87,0-1.87,0v-1.05h1.51l-2.01-3.47h1.75c.79,1.61,1.29,2.67,1.5,3.18h.04c.03-.07.06-.17.1-.28.06-.18.31-.7.74-1.58l.64-1.33h1.65s-2.06,3.47-2.06,3.47h1.46v1.05h-1.81s0,.79,0,.79h1.81v1.06h-1.81v1.45Z"/><polygon points="16 17.57 12 21.5 2.5 12.17 6.5 8.23 7.44 9.16 4.26 12.28 11.88 19.77 15.06 16.65 16 17.57"/><ellipse cx="7.41" cy="12.41" rx=".93" ry=".91"/><ellipse cx="9.58" cy="14.54" rx=".93" ry=".91"/><ellipse cx="11.75" cy="16.67" rx=".93" ry=".91"/>'},subrail:{d:'<path d="M11.81,19.66c-.47-.01-.92-.07-1.37-.16-.17-.04-.35.02-.48.14l-1.05,1.05c-.29.29-.16.77.23.89.91.27,1.86.41,2.86.41s1.95-.14,2.86-.41c.39-.12.51-.6.23-.89l-1.05-1.05c-.13-.13-.31-.18-.48-.14-.56.12-1.14.17-1.74.16Z"/><path d="M11.86,2c-5.39.08-9.79,4.48-9.86,9.88-.04,3.45,1.67,6.51,4.3,8.34.21.15.5.12.68-.06l1.41-1.41h0l2.64-2.64c.06-.06.1-.15.1-.24v-1.87c0-.5-.41-.91-.91-.91h-1.17c-.19,0-.34-.15-.34-.34v-2.03c0-.41.18-.79.49-1.05.46-.39.97-.75,1.66-.87.16-.03.28-.17.28-.34v-1.64c0-.21-.18-.37-.39-.34-.62.08-1.4.34-2.2.76-.89.46-1.54,1.16-1.86,1.85-.08.18-.12.37-.12.56v4.04c0,.62.5,1.11,1.11,1.11h.83c.31,0,.46.37.24.59l-2.09,2.09c-1.37-1.34-2.25-3.19-2.31-5.23-.12-3.83,2.58-7.06,6.18-7.76.14-.03.24-.14.26-.27.11-.62.61-1.08,1.22-1.08s1.11.47,1.22,1.08c.02.14.13.25.26.27,3.52.69,6.18,3.79,6.18,7.52,0,2.15-.88,4.09-2.31,5.48l-2.1-2.1c-.22-.22-.06-.59.24-.59h.83c.62,0,1.11-.5,1.11-1.11v-4.04c0-.19-.04-.39-.12-.56-.31-.69-.97-1.38-1.86-1.85-.8-.42-1.58-.68-2.2-.76-.21-.03-.39.13-.39.34v1.64c0,.16.12.31.28.34.69.12,1.2.48,1.66.87.31.26.48.65.48,1.05v2.03c0,.19-.15.34-.34.34h-1.17c-.5,0-.91.41-.91.91v1.87c0,.09.04.18.1.24l2.64,2.64,1.4,1.4c.18.18.47.21.68.06,2.6-1.81,4.3-4.81,4.3-8.22,0-5.57-4.55-10.08-10.14-10Z"/>'},ticket:{d:'<path d="M21.39,7.95l-6.07-3.42c-.11-.06-.24-.02-.29.09l-2.91,5.6-3.82-2.54c-.22-.15-.49-.16-.72-.04l-4.89,2.09c-.12.06-.19.2-.19.35v8.49c0,.19.09.36.26.38.75.08,1.09-.15,1.86-.46.97-.4,1.71-.95,2.24-1.42.4-.37.94-.49,1.43-.55l1.58-.22-.34.67c-.31.6-.13,1.35.39,1.7.34.23.74.22,1.06.02.05.27.19.53.42.68.41.27.94.11,1.18-.36l.48-.95,2.38,1.35c.11.05.23.01.29-.09l5.74-11.07c.06-.11.02-.24-.08-.3ZM7.14,13.42c.33-.59.81-.96,1.34-.96.46,0,.89.28,1.21.76l-2.55.2ZM15.17,17.15c-.06.11-.19.15-.29.09l-2.29-1.28h.13c.78,0,1.4-.56,1.4-1.46s-.78-1.47-1.56-1.47h-.23l2.16-4.13,1.1-2.12c.06-.11.18-.15.29-.09l3.46,1.95c.11.06.15.19.09.3l-1.1,2.13-3.16,6.08Z"/><path d="M19.43,8.94l-1.1,2.13-3.84-2.17,1.1-2.12c.06-.11.18-.15.29-.09l3.46,1.95c.11.06.15.19.09.3Z"/>'},time:{d:'<path d="M12,2C6.49,2,2,6.49,2,12s4.49,10,10,10,10-4.49,10-10S17.51,2,12,2ZM12,20c-4.41,0-8-3.59-8-8S7.59,4,12,4s8,3.59,8,8-3.59,8-8,8h0Z"/><path d="M13.06,11.99s-.06-.09-.06-.14v-5.51c0-.55-.45-1-1-1h0c-.55,0-1,.45-1,1v6c0,.27.11.52.29.71l1.71,1.71,1.13,1.13c.39.39,1.02.39,1.41,0h0c.39-.39.39-1.02,0-1.41l-2.48-2.48Z"/><path d="M12,11.35c-.55,0-1,.45-1,1,0,.28.11.53.29.71h0s2.83,2.83,2.83,2.83h0c.18.18.43.29.71.29.55,0,1-.45,1-1,0-.28-.11-.53-.29-.71l-2.83-2.83c-.18-.18-.43-.29-.71-.29Z"/>'},cgo:{d:'<path d="M15.57,5.61l-1.63,1.63c-.37-2.41-2.44-4.26-4.95-4.26-1.39,0-2.64.56-3.55,1.47h0s-3.44,3.44-3.44,3.44c0,.04,0,.07,0,.11,0,.84.15,1.65.42,2.4l1.63-1.63c.37,2.41,2.44,4.26,4.95,4.26,1.11,0,2.12-.37,2.95-.98v3.93c0,1.63-1.32,2.95-2.95,2.95s-2.95-1.32-2.95-2.95c0-.53.14-1.04.39-1.47-.65-.26-1.25-.61-1.79-1.04-.42.74-.67,1.59-.67,2.5,0,2.77,2.25,5.02,5.02,5.02,1.1,0,2.13-.36,2.95-.96,1.25-.91,2.07-2.39,2.07-4.06v-5.9l1.97-1.97s0-.07,0-.11c0-.84-.15-1.65-.42-2.4ZM11.09,10.1h0s0,0,0,0c-.53.53-1.27.87-2.09.87-1.63,0-2.95-1.32-2.95-2.95,0-.81.33-1.55.86-2.09h0s0,0,0,0c.53-.53,1.27-.87,2.09-.87,1.63,0,2.95,1.32,2.95,2.95,0,.82-.33,1.55-.86,2.09Z"/><path d="M22,8.01c0,2.77-2.25,5.02-5.02,5.02-.91,0-1.77-.24-2.5-.67.43-.54.78-1.14,1.04-1.79.43.25.93.39,1.47.39,1.63,0,2.95-1.32,2.95-2.95s-1.32-2.95-2.95-2.95c-.53,0-1.04.14-1.47.39-.26-.65-.61-1.25-1.04-1.79.74-.42,1.59-.67,2.5-.67,2.77,0,5.02,2.25,5.02,5.02Z"/><path d="M20.53,16.73c-.03-.33-.08-1.33-.83-1.77-.41-.24-1.28-.26-1.45-.26s-1.05.02-1.45.26c-.75.45-.81,1.44-.83,1.77-.05.54-.15,1.89-.02,2.35.06.22.29.5.8.5h3.02c.51,0,.74-.28.8-.5.13-.46.03-1.81-.02-2.35ZM20.01,18.05c0,.22-.02.4-.05.52-.05.17-.22.38-.6.38h-2.26c-.38,0-.55-.21-.6-.38-.03-.12-.05-.3-.05-.52l.06-1.27c.02-.25.06-1.01.62-1.35.3-.18.95-.2,1.09-.2s.78.02,1.09.2c.56.34.6,1.1.62,1.35.02.24.06.69.06,1.1v.18Z"/><polygon points="19.14 19.74 19.66 19.74 20.31 20.45 19.52 20.45 19.14 19.74"/><polygon points="17.33 19.74 16.82 19.74 16.16 20.45 16.95 20.45 17.33 19.74"/>'},cgoapp:{d:'<path d="M14.75,1.75h-5.5C3.99,1.75,1.75,3.99,1.75,9.25v5.5c0,5.26,2.24,7.5,7.5,7.5h5.5c5.26,0,7.5-2.24,7.5-7.5v-5.5c0-5.26-2.24-7.5-7.5-7.5ZM20.75,14.75c0,4.43-1.57,6-6,6h-5.5c-4.43,0-6-1.57-6-6v-5.5c0-4.43,1.57-6,6-6h5.5c4.43,0,6,1.57,6,6v5.5Z"/><path d="M13.97,7.98l-1.07,1.07c-.24-1.58-1.59-2.79-3.24-2.79-.91,0-1.73.37-2.33.96h0s-2.25,2.25-2.25,2.25c0,.02,0,.05,0,.07,0,.55.1,1.08.28,1.57l1.07-1.07c.24,1.58,1.59,2.79,3.24,2.79.73,0,1.39-.24,1.93-.64v2.58c0,1.07-.87,1.93-1.93,1.93s-1.93-.87-1.93-1.93c0-.35.09-.68.26-.96-.43-.17-.82-.4-1.17-.68-.28.48-.44,1.04-.44,1.64,0,1.82,1.47,3.29,3.29,3.29.72,0,1.39-.23,1.93-.63.82-.6,1.36-1.57,1.36-2.66v-3.86l1.29-1.29s0-.05,0-.07c0-.55-.1-1.08-.28-1.57ZM11.04,10.91h0s0,0,0,0c-.35.35-.83.57-1.37.57-1.07,0-1.93-.87-1.93-1.93,0-.53.22-1.02.57-1.37h0s0,0,0,0c.35-.35.83-.57,1.37-.57,1.07,0,1.93.87,1.93,1.93,0,.53-.22,1.02-.57,1.37Z"/><path d="M18.18,9.55c0,1.82-1.47,3.29-3.29,3.29-.6,0-1.16-.16-1.64-.44.28-.35.51-.75.68-1.17.28.16.61.26.96.26,1.07,0,1.93-.87,1.93-1.93s-.87-1.93-1.93-1.93c-.35,0-.68.09-.96.26-.17-.43-.4-.82-.68-1.17.48-.28,1.04-.44,1.64-.44,1.82,0,3.29,1.47,3.29,3.29Z"/><path d="M17.22,15.26c-.02-.22-.05-.87-.55-1.16-.27-.16-.84-.17-.95-.17s-.69.01-.95.17c-.49.29-.53.95-.55,1.16-.03.35-.1,1.24-.01,1.54.04.15.19.33.52.33h1.98c.33,0,.48-.18.52-.33.09-.3.02-1.19-.01-1.54ZM16.88,16.12c0,.14,0,.26-.03.34-.03.11-.14.25-.39.25h-1.48c-.25,0-.36-.14-.39-.25-.02-.08-.03-.2-.03-.34l.04-.83c.01-.16.04-.66.41-.88.2-.12.62-.13.71-.13s.51.01.71.13c.37.22.39.72.41.88.01.16.04.45.04.72v.12Z"/><polygon points="16.31 17.22 16.65 17.22 17.08 17.69 16.56 17.69 16.31 17.22"/><polygon points="15.12 17.22 14.79 17.22 14.36 17.69 14.88 17.69 15.12 17.22"/>'},a11yclimber:{d:'<path d="M12.69,13.84c.07.44.46.77.91.77h4.55c.14,0,.26.09.31.21l1.5,4.03c.16.44.65.67,1.1.5s.67-.65.5-1.1l-1.36-3.65-.39-1.05c-.18-.47-.63-.79-1.13-.79h-3.35c-.14,0-.25-.1-.28-.23l-.17-1.05c-.01-.08.05-.16.14-.16h2.3c.31,0,.57-.25.57-.57s-.25-.57-.57-.57h-2.44c-.12,0-.22-.09-.24-.21l-.25-1.47c-.12-.69-.77-1.16-1.46-1.04-.69.12-1.15.77-1.04,1.46l.64,3.83.18,1.07Z"/><path d="M13.81,6.95c.68,0,1.22-.55,1.22-1.22s-.55-1.22-1.22-1.22-1.22.55-1.22,1.22.55,1.22,1.22,1.22Z"/><path d="M13.42,19.5c2.5-.01,4.54-1.98,4.67-4.44,0-.03-.02-.05-.05-.05h-.89s-.05.02-.05.05c-.13,1.96-1.77,3.5-3.77,3.46-1.94-.04-3.54-1.59-3.63-3.52-.08-1.58.83-2.95,2.17-3.56.02,0,.03-.03.03-.05l-.15-.9s-.04-.05-.07-.04c-1.77.7-3.01,2.44-2.97,4.46.05,2.55,2.17,4.61,4.71,4.6Z"/><path d="M3.72,5.25c.9,0,1.63-.73,1.63-1.63s-.73-1.63-1.63-1.63-1.63.73-1.63,1.63.73,1.63,1.63,1.63Z"/><path d="M21,20h-12c-.55,0-1-.45-1-1v-7c0-.53-.42-.95-.94-.99l-1.72-3.96c-.23-.69-.87-1.19-1.63-1.19-.95,0-1.72.77-1.72,1.72v6.52c0,.57.29,1.08.72,1.39v5.5c0,.55.45,1,1,1s1-.45,1-1v-5.5c.43-.31.72-.82.72-1.39v-3.49l.53,1.22s.03.05.05.07c0,.03-.02.06-.02.09v8c0,1.1.9,2,2,2h13c.55,0,1-.45,1-1s-.45-1-1-1Z"/>'},a11yplatform:{d:'<path d="M12.61,17.03H4.46s0,1.63,0,1.63h10.07s3.96,3.34,3.96,3.34l.36-.44-3.43-2.9h5.13s0-1.52,0-1.52h0s1.1.93,1.1.93l.36-.44-4.13-3.49-.8-2.13-.35-.95c-.16-.43-.57-.71-1.03-.71h-2.3s-1.12-.95-1.12-.95l-.03-.2c-.01-.08.05-.14.12-.14h2.09c.28,0,.51-.23.51-.51,0-.28-.23-.51-.51-.51h-2.22c-.11,0-.2-.08-.22-.19l-.22-1.32c-.1-.62-.7-1.04-1.32-.94-.63.1-1.05.69-.94,1.31l.03.2-4.04-3.42-.36.44,4.54,3.85h0s.4,2.38.4,2.38l.16.96c.07.4.41.69.82.69h3.38s.42.35.42.35h0s-.58,0-.58,0c-.02,0-.04.02-.04.04-.1,1.51-1.21,2.74-2.67,3.04l-4.04-3.42c.06-1.28.84-2.37,1.96-2.88.02,0,.03-.03.03-.05l-.14-.81s-.03-.05-.06-.03c-1.32.52-2.31,1.68-2.6,3.08h0s-4.39-3.72-4.39-3.72l-.36.44,4.66,3.94h0c0,.09-.02.18-.02.26.05,2.29,1.97,4.15,4.28,4.14.28,0,.56-.03.83-.08h0s0,0,0,0l.84.71h0ZM10.8,15.5h0c-1.58-.05-2.89-1.19-3.19-2.7l3.19,2.7ZM20.42,17.03h-6.94s-1.06-.9-1.06-.9h0c1.49-.56,2.58-1.93,2.73-3.56h0s.71.61.71.61h0s.99,2.65.99,2.65c.15.4.59.6.99.45.4-.15.6-.59.46-.99l-.02-.06,2.14,1.81h0Z"/><path d="M11.16,5.03c-.61,0-1.1-.49-1.1-1.1s.49-1.1,1.1-1.1,1.1.49,1.1,1.1-.49,1.1-1.1,1.1Z"/>'},a11ytoilet:{d:'<circle cx="3.88" cy="2.96" r=".81"/><path d="M5.76,5.02v3.62c0,.19-.15.34-.34.34h0c-.19,0-.34-.15-.34-.34v-3.31s-.03-.06-.06-.06h0s-.06.03-.06.06v8.2c0,.26-.21.48-.48.48-.13,0-.25-.05-.34-.14-.09-.09-.14-.2-.14-.34v-4.8c0-.07-.06-.13-.13-.13s-.13.06-.13.13v4.8c0,.26-.21.48-.48.48-.13,0-.25-.05-.34-.14-.09-.09-.14-.2-.14-.34V5.32s-.03-.06-.06-.06-.06.03-.06.06v3.31c0,.19-.15.34-.34.34-.09,0-.18-.04-.24-.1-.06-.06-.1-.15-.1-.24v-3.62c0-.58.47-1.05,1.05-1.05h1.67c.58,0,1.05.47,1.05,1.05Z"/><path d="M11.86,2.96c0,.45-.36.81-.81.81s-.81-.36-.81-.81.36-.81.81-.81.81.36.81.81Z"/><path d="M13.11,10.33h-.93s-.04.02-.04.04v3.15c0,.26-.21.48-.48.48-.13,0-.25-.05-.34-.14-.09-.09-.14-.2-.14-.34v-3.07c0-.07-.06-.13-.13-.13s-.13.06-.13.13v3.07c0,.26-.21.48-.48.48-.13,0-.25-.05-.34-.14-.09-.09-.14-.2-.14-.34v-3.15s-.02-.04-.04-.04h-.93c-.09,0-.15-.09-.11-.17l1.25-3.02c.02-.05.03-.11.03-.17v-1.65s-.03-.06-.06-.06-.06.03-.06.06v1.63s0,.09-.03.13l-.32.78-.15.37c-.07.17-.27.26-.45.18-.13-.05-.21-.18-.21-.32,0-.04,0-.09.03-.13l.42-1.02s.03-.09.03-.13v-1.79c0-.58.47-1.05,1.05-1.05h.06c.15.15.35.24.58.24s.43-.09.58-.24h.06c.58,0,1.05.47,1.05,1.05v1.79s0,.09.03.13l.42,1.02c.08.2-.03.42-.25.47-.16.03-.32-.06-.38-.22l-.13-.32-.34-.81s-.03-.09-.03-.13v-1.63s-.02-.05-.05-.06c0,0,0,0-.01,0s0,0-.01,0c-.03,0-.05.03-.05.06v1.65c0,.06.01.11.03.17l1.25,3.02c.03.08-.03.17-.11.17Z"/><rect x="7.14" y="2" width=".65" height="11.99" rx=".32" ry=".32"/><path d="M18.18,11.09c.63.1,1.05.7.94,1.32l-.58,3.48-.16.97c-.07.4-.42.7-.82.7h-4.13c-.12,0-.24.08-.28.19l-1.36,3.66c-.15.4-.59.6-1,.46h0c-.4-.15-.6-.59-.46-1l1.23-3.31.35-.95c.16-.43.57-.72,1.03-.72h3.04c.12,0,.23-.09.25-.21l.16-.95c.01-.08-.05-.15-.12-.15h-2.09c-.28,0-.51-.23-.51-.51h0c0-.28.23-.51.51-.51h2.22c.11,0,.2-.08.22-.19l.22-1.33c.1-.63.7-1.05,1.32-.94h0Z"/><path d="M18.52,9.68c0,.53-.43.97-.97.97s-.97-.43-.97-.97.43-.97.97-.97.97.43.97.97Z"/><path d="M22,17.83c-.05,2.31-1.97,4.18-4.28,4.17-2.27,0-4.12-1.79-4.24-4.04,0-.03.02-.05.05-.05h.81s.04.02.04.04c.12,1.78,1.61,3.18,3.43,3.15,1.76-.03,3.21-1.44,3.3-3.2.07-1.43-.76-2.68-1.97-3.23-.02,0-.03-.03-.03-.05l.14-.82s.03-.05.06-.03c1.6.63,2.73,2.21,2.69,4.05Z"/>'},aed:{d:'<path d="M20.48,5.12c-2.27-2.45-6.58-2.02-8.48.66-1.9-2.68-6.21-3.11-8.48-.66-3.04,3.27-1.1,8.62,2.11,11.07,1.97,1.65,4.29,2.8,6.36,4.31,2.07-1.51,4.4-2.66,6.36-4.31,3.22-2.46,5.15-7.8,2.12-11.07ZM10.56,18.23l1.41-4.87h-3.5l4.95-6.91-1.37,4.88h3.49l-4.98,6.91Z"/>'},arrive:{d:'<path d="M9.97,12.08l-2.14,1.98-1.02.95-1.01.93s-.1.06-.16.06h-1.61c-.07,0-.1-.08-.05-.13l.89-.83,1.21-1.12,1.09-1.01.26-.24H2.1c-.05,0-.1-.05-.1-.1v-1.17c0-.05.04-.1.1-.1h5.33l-.26-.24-1.09-1.01-1.21-1.12-.89-.83s-.01-.13.05-.13h1.61c.06,0,.12.02.16.06l1.01.93,1.02.95,2.14,1.98s.04.11,0,.15Z"/><path d="M16,6c-3.31,0-6,2.69-6,6s2.69,6,6,6,6-2.69,6-6-2.69-6-6-6ZM16,16c-2.21,0-4-1.79-4-4s1.79-4,4-4,4,1.79,4,4-1.79,4-4,4Z"/><circle cx="16" cy="12" r="2"/>'},baby:{d:'<path d="M6.27,3.81l.11-.31c.02-.05.03-.11.05-.16.02-.11.03-.18.03-.31h0c0-.57-.48-1.02-1.08-1.02h-.03c-.6,0-1.08.46-1.08,1.02h0c0,.13.01.21.03.31.01.05.03.11.05.16l.11.31c.03.14-.09.28-.24.28h-.8c-.51,0-.92.39-.92.87h0c0,.48.41.87.92.87h3.82c.51,0,.92-.39.92-.87h0c0-.48-.41-.87-.92-.87h-.74c-.16,0-.27-.13-.24-.28Z"/><path d="M6.84,6.37h-3.01c-.64,0-1.16.52-1.16,1.16v7.39c0,.64.52,1.16,1.16,1.16h3.01c.64,0,1.16-.52,1.16-1.16v-7.39c0-.64-.52-1.16-1.16-1.16ZM7.36,14.92c0,.29-.23.52-.52.52h-3.01c-.29,0-.52-.23-.52-.52v-.58h1.57c.19,0,.35-.16.35-.35s-.16-.35-.35-.35h-1.57v-1.15h1.57c.19,0,.35-.16.35-.35h0c0-.19-.16-.35-.35-.35h-1.57v-1.15h1.57c.19,0,.35-.16.35-.35h0c0-.19-.16-.35-.35-.35h-1.57v-1.15h1.57c.19,0,.35-.16.35-.35h0c0-.19-.16-.35-.35-.35h-1.57v-.58c0-.29.23-.52.52-.52h3.01c.29,0,.52.23.52.52v7.39Z"/><circle cx="15.91" cy="7.97" r="2.1"/><path d="M21.17,14.44l-3.14-2.77c-1.21-1.07-3.03-1.07-4.25,0l-3.14,2.77c-.4.35-.44.95-.1,1.35.35.41.97.45,1.37.1l1.55-1.37v.89h4.87v-.89l1.55,1.37c.4.36,1.02.31,1.37-.1h0c.34-.4.3-1-.1-1.35Z"/><path d="M14.13,18.83l1.01-1.01-1.7-1.7-1.6,1.6c-.55.55-.55,1.44,0,1.98l2,2c.38.38,1,.38,1.39,0h0c.38-.38.38-1,0-1.39l-1.1-1.1c-.11-.11-.11-.28,0-.39Z"/><path d="M17.69,18.83l-1.01-1.01,1.7-1.7,1.6,1.6c.55.55.55,1.44,0,1.98l-2,2c-.38.38-1,.38-1.39,0h0c-.38-.38-.38-1,0-1.39l1.1-1.1c.11-.11.11-.28,0-.39Z"/>'},beijing:{d:'<path d="M13.34,9.4h-3.6v5.15h3.64s.19-.03.19-.03c.57-.12.99-.62.99-1.22s-.43-1.1-.99-1.22h-.07s-.03-.01-.03-.01c-.03-.01-.06-.05-.06-.08s.02-.07.06-.08h.03s.09-.02.09-.02c.57-.12,1.01-.63,1.01-1.24s-.43-1.12-1.01-1.24l-.22-.02h0s-.02,0-.02,0h0ZM12,2c4.83,0,8.86,3.43,9.8,7.98v.03s-2.25,0-2.25,0l-.09-.33c-.99-3.18-3.96-5.49-7.46-5.49-4.31,0-7.81,3.5-7.81,7.81s3.5,7.81,7.81,7.81c3.51,0,6.47-2.31,7.46-5.49l.07-.27h-2.83l-.02.11c-.16.72-.39,1.43-.71,2.11l-.18.35H7.37V7.37h8.42l.16.3c.64,1.36.96,2.83.97,4.3v.03s2.9,0,2.9,0h2.19c0,5.52-4.48,10-10,10S2,17.52,2,12,6.48,2,12,2h0Z" fill-rule="evenodd"/>'},bus:{d:'<path d="M21.13,7H2.87c-.48,0-.87.39-.87.88v7.21h1.67c0-1.38,1.1-2.5,2.47-2.5s2.47,1.12,2.47,2.5h6.78c0-1.38,1.1-2.5,2.47-2.5s2.47,1.12,2.47,2.5h1.67v-7.21c0-.49-.39-.88-.87-.88ZM6.66,10.95h-3.66v-2.76c0-.12.1-.22.22-.22h3.44v2.98ZM11.45,10.95h-3.66v-2.98h3.66v2.98ZM16.23,10.95h-3.66v-2.98h3.66v2.98ZM21.02,10.95h-3.66v-2.98h3.44c.12,0,.22.1.22.22v2.76Z"/><circle cx="6.14" cy="15.09" r="1.91"/><circle cx="17.86" cy="15.09" r="1.91"/>'},changchun:{d:'<path d="M21.29,15.69c.12-.29.22-.59.31-.89.09-.3.16-.61.22-.92.06-.31.1-.62.13-.94.03-.31.04-.63.04-.94,0-.16,0-.33-.01-.49s-.02-.33-.04-.49-.04-.33-.06-.49c-.02-.16-.05-.32-.08-.48s-.07-.32-.11-.48-.08-.32-.13-.47c-.05-.16-.1-.31-.15-.47-.06-.15-.11-.31-.18-.46-.06-.15-.13-.3-.2-.45-.07-.15-.14-.29-.22-.44-.08-.14-.16-.29-.24-.43-.08-.14-.17-.28-.26-.41-.09-.14-.19-.27-.28-.4s-.2-.26-.3-.39c-.1-.13-.21-.25-.32-.37s-.22-.24-.34-.36c-.12-.12-.23-.23-.36-.34-.12-.11-.25-.22-.37-.32-.13-.1-.26-.2-.39-.3-.13-.1-.27-.19-.4-.28-.14-.09-.27-.18-.41-.26-.14-.08-.28-.16-.43-.24-.14-.08-.29-.15-.44-.22-.15-.07-.3-.14-.45-.2s-.3-.12-.46-.18c-.15-.06-.31-.11-.47-.15-.16-.05-.31-.09-.47-.13-.16-.04-.32-.08-.48-.11-.16-.03-.32-.06-.48-.08s-.32-.04-.49-.06c-.16-.02-.33-.03-.49-.04-.16,0-.33-.01-.49-.01s-.33,0-.49.01c-.16,0-.33.02-.49.04-.16.02-.33.04-.49.06-.16.02-.32.05-.48.08s-.32.07-.48.11c-.16.04-.32.08-.47.13-.16.05-.31.1-.47.15-.15.06-.31.11-.46.18-.15.06-.3.13-.45.2-.15.07-.29.14-.44.22-.14.08-.29.16-.43.24-.14.08-.28.17-.41.26-.14.09-.27.19-.4.28s-.26.2-.39.3c-.13.1-.25.21-.37.32-.12.11-.24.22-.36.34s-.23.23-.34.36c-.11.12-.22.25-.32.37-.1.13-.2.26-.3.39-.1.13-.19.27-.28.4-.09.14-.18.27-.26.41-.08.14-.16.28-.24.43-.08.14-.15.29-.22.44-.07.15-.14.3-.2.45-.06.15-.12.3-.18.46-.06.15-.11.31-.15.47-.05.16-.09.31-.13.47-.04.16-.08.32-.11.48-.03.16-.06.32-.08.48-.02.16-.04.32-.06.49-.02.16-.03.33-.04.49,0,.16-.01.33-.01.49,0,.57.05,1.14.15,1.7,0-.04,0-.08,0-.13,0-2.14,3.86-4.71,9-6.57-5.29,2.57-7.86,4.53-7.86,6.86,0,.76.19,1.24.57,1.43-.57,0-1-.14-1.29-.43-.11-.11-.19-.23-.26-.38.03.13.07.27.11.4.04.13.08.26.13.39.04.13.09.26.14.39.05.13.1.25.16.38.06.13.11.25.17.37.06.12.12.25.19.37.07.12.13.24.2.36s.14.23.22.35c.08.11.15.23.23.34.08.11.16.22.25.33.08.11.17.21.26.32.09.1.18.21.27.31.09.1.19.2.29.3.1.1.2.19.3.29.1.09.2.18.31.27.11.09.21.18.32.26.11.08.22.17.33.25.11.08.23.16.34.23s.23.15.35.22c.12.07.24.14.36.2.12.07.24.13.37.19s.25.12.37.17c.13.06.25.11.38.16s.26.1.39.14c.13.04.26.09.39.13.13.04.26.08.4.11s.27.06.4.09c.13.03.27.05.41.08.14.02.27.04.41.06.14.02.27.03.41.04.14.01.27.02.41.03s.27,0,.41,0c.12,0,.25,0,.37,0,.12,0,.25-.01.37-.02.12,0,.25-.02.37-.03s.25-.03.37-.05c.12-.02.24-.04.37-.06s.24-.05.36-.08c.12-.03.24-.06.36-.09.12-.03.24-.07.36-.1.12-.04.24-.07.35-.12.12-.04.23-.08.35-.13.12-.05.23-.09.34-.14.11-.05.23-.1.34-.15s.22-.11.33-.17c.11-.06.22-.12.33-.18.11-.06.21-.13.32-.19.11-.07.21-.13.31-.2.1-.07.2-.14.3-.21.1-.07.2-.15.3-.23.1-.08.19-.16.29-.24.09-.08.19-.16.28-.25.09-.08.18-.17.27-.26.09-.09.17-.18.26-.27.08-.09.17-.18.25-.28.08-.09.16-.19.24-.29.08-.1.15-.19.23-.29.07-.1.15-.2.22-.3s.14-.21.21-.31c.07-.1.13-.21.19-.32.06-.11.12-.22.18-.32s.12-.22.17-.33c.05-.11.11-.22.16-.34.05-.11.1-.23.14-.34h-12.43c-2.71,0-4.43-.43-4.43-2.14,0-2.14,4.71-6.86,14.57-8.43-6.57,2.2-9.86,4.53-9.86,7,0,3.11,7.56,2.86,12.15,3.55Z" fill-rule="evenodd"/>'},counter:{d:'<circle cx="16.2" cy="3.33" r="1.33"/><path d="M19.27,6.84v6.11c0,.32-.25.58-.56.58h0c-.31,0-.56-.26-.56-.58v-5.6c0-.06-.04-.1-.1-.1h0c-.06,0-.1.05-.1.1v13.85c0,.44-.35.8-.78.8-.22,0-.41-.09-.55-.24-.14-.14-.23-.35-.23-.57v-8.11c0-.12-.09-.21-.2-.21s-.2.09-.2.21v8.11c0,.44-.35.8-.78.8-.22,0-.41-.09-.55-.24-.14-.14-.23-.35-.23-.57V7.35c0-.06-.04-.1-.1-.1s-.1.05-.1.1v5.6c0,.32-.25.58-.56.58-.15,0-.29-.06-.4-.17-.1-.11-.16-.25-.16-.41v-6.11c0-.98.77-1.77,1.71-1.77h2.72c.95,0,1.71.79,1.71,1.77Z"/><ellipse cx="6.8" cy="3.36" rx="1.33" ry="1.36"/><path d="M9.88,6.84v3.44h-1.12v-2.93c0-.06-.04-.1-.1-.1-.06,0-.1.05-.1.1v2.93h-3.51v-2.93c0-.06-.04-.1-.1-.1s-.1.05-.1.1v2.93h-1.12v-3.44c0-.98.77-1.77,1.72-1.77h2.72c.94,0,1.71.79,1.71,1.77Z"/><rect x="1.5" y="11.16" width="10.72" height="1.43"/><rect x="20.17" y="11.16" width="2.33" height="1.43"/>'},crh:{d:'<path d="M7.75,19.92h-1.41c-.06,0-.11.02-.15.06l-1.87,2.02h2.21c.07,0,.14-.04.18-.11l1.04-1.97Z"/><path d="M16.25,19.92h1.41c.06,0,.11.02.15.06l1.87,2.02h-2.21c-.07,0-.14-.04-.18-.11l-1.04-1.97Z"/><path d="M16.51,2.7c-.12-.08-.27-.12-.42-.12h-.65c-.1,0-.2-.02-.3-.06-.38-.16-.72-.32-1.37-.41-.59-.08-1.15-.11-1.78-.11s-1.2.03-1.78.11c-.65.09-.99.25-1.37.41-.09.04-.2.06-.3.06h-.65c-.15,0-.29.04-.42.12-.09.06-.17.11-.25.17.7.89.88,2.02,1.04,3.05v.09c.19,1.01.36,1.93.6,3.09l.02.09c.08.36.16.74.31,1.04h0c.33.67,1.29.72,2.49.71.1,0,.19,0,.28,0s.19,0,.28,0c1.21,0,2.16-.04,2.49-.7h0c.16-.31.24-.68.31-1.05l.02-.09c.24-1.16.41-2.08.59-3.09v-.09c.18-1.03.36-2.16,1.06-3.05-.08-.06-.16-.12-.25-.17Z"/><path d="M15.74,10.66c-.6,1.18-2.06,1.27-3.16,1.27-.11,0-.21,0-.3,0-.09,0-.19,0-.28,0s-.18,0-.28,0c-.1,0-.2,0-.3,0-1.1,0-2.57-.09-3.16-1.27-.17-.59-.5-1.76-.67-2.64-.02-.09-.09-.46-.18-.93-.07-.38-.13-.7-.17-.93v-.09c-.16-.94-.31-1.84-.79-2.52,0,0,0,0-.01.01-.35.35-1.02,1.03-1.28,2.05-.06.22-.07.46-.11.93-.03.41-.04.73-.05,1.28-.02,1.52,0,1.44-.02,1.68-.04.43-.16,1.03-.51,1.74-.11.19-.22.44-.31.74-.1.33-.13.62-.13.85,0,.09-.01.18-.02.28-.06,1.27.16,2.45.52,3.52,0,0,.51,1.37,1.36,2.11.17.14.35.23.35.23,0,0,.23.11.51.16.36.06,2.35.23,5.25.23s4.88-.18,5.25-.23c.28-.04.51-.16.51-.16,0,0,.19-.09.35-.23.85-.74,1.36-2.11,1.36-2.11.36-1.06.58-2.24.52-3.52,0-.09,0-.18-.02-.28,0-.23-.04-.52-.13-.85-.09-.3-.21-.55-.31-.74-.35-.72-.47-1.32-.51-1.74-.03-.25,0-.16-.02-1.68,0-.55-.02-.87-.05-1.28-.03-.48-.05-.72-.11-.93-.26-1.02-.93-1.7-1.28-2.05,0,0,0,0-.01-.01-.14.25-.35.65-.52,1.17-.21.67-.25,1.2-.26,1.35-.05.67-.28,1.95-1.03,4.59ZM14.45,16.91c-.76.32-1.54.31-2.42.31h-.06c-.87,0-1.66.01-2.42-.31-.81-.35-1.58-1.2-1.13-2.05.18-.35.45-.69.8-.92.72-.46,1.9-.53,2.78-.53.88,0,2.06.07,2.78.53.35.23.62.56.8.92.45.86-.32,1.7-1.13,2.05Z"/>'},dalian:{d:'<path d="M22,12.21c0-.07,0-.14,0-.21,0-.16,0-.33-.01-.49,0-.16-.02-.33-.04-.49-.02-.16-.04-.33-.06-.49-.02-.16-.05-.32-.08-.48-.03-.16-.07-.32-.11-.48-.04-.16-.08-.32-.13-.47-.05-.16-.1-.31-.15-.47-.06-.15-.11-.31-.18-.46-.06-.15-.13-.3-.2-.45s-.14-.29-.22-.44-.16-.29-.24-.43-.17-.28-.26-.41-.19-.27-.28-.4c-.1-.13-.2-.26-.3-.39s-.21-.25-.32-.37-.22-.24-.34-.36c-.12-.12-.23-.23-.36-.34-.12-.11-.25-.22-.37-.32-.13-.1-.26-.2-.39-.3s-.27-.19-.4-.28-.27-.18-.41-.26c-.14-.08-.28-.16-.43-.24-.14-.08-.29-.15-.44-.22-.15-.07-.3-.14-.45-.2-.15-.06-.3-.12-.46-.18-.15-.06-.31-.11-.47-.15-.16-.05-.31-.09-.47-.13-.16-.04-.32-.08-.48-.11s-.32-.06-.48-.08c-.16-.02-.32-.04-.49-.06-.16-.02-.33-.03-.49-.04-.16,0-.33-.01-.49-.01-.12,0-.25,0-.37,0-.12,0-.25.01-.37.02-.12,0-.25.02-.37.03-.12.01-.25.03-.37.05-.12.02-.25.04-.37.06-.12.02-.24.05-.37.08-.12.03-.24.06-.36.09-.12.03-.24.07-.36.1-.12.04-.24.08-.35.12-.12.04-.23.08-.35.13-.12.05-.23.09-.35.14-.11.05-.23.1-.34.16-.11.05-.22.11-.33.17-.11.06-.22.12-.33.18-.11.06-.21.13-.32.19s-.21.13-.31.2c-.1.07-.2.14-.3.22-.1.07-.2.15-.3.23-.1.08-.19.16-.29.24s-.19.16-.28.25-.18.17-.27.26c-.09.09-.17.18-.26.27-.08.09-.17.18-.25.28-.08.09-.16.19-.24.29-.08.1-.15.2-.23.3s-.15.2-.22.3c-.07.1-.14.21-.2.31-.07.11-.13.21-.19.32-.06.11-.12.22-.18.33-.06.11-.11.22-.17.33-.05.11-.11.23-.16.34-.05.11-.1.23-.14.35h5.65l.51-1.91c.07-.25.29-.42.54-.42h5.06c2.71,0,4.72,2.51,4.12,5.16l-.24,1.04h3.65ZM21.48,15.17c-.04.12-.08.25-.13.37s-.09.24-.15.36c-.05.12-.1.24-.16.36-.06.12-.11.23-.17.35-.06.12-.12.23-.19.34-.06.11-.13.22-.2.34-.07.11-.14.22-.21.33-.07.11-.15.21-.23.32-.08.1-.16.21-.24.31-.08.1-.16.2-.25.3-.09.1-.17.2-.26.29-.09.1-.18.19-.27.28-.09.09-.19.18-.28.27-.1.09-.19.17-.29.26-.1.08-.2.17-.3.25-.1.08-.21.16-.31.23-.11.08-.21.15-.32.22-.11.07-.22.14-.33.21s-.22.13-.34.2-.23.12-.34.18c-.12.06-.23.12-.35.17-.12.05-.24.11-.36.16-.12.05-.24.1-.36.14-.12.04-.25.09-.37.13-.12.04-.25.08-.37.11s-.25.07-.38.1c-.13.03-.25.06-.38.08-.13.03-.26.05-.38.07-.13.02-.26.04-.39.05s-.26.03-.39.04c-.13.01-.26.02-.39.02-.13,0-.26,0-.39,0-.16,0-.33,0-.49-.01-.16,0-.33-.02-.49-.04-.16-.02-.33-.04-.49-.06-.16-.02-.32-.05-.48-.08-.16-.03-.32-.07-.48-.11-.16-.04-.32-.08-.47-.13-.16-.05-.31-.1-.47-.15-.15-.06-.31-.11-.46-.18-.15-.06-.3-.13-.45-.2s-.29-.14-.44-.22-.29-.16-.43-.24-.28-.17-.41-.26-.27-.19-.4-.28c-.13-.1-.26-.2-.39-.3s-.25-.21-.37-.32-.24-.22-.36-.34c-.12-.12-.23-.23-.34-.36-.11-.12-.22-.25-.32-.37-.1-.13-.2-.26-.3-.39s-.19-.27-.28-.4-.18-.27-.26-.41c-.08-.14-.16-.28-.24-.43-.08-.14-.15-.29-.22-.44-.07-.15-.14-.3-.2-.45-.06-.15-.12-.3-.18-.46-.06-.15-.11-.31-.15-.47-.05-.16-.09-.31-.13-.47-.04-.16-.08-.32-.11-.48s-.06-.32-.08-.48c-.02-.16-.04-.32-.06-.49-.02-.16-.03-.33-.04-.49,0-.16-.01-.33-.01-.49,0-.24,0-.47.02-.7h5.53l-1.44,5.38c-.12.45.22.89.68.89h7.08c1.63,0,3.07-.96,3.72-2.39h3.89Z" fill-rule="evenodd"/><path d="M2.36,9.32h11.74c.85,0,1.46.82,1.21,1.63l-.71,2.38h7.3c-.04.28-.09.57-.15.85h-11.45l.91-3.34c.07-.27-.13-.53-.41-.53H2.14c.06-.33.13-.66.22-.99Z" fill-rule="evenodd"/>'},depart:{d:'<path d="M21.97,12.08l-2.14,1.98-1.02.95-1.01.93s-.1.06-.16.06h-1.61c-.07,0-.1-.08-.05-.13l.89-.83,1.21-1.12,1.09-1.01.26-.24h-7.33c-.05,0-.1-.05-.1-.1v-1.17c0-.05.04-.1.1-.1h7.33l-.26-.24-1.09-1.01-1.21-1.12-.89-.83s-.01-.13.05-.13h1.61c.06,0,.12.02.16.06l1.01.93,1.02.95,2.14,1.98s.04.11,0,.15Z"/><path d="M8,6c-3.31,0-6,2.69-6,6s2.69,6,6,6,6-2.69,6-6-2.69-6-6-6ZM8,16c-2.21,0-4-1.79-4-4s1.79-4,4-4,4,1.79,4,4-1.79,4-4,4Z"/><circle cx="8" cy="12" r="2"/>'},drunk:{d:'<path d="M4,16.9v-5.99c0-.88.68-1.59,1.52-1.59h1.9s2.03,0,2.03,0v10.56s1.35,0,1.35,0v-10.51c.4.29.87.48,1.37.57v9.94s1.35,0,1.35,0v-9.98c.46-.11,1-.31,1.37-.58v10.56h1.36s0-10.56,0-10.56h2.04v10.7c0,1.09-.85,1.98-1.91,1.98h-7.02c-1.05,0-1.99-.89-1.99-1.98v-1.53s-1.85,0-1.85,0c-.84,0-1.52-.71-1.52-1.59ZM5.97,17.06h.8c.33,0,.61-.27.61-.61v-5.15c0-.33-.27-.61-.61-.61h-.8c-.33,0-.61.27-.61.61v5.15c0,.33.27.61.61.61Z"/><path d="M11.61,3.26c.58-.7,1.32-.93,1.68-1.05,1.86-.58,5.63,0,6.52,2.34.46,1.22-.07,2.37-.1,2.43-.39.81-1.24,1.57-2.2,1.64-.79.06-.88-.42-1.74-.46-1.39-.07-1.67,1.13-2.95,1.13-1.2,0-1.44-1.05-2.81-1.01-.86.02-.97.44-1.65.36-1.04-.11-2.28-1.23-2.22-2.55.08-1.5,1.8-2.3,3.02-2.35.89-.03,1.57.34,1.9.55.08-.26.24-.65.55-1.03Z"/>'},elder:{d:'<path d="M15.05,3.22c0,.95.77,1.73,1.73,1.73.95,0,1.72-.77,1.72-1.72s-.77-1.73-1.72-1.73c-.95,0-1.73.77-1.73,1.72Z"/><path d="M16.85,11.88c.25,0,.54-.14.66-.4.13-.31,0-.71-.35-.91l-1.88-.84c-.07-.03-.11-.1-.11-.17v-3.55c0-.85-.69-1.54-1.54-1.54-1.22,0-2.62.66-4.24,2-2.14,1.78-2.96,3.81-3.18,4.45-.54,1.55-.71,2.54-.71,3.97h2.04v6.5c0,.61.5,1.1,1.11,1.1s1.11-.49,1.11-1.1v-6.5h1.96c0-1.35.03-2.33.5-4.11.21-.79.51-1.3.85-1.69.17-.19.48-.08.47.17v1.14c-.01.16.09.31.24.37.95.35,1.9.7,2.85,1.05.05.02.13.04.22.04Z"/><path d="M16.42,11.82c-.67,0-1.13.44-1.18.49-.47.47-.49,1.06-.49,1.18h.71c0-.53.43-.95.96-.95s.96.43.96.95v9.02h.71v-9.02c0-.14-.02-.6-.35-1.02-.33-.42-.76-.55-.89-.58-.21-.06-.38-.06-.43-.06Z"/>'},elevator:{d:'<rect x="2.5" y="2.48" width="2.35" height="19.04"/><path d="M16.77,5.87H7.23c-.6,0-1.09.49-1.09,1.09v10.07c0,.6.49,1.09,1.09,1.09h9.55c.6,0,1.09-.49,1.09-1.09V6.97c0-.6-.49-1.09-1.09-1.09ZM16.99,16.77c0,.26-.21.48-.48.48H7.49c-.26,0-.48-.21-.48-.48V7.23c0-.26.21-.48.48-.48h9.02c.26,0,.48.21.48.48v9.54Z"/><path d="M11.48,7.8c0,.37-.3.66-.66.66s-.66-.3-.66-.66.3-.66.66-.66.66.3.66.66Z"/><path d="M12.36,9.49v2.97c0,.16-.13.28-.28.28h0c-.15,0-.28-.13-.28-.28v-2.72s-.02-.05-.05-.05h0s-.05.02-.05.05v6.73c0,.22-.17.39-.39.39-.11,0-.21-.04-.28-.11-.07-.07-.11-.17-.11-.28v-3.94c0-.06-.05-.1-.1-.1s-.1.05-.1.1v3.94c0,.22-.17.39-.39.39-.11,0-.21-.04-.28-.11-.07-.07-.11-.17-.11-.28v-6.73s-.02-.05-.05-.05-.05.02-.05.05v2.72c0,.16-.13.28-.28.28-.08,0-.15-.03-.2-.08-.05-.05-.08-.12-.08-.2v-2.97c0-.48.39-.86.86-.86h1.37c.48,0,.86.39.86.86Z"/><path d="M15.62,8.42c0,.27-.22.5-.5.5s-.5-.22-.5-.5.22-.5.5-.5.5.22.5.5Z"/><path d="M15.62,9.78c0,.27-.22.5-.5.5s-.5-.22-.5-.5.22-.5.5-.5.5.22.5.5Z"/><path d="M15.62,11.15c0,.27-.22.5-.5.5s-.5-.22-.5-.5.22-.5.5-.5.5.22.5.5Z"/><polygon points="13.42 3.52 13.41 4.84 12.44 3.79 12.43 5.31 11.55 5.31 11.56 3.79 10.58 4.84 10.58 3.52 12 2 13.42 3.52"/><polygon points="13.42 20.48 13.41 19.16 12.44 20.21 12.43 18.69 11.55 18.69 11.56 20.21 10.58 19.16 10.58 20.48 12 22 13.42 20.48"/><rect x="19.15" y="2.48" width="2.35" height="19.04"/>'},escalator:{d:'<path d="M19.4,5.96h-2.43c-.79,0-1.55.31-2.11.87l-3.06,3.06-.2.2v-2.63c0-.35-.14-.67-.37-.9-.23-.23-.55-.37-.9-.37-.7,0-1.27.57-1.27,1.28v5.18l-2.48,2.48c-.11.11-.26.17-.41.17h-1.56c-1.44,0-2.6,1.16-2.6,2.6,0,.72.29,1.37.76,1.84.47.47,1.12.76,1.84.76h2.42c.79,0,1.54-.31,2.1-.87l3.07-3.07,5.23-5.23c.11-.11.25-.17.41-.17h1.57c1.44,0,2.6-1.16,2.6-2.6s-1.16-2.6-2.6-2.6ZM19.4,9.96h-1.57c-.48,0-.92.18-1.26.52l-8.3,8.3c-.34.34-.78.52-1.25.52h-2.42c-.77,0-1.4-.62-1.4-1.4s.63-1.39,1.4-1.39h1.56c.48,0,.92-.19,1.26-.52l1.63-1.63,2.55-2.55,1.05-1.05,3.06-3.07c.34-.33.78-.52,1.26-.52h2.43c.77,0,1.4.63,1.4,1.4s-.63,1.4-1.4,1.4Z"/><path d="M10.33,5.89c.66,0,1.2-.54,1.2-1.2s-.54-1.2-1.2-1.2-1.2.54-1.2,1.2.54,1.2,1.2,1.2Z"/>'},escdown:{d:'<path d="M19.14,4.47h-2.43c-.79,0-1.55.31-2.11.87l-3.06,3.06-.2.2v-2.63c0-.35-.14-.67-.37-.9-.23-.23-.55-.37-.9-.37-.7,0-1.27.57-1.27,1.28v5.18l-2.48,2.48c-.11.11-.26.17-.41.17h-1.56c-1.44,0-2.6,1.16-2.6,2.6,0,.72.29,1.37.76,1.84.47.47,1.12.76,1.84.76h2.42c.79,0,1.54-.31,2.1-.87l3.07-3.07,5.23-5.23c.11-.11.25-.17.41-.17h1.57c1.44,0,2.6-1.16,2.6-2.6s-1.16-2.6-2.6-2.6ZM19.14,8.47h-1.57c-.48,0-.92.18-1.26.52l-8.3,8.3c-.34.34-.78.52-1.25.52h-2.42c-.77,0-1.4-.62-1.4-1.4s.63-1.39,1.4-1.39h1.56c.48,0,.92-.19,1.26-.52l1.63-1.63,2.55-2.55,1.05-1.05,3.06-3.07c.34-.33.78-.52,1.26-.52h2.43c.77,0,1.4.63,1.4,1.4s-.63,1.4-1.4,1.4Z"/><path d="M10.07,4.4c.66,0,1.2-.54,1.2-1.2s-.54-1.2-1.2-1.2-1.2.54-1.2,1.2.54,1.2,1.2,1.2Z"/><path d="M21.74,15.99v1.62c0,.06-.02.12-.07.17l-3.86,4.19s-.11.04-.15,0l-3.86-4.19s-.07-.11-.07-.17v-1.62c0-.07.08-.1.13-.05l3.19,3.46v-6.3c0-.06.04-.1.1-.1h1.17c.05,0,.1.04.1.1v6.3s3.19-3.46,3.19-3.46c.05-.05.13-.02.13.05Z"/>'},escup:{d:'<path d="M19.4,4.47h-2.43c-.79,0-1.55.31-2.11.87l-3.06,3.06-.2.2v-2.63c0-.35-.14-.67-.37-.9-.23-.23-.55-.37-.9-.37-.7,0-1.27.57-1.27,1.28v5.18l-2.48,2.48c-.11.11-.26.17-.41.17h-1.56c-1.44,0-2.6,1.16-2.6,2.6,0,.72.29,1.37.76,1.84.47.47,1.12.76,1.84.76h2.42c.79,0,1.54-.31,2.1-.87l3.07-3.07,5.23-5.23c.11-.11.25-.17.41-.17h1.57c1.44,0,2.6-1.16,2.6-2.6s-1.16-2.6-2.6-2.6ZM19.4,8.47h-1.57c-.48,0-.92.18-1.26.52l-8.3,8.3c-.34.34-.78.52-1.25.52h-2.42c-.77,0-1.4-.62-1.4-1.4s.63-1.39,1.4-1.39h1.56c.48,0,.92-.19,1.26-.52l1.63-1.63,2.55-2.55,1.05-1.05,3.06-3.07c.34-.33.78-.52,1.26-.52h2.43c.77,0,1.4.63,1.4,1.4s-.63,1.4-1.4,1.4Z"/><path d="M10.33,4.4c.66,0,1.2-.54,1.2-1.2s-.54-1.2-1.2-1.2-1.2.54-1.2,1.2.54,1.2,1.2,1.2Z"/><path d="M14,19.01v-1.62c0-.06.02-.12.07-.17l3.86-4.19s.11-.04.15,0l3.86,4.19s.07.11.07.17v1.62c0,.07-.08.1-.13.05l-3.19-3.46v6.3c0,.06-.04.1-.1.1h-1.17c-.05,0-.1-.04-.1-.1v-6.3l-3.19,3.46c-.05.05-.13.02-.13-.05Z"/>'},fuzhou:{d:'<path d="M12.29,3.5c.28.05.56.08.83.15,2.08.54,3.38,1.86,3.88,3.95.05.22.07.45.09.68.02.31.01.31.33.34,1.08.11,2.03.51,2.84,1.24,1.41,1.27,1.99,2.87,1.65,4.73-.33,1.86-1.43,3.14-3.18,3.85-.94.38-1.92.44-2.91.23-.14-.03-.2-.08-.21-.24-.02-.49-.07-.99-.11-1.52.1.03.17.04.24.07,2.1.71,4.29-.62,4.62-2.8.28-1.91-1.08-3.72-2.98-3.96-.69-.09-1.37-.02-2.04.13-.03,0-.05,0-.11.02.01-.07.02-.12.03-.18.08-.39.18-.78.24-1.18.09-.55-.08-1.06-.34-1.54-.37-.69-.85-1.28-1.48-1.76-.9-.68-1.87-.76-2.9-.37-.72.28-1.3.76-1.69,1.37-.45.7-.65,1.56-.51,2.45.05.33.14.65.21.98.01.06.03.13.04.22-.18-.04-.34-.07-.49-.09-.85-.12-1.7-.16-2.52.17-1.26.51-2.13,1.77-2.17,3.12-.05,1.65,1.09,3.17,2.77,3.53.59.12,1.18.1,1.76-.08.11-.03.21-.07.33-.1,0,.2,0,.38,0,.56-.02.34-.04.68-.09,1.02,0,.07-.12.15-.2.17-.8.18-1.59.17-2.38-.06-1.93-.56-3.17-1.82-3.66-3.76-.71-2.79,1.2-5.69,4.05-6.18.17-.03.35-.06.52-.07.14,0,.18-.06.19-.2.05-.95.32-1.83.86-2.62.9-1.31,2.14-2.06,3.73-2.24.08,0,.16-.03.24-.05h.57Z"/><path d="M15.03,20.5c-.43-.19-.83-.36-1.23-.54-.18-.08-.35-.17-.54-.23-.18-.06-.23-.18-.24-.35-.04-.84-.08-1.69-.13-2.53-.08-1.48-.16-2.96-.25-4.44-.05-.94-.11-1.87-.16-2.81,0-.15-.03-.31-.05-.5-.1.08-.18.13-.25.2-.11.11-.22.14-.35.01-.07-.07-.17-.12-.3-.22-.03.37-.06.7-.08,1.03-.08,1.43-.16,2.87-.24,4.3-.06,1.1-.11,2.2-.17,3.29-.03.59-.07,1.18-.11,1.77,0,.07-.05.17-.1.19-.61.28-1.22.54-1.85.82,0-.22-.01-.43,0-.64.06-.73.12-1.45.19-2.18.08-.84.16-1.68.25-2.52.1-.89.22-1.78.35-2.67.18-1.14.36-2.27.79-3.35.07-.17.17-.34.27-.49.13-.21.33-.29.58-.29.18,0,.28.11.38.22.12.14.21.16.35.01.36-.36.76-.34,1,.11.24.44.42.91.55,1.39.38,1.39.58,2.82.74,4.25.14,1.22.27,2.45.39,3.68.07.75.12,1.51.17,2.26,0,.06,0,.13,0,.22h0Z"/>'},hefei:{d:'<path d="M16.78,12.11c-.05-.23-.14-.45-.26-.65-.06-.11-.14-.22-.23-.32-.18-.21-.4-.38-.64-.52-.14-.07-.28-.13-.43-.19-.08-.03-.16-.05-.24-.07-.17-.05-.34-.07-.51-.07h-3.36c-.52,0-1.04,0-1.56,0-.14,0-.27,0-.41.03-.28.05-.55.14-.8.27-.17.09-.33.21-.48.34-.11.09-.21.2-.29.32-.1.13-.18.27-.25.41-.03.07-.06.15-.09.22-.06.18-.1.36-.11.55-.02.16,0,.31,0,.47v4.23c0,.1,0,.2.02.29.02.15.05.29.09.44.04.12.09.24.15.35.09.19.22.36.36.5.08.09.17.17.27.24.07.04.13.1.21.14.16.1.34.18.51.24.14.05.29.09.44.1.24.02.48.03.72.03.83,0,1.66,0,2.49,0h2.02c.41,0,.82-.1,1.18-.29.11-.06.23-.14.33-.21.12-.08.22-.17.31-.28.07-.08.14-.16.2-.24.02-.02.03-.04.05-.07.04-.08.09-.16.13-.25.07-.13.12-.27.15-.41,0-.02,0-.03.01-.04.03-.1.05-.2.05-.31,0-.1,0-.19,0-.29v-3.96c0-.23,0-.46,0-.68,0-.11-.01-.22-.04-.32ZM9.68,18.15c-.15.25-.42.39-.71.37-.05,0-.1,0-.14,0-.06,0-.12-.03-.17-.06-.01-.01-.03-.02-.05-.03-.15-.07-.27-.19-.34-.34-.09-.18-.1-.39-.02-.57.07-.19.23-.35.42-.42.25-.11.55-.08.77.08.12.08.22.2.28.34.09.21.07.45-.05.64h0ZM11.97,16.51h-2.37s-.09,0-.14,0c-.08,0-.16-.03-.22-.1,0,0-.01-.01-.02-.01-.14-.09-.21-.25-.17-.41.02-.18.03-.36.05-.54.01-.15.03-.3.04-.44s.03-.31.04-.46c.02-.28.05-.57.07-.85l.06-.68c.02-.27.14-.53.32-.73.18-.21.43-.35.71-.39.1-.01.2-.02.3-.01h2.72c.29,0,.57.08.8.26.17.13.3.3.38.5.06.15.1.32.1.48.02.26.05.52.07.79s.04.53.06.79.04.55.07.82c.01.18.03.37.04.55,0,.14-.07.26-.18.34-.1.07-.23.11-.36.1h-2.39ZM15.7,18.01s-.02.06-.04.09c-.03.05-.06.09-.09.13,0,.01-.02.03-.03.04-.23.23-.57.31-.88.21-.13-.06-.24-.14-.34-.24-.11-.13-.17-.28-.18-.45,0-.1.02-.2.06-.29.15-.36.54-.55.92-.45.09.03.18.06.26.11.13.08.23.2.3.34.03.09.05.18.05.27,0,.08-.02.16-.03.23h0Z"/><path d="M18.86,18.91v-7.52c0-.15,0-.3-.02-.45-.02-.21-.06-.43-.12-.63-.04-.16-.1-.31-.16-.46-.05-.11-.1-.23-.17-.34s-.14-.21-.21-.31c-.1-.14-.2-.27-.32-.39-.1-.11-.21-.21-.32-.3-.15-.12-.32-.24-.48-.34-.06-.03-.12-.06-.18-.09-.13-.06-.25-.12-.38-.17-.09-.03-.17-.06-.26-.08-.28-.08-.58-.12-.87-.13h-6.76s-.08,0-.12,0c-.52.05-1.02.21-1.47.47-.08.05-.15.1-.23.15-.17.11-.33.23-.47.37-.09.1-.18.2-.27.3-.11.13-.22.27-.31.42-.08.13-.14.26-.2.39-.05.09-.09.19-.12.28-.05.17-.1.35-.14.52-.04.19-.06.39-.05.59v8.31h1.15v-7.87c0-.18,0-.36,0-.54.02-.36.13-.7.31-1.01.15-.27.36-.51.6-.7.11-.07.2-.15.31-.22.14-.08.28-.14.43-.19.18-.07.38-.11.57-.12.21-.01.43-.02.64-.02h2.7c1.09,0,2.18,0,3.26,0,.19,0,.39.02.57.06.44.09.85.3,1.17.62.04.04.08.09.12.13.11.11.21.24.29.38.24.41.37.88.36,1.35,0,.19,0,.39,0,.58v7.45s0,.01,0,.02v.07h1.16v-.56h0s0-.02,0-.03Z"/><path d="M22,14.83v-4.2c0-.29-.04-.57-.1-.86-.04-.17-.08-.33-.13-.49-.06-.19-.12-.37-.19-.56-.06-.16-.14-.3-.21-.46-.02-.04-.04-.07-.06-.11-.03-.06-.06-.13-.1-.19-.05-.08-.1-.16-.15-.24s-.1-.18-.16-.26c-.11-.15-.22-.29-.33-.43-.11-.14-.22-.27-.35-.39-.14-.15-.29-.28-.44-.42-.1-.09-.2-.17-.3-.25-.12-.09-.25-.18-.38-.27-.18-.13-.36-.24-.55-.35-.26-.14-.53-.26-.81-.37-.16-.06-.32-.11-.49-.16-.14-.04-.28-.08-.42-.11-.16-.04-.33-.08-.5-.11-.18-.03-.36-.05-.54-.07-.16-.02-.32-.04-.48-.04-.3,0-.6,0-.91,0h-5.89c-.23.02-.46.04-.69.07-.24.04-.47.08-.71.14-.11.03-.21.06-.31.09s-.21.06-.31.1c-.17.07-.35.14-.52.22s-.33.16-.5.25c-.17.09-.34.2-.5.31-.04.03-.08.05-.11.07-.12.09-.25.19-.37.28-.11.09-.21.18-.31.27-.03.03-.06.06-.09.09-.15.15-.3.3-.45.45-.08.09-.16.19-.23.29-.07.1-.14.19-.22.29-.06.08-.12.16-.17.25-.06.1-.12.2-.18.3-.15.26-.28.53-.39.81-.03.08-.05.16-.09.23-.08.19-.14.38-.18.58-.06.23-.09.46-.13.69-.03.17-.03.35-.05.52-.02.13-.02.26-.02.39,0,.81.01,1.62.01,2.44v5.85h2.32v-8.22c0-.24.02-.47.05-.7.01-.08.03-.16.05-.25.05-.23.12-.45.2-.67.05-.11.09-.23.14-.35.23-.45.53-.87.89-1.22.15-.16.32-.3.51-.42.07-.05.15-.11.22-.16.14-.09.29-.17.44-.25.13-.06.25-.11.38-.16.09-.04.19-.07.28-.1.02,0,.05-.02.07-.02.1-.02.2-.05.3-.07.04,0,.07-.01.11-.02.06,0,.13-.01.19-.02.14-.03.29-.04.43-.04.48,0,.97,0,1.45,0h5.14c.28,0,.55.02.83.06.06,0,.11.01.16.03.17.04.33.08.5.14.12.05.24.09.36.14.12.05.23.11.34.17.1.05.2.1.29.16.24.15.46.33.67.52.07.06.13.12.19.19.13.14.24.29.35.44.07.1.15.19.21.3.03.07.07.13.11.2.06.11.12.23.17.35s.1.25.14.38.07.24.1.36c.02.06.04.12.05.18.02.09.02.19.04.28.03.19.05.39.04.59v8.2h2.25v-4.67.02Z"/>'},light:{d:'<path d="M12,2c4.14,0,7.5,3.36,7.5,7.5,0,2.67-1.4,5.02-3.51,6.35.08,1.1-.74,2.06-1.84,2.14-.05,0-.1,0-.15,0h-4c-1.1,0-2-.9-2-2,0-.05,0-.1,0-.15-2.11-1.33-3.51-3.67-3.51-6.35,0-4.14,3.36-7.5,7.5-7.5ZM12.68,4.5c-.38-.01-.69.29-.7.66-.01.38.29.69.66.7.01,0,.02,0,.04,0,1.63,0,2.95,1.32,2.95,2.95-.01.38.29.69.66.7s.69-.29.7-.66c0-.01,0-.02,0-.04,0-2.38-1.93-4.32-4.32-4.32h0Z"/><path d="M13.58,20.5c.28,0,.5.22.5.5,0,.14-.06.27-.16.37-.46.42-1.1.63-1.91.63s-1.45-.21-1.91-.63c-.2-.19-.22-.5-.03-.71.09-.1.23-.16.37-.16h3.15Z"/><path d="M14.25,18.5c.41,0,.75.34.75.75s-.34.75-.75.75h-4.5c-.41,0-.75-.34-.75-.75s.34-.75.75-.75h4.5Z"/>'},luggage:{d:'<path d="M20.88,18.5l-4-5.72c-.21-.31-.63-.38-.93-.17l-1.86,1.29h0l-.44-.63c.14-.16.23-.36.23-.58,0-.07,0-.14-.02-.2l-.65-3.19c-.04-.21-.15-.4-.31-.55l-2.23-2.07c-.37-.37-.9-.61-1.48-.61-.74,0-1.39.38-1.74.94h0s-2.12,3.31-2.12,3.31c-.02.04-.05.07-.09.11l-2,2.05h0s-.01.02-.02.03c-.15.16-.22.38-.19.62.05.34.34.63.71.68.26.04.5-.03.68-.17l.08-.07h0s1.6-1.43,1.6-1.43l.74-.66c.07-.06.12-.12.17-.2l.38-.6.12,1.21c.02.22.03.45.03.67l-.02.78-1.85,3.47c-.08.12-.13.26-.15.4l-.5,3.43s0,.01,0,.01v.09s-.02.05-.02.07c0,.49.43.89.95.89.5,0,.91-.35.95-.81l.47-2.99c.01-.06.04-.12.09-.17l1.62-2.31s.08-.02.1.02l.66,2.35s.03.07.05.11l2.23,3.57s0,.01,0,.01l.06.09c.17.24.46.4.79.4.53,0,.95-.4.95-.89,0-.18-.05-.34-.15-.48l-1.94-3.16c-.04-.07-.07-.14-.09-.22l-.65-3.71.07-1.24c0-.14,0-.27-.02-.4l-.28-2.32.21.11c.09.05.15.13.17.22l.64,2.93h0s.02.08.02.08c.1.42.51.73.99.73,0,0,.01,0,.02,0l.52.75,4.05,5.79c-.15.19-.25.43-.25.7,0,.61.5,1.11,1.12,1.11s1.12-.5,1.12-1.11c0-.18-.04-.34-.11-.48l1.38-.97c.31-.21.38-.63.17-.93ZM18.32,21.27c-.21,0-.39-.18-.39-.39s.18-.39.39-.39.39.18.39.39-.18.39-.39.39Z"/><circle cx="8.88" cy="3.82" r="1.82"/>'},monorail:{d:'<path d="M8.06,5.26h3.02v4.73h-3.64s-.06-.5.14-2.21c.18-1.53.48-2.51.48-2.51Z"/><path d="M15.94,5.26h-3.02v4.73h3.64s.06-.5-.14-2.21c-.18-1.53-.48-2.51-.48-2.51Z"/><path d="M18.99,7.68c-.09-1-.25-4.03-2.55-5.38-1.24-.73-3.89-.79-4.44-.79s-3.2.07-4.44.79c-2.3,1.35-2.46,4.38-2.55,5.38-.15,1.63-.47,5.75-.06,7.14.09.29.26.61.56.88.21.19.34.44.34.72v1.74c0,.59.48,1.07,1.07,1.07h.04c.3,0,.54-.24.54-.53v-1.21c0-.59.48-1.07,1.07-1.07h6.87c.59,0,1.07.48,1.07,1.07v1.21c0,.29.24.53.54.53h.04c.59,0,1.07-.48,1.07-1.07v-1.74c0-.28.13-.53.34-.72.3-.27.47-.59.56-.88.41-1.4.08-5.51-.06-7.14ZM17.72,13.48c-.16.56-.72,1.25-1.98,1.25h-7.48c-1.26,0-1.82-.7-1.98-1.25-.05-.18-.09-.42-.11-.69-.05-.55.38-1.02.93-1.02h9.8c.55,0,.98.47.93,1.02-.03.28-.06.51-.11.69ZM16.91,11.19H7.09c-.53,0-.96-.44-.94-.97.05-1.04.13-2.05.18-2.65.08-.82.2-3.33,2.07-4.45,1.01-.6,3.16-.66,3.6-.66s2.59.06,3.6.66c1.87,1.12,1.99,3.63,2.06,4.45.05.6.14,1.61.18,2.65.02.53-.4.97-.94.97Z"/><path d="M9.26,13.25c0,.48-.4.88-.88.88s-.88-.39-.88-.88.4-.88.88-.88.88.39.88.88Z"/><path d="M16.51,13.25c0,.48-.4.88-.88.88s-.88-.39-.88-.88.4-.88.88-.88.88.39.88.88Z"/><rect x="8.24" y="17.21" width="7.52" height="5.29" rx=".38" ry=".38"/>'},noentry:{d:'<path d="M15.55,18.19l-1.43-2.37c-.03-.05-.05-.11-.06-.17l-.48-2.79.05-.93c0-.1,0-.2-.01-.3l-.2-1.74.15.09c.06.04.11.1.12.16l.47,2.2h0s.01.06.01.06c.08.31.37.55.72.55.41,0,.74-.32.74-.71,0-.05,0-.1-.02-.15l-.48-2.39c-.03-.16-.11-.3-.23-.41l-1.64-1.55c-.27-.28-.66-.46-1.09-.46-.55,0-1.02.28-1.28.7h0s-1.56,2.48-1.56,2.48c-.02.03-.04.06-.06.08l-1.47,1.54h0s0,.01-.01.02c-.11.12-.16.29-.14.47.04.26.25.47.52.51.19.03.37-.03.5-.13l.06-.05h0s1.17-1.07,1.17-1.07l.54-.49s.09-.09.12-.15l.28-.45.09.91c.02.17.02.33.02.5v.59s-1.37,2.61-1.37,2.61c-.06.09-.1.19-.11.3l-.37,2.57s0,0,0,0v.07s-.01.04-.01.06c0,.37.31.67.7.67.36,0,.66-.27.7-.61l.34-2.24s.03-.09.06-.13l1.19-1.73s.06-.02.07.01l.48,1.77s.02.06.04.08l1.63,2.67s0,.01,0,.01l.04.07c.12.18.34.3.58.3.39,0,.7-.3.7-.67,0-.13-.04-.25-.11-.36Z"/><path d="M11.97,4.22c-.75,0-1.36.61-1.36,1.36,0,.75.61,1.36,1.36,1.36s1.36-.61,1.36-1.36c0-.75-.61-1.36-1.36-1.36Z"/><path d="M12,2C6.49,2,2,6.49,2,12s4.49,10,10,10,10-4.49,10-10S17.51,2,12,2ZM9.2,19.91c-2.37-.81-4.28-2.71-5.1-5.08-.97-2.82-.43-5.78,1.29-7.98.07-.1.22-.1.31-.02l11.47,11.47c.09.09.08.23-.02.31-2.19,1.71-5.14,2.26-7.95,1.3ZM18.31,17.17L6.83,5.69c-.09-.09-.08-.23.02-.31,2.19-1.71,5.13-2.26,7.94-1.3,2.37.8,4.29,2.7,5.11,5.07.98,2.82.44,5.79-1.28,8-.07.1-.22.1-.31.02Z"/>'},north:{d:'<path d="M17,17.17c0-2.58-1.97-4.71-4.48-4.97l-.52-2.3-.52,2.3c-2.52.26-4.49,2.39-4.49,4.97,0,1.81.97,3.4,2.42,4.28l-.34,1.55,1.13-1.17c.56.22,1.16.33,1.8.33s1.24-.12,1.8-.33l1.13,1.17-.34-1.55c1.45-.88,2.42-2.47,2.42-4.28ZM9.48,21.17c-1.33-.84-2.21-2.32-2.21-4,0-2.41,1.82-4.41,4.15-4.69l-1.94,8.69h0ZM12,21.9c-.56,0-1.1-.1-1.59-.28l1.59-1.65,1.59,1.65c-.5.18-1.03.28-1.59.28ZM14.52,21.17l-1.94-8.69c2.33.29,4.15,2.28,4.15,4.69,0,1.68-.88,3.16-2.21,4h0Z"/><path d="M6,9.6v-2.51h.49l1.02,1.68v-1.68h.47v2.51h-.51l-1-1.64v1.64s-.47,0-.47,0Z"/><path d="M8.44,8.36c0-.26.04-.47.11-.64.06-.13.13-.24.23-.34s.21-.18.32-.23c.16-.07.33-.1.54-.1.37,0,.66.11.88.34s.33.55.33.96-.11.72-.33.95-.51.34-.88.34-.67-.11-.88-.34-.33-.54-.33-.94h0ZM8.96,8.35c0,.28.07.5.19.65s.29.22.5.22.37-.07.49-.22.19-.37.19-.65-.06-.5-.19-.64c-.13-.14-.29-.21-.5-.21s-.38.07-.5.21-.19.36-.19.65h0Z"/><path d="M11.29,9.6v-2.51h1.06c.27,0,.46.02.58.07s.22.12.29.24c.07.12.11.25.11.39,0,.19-.06.34-.17.47s-.27.2-.49.23c.11.06.2.14.27.21s.17.21.29.41l.31.49h-.6l-.36-.55c-.13-.2-.22-.32-.27-.37s-.1-.08-.15-.1c-.05-.02-.14-.03-.25-.03h-.1v1.05h-.51,0ZM11.8,8.16h.37c.24,0,.39-.01.45-.03.06-.02.11-.06.14-.11.03-.05.05-.11.05-.19,0-.08-.02-.15-.07-.2-.04-.05-.11-.08-.19-.1-.04,0-.16,0-.37,0h-.39v.64h0Z"/><path d="M14.4,9.6v-2.09h-.74v-.42h1.98v.42h-.74v2.09h-.51Z"/><path d="M16.01,9.6v-2.51h.51v.99h.99v-.99h.5v2.51h-.5v-1.1h-.99v1.1h-.51Z"/><path d="M10.77,4.78v-1.7h-1.57v-.61h1.57v-1.47h.62v5.8h-.62v-1.4c-.53.23-1.07.46-1.51.64l-.27-.61c.45-.15,1.11-.4,1.77-.65h0ZM12.96,3.69v2.03c0,.35.04.41.3.41h.81c.28,0,.32-.28.36-1.33.15.11.41.24.58.28-.07,1.2-.22,1.64-.88,1.64h-.94c-.65,0-.85-.23-.85-1.01V1h.62v2.05c.54-.33,1.07-.74,1.45-1.08l.44.54c-.54.41-1.23.82-1.88,1.17Z"/>'},plane:{d:'<path d="M21,16.5v-2.25l-7.68-5.13v-4.88c0-.97-.53-2.25-1.32-2.25s-1.32,1.28-1.32,2.25v4.88l-7.68,5.13v2.25l7.68-3.63v5.45l-2.65,2.17v1.5l3.97-1.5,3.97,1.5v-1.5l-2.65-2.17v-5.45l7.68,3.63h0Z"/>'},police:{d:'<path d="M15.81,8.65l-6.73,9.19h6.75v.9h-7.7v-1.12l.42-.57,6.15-8.4H6.71c-.25,0-.46.21-.46.46v10.97c0,.58.46,1.05,1.03,1.05h.28v.58c0,.16.13.29.28.29h8.31c.16,0,.28-.13.28-.29v-.58h.28c.57,0,1.03-.47,1.03-1.05v-10.97c0-.26-.2-.46-.46-.46h-1.48Z"/><polygon points="9.42 3.66 11.09 3.66 12.73 3.66 14.4 3.66 14.72 3.66 16.36 2 14.4 2 12.73 2 11.09 2 9.42 2 7.75 2 9.38 3.66 9.42 3.66"/><path d="M9.45,4.53h-.07l-1.24,1.26h1.22c.2,1.31,1.32,2.31,2.67,2.31s2.46-1,2.67-2.31c.02-.14.03-.28.03-.42h0v-.84h-5.28Z"/>'},pregnant:{d:'<path d="M14.99,11.58c-.12-1.39-.98-2.39-1.97-2.56-.27-.05-.47-.28-.48-.55l-.09-1.22c-.24-1.93-3.06-1.81-3.13.14l-.31,8.79h1.31v4.87c0,.53.42.95.93.95s.93-.42.93-.95v-4.87h1.35l-.13-1.1c-.03-.25.09-.49.31-.61.84-.43,1.38-1.58,1.28-2.89ZM13.55,11.66c-.17.34-.52.54-.89.54-.16,0-.33-.04-.47-.12l-1.43-.77-.64-.35c-.37-.2-.59-.6-.57-1.02l.03-.73.09-1.91c.02-.55.46-.98,1-.98.01,0,.03,0,.04,0,.27.01.52.13.7.33.18.2.27.47.26.74l-.1,2.03,1.55.84c.24.13.41.34.49.6.08.26.05.54-.08.78Z"/><path d="M13.3,10.98c-.05-.17-.17-.31-.32-.4l-1.63-.88c-.07-.04-.11-.11-.11-.19l.1-2.12v-.03c0-.36-.28-.65-.63-.67h0s0,0,0,0h-.02c-.35,0-.64.28-.66.64l-.09,1.91-.03.73c-.01.29.14.56.39.69l.64.34,1.43.77c.1.05.21.08.31.08.14,0,.26-.05.45-.18h.01s.01-.02.01-.02c.04-.05.08-.1.11-.16.08-.15.1-.34.05-.51Z"/><path d="M10.82,5.25c.9,0,1.62-.73,1.62-1.62s-.73-1.63-1.62-1.63-1.63.73-1.63,1.63.73,1.62,1.63,1.62Z"/>'},qingdao:{d:'<path d="M7.6,17.22s-.05-.01-.07-.03c-.19-.15-.37-.32-.55-.49-1.34-1.34-2.08-3.13-2.08-5.03s.74-3.69,2.08-5.03c1.34-1.34,3.12-2.08,5.02-2.08s3.68.74,5.02,2.08c1.34,1.34,2.08,3.13,2.08,5.03s-.74,3.69-2.08,5.03c-.17.17-.35.34-.54.49-.02.02-.05.03-.07.03-.06,0-.11-.05-.11-.11,0,0,0,0,0,0v-5.44c0-2.38-1.92-4.3-4.29-4.3s-4.29,1.93-4.29,4.3c0,.04,0,3.45,0,5.43,0,0,0,0,0,.01,0,.06-.05.11-.11.11M21.1,16.66s-.08.03-.1.07h0c-.23.59-.72,1.1-1.23,1.53-1.62,1.17-4,1.67-7.44.55-1.4-.46-2.62-.61-3.68-.56h0c-.06,0-.11-.05-.11-.11,0-.05.03-.09.08-.11.44-.17.93-.28,1.47-.32h0c.06,0,.1-.05.1-.11v-5.93h0c0-1.01.82-1.83,1.82-1.83s1.82.82,1.82,1.83h0v6.65c0,.05.04.1.09.11.44.12.93.2,1.09.21,1.56.13,2.81-.16,3.79-.67,1.02-.53,1.55-1.43,1.62-1.56.79-1.4,1.24-3.02,1.24-4.74,0-5.34-4.32-9.67-9.65-9.67S2.35,6.33,2.35,11.67c0,2.95,1.32,5.6,3.4,7.37-1.08.58-1.9,1.41-2.53,2.22,0,0,0,0,0,0-.02.02-.03.05-.03.08,0,.06.05.11.11.11.02,0,.04,0,.06-.02,0,0,0,0,0,0,1.17-.59,2.5-.93,3.91-.93,1.07,0,2.09.19,3.04.55.06.02.11.04.17.05,6.16,2.26,9.02-.25,10.14-2.36.41-.85.57-1.85.58-1.95,0,0,0-.02,0-.02,0-.06-.05-.11-.11-.11"/>'},railway:{d:'<path d="M8.88,17.25c-.5.61-1,1.22-1.5,1.83-.75-.44-1.41-.95-1.99-1.56-.81-.85-1.43-1.81-1.84-2.89-.43-1.13-.61-2.29-.54-3.49.06-1.07.31-2.09.75-3.06.58-1.27,1.43-2.35,2.55-3.23,1.08-.85,2.29-1.43,3.65-1.73.12-.03.17-.07.17-.2.03-.59.37-.91.98-.91.63,0,1.27,0,1.9,0,.49,0,.88.35.89.82,0,.19.05.27.26.32,1.93.47,3.55,1.46,4.81,2.95,1.17,1.39,1.84,2.98,1.99,4.77.18,2.16-.4,4.12-1.71,5.88-.65.87-1.46,1.59-2.4,2.18-.07.04-.13.08-.21,0-.48-.55-.97-1.09-1.45-1.63-.01-.01-.01-.03-.03-.06,2.25-1.33,3.47-3.26,3.43-5.84-.03-1.71-.72-3.19-1.99-4.38-2.71-2.55-7-2.38-9.48.26-1.44,1.53-2,3.36-1.65,5.4.35,2.03,1.53,3.54,3.4,4.58Z"/><path d="M5.76,20.81c.75-.12,1.49-.22,2.22-.36.65-.13,1.3-.27,1.94-.46.6-.17,1.06-.52,1.19-1.17.03-.14.02-.29.02-.44-.01-1.3-.03-2.59-.03-3.89,0-.37-.16-.63-.41-.87-.38-.38-.86-.57-1.37-.73-.16-.05-.31-.1-.47-.13-.11-.02-.15-.07-.15-.17,0-.51-.02-1.02,0-1.53.02-.35.28-.58.56-.77.38-.25.79-.39,1.28-.38,1.01.03,2.02,0,3.02,0,.49,0,.95.06,1.33.39.31.28.48.62.48,1.04,0,.42,0,.84,0,1.25,0,.16-.06.21-.2.25-.52.14-1.06.26-1.52.56-.4.27-.66.62-.65,1.13.02,1.31-.01,2.63,0,3.94,0,.73.39,1.35,1.38,1.58,1,.23,2,.42,3,.63.27.05.55.08.84.13v1.17c-.08,0-.16,0-.24,0-3.94,0-7.87,0-11.81,0-.44,0-.44,0-.44-.43,0-.23,0-.47,0-.7,0-.02,0-.04.02-.06Z"/>'},security:{d:'<path d="M13.16,6.55c0-.66-.54-1.2-1.2-1.2s-1.2.54-1.2,1.2.54,1.2,1.2,1.2,1.2-.54,1.2-1.2Z"/><path d="M13.18,8.05h-2.44c-.85,0-1.54.69-1.54,1.54v5.3c0,.14.06.26.15.36.09.09.22.15.36.15.27,0,.5-.23.5-.5v-4.86s.04-.09.09-.09c.05,0,.09.04.09.09v11.27c0,.19.08.37.21.49.12.13.3.2.49.2.39,0,.7-.31.7-.7v-6.29c0-.1.08-.18.18-.18s.18.08.18.18v6.29c0,.19.08.37.21.49.13.13.3.2.49.2.38,0,.7-.31.7-.7v-11.27s.04-.09.08-.09h0s.09.04.09.09v4.86c0,.28.22.5.5.5s.5-.23.5-.5v-5.3c0-.85-.69-1.54-1.54-1.54Z"/><polygon points="20.94 20.23 19.02 20.23 19.02 2 4.98 2 4.98 20.23 3.07 20.23 3 20.23 3 22 3.07 22 6.91 22 6.91 20.23 6.91 4.13 17.09 4.13 17.09 20.23 17.09 22 20.94 22 21 22 21 20.23 20.94 20.23"/>'},shanghai:{d:'<path d="M11.2,21.98c-1.74-.15-3.33-.71-4.74-1.65-1.4-.94-2.6-2.27-3.36-3.76l-.27-.53h3.49l.3.37c.78.95,1.97,1.75,3.17,2.15.81.27,1.18.32,2.19.32,1.05,0,1.37-.05,2.19-.32,1.49-.49,2.77-1.46,3.65-2.75.17-.25.64-1.14.64-1.21,0-.02-.51-.04-1.14-.04h-1.14l-.8-.89c-.44-.49-.86-.95-.93-1.03l-.12-.14-1.14,1.01c-.63.56-1.15,1.01-1.17,1.01s-.59-.45-1.28-1.01l-1.26-1.01-.09.1c-.05.06-.47.51-.93,1l-.84.9-1.6.03c-.88.01-2.07.03-2.65.03h-1.05l-.06-.27c-.12-.53-.19-1-.24-1.63-.13-1.76.25-3.6,1.06-5.21.5-.98,1.08-1.77,1.88-2.57.68-.67,1.31-1.15,2.16-1.63,1.41-.78,2.88-1.19,4.49-1.25,1.79-.06,3.42.3,4.95,1.09,2.66,1.38,4.56,3.85,5.2,6.77l.08.35h-1.55s-1.55-.02-1.55-.02l-.14-.42c-.79-2.34-2.89-4.14-5.37-4.59-.64-.12-1.73-.12-2.36-.02-1.94.32-3.69,1.46-4.74,3.08-.55.85-.89,1.73-1.04,2.75-.12.79-.2.7.62.7h.7l1.41-1.82c.77-1,1.43-1.82,1.45-1.82s.64.63,1.38,1.4c.74.77,1.36,1.4,1.38,1.4s.51-.63,1.09-1.4l1.05-1.4,1.6,1.83,1.6,1.83h2.3c2.2,0,2.3,0,2.33.08.03.09-.04,1.19-.1,1.6-.21,1.48-.8,3-1.65,4.22-.42.61-.67.91-1.23,1.47-1.56,1.55-3.54,2.52-5.71,2.81-.6.08-1.59.11-2.11.06h0Z"/>'},shenyang:{d:'<path d="M10.6,2h2.85c0,.2,0,.4,0,.6,1.4.21,2.74.74,3.91,1.53,1.51,1.02,2.72,2.48,3.44,4.17.15.34.27.69.38,1.05-.99,0-1.97,0-2.96,0-.46-1.08-1.21-2.05-2.14-2.76-.67-.51-1.42-.89-2.22-1.12-.11-.03-.26,0-.33.1-.06.1-.08.22-.07.34,0,1.15,0,2.29,0,3.44-.95,0-1.9,0-2.85,0,0-1.16,0-2.32,0-3.47,0-.12-.04-.23-.11-.33-.04-.04-.08-.09-.13-.11-.05,0-.1.02-.14.03-.87.25-1.69.67-2.39,1.25-1.21.98-2.07,2.38-2.39,3.91,1.38,0,2.76,0,4.13,0,.39,0,.77,0,1.16,0,.53,0,1.06,0,1.59,0,.43,0,.85,0,1.28,0,1.58,0,3.17,0,4.75,0,1,0,2,0,3,0,.22,0,.44,0,.66,0v2.76c-.17,0-.35,0-.52,0-.2,1.44-.72,2.82-1.53,4.02-1.5,2.23-3.85,3.73-6.49,4.13v.47h-2.85v-.46c-2.74-.4-5.17-1.98-6.67-4.32-.51-.79-.89-1.65-1.15-2.56.99,0,1.99,0,2.98,0,.47,1.18,1.26,2.23,2.27,2.98.64.48,1.37.85,2.14,1.07.1.02.21.07.3,0,.09-.1.14-.24.13-.37,0-1.23,0-2.46,0-3.68.95,0,1.9,0,2.85,0,0,1.23,0,2.46,0,3.68,0,.1,0,.21.06.3.06.09.18.12.28.1.17-.04.34-.1.5-.16,1.21-.44,2.28-1.23,3.06-2.26.66-.86,1.11-1.87,1.31-2.94h-4.88c-.13,0-.25,0-.38,0-.91,0-1.83,0-2.74,0-.11-.01-.22,0-.33,0h-4.44c-.18,0-.37,0-.55,0-.92,0-1.83,0-2.75,0-.2-.02-.39,0-.59,0v-2.76c.18,0,.35,0,.53,0,.24-1.61.9-3.14,1.89-4.42,1.52-1.96,3.73-3.26,6.18-3.62v-.59h0Z"/>'},speaker:{d:'<path d="M9.22,16.5v3.43c0,.87-.7,1.57-1.57,1.57h0c-.87,0-1.57-.7-1.57-1.57v-4.23c.11.01.25.04.4.08.16.04.31.07.47.11.18.04.4.08.64.12.24.06.45.11.65.16.19.05.36.11.52.16.17.06.32.12.46.17Z"/><path d="M16.88,3.47c.61-.58,1.16-.9,1.66-.96.5-.06.94.07,1.32.39.38.32.71.79.98,1.4.27.62.49,1.3.66,2.06.17.76.3,1.55.38,2.38.08.83.13,1.62.13,2.37s-.05,1.5-.16,2.25c-.11.75-.26,1.46-.47,2.12-.21.66-.45,1.24-.72,1.73-.28.5-.58.86-.92,1.11-.34.24-.7.33-1.09.26-.39-.07-.8-.35-1.22-.83-.41-.48-.97-.88-1.67-1.2-.7-.32-1.47-.59-2.3-.81-.83-.22-1.67-.4-2.52-.53-.85-.13-1.63-.26-2.34-.36s-1.3-.21-1.77-.31c-.47-.1-.74-.22-.8-.36v-6.65c.06-.2.28-.36.67-.49.39-.13.89-.25,1.49-.36.6-.11,1.28-.24,2.04-.37.76-.13,1.53-.32,2.32-.55.79-.23,1.56-.53,2.31-.89.75-.36,1.43-.83,2.04-1.39h0Z"/><path d="M2,8.95c0-.37.13-.68.39-.94.26-.26.58-.38.95-.38h1.34v5.97h-1.34c-.37,0-.68-.13-.95-.38-.26-.26-.39-.57-.39-.94v-3.34Z"/>'},stairs:{d:'<path d="M8.42,8.2c0,.45-.37.82-.82.82s-.82-.37-.82-.82.37-.82.82-.82.82.37.82.82Z"/><path d="M9.23,14.46l-1.31-1.31c-.06-.06-.07-.17-.01-.24l.49-.61c.15-.19.23-.43.23-.67v-1.51c0-.51-.41-.92-.92-.92h0c-.51,0-.92.41-.92.92v.35l-1.27,1.27c-.15.15-.15.38,0,.53h0c.15.15.38.15.53,0l.74-.74v5.08c0,.28.23.51.51.51h0c.28,0,.51-.23.51-.51v-2.31l.8.8c.18.18.46.18.64,0h0c.18-.18.18-.46,0-.64Z"/><path d="M13.98,3.32c0,.45-.37.82-.82.82s-.82-.37-.82-.82.37-.82.82-.82.82.37.82.82Z"/><path d="M14.55,9.03v.89c0,.25.2.46.46.46h0c.25,0,.46-.2.46-.46v-.5s0-.42,0-.42c0-.25-.1-.5-.28-.68l-.34-.34-.63-.63h0v-.81l.67.67c.15.15.38.15.53,0h0c.15-.15.15-.38,0-.53l-1.2-1.2v-.21c0-.54-.44-.97-.97-.97h0c-.54,0-.97.44-.97.97v2.4c0,.16.06.32.17.43h0c.11.12.17.27.17.43v3.09c0,.28.23.5.5.5h0c.28,0,.5-.23.5-.5v-3.3c0-.11.13-.16.2-.08l.71.71s.03.05.03.08Z"/><path d="M22,8.12h-4.39v2.43h-3.14v2.43h-3.14v2.43h-3.14v2.43h-3.14v2.43h-3.06v1.25h4.31v-2.43h3.14v-2.43h3.14v-2.43h3.14v-2.43c.75,0,2.4,0,3.14,0v-2.43h3.14v-1.25Z"/>'},stroller:{d:'<path d="M5.66,3.63c0,.9.73,1.63,1.63,1.63.9,0,1.63-.73,1.63-1.63,0-.9-.73-1.63-1.63-1.63s-1.63.73-1.63,1.63Z"/><path d="M17.15,13.48c0,.44-.24.82-.6,1.01l-1.5-1.55c.19-.36.56-.61.98-.61.61,0,1.11.51,1.11,1.15Z"/><path d="M21.86,19.35c-.09.09-.38.23-.8-.2l-2.3-2.37c.53-.22,1.17-.11,1.6.33l1.43,1.47c.23.24.29.53.06.76Z"/><path d="M11.93,10.46h.97c.41,0,.74-.37.67-.79-.05-.33-.37-.56-.7-.56h-3.39c-.07,0-.13-.05-.14-.12l-.27-1.72c-.28-1.82-2.85-1.94-3.31-.17l-2.17,8.31h1.05v.94c0,.11-.04.22-.11.3l-2.32,2.75c-.47.57-.12,1.55.93,1.47.11,0,.2-.07.27-.15l1.23-1.46,1.66-1.98c.07-.08.11-.19.11-.3v-1.58h.81v5.6c0,.49.4.89.89.89s.89-.4.89-.89v-5.6h1.35l-.75-4.79c-.01-.08.05-.16.14-.16h1.76c-.19.03-.35.12-.49.26l-.2.21c-.18.18-.28.43-.28.69v.61c0,.19.15.35.34.35s.34-.16.34-.35v-.61c0-.08.03-.15.08-.19l.2-.21c.1-.1.28-.1.38,0l2.01,2.08v5.6c0,.54.42.97.94.97h.42l-.28.82c-.34.02-.6.31-.6.66s.29.66.64.66.64-.3.64-.66c0-.19-.08-.37-.21-.49l.34-.99h2.51l-.28.82c-.34.02-.6.31-.6.66s.29.66.64.66.64-.3.64-.66c0-.19-.08-.37-.21-.49l.34-.99h.38c.52,0,.94-.43.94-.97v-.12l-7.79-8.05c-.14-.15-.34-.23-.53-.26h.13Z"/>'},toilet:{d:'<circle cx="5.64" cy="3.6" r="1.34"/><path d="M8.77,7.03v6.03c0,.32-.25.57-.57.57h0c-.31,0-.57-.25-.57-.57v-5.53c0-.06-.04-.1-.1-.1h0c-.06,0-.1.05-.1.1v13.67c0,.44-.35.79-.79.79-.22,0-.42-.09-.56-.23-.14-.14-.23-.34-.23-.56v-8.01c0-.12-.09-.21-.21-.21s-.21.09-.21.21v8.01c0,.44-.35.79-.79.79-.22,0-.42-.09-.56-.23-.14-.14-.23-.34-.23-.56V7.54c0-.06-.05-.1-.1-.1s-.1.05-.1.1v5.53c0,.31-.25.57-.57.57-.16,0-.3-.06-.4-.17-.1-.1-.17-.25-.17-.4v-6.03c0-.97.78-1.75,1.75-1.75h2.78c.97,0,1.75.78,1.75,1.75Z"/><circle cx="17.87" cy="3.6" r="1.34"/><path d="M21.29,15.89h-1.56s-.07.03-.07.07v5.25c0,.44-.35.79-.79.79-.22,0-.42-.09-.56-.23-.14-.14-.23-.34-.23-.56v-5.11c0-.12-.09-.21-.21-.21s-.21.09-.21.21v5.11c0,.44-.35.79-.79.79-.22,0-.42-.09-.56-.23-.14-.14-.23-.34-.23-.56v-5.25s-.03-.07-.07-.07h-1.56c-.15,0-.25-.15-.19-.29l2.09-5.03c.04-.09.06-.18.06-.28v-2.76c0-.06-.04-.1-.1-.1s-.1.04-.1.1v2.71c0,.08-.01.15-.04.22l-.54,1.3-.25.61c-.12.29-.45.43-.74.31-.22-.09-.35-.3-.35-.53,0-.07.01-.15.04-.22l.71-1.7c.03-.07.04-.14.04-.22v-2.99c0-.97.78-1.75,1.75-1.75h.11c.24.25.58.4.96.4s.72-.15.96-.4h.11c.97,0,1.75.78,1.75,1.75v2.99c0,.08.01.15.04.22l.71,1.71c.13.33-.06.71-.42.78-.27.05-.53-.11-.64-.36l-.22-.54-.56-1.36c-.03-.07-.04-.14-.04-.22v-2.71s-.03-.09-.08-.1c0,0-.01,0-.02,0s-.01,0-.02,0c-.05,0-.08.05-.08.1v2.76c0,.1.02.19.06.28l2.09,5.03c.06.14-.04.29-.19.29Z"/><rect x="11.21" y="2" width="1.08" height="20" rx=".54" ry=".54"/>'},tourist:{d:'<path d="M19.35,19v-2.05h-.85v-5.41c2.62-.13,3.5-1.92,3.5-1.92-2.75,0-4.75-2.69-5.12-3.21-.38-.64.38-.77.38-.77v-.64H6.75v.64s.75.13.38.77c-.38.64-2.38,3.21-5.13,3.21,0,0,.87,1.79,3.62,2.05v5.28h-.98v2.05h14.71ZM7.17,16.95v-5.15h2.36v5.15h-2.36ZM10.82,16.95v-5.15h2.36v5.15h-2.36ZM14.47,16.95v-5.15h2.36v5.15h-2.36Z"/>'},tram:{d:'<ellipse cx="9.62" cy="15.14" rx=".75" ry=".75"/><ellipse cx="14.38" cy="15.14" rx=".75" ry=".75"/><path d="M18.75,10.82c-.09-1.05-.24-4.23-2.46-5.64-.67-.43-1.76-.64-2.69-.74l3.13-2.07-1.6-.87h-6.25l-1.6.87,3.13,2.07c-.93.1-2.02.31-2.69.74-2.22,1.42-2.37,4.59-2.46,5.64-.14,1.71-.45,4.47-.06,5.94.19.71,1.56,3.14,3.05,3.14h7.51c1.5,0,2.87-2.43,3.05-3.14.39-1.47.08-4.23-.06-5.94ZM8.3,2.38l.8-.41h5.79l.8.42-3,1.98c-.32-.02-.57-.02-.7-.02s-.38,0-.7.02l-3-1.98ZM12.56,17.06h-1.11c-1.98,0-3.67-1.35-4.19-3.18h9.5c-.53,1.83-2.21,3.18-4.2,3.18ZM16.93,12.65c0,.16,0,.32-.03.48H7.1c-.02-.16-.03-.32-.03-.48v-2.48c0-.49.08-.97.23-1.41.59-1.74,2.22-3,4.14-3h1.11c2.4,0,4.37,1.98,4.37,4.41v2.48Z"/><polygon points="9.13 20.76 7.9 20.76 6.31 22.5 8.22 22.5 9.13 20.76"/><polygon points="14.87 20.76 16.1 20.76 17.69 22.5 15.78 22.5 14.87 20.76"/><path d="M15.76,10.16v2.05h-7.53v-2.05c0-.48.07-.95.21-1.38h7.11c.14.44.21.9.21,1.38Z"/>'},walk:{d:'<path d="M6,22.02c0,.54.47.98,1.05.98.36,0,.68-.17.87-.43l.06-.1s0-.01,0-.02l2.45-3.92s.04-.08.06-.12l.73-2.59s.08-.06.11-.02l1.78,2.54c.05.05.08.12.09.19l.51,3.29c.05.5.5.89,1.04.89.58,0,1.05-.44,1.05-.98,0-.03,0-.06,0-.08v-.1s-.02,0-.02-.01l-.55-3.78c-.02-.16-.08-.3-.17-.44l-2.03-3.82-.02-.86c0-.25,0-.49.03-.74l.13-1.33.42.66c.05.08.12.16.19.22l.81.72,1.76,1.57h0s.09.09.09.09c.2.15.46.23.75.19.41-.06.73-.37.78-.75.04-.26-.05-.5-.21-.68,0,0-.01-.02-.02-.02h0s-2.2-2.26-2.2-2.26c-.04-.04-.07-.08-.09-.12l-2.34-3.63h0c-.38-.63-1.1-1.04-1.92-1.04-.64,0-1.22.26-1.63.67l-2.46,2.27c-.18.16-.3.37-.34.6l-.71,3.5c-.02.07-.03.15-.03.22,0,.57.5,1.04,1.11,1.04.53,0,.97-.34,1.09-.8l.02-.08h0s.7-3.23.7-3.23c.02-.1.09-.19.18-.24l.23-.13-.3,2.55c-.02.15-.02.3-.02.44l.07,1.36-.72,4.09c-.02.09-.05.17-.1.24l-2.14,3.48c-.1.15-.16.33-.16.53Z"/><path d="M9.53,3c0,1.11.89,2,2,2s2-.89,2-2-.9-2-2-2-2,.89-2,2Z"/>'},world:{d:'<path d="M12,2C6.49,2,2,6.49,2,12s4.49,10,10,10,10-4.49,10-10S17.51,2,12,2ZM20.01,11.04h-4.05c-.04-.98-.13-1.94-.27-2.86.93-.29,1.82-.69,2.63-1.19.94,1.17,1.52,2.56,1.69,4.05ZM8.32,15.82c-.94.3-1.83.69-2.64,1.19-.93-1.17-1.51-2.56-1.69-4.05h4.05c.03.98.13,1.94.27,2.86ZM8.32,8.18c-.15.91-.24,1.87-.27,2.86H3.99c.18-1.49.76-2.88,1.69-4.05.81.5,1.69.9,2.64,1.19ZM13.4,17.28c-.53,1.9-1.19,2.7-1.4,2.79-.21-.09-.87-.89-1.4-2.79.95-.13,1.86-.13,2.8,0ZM8.72,17.72c.19.72.42,1.36.68,1.92-.82-.28-1.59-.69-2.28-1.22.51-.28,1.04-.51,1.6-.69ZM10.6,6.72c.54-1.96,1.23-2.75,1.39-2.8.19.05.87.84,1.42,2.8-.96.13-1.89.13-2.8,0ZM15.28,6.28c-.19-.71-.42-1.36-.68-1.92.82.28,1.59.69,2.29,1.22-.51.28-1.04.51-1.6.7ZM16.89,18.41c-.69.53-1.47.94-2.29,1.22.26-.56.49-1.21.68-1.92.56.19,1.1.42,1.6.69ZM9.97,11.04c.03-.84.11-1.66.22-2.42,1.21.18,2.41.18,3.6,0,.11.76.19,1.57.22,2.42h-4.05ZM14.02,12.96c-.03.85-.11,1.66-.22,2.42-1.19-.18-2.39-.18-3.6,0-.12-.76-.19-1.57-.22-2.42h4.05ZM7.12,5.59c.69-.53,1.46-.94,2.28-1.22-.26.56-.49,1.2-.68,1.92-.56-.19-1.09-.42-1.6-.7ZM15.68,15.82c.15-.92.24-1.87.27-2.86h4.05c-.18,1.49-.76,2.88-1.69,4.05-.81-.5-1.7-.9-2.63-1.2Z"/>'},changsha:{d:'<path transform="translate(1.4090 2.5443) scale(0.018468)" d="M597.9078125 32h22.75593749c41.585625 1.26 83.0390625 7.7765625 122.85281251 19.8965625 68.08125001 20.521875 131.1525 57.2925 182.645625 106.31718751 45.82874999 43.41 82.415625 96.1434375 108.991875 153.29249998 13.021875 27.868125 23.6878125 56.8115625 32.334375 86.32875001 5.6859375 16.3209375 10.419375 33.0928125 12.40781251 50.3053125-3.75-16.6696875-7.591875-33.3496875-12.54093751-49.72125-5.2153125-14.630625-11.7-28.790625-18.94406249-42.519375-20.285625-38.1028125-46.81125001-72.7734375-77.5275-103.0378125-48.4809375-47.713125-108.4378125-84.6375-174.42843751-102.14812501-45.97124999-12.3046875-94.515-14.7225-141.48-7.15124999-9.6815625 1.65-19.4353125 3.17624999-28.8 6.2090625-21.196875 6.4546875-42.129375 13.831875-62.518125 22.509375-41.0221875 17.52-80.4375 40.490625-112.044375 72.33281249-17.9090625 17.6625-32.5696875 38.296875-45.66375 59.7-1.126875 1.4653125-1.7821875 3.811875-3.93375 3.99656251-70.99124999 16.618125-141.9721875 33.286875-212.9625 49.905 8.34-53.19375001 34.2196875-102.1678125 66.984375-144.3075C300.891875 156.708125 359.219375 110.459375 424.10375001 77.920625 478.098125 51.066875 537.4390625 33.9359375 597.9078125 32z"/><path transform="translate(1.4090 2.5443) scale(0.018468)" d="M417.2290625 351.5965625c24.9684375-4.7325 50.4384375-6.4846875 75.826875-6.361875 21.781875 2.1 42.9084375 8.29875001 64.003125 13.861875 62.6821875 17.540625 124.4521875 38.13375001 186.058125 59.09625 41.904375 14.394375 83.398125 29.9775 125.1178125 44.93625 81.1340625 29.4459375 162.2878125 58.8496875 243.3496875 88.520625 1.516875 0.4096875 2.44875001 1.6809375 3.3609375 2.889375v1.24968751c-57.2315625-8.2875-114.0525-19.1278125-170.915625-29.61937501-97.2084375-18.298125-194.263125-37.40625001-291.2371875-56.89312499-8.4525-1.588125-16.8225-3.6984375-25.3875-4.60031251-37.1296875-4.6509375-74.3821875-8.8725-111.819375-9.86625-13.08374999 0.0721875-26.6896875-0.665625-39.106875 4.190625-31.689375 11.454375-62.65124999 25.2553125-91.48125 42.7640625-14.8359375 9.271875-29.435625 19.4775-40.85906251 32.878125-4.29375001 5.0915625-8.319375 11.8434375-6.28124999 18.75 2.551875 7.509375 10.1128125 11.5659375 16.9565625 14.5171875 15.7678125 6.27 32.836875 8.4525 49.68 9.2925 223.996875 14.5078125 447.99375001 29.045625 672 43.5225-14.68125001 70.29375001-45.705 137.1046875-89.934375 193.68-46.6471875 59.895-108.09 108.264375-177.5746875 138.928125-55.929375 24.8559375-116.95124999 37.87874999-178.1175 38.6671875H620.58125001c-60.8165625-0.7884375-121.5-13.6471875-177.17437501-38.225625-61.8525-27.15-117.42375001-68.296875-161.8171875-119.16562499-36.6065625-41.821875-65.7140625-90.1903125-85.5290625-142.125 59.8125 0.0103125 119.6259375 0.0103125 179.439375 0.01031249a508.2796875 508.2796875 0 0 0 66.6871875 83.900625c26.26875001 26.525625 55.6846875 50.120625 88.1625 68.61375 26.26875001 15.050625 54.61875001 26.443125 84.013125 33.6871875 66.493125 17.2734375 137.8828125 15.624375 203.34093751-5.3690625 36.87375001-11.8125 71.8828125-29.773125 102.435-53.6146875 26.6578125-20.72625001 49.83375001-46.0021875 67.7325-74.6484375 18.2775-29.116875 30.9309375-61.6978125 37.44656249-95.446875-80.0784375 0.3590625-160.1671875 0.54375001-240.2559375 0.6975-98.0484375-0.5840625-196.0978125-1.1990625-294.1471875-1.7934375-86.7075-0.7275-173.424375-0.328125-260.1421875-0.4303125-45.46875001-0.2559375-91.48125001 1.9875-136.265625-7.479375-16.2075-3.5859375-32.671875-8.431875-46.2065625-18.37968749C39.520625 615.87874999 32.871875 606.104375 32 595.11125001v-5.49187501c1.239375-5.9315625 4.569375-11.12625001 7.940625-16.0546875 5.85-8.2875 12.590625-15.9 19.5065625-23.308125 14.9690625-15.778125 30.9-30.6234375 47.3034375-44.90625 19.906875-17.2021875 40.224375-34.0453125 61.90312501-48.9834375 27.0890625-16.4746875 55.1625-31.27874999 83.54156249-45.3975 52.6003125-25.6546875 107.300625-48.4096875 165.03375-59.371875z"/>'},changzhou:{d:'<path transform="translate(-1.6260 -1.6320) scale(0.026625)" d="M886.384977 887.586854V590.873239h-93.596245v195.305165h-555.868544V307.380282s0-73.915493 70.460094-73.915493H734.647887s60.093897 18.478873 60.093897 75.117371v150.234741H886.384977V276.58216s-4.807512-140.169014-140.169015-140.169014h-459.718309S137.164319 144.375587 137.164319 285.446009v602.140845z"/><path transform="translate(-1.6260 -1.6320) scale(0.026625)" d="M299.71831 719.474178h102.159624V396.319249H630.985915v323.154929h91.643193v-345.539906S718.723005 300.469484 649.615023 300.469484H370.028169S300.469484 301.671362 300.469484 370.629108s-0.751174 348.84507-0.751174 348.84507z"/><path transform="translate(-1.6260 -1.6320) scale(0.026625)" d="M463.474178 463.323944h97.802817v256.150234h-97.802817z"/>'},chengdu:{d:'<path d="M10.15,9.67c-.69-.25-1.41-.5-2.14-.61-.09-.01-.18-.02-.26-.02-.11-.01-.2-.02-.31-.04h-.11c-.14,0-.28.01-.42.03-.07,0-.15.01-.22.02-.74.1-1.51.43-2.42,1.03-.76.52-1.41,1.09-1.93,1.69-.33.38-.67.85-.82,1.39-.03.09-.03.19-.03.29v.16c.01.14.09.31.25.47.27.27.64.47,1.12.61.52.14,1.04.21,1.48.24.73.07,1.47.08,2.19.08-.22-.09-.4-.21-.55-.34-.22-.2-.36-.49-.37-.8-.02-.4.08-.84.33-1.31.53-1.02,1.46-1.84,2.61-2.29.59-.25,1.24-.39,1.99-.46-.14-.04-.26-.09-.4-.13Z"/><path d="M14.66,11.42c.15.06.29.12.45.18-.87-.17-1.68-.3-2.52-.33-.24-.02-.49-.02-.74-.02h-.05c-.11-.01-.21-.01-.32-.01-.12,0-.22,0-.34.01h-.43c-.47.03-.97.05-1.44.16-1.12.22-1.97.6-2.6,1.18-.24.22-.44.46-.59.7.05-.24.15-.49.27-.72.33-.62.86-1.16,1.61-1.61.95-.57,2-.87,3.06-.87h.21c.12.02.22.06.33.1.07.02.15.05.21.07.29.1.59.22.89.34.06.02.28.11.34.13.32.13.63.27.96.4.22.09.45.2.68.29Z"/><path d="M22.5,14.4c-.37-.04-.73-.08-1.09-.13-2.03-.3-4.05-.81-6.02-1.3-.45-.11-.91-.23-1.37-.34l-.08-.02c-.97-.24-1.97-.49-2.98-.66l-.22-.03c-.29-.04-.61-.09-.93-.1-.15-.01-.29-.02-.44-.02-.05,0-.11,0-.16.01.27-.06.56-.11.86-.14.49-.06,1.01-.09,1.54-.09.34,0,.69.01,1.04.04,1.17.08,2.35.24,3.48.46.05.01.12.02.18.05,1.83.79,3.97,1.67,6.19,2.3Z"/>'},chongqing:{d:'<path transform="translate(0.6448 8.3543) scale(0.007121)" d="M1331.44257811 493.22919922L1677.32646482 62.09404297h468.72333985l-309.32666016 431.18261719h-262.45898437l-0.09404297 468.67675781h-421.6209961v-468.67675781h178.94003907z m299.109375 468.67675781L2258.39160154 62.09404297h740.69648438l-346.82080078 431.18261719h-196.84423829l-309.32666015 468.67675781h-515.5444336z m-571.78564454 0H252.5957031c-57.31962891 0-81.36210937-82.25244141-45.08701171-131.22949219L777.60683592 62.04658203h778.28466797l-271.69189453 337.44726563h-264.28710938l-66.41015625 93.73535156H1058.71972654v468.67675781z m224.96484375-787.37695312h-431.18261718l-487.42382813 656.14746093h581.15917969l-0.140625-243.85253906-207.8578125 0.140625 219.19921875-309.32666015h243.759375l82.48710937-103.10888672z"/>'},dongguan:{d:'<path transform="translate(1.5684 1.8512) scale(0.020374)" d="M576.53 493.398c19.944 0 284.202 9.987 426.287 14.34-44.872-4.985-189.864-23.045-226.647-27.413 76.668-115.923 36.572-152.058-6.416-169.515-43.02-17.457-117.806-26.45-210.026-22.714-92.249 3.75-181.571 38.289-229.356 58.849-46.182 19.883-123.559 72.467-157.465 122.775-38.635 57.358 22.225 75.418 59.001 77.919 13.526 0.902 47.169 4.143 106.995 4.563 75.391 0.511 158.248-4.187 187.803-4.563-66.691 31.149-84.675 31.179-141.996 38.725-49.759 6.554-179.6-1.973-208.888-1.341-29.274 0.619-150.813 19.313-154.55 76.036-3.742 56.712 112.178 46.107 112.178 46.107s120.283 6.22 176.963-4.353c56.719-10.62 136.49-11.84 231.226-52.359 94.722-40.502 117.587-56.499 178.649-109.489 39.888-0.632 75.63-3.313 144.18-5.813-44.872-4.384-88.297-3.119-361.269-14.34 33.657 0.634 138.162 0 436.673 0.634-35.518-1.235-363.342-28.048-363.342-28.048z m-127.097-50.474c-43.004-5.618-24.312-39.885-6.236-52.99 11.878-8.6 47.094-31.646 88.908-45.066 29.846-9.58 62.893-15.078 66.658-15.425 66.08-5.964 130.051 1.506 99.926 58.64-30.563 57.99-52.93 77.888-52.93 77.888s-153.321-17.459-196.326-23.047z"/>'},foshan:{d:'<path d="M8.01,8.62c.47-.13.96-.11,1.44-.12.8.04,1.58.18,2.36.33,1.48.24,2.95.53,4.43.76-.45,0-.9-.04-1.35-.08-1.31-.11-2.62-.06-3.93.03-.49.05-.97.22-1.41.43-1.29.54-2.48,1.33-3.52,2.27-.12.14-.33.25-.34.46,1.39-.66,2.85-1.17,4.34-1.54,1.79-.46,3.62-.77,5.46-.88,1.06-.07,2.13-.12,3.19-.03,1.29.05,2.57.2,3.82.53-.38.02-.76-.03-1.14-.02-1.34.01-2.68.1-4,.31-1.85.3-3.67.75-5.47,1.25-1.46.38-2.88.9-4.29,1.44-.78.28-1.51.69-2.28.99-.88.35-1.79.73-2.75.75-.32-.01-.7-.07-.91-.35-.26-.39-.14-.89.06-1.27.44-.72.93-1.41,1.52-2.01.83-.84,1.74-1.59,2.7-2.28.64-.42,1.34-.78,2.08-.98Z"/>'},guangzhou:{d:'<path transform="translate(2.0000 2.0000) scale(0.019531)" d="M255.329 231.83C212.739 142.273 153.359 65.132 77.148 0.386L267.84 0a686.133 686.133 0 0 1 149.188 218.117 685.707 685.707 0 0 1 56.011 267.446v538.418H321.49V525.925c0-103.384-22.06-201.422-66.18-294.096zM550.955 1024V485.583a685.688 685.688 0 0 1 55.991-267.466C642.466 135.883 692.183 63.177 756.154 0l190.693 0.387C870.616 65.133 811.235 142.274 768.665 231.83a677.418 677.418 0 0 0-66.16 294.077V1024h-151.55z"/>'},guiyang:{d:'<path transform="translate(0.5956 0.9089) scale(0.021859)" d="M518.912 540.416h384l23.04-59.136H554.24zM380.16 576.256l-26.624 41.728h375.04c-47.872 65.024-136.704 108.544-238.336 108.544-95.744 0-179.968-38.656-229.632-97.536h-97.28c63.232 88.576 193.024 149.248 342.784 149.248 156.16 0 290.304-65.792 350.464-160.256 8.448-13.056 15.36-27.136 20.736-41.728H380.16z"/><path transform="translate(0.5956 0.9089) scale(0.021859)" d="M252.416 377.088c-28.16 0-55.04 12.544-73.216 34.048l-102.4 120.832c-28.928 34.048-4.608 86.272 39.936 86.272H281.6l24.064-41.728h-151.04c-6.144 0-11.008-4.864-11.008-11.008 0-2.048 0.512-4.352 1.792-6.144l5.12-7.936c4.352-6.656 11.776-10.752 19.712-10.752h279.296l33.536-59.136h-279.04c-2.048 0-3.584-1.536-3.584-3.584 0-0.768 0.256-1.536 0.768-2.048 9.216-13.056 17.152-23.552 21.76-28.16 23.808-23.808 45.824-28.416 77.824-28.416h655.36l23.04-41.728H252.416z"/><path transform="translate(0.5956 0.9089) scale(0.021859)" d="M245.248 365.568h34.816c50.688-47.36 125.952-77.312 210.432-77.312 83.456 0 158.208 29.44 208.896 76.032H832c-67.84-76.8-188.416-127.744-325.632-127.744-182.272 0-335.104 89.856-374.016 210.176l39.936-47.104c17.92-21.76 44.8-34.048 72.96-34.048z"/>'},hangzhou:{d:'<path transform="translate(-0.6725 -0.4436) scale(0.024518)" d="M557.531 100.89c202.48 27.15 349.287 160.119 365.672 372.372 16.471 213.919-103.802 340.511-248.269 412.628 1.756-138.412 11.088-303.738-3.335-436.122-15.71-14.833-54.592-12.463-67.113 3.365-7.694 87.329-1.199 188.907-3.336 281.793H477.018c-14.102-88.557 43.182-355.753-67.084-288.522-9.421 80.894 2.486 212.165-6.7 271.729H272.401V265.25c-69.162 49.384-94.644 144.935-104.006 234.839-0.234 2.194-0.029 4.505 0 6.699 0.614 210.264 187.298 396.654 432.755 338.814 10.123 18.023-2.164 42.48 0 63.779-275.269 34.055-467.482-117.082-489.804-355.637-21.649-231.504 108.95-379.745 291.859-436.092 0.673 62.169 8.484 148.445 0 197.917 44.001-9.976 111.202 1.61 134.227 33.557 63.632-60.94 181.826-34.083 228.08 20.128 61.116 71.59 27.677 207.425 40.257 332.144 37.799-53.654 65.153-150.932 57.049-244.931-16.324-189.55-190.193-304.673-389.164-298.559v-53.685c8.016-2.045 64.86-3.333 83.877-3.333z"/>'},harbin:{d:'<path transform="translate(0.5389 0.5392) scale(0.022385)" d="M652.878 454.162H298.972a30.118 30.118 0 0 0-30.118 30.118l-0.662-0.073a246.885 246.885 0 0 0-1.699 28.937c0 135.59 109.93 245.52 245.519 245.52 12.625 0 25.022-0.952 37.13-2.783v-0.157a15.565 15.565 0 0 1 17.696 15.408h-0.193v185.332l0.025 0.097c220.93-26.95 392.059-215.197 392.059-443.417 0-228.352-171.333-416.683-392.457-443.476l0.373-3.265s0 109.099 0.025 109.099c162.888 26.166 287.322 167.381 287.322 337.63 0 132.735-75.62 247.808-186.14 304.478l-0.023-0.06V701.392a32.467 32.467 0 0 0-32.455-32.467H512.012c-70.535 0-130.156-46.887-149.335-111.194l0.024-0.012h364.7a30.118 30.118 0 0 0 30.13-30.118l-0.41-0.012c0.278-4.783 0.422-9.602 0.41-14.457 0-135.577-109.941-245.519-245.519-245.519-9.939 0-19.757 0.59-29.37 1.735l-0.013-0.132a15.565 15.565 0 0 1-17.685-15.42h0.109V68.86C240.399 92.341 65.27 282.299 65.27 513.157c0 231.303 175.79 421.538 401.059 444.416l-1.277-0.145V851.932c-166.647-22.89-295.02-165.852-295.02-338.775 0-134.783 79.39-252.362 192.68-308.08v120.724a31.563 31.563 0 0 0 31.551 31.55h-1.458 119.218c64.524 0 119.904 39.25 143.565 95.16"/>'},hongkong:{d:'<path d="M16.4,4.34c-1.36-.46-2.85-.73-4.41-.73s-3.08.27-4.41.73c-3.29,1.22-5.59,4.18-5.59,7.66s2.3,6.42,5.57,7.66c1.36.46,2.85.73,4.44.73s3.05-.27,4.39-.72c3.27-1.22,5.6-4.21,5.6-7.66h0c0-3.5-2.32-6.45-5.6-7.68ZM15.22,17.26c-.06-1.36-1.05-2.49-2.32-2.85v3.2h-1.81v-3.21c-1.3.33-2.26,1.46-2.35,2.85h-1.81c.16-2.3,1.88-4.15,4.11-4.51v-1.48c-2.24-.33-3.97-2.21-4.11-4.48h1.81c.07,1.34,1.03,2.48,2.33,2.82v-3.21h1.79v3.18c1.27-.33,2.26-1.46,2.32-2.82h1.81c-.13,2.29-1.85,4.14-4.08,4.5v1.49c2.24.36,3.94,2.23,4.11,4.51h-1.81Z"/>'},jinan:{d:'<path transform="translate(2.0000 2.2591) scale(0.019025)" d="M0 101.21028l1.471385 414.257985 1.135069 419.533952 8.639133 16.185237c13.557763 25.202726 36.322194 50.972986 60.032515 62.260612 18.434354 9.038509 25.581082 10.551934 54.945726 10.551934 29.72198 0 36.490352-1.513425 56.059775-10.93029 28.965268-14.293456 47.567781-33.295344 68.272272-64.530749 25.202726-38.003777 36.868708-73.737417 39.117826-120.401347 3.00583-63.206503-7.525084-99.339519-48.534691-162.903358-45.528861-70.752607-62.449791-118.152229-66.212333-185.499631-9.416865-167.821989 98.20445-317.945316 258.480335-361.20404 19.191067-4.897611 35.73364-9.795221 36.490352-10.930289 0.756712-0.735693 2.270137-11.644963 2.648494-24.067658 0.735693-12.401675 2.249117-24.467033 3.762542-26.716151 3.363166-5.254947 82.775926-5.654323 92.928483-0.378356 5.254947 3.00583 7.146728 8.281797 7.146728 19.947779 0 27.094507 3.00583 32.370474 20.326135 36.490352 74.115773 18.81271 127.169718 47.042286 175.326053 94.441909 27.851219 27.094507 33.106166 33.841859 56.059775 73.35906 47.042286 79.770096 60.579029 172.341243 38.003777 263.756302-9.395845 39.517202-23.710321 70.752607-52.297233 114.768043-40.252894 62.449791-53.053945 99.696855-53.053945 155.399294 0 41.766319 6.768372 69.596519 26.716151 109.849413 18.81271 39.138846 48.913047 72.245012 77.499959 86.538468 30.100337 14.293456 76.38591 16.563593 107.621315 4.897611 27.094507-10.152558 56.059775-37.625421 68.48247-64.719928l10.173577-19.926759-0.105098-417.936448 0.084079-418.503982-11.518844-26.211676c-11.287626-25.223746-38.340094-55.59734-63.54282-68.020035L529.362345 0.756712 92.907464 0C45.255604 13.242467 13.662862 46.558831 0 101.21028zM479.692586 214.464899c-50.405452 10.530914-91.436078 33.484523-129.0615 71.109943-86.160112 86.538468-95.934313 215.221611-24.80335 317.188603 23.310945 33.484523 49.64874 86.538468 59.065605 119.644634 12.023319 42.523031 13.9151 115.1464 4.119878 161.78931-9.395845 44.393793-18.434354 68.860826-40.252894 106.864603-9.416865 16.542573-16.437474 31.908038-17.026028 32.370474H474.794975V515.447245h-28.208556c-34.997947 0-55.303063-7.525084-65.854996-24.446013-14.293456-23.331965-6.390016-56.438131 17.698662-72.245012 9.395845-6.032679 20.683472-6.768372 127.169718-6.768372h117.395517l12.780031 9.774201c31.992118 24.446014 26.337795 73.359061-10.152558 88.409229-7.146728 3.026849-25.223746 5.275967-41.009606 5.275967h-28.229576v507.943181h143.165777c0-1.891781-7.335906-17.677642-15.596683-31.971098-34.262255-56.438131-50.804828-126.05567-47.042285-195.652188 3.783562-72.623368 21.061828-122.671484 62.47081-184.364562 38.361113-57.194844 52.675589-98.582806 52.675589-152.77182-0.378356-107.221939-67.368421-200.171443-170.470482-235.526726-30.079317-10.530914-92.907464-15.050168-121.893751-8.660153z"/>'},kaohsiung:{d:'<path transform="translate(1.5556 4.8895) scale(0.013888)" d="M903.003125 477.7690625l57.2090625 292.906875H730.57625l-36.658125-186.97125 0.129375 0.065625 77.9184375-44.349375H303.4203125l7.755-15.4096875h150.37875l150.18375-292.906875H807.096875l-59.6934375 116.836875L569.49125 462.359375h565.494375l-7.7184375 15.4096875H903.003125z m301.6125-238.974375L950.901875 408.513125H715.7075l253.8075-169.7184375h235.100625zM624.2525 589.1046875L531.565625 770.6759375H336.205625l92.7225-181.57125h195.324375z"/><path transform="translate(1.5556 4.8895) scale(0.013888)" d="M1472.1265625 484.5734375a557.235 557.235 0 0 1-11.405625 21.91875c-147.2671875 268.0725-537.6 486.1434375-868.88625 485.4740625-313.846875-0.63375-465.0815625-197.390625-354.9478125-445.985625-83.60625 205.4915625 45.6159375 367.1746875 304.5075 367.1746875 264.226875 0 607.5825-175.6959375 722.475-428.581875h208.2571875zM32 539.4275C179.7715625 240.385625 593.073125 31.401875 912.291875 32.035625c313.846875 0.63375 465.0459375 197.390625 354.9478125 445.9921875 83.60625-205.490625-45.6159375-367.145625-304.5075-367.145625-264.226875 0-607.5825 175.659375-722.475 428.5453125H32z"/>'},kunming:{d:'<path transform="translate(2.0000 1.1375) scale(0.021216)" d="M259.4816 943.0016H138.752L259.9936 80.9984h120.6272zM347.136 943.0016h-52.1216L416.1536 80.9984h52.224z"/><path transform="translate(2.0000 1.1375) scale(0.021216)" d="M921.6 80.9984H725.4016s-2.048 367.5136-343.7568 509.8496l-1.024 20.48S813.4656 545.792 921.6 80.9984z"/><path transform="translate(2.0000 1.1375) scale(0.021216)" d="M8.6016 599.04h370.8928c239.104 0 476.8768 120.832 563.2 343.9616H684.3392S613.4784 652.288 261.3248 652.288H0z"/>'},lanzhou:{d:'<path transform="translate(0.8558 1.4535) scale(0.020793)" d="M1016.74108409 513.58145808c0.02870996-2.12216804 0.08134585-4.23715777 0.08134606-6.36650479 0-5.90235489-0.14355129-11.76882201-0.35409443-17.61854246 0.38758893 8.31401947 0.57420637 16.85532694 0.27274837 23.98504725zM887.62616811 461.75700926c-36.40702805-62.55013098-91.53076598-106.88119593-138.76635502-136.37383205-121.82011198-76.06310322-255.09801906-46.53457927-244.03738317-45.45794343 206.03693498 20.03738346 274.90093516 192.2368597 274.90093408 192.23685906L691.43925202 478.50467223c-25.04015028-59.67192489-64.66512089-100.35917892-100.48598108-129.19626117-117.87005614-94.88986918-251.21495251-57.42056095-251.21495301-57.42056132S82.58272924 378.75558912 71.77570095 382.8037381C125.48306523 175.86243014 312.18123396 26.31775693 535.92523456 26.31775693c259.6916637 0 471.26729012 205.85270958 480.54310116 463.27865463-0.82302733-17.58265401-2.5576069-34.14609319-2.55760656-34.14609369z m-418.5336818 29.50220585L55.70033601 524.68037399c-0.06699155-0.05024318-0.6722991-3.3878135-0.6722989-17.46542125a484.13428004 484.13428004 0 0 1 6.37607506-78.27618708l226.09345794-61.81562536c117.83895314-17.89846709 181.59491621 124.13607533 181.5949162 124.13607456z m547.64859778 22.32224297a483.11984962 483.11984962 0 0 1-8.20396291 82.69278479L57.52583234 555.78317791a509.65532727 509.65532727 0 0 1-1.43551394-16.79551371l960.19857863-19.08994503c0.21293522-1.91641095 0.35648593-4.04815026 0.45218706-6.31626137z m-961.31588827 12.65405539q0.23925201 6.40239355 0.66272971 12.76172032s-0.24642973-2.77772001-0.65076723-12.76172032z m14.99394408-140.17315865q-5.46930796 21.07813113-9.02698972 42.87641084s3.37824279-20.68097171 9.03895269-42.87641084z m870.97899076 379.57383243l-878.06325192-169.24710314q-1.99057939-10.61562625-3.51700927-21.38915942l926.86355151 99.97637453a479.15783167 479.15783167 0 0 1-45.27371969 90.65988743zM873.27102796 849.34579433a448.83738298 448.83738298 0 0 0 61.15050564-73.06287925A480.24403639 480.24403639 0 0 1 535.92523456 988.11214948c-224.75603732 0-413.4280376-154.20530791-466.15446809-362.57495316z"/>'},nanchang:{d:'<path transform="translate(1.7392 1.9705) scale(0.020059)" d="M987.159 307H35.898C23.252 307 13 317.252 13 329.898v340.203C13 682.748 23.252 693 35.898 693h951.261c12.646 0 22.898-10.252 22.898-22.898V329.898c0.001-12.646-10.252-22.898-22.898-22.898zM908.68 623.155c-36.838 2.456-148.824 0.492-240.182-12.77 0 0-0.12-7.426 11.298-7.859 32.769-1.243 48.625-21.12 52.555-25.54 3.929-4.421 20.875-49.494-27.997-57.959-45.236-7.834-234.82 81.927-297.647 105.602-8.04 3.03-11.297-0.981-11.297-0.981 2.456-5.403 27.965-54.858-32.417-65.817-12.233-2.22-84.771 11.654-143.421 27.506-127.212 34.382-152.753 48.871-160.12 36.347 0 0 250.802-139.98 355.396-175.893 25.897-8.892 54.237 0.461 67.211 17.939 12.483 16.817 16.005 23.864 16.005 23.864s162.085-95.287 208.746-110.513c46.661-15.226 85.093 2.259 110.021 28.488 29.8 31.354 105.109 122.792 122.301 150.296 15.596 24.953 6.385 64.835-30.452 67.29z"/>'},nanjing:{d:'<path d="M21.79,9.39c-.74-2.27-3.19-3.52-5.46-2.78,0-2.39-1.94-4.33-4.33-4.33s-4.33,1.94-4.33,4.33c-2.28-.74-4.72.51-5.46,2.78-.74,2.28.51,4.72,2.78,5.46-1.4,1.93-.97,4.64.96,6.05,1.94,1.4,4.64.97,6.05-.96,1.4,1.93,4.12,2.36,6.05.96,1.94-1.41,2.36-4.12.96-6.05,2.27-.74,3.52-3.18,2.78-5.46ZM15.62,18.29l-1.16-1.56c1.02-.75,1.67-1.95,1.67-3.31,0-1.95-1.35-3.58-3.16-4.02v7.59h-1.94v-7.59c-1.81.44-3.16,2.07-3.16,4.02,0,1.36.65,2.56,1.67,3.31l-1.16,1.56c-1.49-1.11-2.45-2.88-2.45-4.87,0-3.03,2.21-5.53,5.1-6v-1.71h1.94v1.72c2.89.46,5.1,2.97,5.1,5.99,0,1.99-.96,3.77-2.45,4.87Z"/>'},nanning:{d:'<path d="M21.92,8.32c-4.03,1.86-5.84,5.06-6.65,7.65-.21-.92-.5-1.93-.92-3.01,1.42-2.78,3.18-3.86,3.18-3.86l.14,1.56c.14-.39,2.06-1.81,2.06-1.81l-.56-2.56c-2.51,1.62-4.2,3.55-5.36,5.43-.31-.65-.67-1.3-1.08-1.96,1.39-1.97,2.69-3,2.69-3l.14,1.56c.14-.39,2.06-1.81,2.06-1.81l-.64-2.51c-2.15,1.37-3.76,2.99-4.98,4.67-1.22-1.68-2.83-3.3-4.98-4.67l-.64,2.51s1.92,1.42,2.06,1.81l.14-1.56s1.3,1.03,2.69,3c-.42.67-.79,1.33-1.1,1.99-1.16-1.9-2.86-3.83-5.38-5.46l-.56,2.56s1.92,1.42,2.06,1.81l.14-1.56s1.77,1.08,3.2,3.89c-.41,1.05-.69,2.04-.9,2.94-.82-2.58-2.62-5.76-6.64-7.62l-.08,1.31s5.9,2.62,6.23,10.22c0,.09,0,.14,0,.14h1.23c.01-2.02.36-3.82.86-5.39.53,1.45.93,3.23,1.04,5.39h1.24c.11-2.19.52-3.98,1.06-5.44.51,1.59.86,3.39.87,5.44h1.23c.25-7.72,6.24-10.37,6.24-10.37l-.08-1.31ZM11.98,15.92c-.25-.88-.6-1.85-1.09-2.86.34-.8.72-1.52,1.11-2.17.38.64.76,1.35,1.09,2.14-.5,1.02-.86,2-1.11,2.89Z"/>'},nantong:{d:'<path transform="translate(0.5049 0.4937) scale(0.022381)" d="M513.7 68.6c247.4 0.1 447.2 199.7 446.7 446-0.6 246.7-199.8 446.2-446.1 445-266.5-1.4-447.5-214.3-447.5-445.2 0.1-247.2 199.7-446 446.9-445.8z m356 519.7H653.1c-0.6-1.3-1.3-2.5-1.9-3.8 29.8-30.5 49.7-70.2 89.7-91.5-22.9-9.6-39.9-6-54.9 11.4-16 18.7-32.1 37.3-47.6 56.3-15.5 19.1-35 28.1-59.7 27.9-60-0.5-120.1-0.4-180.1-0.5-4.4 0-8.8-0.6-17-1.3 40-47.3 77.5-91.7 115.6-136.6-21.3-8-31.8-5.4-46.6 11.8-29.8 34.7-59.2 69.6-88.6 104.6-11.8 14-26.7 21.3-45.1 21.3-41.9 0-83.8 0.3-125.7-0.1-4.9 0-12.3-2.6-13.8-6-1.5-3.5 1.7-10.5 4.9-14.3 35.3-41.9 71-83.4 106.4-125.1 45.7-53.8 104.3-76.6 173.8-68.9 40.6 4.5 80.8 12.6 121 20.2 33.7 6.4 67.1 14.4 100.7 21.7-39.2 3.5-70.1 19.7-93.7 51.3-16 21.4-34.2 41.1-51.3 61.6-2.3 2.7-3.9 6-6.4 10 18.8 3.4 32.6-2.2 43.5-14.8C589 509 601.2 494 613.6 479c26.6-32.2 60.4-46.5 102-40 24.7 3.9 49.1 9.5 73.6 14.1 28.2 5.3 56.4 10.5 85 15.8-6.7-121.2-120.3-298.5-325.3-317.1-211.7-19.2-383.5 137-399.4 334.5-15.6 193.9 130.2 372.8 328.7 391.4 215.3 20.2 366.3-141.5 391.5-289.4z"/>'},ningbo:{d:'<path transform="translate(1.3334 1.3333) scale(0.020833)" d="M679.25619125 174.67642345l-22.26797344 4.37884967 77.75435156 59.81231157s114.58762219-0.39356719 72.51891282-79.04750158c-17.73037312-33.14564437-50.85948188-59.47496812-124.68477375-96.58935842C629.56748937 43.06949469 572.08020219 32 512 32 324.5230475 32 162.17487313 139.49348844 83.16044469 296.19612219c20.43573562-14.11881469 142.85832375-89.13473063 514.1179875-150.66683156 38.42076937-6.36653063 81.97775813 29.14713281 81.97775906 29.1471328zM493.247675 559.366985l-91.28116125-108.54851344s-104.84765812 66.60878906-156.65633156 74.01050063c-51.80867344 7.40171156-50.57505469-27.13960875-38.23886907-44.40696188 12.33618562-17.27066063 127.05279281-104.85096563 127.05279282-104.85096562-4.93447406-12.33287813-80.17859344-75.24411938-80.17859344-75.24411938-82.63921594 31.24395375-181.71234844 105.27429844-215.21518031 131.33242406C34.32833094 457.78692781 32 484.61895875 32 512c0 146.82376311 65.94402375 278.2223325 169.80280311 366.2722725 0.10914094-0.22489594 0.22489594-0.42994781 0.33734345-0.65815031 71.54326313-148.02430875 291.10752844-318.24713719 291.10752844-318.24713719zM923.764025 265.22667313c-54.86130094 0.37372313-125.01881063 22.69792031-125.01881063 22.69792031s57.97676625 53.89557281 66.80061188 59.51134875c8.82715313 5.61908343 29.51754937-6.25077469 29.51754937-6.25077563 43.06089563 31.73012531 45.32638781 52.12617281 45.32638875 52.12617375s-89.52168375 30.595725-288.95779125 173.37467438C451.99255906 709.46496311 327.344165 954.23076594 327.344165 954.23076594l2.74835625 2.06374781c56.10484125 22.99557655 117.51787969 35.70548625 181.90417125 35.70548625 265.095705 0 480-214.904295 480-480 0.0033075-90.24597938-24.92041875-174.66120937-68.2326675-246.77332687zM696.070445 250.87965594s-53.30356781-48.86187938-76.62656531-62.19025125c0 0-44.58224812 6.092025-103.8786225 19.66182937 30.67179281 23.08487344 58.34718281 44.88982594 83.04270468 65.01798375 29.84497125-8.34098156 62.47137094-16.12303125 97.46248313-22.48956187zM322.93885625 273.09140562L409.36161031 346.79432844s51.8152875-29.00161219 137.27892844-57.51043875c-38.38438969-31.39939689-71.43081562-56.61747094-85.5099422-67.22725219-46.59307969 12.84220125-96.25862999 29.67299156-138.1917403 51.03476813zM743.61933125 402.73711156c48.82880625-23.79263344 85.06345875-39.16821655 85.06345874-39.16821656-8.87676187-10.85121375-67.07842406-65.10728063-67.07842405-65.10728063-35.84439187 8.39720531-69.04626094 18.2926125-99.23188219 28.68742032 46.16974687 40.38199219 73.626855 67.81925625 81.2468475 75.58807687zM565.29695281 504.63136156c38.47699406-27.53648345 86.02587938-54.62648345 130.10211281-77.60221593-21.96370219-25.4462775-51.55401188-53.87242125-82.52346093-81.41882719-85.592625 34.45863844-136.3595025 68.26904812-136.3595025 68.26904812 15.78238031 10.84790625 88.78085062 90.751995 88.78085062 90.751995z"/>'},shenzhen:{d:'<path transform="translate(-2.1135 -2.2553) scale(0.027704)" d="M860.16 158.72V153.6h-122.88v5.12c0 74.24-38.4 138.24-97.28 179.2V153.6h-94.72v220.16c-12.8 2.56-25.6 2.56-38.4 2.56s-25.6 0-35.84-2.56V153.6h-94.72v181.76c-56.32-38.4-94.72-102.4-94.72-176.64V153.6H158.72v5.12c0 140.8 89.6 261.12 217.6 312.32v84.48c-128 51.2-217.6 171.52-217.6 312.32v5.12H281.6V870.4c0-74.24 38.4-138.24 94.72-176.64v181.76h94.72v-220.16c12.8-2.56 25.6-2.56 38.4-2.56s25.6 0 35.84 2.56v220.16H640V691.2c58.88 38.4 97.28 104.96 97.28 179.2v5.12h122.88V870.4c0-140.8-89.6-263.68-220.16-312.32v-84.48c130.56-51.2 220.16-174.08 220.16-314.88zM547.84 535.04c-12.8 0-25.6-2.56-35.84-2.56-12.8 0-25.6 0-38.4 2.56v-38.4c12.8 0 25.6 2.56 35.84 2.56 12.8 0 25.6 0 38.4-2.56v38.4z"/>'},shijiazhuang:{d:'<path d="M22,5.55c-.06-1.97-1.68-3.55-3.66-3.55H5.66c-2.02,0-3.66,1.64-3.66,3.66v12.67c0,1.98,1.57,3.59,3.54,3.66V5.55h16.46Z"/><path d="M18.33,10.88v11.12h0c2.02,0,3.66-1.64,3.66-3.66V7.34H7.37v14.66h3.54v-11.12h7.42Z"/><path d="M12.82,22h3.6v-9.28h-3.6v9.28Z"/>'},suzhou:{d:'<path d="M7.12,12.88h7.11c-.87,1.18-2.11,1.9-3.56,1.9H3.02c-.31,0-.58-.19-.76-.43-.28-.38-.34-.89-.15-1.33.36-.81.79-1.57,1.29-2.29,2.19-3.16,5.58-5.2,9.37-5.22h7.08s-1.8,1.87-1.8,1.87h-5.18c-2.2.03-4.18,1.15-5.53,2.93-.32.42-.59.85-.83,1.32-.16.31-.15.66.04.95.13.2.33.31.57.31Z"/><path d="M4.15,18.5l1.79-1.87h5.15c2.23-.02,4.22-1.15,5.58-2.95.31-.41.58-.83.81-1.3.16-.3.16-.66-.03-.95-.13-.2-.33-.32-.58-.32h-7.11c.85-1.17,2.11-1.89,3.52-1.89h7.62c.32,0,.59.13.8.39.29.36.39.89.19,1.34-.58,1.33-1.37,2.55-2.33,3.63-2.16,2.42-5.11,3.9-8.3,3.92h-7.12Z"/>'},taipei:{d:'<path d="M9.18,13.02H2s1.04-1.26,1.04-1.26c.09-.1.16-.21.28-.27.36-.33.82-.48,1.3-.49h.91c.49-.05.95-.29,1.29-.64.09-.09.16-.18.23-.27l.61-.74.52-.64.8-.97c.36-.43.84-.65,1.41-.74h6.96s.07.01.08.03c.01.03,0,.06-.03.08l-.97,1.16c-.25.3-.58.53-.95.65-.16.05-.31.1-.48.1h-.98c-.22.01-.41.08-.62.16-.39.14-.67.41-.94.73l-2.11,2.52c-.29.35-.72.47-1.17.58Z"/><path d="M14.1,16.9c-.15.04-.3.1-.45.1h-7.1s1.09-1.32,1.09-1.32c.3-.37.73-.56,1.19-.68.4-.04.78-.02,1.19-.03.24,0,.48-.09.69-.18.36-.16.61-.41.86-.71l.41-.51.74-.89.65-.78c.4-.49.94-.89,1.6-.89h6.51c.1-.01.15-.04.25-.01.07.02.17-.03.26.02l-1.13,1.35c-.32.38-.79.58-1.28.64l-1.07.02c-.54.05-1.04.29-1.39.71l-1.03,1.24-.54.65-.33.39c-.32.38-.65.73-1.15.88Z"/>'},taiyuan:{d:'<path transform="translate(0.0236 -0.0555) scale(0.023065)" d="M541.27 337.962h411.522V229.119c0-74.914-62.886-135.647-140.455-135.647H541.27v244.49zM519.971 491.58L348.163 663.388l288.48 288.479h175.694c46.285 0 87.334-21.64 112.921-55L519.971 491.58z"/><path transform="translate(0.0236 -0.0555) scale(0.023065)" d="M952.792 381.535H85.686v434.677c0 14.433 2.354 28.322 6.672 41.36L519.885 430.05l0.086 0.085 0.085-0.085 426.438 426.433a131.279 131.279 0 0 0 6.298-40.271V381.535z"/><path transform="translate(0.0236 -0.0555) scale(0.023065)" d="M317.355 694.195L113.852 897.696c25.63 32.895 66.384 54.171 112.286 54.171h348.884L317.355 694.195zM497.696 337.962V93.472H226.138c-77.569 0-140.452 60.733-140.452 135.647v108.843h412.01z"/>'},taoyuan:{d:'<path transform="translate(0.5677 3.2008) scale(0.017186)" d="M1247.08255208 475.29072266v21.7555664c-5.43691406 43.50410156-24.47050781 84.28710938-54.37880859 122.35429688-78.85019531 97.88378906-233.83476563 163.14345703-410.57490235 165.85839843 187.61484375-32.62939453 323.56582031-141.38789063 323.56582031-271.90107421 0-154.98457031-195.76757813-282.77666016-435.04628906-282.77666016-24.47050781 0-46.22607422 0-70.69042969 2.71582031l-13.59667968-43.50585937L545.57122396 62c296.37421875 32.63027344 538.36787109 133.22900391 644.41054687 263.7421875l2.71582031 2.72285156c29.91445313 38.0671875 48.94101562 76.134375 54.38496094 119.63935547v16.31162109"/><path transform="translate(0.5677 3.2008) scale(0.017186)" d="M602.67288411 932.09169922c57.10078125 13.58964844 119.63935547 21.74941406 184.8928711 29.90830078L678.80725911 624.8375l-76.134375-24.47050781v190.3359375C393.3086263 768.94824219 235.60384114 652.02470703 235.60384114 510.64296875c0-84.29326172 57.10078125-160.42851562 146.82480469-212.08535156 48.94189453-27.19335938 108.76464844-48.94189453 174.02519531-59.82275391-179.45507813 0-334.44667969 65.25966797-416.01269531 163.14345703l-2.71494141 2.71582031C107.80384114 442.67363281 88.77727864 486.17158203 83.33948567 529.67480469v43.49882812C88.77727864 616.68476562 107.81087239 657.46777344 137.72005208 698.25078125l2.71582031 2.71582031c81.57744141 100.61103516 250.15253906 184.89902344 462.23789063 231.11894531m462.23261718-456.79482421h-78.85019531c-62.53857422 59.82275391-138.66679687 103.32685547-222.9609375 130.51318359l84.29414063 27.19335937c87.00908203-35.35224609 160.42236328-89.73105469 217.51699218-157.70654296z m-62.53242187-76.12822266H899.04622396C812.03714192 478.01181641 697.84173177 532.390625 572.76458333 545.98730469l114.19628906 35.34521484c127.79824219-27.19335938 239.27783203-92.446875 315.41308594-182.17089844z m-84.29326172-76.13525391H809.32132161C705.99446614 418.19521484 567.32766927 475.29072266 415.05891927 475.29072266c-29.90830078 0-57.09375-2.71582031-87.00908203-5.43164063l190.3359375 59.81044922c163.13818359-16.3125 307.24804688-92.446875 399.69492187-206.64228516z"/>'},tianjin:{d:'<path transform="translate(0.4839 0.4851) scale(0.022490)" d="M568.855 407.011h373.52C892.628 215.798 718.842 74.616 512.053 74.616c-206.79 0-380.573 141.182-430.322 332.396h365.113v112.247H67.412c0 212.904 138.887 372.513 323.446 426.626l64.667-419.57H557.19l67.834 423.07c190.843-49.986 331.669-223.591 331.669-430.114H568.855v-112.26z"/>'},wenzhou:{d:'<path transform="translate(2.0000 2.8023) scale(0.017964)" d="M313.147 838.018l302.748-302.747v0.008a84.333 84.333 0 0 0 24.21-59.248c0-46.723-37.88-84.612-84.613-84.612-46.723 0-84.612 37.889-84.612 84.612a84.341 84.341 0 0 0 25.373 60.412l38.948 38.93-101.537 101.545-38.94-38.939-0.017 0.01c-41.633-41.354-67.417-98.634-67.417-161.949 0-126.036 102.175-228.21 228.22-228.21 126.035 0 228.21 102.174 228.21 228.21a227.467 227.467 0 0 1-66.253 160.776l-369.929 372.247c-25.478 25.478-78.097 15.577-115.111-8.825h-0.01C91.672 899.217 0 734.164 0 547.708 0 274.409 196.96 47.099 456.684 0l0.009 0.079-0.009 182.537C296.188 226.47 178.225 373.314 178.225 547.708c0 116.414 52.557 220.532 135.228 289.952l-0.306 0.358z"/><path transform="translate(2.0000 2.8023) scale(0.017964)" d="M656.627 182.642V0.08l0.017-0.079c259.724 47.108 456.676 274.4 456.676 547.708 0 186.438-91.654 351.483-232.366 452.495l0.018 0.017c-37.015 24.403-89.633 34.303-115.103 8.825l-0.026 0.044-189.49-189.482 101.536-101.546 120.666 120.674 0.008 0.01c83.423-69.42 136.523-174.02 136.523-291.028 0-174.403-117.98-321.255-278.477-365.092"/>'},wuhan:{d:'<path transform="translate(0.5714 0.5808) scale(0.022321)" d="M64 82h246.875l202 498.97L712.698 82h245.31v632.178H797.725V323.713L603.59 714.178H424.072L223.606 323.713v390.465H64V82z m1.991 768.569V730.107h159.606v74.403l200.466-74.403H605.58l194.134 74.403v-74.403H960v120.462H714.69l-199.824-95.08-202 95.08H65.992zM64 860.524h244.907v80.64H64v-80.64z m326.542 0H635.45v80.64H390.542v-80.64z m322.56 0H958.01v80.64H713.102v-80.64z"/>'},wuhu:{d:'<path transform="translate(1.2519 1.2163) scale(0.020969)" d="M579.2 978.07v-0.56l-0.25-234.8c0.01-0.16 0.59-13.59-6.68-21.25-3.35-3.52-7.88-5.31-13.45-5.31H467.1c-6.03 0-10.85 1.91-14.32 5.67-7.32 7.95-6.29 21.62-6.28 21.76l-0.54 234.49-0.56-0.07c-37.53-4.5-122.37-26.56-202.31-80.71-48.93-33.15-90.09-73.92-122.34-121.19-39.09-57.3-65.3-124.58-77.9-199.99-12.48-74.7-8.66-146.34 11.36-212.92 16.02-53.27 42.38-103.43 78.35-149.11C193.8 136.32 262.63 98.07 263.32 97.69l2.96-1.62-2.37 2.41c-0.34 0.35-34.19 35.55-33.24 93.27l-3.87 64.42-0.16 0.14c-0.25 0.21-24.8 21.43-47.98 63.69-21.4 39-45.97 104.4-41.53 194.53 6.36 129.08 62.5 210.43 108.48 255.94 46.63 46.16 92.48 65.78 98.53 68.25l1.37-161.21 0.01-0.05c0.03-0.15 3.53-15.56 12.88-30.76 8.65-14.07 24.21-30.85 49.23-30.85h209.41c29.38 0 45.23 17.6 53.35 32.36 8.78 15.95 10.65 32.13 10.67 32.29l-1.6 158.22c6.14-2.48 52.36-22.12 99.33-68.28 46.31-45.51 102.86-126.85 109.22-255.91C892.45 424.41 867.88 359 846.48 320c-23.19-42.26-47.74-63.48-47.98-63.69l-0.16-0.14-3.86-64.38c0.95-57.78-32.9-92.96-33.25-93.31l-2.37-2.42 2.97 1.63c0.69 0.38 69.52 38.63 130.76 116.39 35.97 45.67 62.33 95.84 78.35 149.11 20.02 66.58 23.84 138.22 11.36 212.92-12.6 75.41-38.81 142.69-77.9 199.99-32.25 47.27-73.41 88.04-122.34 121.19-79.94 54.15-164.78 76.21-202.31 80.71l-0.55 0.07z"/><path transform="translate(1.2519 1.2163) scale(0.020969)" d="M261.13 100.13c-13.26 7.85-73.52 45.68-127.81 114.62-56.39 71.61-117.69 192.41-89.48 361.21 23.15 138.54 90.37 246.37 199.82 320.51 79.38 53.77 163.59 75.83 201.31 80.47l0.53-233.32c-0.05-0.54-1.07-14.21 6.54-22.48 3.67-3.98 8.73-6 15.05-6h91.72c5.86 0 10.63 1.89 14.18 5.62 7.57 7.97 6.98 21.39 6.96 21.96l0.25 234.21c37.72-4.64 121.92-26.7 201.3-80.47 109.44-74.14 176.67-181.97 199.82-320.51 28.2-168.81-33.1-289.6-89.49-361.21-54.29-68.94-114.54-106.76-127.81-114.62 7.44 8.79 32.28 41.94 31.46 91.66l3.84 63.92c2.18 1.92 25.74 23.18 48.03 63.78 21.47 39.12 46.13 104.72 41.68 195.1-2.82 57.13-15.6 109.79-37.99 156.51-17.92 37.38-41.99 71.06-71.56 100.1-50.34 49.45-99.83 68.55-100.33 68.74l-0.68 0.26 0.01-0.73 1.61-158.9c-0.01-0.1-1.87-16.1-10.56-31.88-7.99-14.51-23.58-31.82-52.46-31.82H407.64c-46.45 0-60.64 58.75-61.12 60.78l-1.38 162.55-0.67-0.26c-0.49-0.19-49.6-19.29-99.55-68.74-29.34-29.04-53.23-62.72-71.02-100.1-22.23-46.72-34.94-99.37-37.75-156.51-4.45-90.38 20.21-155.98 41.68-195.1 22.28-40.6 45.84-61.86 48.03-63.78l3.84-63.96c-0.84-49.67 24-82.82 31.43-91.61z"/><path transform="translate(1.2519 1.2163) scale(0.020969)" d="M710.61 788.03l-0.04-0.81-7.73-147.23c-6.07-28-43.98-47.45-46.23-48.58H373.99c-0.32 0.06-40.19 7.28-53.44 48.64L313 787.95l-0.67-0.3c-41.85-18.65-91.22-99.36-91.71-100.17l-0.08-0.14 0.01-0.16 37.83-495.43c0.02-0.33 2.54-33.56 22.83-67.4 11.92-19.88 27.56-36.08 46.47-48.16 23.63-15.09 52.47-23.73 85.72-25.69l0.54-0.03-1.62 104.11-0.47 0.02c-42.63 1.55-54.28 35.74-54.78 37.28l-21.31 292.74a2.5 2.5 0 0 0 2.5 2.68h0.01l348.96-0.92c0.7 0 1.35-0.29 1.83-0.8s0.71-1.18 0.66-1.88l-20.87-291.88c-6.71-31.46-53.21-37.85-53.68-37.92l-0.42-0.05-0.01-0.43-3.23-102.94 0.53 0.01c0.36 0.01 36.17 1.19 72.75 19.12 21.5 10.54 39.06 24.71 52.2 42.13 16.42 21.77 25.92 48.69 28.25 80l36.7 494.64-0.05 0.11c-0.29 0.66-29.66 66.13-90.55 101.12l-0.73 0.42z"/><path transform="translate(1.2519 1.2163) scale(0.020969)" d="M221.56 687.09c2.3 3.75 49.9 80.64 90.52 99.34l7.49-146.56 0.02-0.06c13.42-42.01 53.92-49.33 54.32-49.39l282.92-0.01 0.1 0.05c0.4 0.2 40.55 20.13 46.88 49.4l7.7 146.49c58.94-34.23 87.99-97.07 89.38-100.14l-36.68-494.39c-5.23-70.45-46.31-104.85-79.85-121.29-33.97-16.65-67.27-18.79-71.84-19.01l3.18 101.45c4.74 0.73 47.59 8.12 54.12 38.71l20.88 291.95a3.506 3.506 0 0 1-3.49 3.75l-348.96 0.92h-0.01c-0.97 0-1.9-0.41-2.56-1.11-0.66-0.71-1-1.67-0.93-2.64l21.32-292.85 0.02-0.05c0.11-0.36 11.54-36.18 55.25-38.02l1.59-102.08c-74.5 4.56-112.26 42.36-130.83 73.3-20.18 33.63-22.69 66.66-22.71 66.99l-37.83 495.25z"/>'},wuxi:{d:'<path transform="translate(1.9544 1.9306) scale(0.019663)" d="M266.135864 66.438508C402.067525-9.059797 573.301153-16.245153 715.376814 46.618034 820.31078 92.298847 908.652475 174.808949 961.483932 276.306441 999.389288 347.812881 1018.619661 428.413831 1019.452746 509.223051 944.822237 476.420339 870.157017 443.617627 795.422373 410.988475 753.629288 393.111864 712.808136 372.041763 668.481085 361.038102 618.287729 349.479051 559.65939 343.196203 515.124068 374.610441 440.077017 430.531254 368.188746 491.103458 304.180068 559.555254 295.016136 569.656407 278.875119 577.466576 266.031729 569.448136 247.877424 557.125424 232.500068 538.936407 210.215051 534.076746 187.999458 529.87661 166.44339 540.498441 148.913898 553.168271 139.298712 560.388339 126.594169 565.838102 115.069831 559.520542 117.430237 540.533153 130.551322 525.745898 141.138441 510.646237 219.587254 406.649492 342.536678 341.252339 470.345763 322.369085 470.345763 320.945898 470.345763 318.168949 470.345763 316.780475 371.312814 318.516068 270.162441 339.516746 184.87539 391.653966 140.409492 418.277966 98.998237 451.150102 66.855051 492.110102 41.376542 524.045017 23.430508 561.637966 12.010305 600.723525 8.886237 593.017492 6.907661 584.860203 6.491119 576.529356-5.137356 486.48678 7.567186 393.042441 44.222915 309.872814 88.306983 206.986847 167.970712 120.068339 266.135864 66.438508Z" opacity="1.00"/><path transform="translate(1.9544 1.9306) scale(0.019663)" d="M585.103186 451.288949C610.998237 442.055593 639.392542 446.221017 664.871051 454.829559 766.333831 493.220881 867.692475 531.751051 969.120542 570.177085 983.907797 576.42522 999.875254 579.965831 1013.655864 588.504949 1001.367864 670.737356 968.461017 749.845695 918.44122 816.249492 855.092068 900.599322 765.500746 965.54522 664.48922 996.716475 581.111322 1023.409898 491.034034 1026.533966 405.399864 1009.455729 313.552271 990.225356 227.536271 944.475119 159.709288 879.737492 99.102373 822.601763 54.393492 749.880407 27.457085 671.292746 51.408271 683.823729 80.462102 677.193763 101.671051 662.232949 121.977492 650.430915 139.923525 630.922847 164.881356 630.367458 185.326644 630.367458 199.003119 647.445695 213.825085 658.970034 233.853831 674.034983 250.654373 694.619119 275.126237 702.741695 301.472542 712.14861 331.255322 700.867254 349.687322 681.04678 403.698983 621.793627 458.370169 563.095864 513.839729 505.196475 534.666847 483.918102 556.50061 461.702508 585.103186 451.288949Z" opacity="1.00"/>'},xiamen:{d:'<path d="M6.43,4.37c-.27-.25-.63-.38-1-.37h-1.74c-1.01,0-1.69.68-1.69,1.7v12.64c.01.97.69,1.66,1.64,1.66h2.15c.07,0,.15.02.22-.03v-10.76l2.39,2.16,2.9-2.61-4.87-4.39ZM20.34,4h-1.79c-.37,0-.72.14-.99.39l-4.86,4.37,2.91,2.61,2.32-2.09s.06.03.06.08v10.61s.03.02.05.02h2.61s.07-.01.11-.02c.76-.19,1.24-.83,1.24-1.67V5.65c-.01-.97-.7-1.65-1.66-1.65ZM15.13,12.27l-.19-.17-2.94-2.64-2.94,2.64-2.1,1.9v5.27l4.89-4.4c.12-.12.19-.11.3,0,1.62,1.45,3.22,2.91,4.84,4.35.02.01.03.03.05.04v-5.27c-.32-.28-.65-.57-.96-.85-.32-.28-.64-.58-.95-.87Z"/>'},xian:{d:'<path transform="translate(0.6222 0.6222) scale(0.022222)" d="M166.05722656 62.09931641c232.78710938-0.14414062 465.57421875-0.10810547 698.36132813-0.03603516 48.53232422 0.10810547 92.97773437 42.56455078 92.94169922 91.53105469 0.25400391 157.52988281 0.10810547 472.18623047 0.10810547 472.18623047H877.765625l-0.03779297-161.97890625s-32.94404297 0.18896484-49.72412109-0.02900391c-73.48535156 0.07207031-146.97070313 0.10810547-220.45605469-0.03515625-9.00439453 0.07119141-30.09375001-0.48339844-30.09375-0.48339844l-0.10371094 162.52734375H464.55488281l-1.1390625-161.41113281-313.1586914-0.47724609c0.05185547 51.54785156-0.03955078 161.8875-0.03955079 161.8875H66.48945313s0.11601562-43.75195313 0.11601562-59.62851563c-0.03515625-125.37949219 0-287.14042969-0.03515625-412.55859375C67.29101562 120.78124999 99.265625 71.60644531 166.05722656 62.10019531z"/><path transform="translate(0.6222 0.6222) scale(0.022222)" d="M282.54130859 548.64863281c35.33203125-25.27734375 91.096875 3.36269531 94.53251954 45.67675782 1.265625 32.54589844 0.759375 109.70859375 0.759375 109.70859375h291.96738281s0.58359375-82.21113281 0.03779297-104.86406251c-1.06699219-35.01386719 39.57011719-67.95439453 76.43408203-57.35566406 25.60253906 6.29296875 42.2015625 32.04140625 43.83017577 57.35566406 0.62929687 50.89394531 0 104.8640625 0 104.8640625s9.51064453 0.590625 16.41796876 0.44472657c50.26728516 0.10986329 100.60839844-0.10722656 150.91171875 0.07382812-0.07119141 55.18652345 0.21708985 110.37128906-0.07119141 165.55869141-0.47109375 46.97753906-41.37275391 87.40810547-87.69814453 90.77080078-13.77861328 1.73583984-27.73828125 0.86923828-41.55205078 0.97558594-209.78701172-0.03515625-419.53974609 0.03691406-629.32675781 0-13.52373047-0.0703125-27.08613281 0.76025391-40.53779297-0.93955078-36.13535156 0.98876953-93.04101563-45.34013671-91.65234375-89.128125 0.37617187-32.15039063 0.50273437-25.03828125 0.01142578-45.21972657 0.43505859-41.37275391 0.759375-122.53623047 0.759375-122.53623047h183.67734375s0.53613281-77.04755859 0-109.70947265c-0.2953125-18.08789063 17.21425781-35.11582031 31.5-45.67587891z"/>'},zhengzhou:{d:'<path transform="translate(1.9994 2.0000) scale(0.019536)" d="M520.367 80.676v603.677c0 2.276 0.759 2.782 2.782 2.782h312.08c10.876 0 30.855-18.462 30.855-41.982V405.908c0-14.416-16.186-30.096-27.06-34.648-5.817-2.276-49.822-1.012-59.938-1.012l-61.456 0.253c-9.357 1.518-28.325 18.968-28.325 34.395 0 22.761-1.77 151.488 2.024 164.386 3.034 10.875 9.863 21.497 22.255 21.497 8.599 0 44.005 2.529 51.34-1.012-2.277-3.287-0.254-0.758-3.794-2.782-5.058-2.781-8.346-7.334-8.346-14.162V434.486c0-2.277 0.759-2.782 2.782-2.782h41.981c2.277 0 3.794 1.517 3.794 3.793V617.84c0 5.059-3.288 8.346-8.346 8.346h-195.24c-4.552 0-2.782-12.392-2.782-21.496 0-24.532-1.012-166.663 0.253-175.514 2.529-18.715 0-324.474-0.253-366.708C594.72 26.555 617.734 6.07 618.24 0c-14.163 0-37.177 10.875-48.051 18.462-2.53 1.77-4.047 2.529-6.576 4.552-10.875 8.093-19.726 16.945-27.82 28.072-3.034 4.552-15.426 24.026-15.426 29.59z m-360.891 325.99v244.81c0 11.633 20.99 35.406 34.647 35.406h104.702c12.14 0 32.624-28.325 32.624-37.43V488.607c0-11.381-24.531-27.06-31.865-27.06h-41.982c0 5.057 0.506 3.793 3.54 6.827 6.323 6.576 8.6 12.898 8.6 23.014v126.199c0 4.299-2.277 6.575-6.576 6.575h-37.43c-3.54 0-5.564-5.817-5.564-6.575V436.256c0-2.782 5.564-8.346 8.346-8.346h197.264c4.552 0 2.782 10.622 2.782 19.726v560.684c0 3.54-0.253 8.093 0 11.38 0.505 8.346 7.587 2.277 19.473-5.057l28.83-15.933c2.53-1.518 4.553-2.53 7.335-4.047 3.793-2.023 19.98-9.357 19.98-13.656V374.042c0-2.529-0.507-2.529-1.012-4.552H194.123c-5.31 0.758-12.392 5.058-15.932 8.346-7.335 7.08-18.715 18.208-18.715 28.83z"/><path transform="translate(1.9994 2.0000) scale(0.019536)" d="M85.628 371.26V678.79c0 25.29 19.727 50.58 38.694 64.996 8.346 6.322 22.509 15.427 33.13 15.427h174.756c22.255 0 52.603-26.302 63.225-46.028 4.805-9.105 7.84-15.175 7.84-28.578V490.883c0-8.346-17.45-21.75-28.83-25.543-15.68-5.058-31.613-3.541-50.834-3.541v2.782c4.552 1.264 19.727 11.633 19.727 19.726v183.101c0 6.576-5.817 16.186-9.105 19.98-4.3 4.805-9.61 10.874-17.956 10.874H179.708c-15.174 0-31.866-20.232-31.866-29.083v-287.55c0-9.863 14.416-23.267 23.52-24.279 9.358-1.011 249.867 0 286.032 0 13.657 0 35.407 1.77 46.787-1.011V102.93c0-18.715-1.77-37.935 10.622-53.11 3.035-3.793 8.852-6.828 10.116-11.38-6.575-3.288-41.729 12.898-51.086 19.22-5.564 3.541-8.852 6.323-14.163 10.37-13.656 10.874-23.52 27.313-29.083 43.752-3.54 10.369 0.253 172.479-1.265 180.066-0.758 4.046-4.046 2.782-9.357 2.782-70.56-1.012-146.683 0-217.749 0-40.717 0-48.051-4.047-77.64 18.715-14.922 11.633-38.948 36.417-38.948 57.914z m532.865-8.346V551.58c0 20.738 16.438 39.2 30.854 39.2h42.993c3.54 0 0.253 0.253 2.782-1.012-0.759-1.77 0.506-1.517-3.54-3.793-6.323-3.794-15.175-9.105-15.175-20.485V390.734c0-10.622 15.427-31.866 28.073-31.866h146.683c9.104 0 25.29 18.462 25.29 33.636v271.87c0 12.392-10.875 23.772-18.462 29.083-6.828 4.805-9.863 3.54-20.738 3.54H521.126c-0.506 2.024-1.012 2.024-1.012 4.553v268.329c0 8.093 19.726-6.07 30.095-11.886l28.325-15.68c3.035-1.77 17.198-7.587 17.198-11.634V758.706h271.363c7.588 0 20.486-6.829 25.544-10.116 8.345-5.564 12.392-9.61 19.22-16.439 10.875-10.875 26.302-29.842 26.302-45.522V364.685c0-11.634-7.081-24.279-13.151-32.625-6.323-8.346-14.921-17.703-23.014-23.52-2.782-2.023-5.817-4.299-9.105-5.816-2.529-1.265-9.104-3.288-12.392-3.288H678.684c-18.462 0-42.488 25.29-51.845 40.464-4.553 6.576-8.346 12.645-8.346 23.014z"/>'}};v["open-link"]=v.external;v.plus=v.add;v.bell=v.notification;v["escalator-down"]=v.escdown;v["escalator-up"]=v.escup;v.arrival=v.arrive;v.departure=v.depart;v.compass=v.north;v["cgo-app"]=v.cgoapp;v.xianggang=v.hongkong;v.taibei=v.taipei;v.gaoxiong=v.kaohsiung;v.haerbin=v.harbin;v["xi-an"]=v.xian;const Lt='<linearGradient id="cgo-brand-grad" x1="0%" y1="100%" x2="0%" y2="0%"><stop offset="0%" stop-color="var(--brand-gradient-start-appname)"/><stop offset="100%" stop-color="var(--brand-gradient-end-appname)"/></linearGradient>',Bt={a11yclimber:[0,1,2],a11ytoilet:[5,6,7],addone:[0],arrival:[2],arrive:[2],baby:[2],"bar-chart":[0],bus:[1,2],calendar:[1,3,5],cgo:[1],cgoapp:[1,2,3,4,5],"cgo-app":[1,2,3,4,5],compass:[0],counter:[2,3],crh:[2],delete:[1],depart:[2],departure:[2],design:[0],download:[0],drunk:[1],edit:[0],elder:[2],elevator:[7,8],escalator:[1],escdown:[2],escup:[2],"escalator-down":[2],"escalator-up":[2],"export-svg":[0],eye:[1],"horizontal-flip":[1],layer:[0],light:[1,2],link:[1],login:[0],logout:[0],luggage:[1],menu:[2],monorail:[0,1],noentry:[2],north:[0],notification:[0],payment:[2,3,4],plugin:[4],police:[1],pregnant:[1],preset:[1],security:[2],sort:[2],sparkle:[0],speaker:[2],stairs:[0,1],stroller:[1,2],ticket:[1],time:[2],toilet:[2,3],train:[0,1],tram:[5],unlock:[0],"vertical-flip":[1],"vi-clss":[0],"vi-line":[0],"vi-nbr":[1],"vi-oth":[2,3,4],"vi-stn":[2],"vi-sub":[0],"vi-text":[0],"vi-way":[1],"view-list":[0,1],walk:[1],window:[2]};function It(a){return a.match(/<(path|circle|rect|polygon|ellipse|line|polyline)[^>]*\/>/g)||[a]}function Pt(a,e){return a.replace(/\/>$/,' fill="'+e+'"/>')}function I(a){return String(a).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function We(a,e={}){const t=v[a];if(!t)return console.warn('[CGO.icon] 未找到图标："'+a+'"'),"";const o=e.size!==void 0?e.size:24,r=typeof o=="number"?o+"px":o,i=t.type==="stroke",s="cgo-svg-icon"+(i?" cgo-stroke-icon":"")+(e.class?" "+e.class:""),n=e.ariaHidden!==!1?' aria-hidden="true"':"",c=e.title?"<title>"+I(e.title)+"</title>":"",h=e.colorMode||(e.color?"fixed":"auto"),b=Bt[a]||[],d=b.length>0;if(h==="brand"&&d){let p=c+"<defs>"+Lt+"</defs>";const u=It(t.d),y=i?"none":"var(--icon-clr, currentColor)";for(let w=0;w<u.length;w++){const _=b.includes(w)?"url(#cgo-brand-grad)":y;p+=Pt(u[w],_)}return'<svg class="'+s+'" xmlns="http://www.w3.org/2000/svg" viewBox="'+(t.viewBox||"0 0 24 24")+'" width="'+r+'" height="'+r+'"'+(i?' stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"':"")+n+">"+p+"</svg>"}let f=i?"none":"currentColor";return e.color&&(f=e.color),'<svg class="'+s+'" xmlns="http://www.w3.org/2000/svg" viewBox="'+(t.viewBox||"0 0 24 24")+'" width="'+r+'" height="'+r+'" fill="'+f+'"'+(i?' stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"':"")+n+">"+c+t.d+"</svg>"}function Ot(){return Object.keys(v)}const Xe=new Set(["bjsubway"]),Nt=Object.freeze(Object.fromEntries(Object.entries(v).filter(([a])=>!Xe.has(a))));function qt(a,e={}){return Xe.has(a)?(console.warn('[CGO.icon] Removed operator-specific legacy icon: "'+a+'"'),""):We(a,e)}class H1 extends x{constructor(){super(),this.name="",this.size="",this.color="",this.colorMode=""}updated(e){if(e.has("size")){const t=this.size?isNaN(this.size)?this.size:`${this.size}px`:"";t?(this.style.setProperty("--cgo-icon-size",t),this.style.width=t,this.style.height=t):(this.style.removeProperty("--cgo-icon-size"),this.style.width="",this.style.height="")}}render(){if(!Nt[this.name])return l``;const t=qt(this.name,{size:this.size||void 0,color:this.color||void 0,colorMode:this.colorMode||void 0});if(!t)return l``;const o=document.createElement("template");return o.innerHTML=t,l`${o.content.cloneNode(!0)}`}}g(H1,"properties",{name:{type:String},size:{type:String},color:{type:String},colorMode:{type:String,attribute:"color-mode"}}),g(H1,"styles",m`
        :host {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            line-height: 1;
            vertical-align: middle;
            color: inherit;
        }
        svg {
            display: block;
            width: var(--cgo-icon-size, 20px);
            height: var(--cgo-icon-size, 20px);
        }
    `);typeof window<"u"&&window.customElements&&(customElements.get("cgo-icon")||customElements.define("cgo-icon",H1));const z=m`
    .glass-refraction {
        position: absolute;
        inset: 0;
        z-index: 0;
        border-radius: inherit;
        backdrop-filter: var(--glass-backdrop-filter-surface, blur(14px) saturate(135%));
        -webkit-backdrop-filter: var(--glass-backdrop-filter-surface, blur(14px) saturate(135%));
        /*
         * Fix: Shadow DOM 内 filter: url(#id) 因文档边界而静默失效（Chromium 117+）。
         * --glass-refraction-filter 由 theme.js 注入到 :root，CSS 变量继承穿透 Shadow boundary，
         * 在宿主文档上下文中解析 SVG ID，确保折射滤镜跨组件可靠生效。
         */
        filter: var(--glass-refraction-filter, none);
        pointer-events: none;
        overflow: hidden;
        isolation: isolate;
    }
`,V=m`
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 1px;
    background:
        linear-gradient(to right,
            rgba(0, 38, 59, var(--lg-rim-dark, 0.04)) 0,
            rgba(0, 0, 0, 0) var(--lg-rim-side, 3px),
            rgba(0, 0, 0, 0) calc(100% - var(--lg-rim-side, 3px)),
            rgba(0, 38, 59, var(--lg-rim-dark, 0.04)) 100%),
        linear-gradient(to bottom,
            rgba(255, 255, 255, calc(var(--lg-rim-lit, 0.95) * 0.45)) 0,
            rgba(255, 255, 255, calc(var(--lg-rim-lit, 0.95) * 0.45)) var(--lg-rim-hold, 1px),
            rgba(255, 255, 255, 0) 8px,
            rgba(0, 0, 0, 0.02) calc(100% - 4px),
            rgba(0, 0, 0, 0.12) 100%);
    -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
    z-index: 2;
    opacity: 0.64;
    transition: opacity var(--dur-fast, 140ms) ease;
`,n1=m`
    background:
        linear-gradient(to bottom,
            rgba(255, 255, 255, calc(var(--lg-rim-lit, 0.22) * 1.5)) 0,
            rgba(255, 255, 255, calc(var(--lg-rim-lit, 0.22) * 1.5)) 1px,
            rgba(255, 255, 255, 0) 8px,
            rgba(255, 255, 255, 0) calc(100% - 4px),
            rgba(255, 255, 255, 0.08) 100%);
`,H=m`
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 1px;
    background: linear-gradient(to bottom,
        rgba(255, 255, 255, calc(var(--lg-rim-lit, 0.95) * 0.45 * 0.75)) 0,
        rgba(255, 255, 255, calc(var(--lg-rim-lit, 0.95) * 0.45 * 0.75)) var(--lg-rim-hold, 1px),
        rgba(255, 255, 255, 0) var(--lg-rim-fade, 12px));
    -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
    z-index: 2;
    opacity: 0.8;
`,T=m`
    background: linear-gradient(to bottom,
        rgba(255, 255, 255, calc(var(--lg-rim-lit, 0.22) * 0.45 * 1.5)) 0,
        rgba(255, 255, 255, calc(var(--lg-rim-lit, 0.22) * 0.45 * 1.5)) 1px,
        rgba(255, 255, 255, 0) 8px);
`,fe=m`
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 1px;
    background:
        linear-gradient(to right,
            rgba(0, 38, 59, var(--lg-rim-dark, 0.04)) 0,
            rgba(0, 0, 0, 0) var(--lg-rim-side, 4px),
            rgba(0, 0, 0, 0) calc(100% - var(--lg-rim-side, 4px)),
            rgba(0, 38, 59, var(--lg-rim-dark, 0.04)) 100%),
        linear-gradient(to bottom,
            rgba(255, 255, 255, var(--lg-rim-lit, 0.95)) 0,
            rgba(255, 255, 255, var(--lg-rim-lit, 0.95)) var(--lg-rim-hold, 1px),
            rgba(255, 255, 255, 0) var(--lg-rim-fade, 12px),
            rgba(255, 255, 255, 0) calc(100% - var(--lg-rim-fade, 12px)),
            rgba(255, 255, 255, calc(var(--lg-rim-lit, 0.95) * 0.4)) calc(100% - var(--lg-rim-hold, 1px)),
            rgba(255, 255, 255, calc(var(--lg-rim-lit, 0.95) * 0.4)) 100%);
    -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
    z-index: 2;
    opacity: 0.95;
`,Je=m`
    background:
        linear-gradient(to bottom,
            rgba(255, 255, 255, calc(var(--lg-rim-lit, 0.22) * 1.5)) 0,
            rgba(255, 255, 255, calc(var(--lg-rim-lit, 0.22) * 1.5)) 1px,
            rgba(255, 255, 255, 0) 8px,
            rgba(255, 255, 255, 0) calc(100% - 4px),
            rgba(255, 255, 255, 0.12) 100%);
`,j=m`
    content: '';
    position: absolute;
    inset: 0;
    z-index: 1;
    border-radius: inherit;
    background: var(--glass-bg-panel, rgba(255, 255, 255, 0.9));
    pointer-events: none;
    transition: background-color 0.25s ease;
`,U=m`
    background: var(--glass-bg-panel, rgba(31, 32, 34, 0.9));
`,Vt=m`
    content: '';
    position: absolute;
    inset: 0;
    z-index: 1;
    border-radius: inherit;
    background: var(--glass-bg-surface, rgba(255, 255, 255, 0.72));
    pointer-events: none;
    transition: background-color 0.25s ease;
`,jt=m`
    background: var(--glass-bg-surface, rgba(31, 32, 34, 0.72));
`;class T1 extends x{constructor(){super(),this.variant="info",this.size="",this.icon="",this.iconPos="left",this.disabled=!1,this.loading=!1,this.full=!1,this.iconOnly=!1,this.pill=!1,this.active=!1,this.type="button",this.color="",this.textColor="",this.iconColor=""}connectedCallback(){super.connectedCallback(),this._onFormActionClick=e=>{if(this.disabled||this.loading){e.preventDefault(),e.stopImmediatePropagation();return}if(this.type==="submit"){const t=this.closest("form");t&&(typeof t.requestSubmit=="function"?t.requestSubmit():t.dispatchEvent(new Event("submit",{bubbles:!0,cancelable:!0})))}else if(this.type==="reset"){const t=this.closest("form");t&&t.reset()}},this.addEventListener("click",this._onFormActionClick)}disconnectedCallback(){super.disconnectedCallback(),this._onFormActionClick&&this.removeEventListener("click",this._onFormActionClick)}render(){const e=this.variant==="secondary"||this.variant==="glass"?"info":this.variant||"info",o=`v-${this.color?"custom":e} ${this.size?"s-"+this.size:""} ${this.active?"is-active":""}`,r=this.color?`--cgo-button-bg:${this.color};--cgo-button-border:${this.color};--cgo-button-fg:${this.textColor||"var(--btn-text, #fff)"};`:"",i=this.icon?l`
                  <cgo-icon name=${this.icon} size="18" color=${this.iconColor||""}></cgo-icon>
              `:null,s=l`
            <span class="btn-label"><slot></slot></span>
        `;return l`
            <button class=${o} style=${r} type=${this.type} ?disabled=${this.disabled||this.loading}>
                ${this.loading?l`
                          <span class="spin"></span>
                      `:null}
                ${!this.loading&&this.iconPos!=="right"?i:null}
                ${this.iconOnly&&this.icon?null:s}
                ${!this.loading&&this.iconPos==="right"?i:null}
            </button>
        `}}g(T1,"properties",{variant:{type:String},size:{type:String},icon:{type:String},iconPos:{type:String,attribute:"icon-pos"},disabled:{type:Boolean,reflect:!0},loading:{type:Boolean,reflect:!0},full:{type:Boolean,reflect:!0},iconOnly:{type:Boolean,attribute:"icon-only",reflect:!0},pill:{type:Boolean,reflect:!0},active:{type:Boolean,reflect:!0},type:{type:String},color:{type:String},textColor:{type:String,attribute:"text-color"},iconColor:{type:String,attribute:"icon-color"}}),g(T1,"styles",m`
        :host {
            display: inline-flex;
            vertical-align: middle;
        }
        :host([full]) {
            display: flex;
            width: 100%;
        }
        button {
            position: relative;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            padding: 6px 14px;
            border-radius: var(--radius-sm, 6px);
            border: none;
            cursor: pointer;
            font-family: var(--font-sans, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
            font-size: var(--text-md, 0.9rem);
            font-weight: 500;
            line-height: 1;
            height: 34px;
            box-sizing: border-box;
            width: 100%;
            white-space: nowrap;
            user-select: none;
            overflow: hidden;
            isolation: isolate;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
            /* Emil Kowalski 规范：显式声明光学与微交互过渡，无位移浮动 */
            transition:
                color var(--dur-fast, 140ms) ease,
                background-color var(--dur-fast, 140ms) ease,
                box-shadow var(--dur-fast, 140ms) ease,
                transform var(--dur-micro, 100ms) cubic-bezier(0.23, 1, 0.32, 1),
                opacity var(--dur-fast, 140ms) ease;
        }

        /* 卡片同款精致 1px 双轴微光描边 (Layer 2 Masked 1px Hairline Rim Light) */
        button::before {
            ${V}
        }
        @media (hover: hover) and (pointer: fine) {
            button:hover:not([disabled]):not([loading])::before {
                opacity: 0.75;
            }
        }

        :host-context([data-theme='dark']) button::before {
            ${n1}
        }

        :host([variant='primary']),
        :host([variant='danger']),
        :host([variant='success']),
        :host([variant='warning']),
        :host([variant='dark']) {
            color: #ffffff !important;
        }

        /* 保证按钮文字和图标在 Layer 3 (z-index: 3) 绝对锐利清晰 */
        button > *,
        .btn-label,
        ::slotted(*) {
            position: relative;
            z-index: 3;
            color: inherit;
        }

        .btn-label {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        /* 按压微触感反馈：仅在点击时产生 scale(0.98) 弹性回馈，鼠标悬停完全取消位移上升 */
        button:active:not([disabled]):not([loading]) {
            transform: scale(0.98);
        }

        /* 焦点环指示器 */
        button:focus-visible {
            outline: none;
            box-shadow: 0 0 0 2px var(--bg-color, #ffffff), 0 0 0 4px var(--primary-color, #006098);
        }
        :host-context([data-theme='dark']) button:focus-visible {
            box-shadow: 0 0 0 2px var(--bg-color, #1a1a1a), 0 0 0 4px var(--primary-hover, #0070b0);
        }

        :host([disabled]) button,
        :host([loading]) button {
            opacity: 0.55;
            cursor: not-allowed;
            pointer-events: none;
            transform: none !important;
            box-shadow: none;
        }

        /* ── 变体 1：Primary 主要按钮（纯正品牌色，同系统一）── */
        .v-primary {
            background-color: var(--primary-color, #006098);
            color: #ffffff !important;
            border-color: var(--primary-color, #006098);
            box-shadow: 0 1px 2px rgba(0, 96, 152, 0.2);
        }
        .v-primary.is-active {
            background-color: var(--primary-hover, #004f80);
            color: #ffffff !important;
            border-color: var(--primary-hover, #004f80);
            box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.2);
        }
        :host-context([data-theme='dark']) .v-primary {
            background-color: var(--primary-color, #0070b0);
            color: #ffffff !important;
            border-color: var(--primary-color, #0070b0);
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        }

        /* ── 变体 2：Info 次级按钮（标准次级中性，同系统一）── */
        .v-info {
            background-color: var(--btn-info-bg, #f1f3f5);
            color: var(--text-main, #00263b);
            border-color: var(--border-color, #dee2e6);
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
        }
        .v-info.is-active {
            background-color: #dee2e6;
            border-color: #ced4da;
        }
        :host-context([data-theme='dark']) .v-info {
            background-color: var(--btn-info-bg, #262729);
            color: var(--text-main, #e5e8ea);
            border-color: var(--border-color, #383a3c);
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
        }

        /* ── 变体 3：Dark 深色按钮 ── */
        .v-dark {
            background-color: #1a1a1c;
            color: #f0f2f5;
            border-color: #2e2f33;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
        }

        /* ── 变体 4：Danger 危险按钮 ── */
        .v-danger {
            background-color: var(--danger-color, #ea4335);
            color: #ffffff;
            border-color: var(--danger-color, #ea4335);
            box-shadow: 0 1px 2px rgba(234, 67, 53, 0.2);
        }

        /* ── 变体 5：Success 成功按钮 ── */
        .v-success {
            background-color: var(--success-color, #34a853);
            color: #ffffff;
            border-color: var(--success-color, #34a853);
            box-shadow: 0 1px 2px rgba(52, 168, 83, 0.2);
        }

        /* ── 变体 6：Warning 警示按钮 ── */
        .v-warning,
        .v-warn {
            background-color: var(--warning-color, #f59e0b);
            color: #ffffff;
            border-color: var(--warning-color, #f59e0b);
            box-shadow: 0 1px 2px rgba(245, 158, 11, 0.2);
        }

        /* ── 变体 7：Ghost 幽灵按钮 ── */
        .v-ghost {
            background-color: transparent;
            color: var(--primary-color, #006098);
            border-color: transparent;
            box-shadow: none;
        }
        .v-ghost::before {
            display: none;
        }
        :host-context([data-theme='dark']) .v-ghost {
            color: var(--primary-color, #4dabf7);
            border-color: transparent;
        }

        /* ── 自定义色按钮 ── */
        .v-custom {
            background-color: var(--cgo-button-bg);
            color: var(--cgo-button-fg, var(--btn-text, #fff));
            border-color: var(--cgo-button-border, var(--cgo-button-bg));
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        /* 鼠标精准悬停状态保护 (防止触屏点击后 Hover 样式永久黏着) */
        @media (hover: hover) and (pointer: fine) {
            .v-primary:hover {
                background-color: var(--primary-hover, #004f80);
                color: #ffffff !important;
                border-color: var(--primary-hover, #004f80);
                box-shadow: 0 2px 5px rgba(0, 96, 152, 0.25);
            }
            :host-context([data-theme='dark']) .v-primary:hover {
                background-color: var(--primary-hover, #0084d1);
                color: #ffffff !important;
                border-color: var(--primary-hover, #0084d1);
                box-shadow: 0 2px 6px rgba(0, 112, 176, 0.35);
            }
            .v-info:hover {
                background-color: var(--btn-info-hover, #e9ecef);
                border-color: var(--border-hover, #ced4da);
                color: var(--text-main, #00263b);
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
            }
            :host-context([data-theme='dark']) .v-info:hover {
                background-color: var(--btn-info-hover, #323438);
                border-color: var(--border-hover, #44474b);
                color: #ffffff;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.35);
            }
            .v-dark:hover {
                background-color: #292a2e;
                border-color: #3e4046;
                color: #ffffff;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.25);
            }
            .v-danger:hover {
                background-color: var(--danger-hover, #d33828);
                border-color: var(--danger-hover, #d33828);
                box-shadow: 0 2px 5px rgba(234, 67, 53, 0.28);
            }
            .v-success:hover {
                background-color: var(--success-color, #34a853);
                border-color: var(--success-color, #34a853);
                box-shadow: 0 2px 5px rgba(52, 168, 83, 0.28);
            }
            .v-warning:hover,
            .v-warn:hover {
                background-color: #d97706;
                border-color: #d97706;
                box-shadow: 0 2px 5px rgba(245, 158, 11, 0.28);
            }
            .v-ghost:hover {
                background-color: var(--info-bg, #e7f3fb);
                color: var(--primary-hover, #004f80);
                border-color: transparent;
            }
            :host-context([data-theme='dark']) .v-ghost:hover {
                background-color: rgba(77, 171, 247, 0.12);
                color: #70bcfb;
                border-color: transparent;
            }
            .v-custom:hover {
                filter: brightness(0.92);
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.16);
            }
        }

        /* 尺寸 */
        .s-sm {
            padding: 4px 10px;
            font-size: var(--text-sm, 12px);
            height: 28px;
        }
        .s-lg {
            padding: 10px 20px;
            font-size: 1rem;
            height: 44px;
        }
        .s-xl {
            padding: 14px 28px;
            font-size: 1.05rem;
            height: 52px;
        }

        /* 纯图标 */
        :host([icon-only]) button {
            width: 34px;
            height: 34px;
            padding: 0;
        }
        :host([icon-only]) .s-sm {
            width: 28px;
            height: 28px;
        }
        :host([icon-only]) .s-lg {
            width: 44px;
            height: 44px;
        }

        /* 胶囊形（筛选 / 控制栏 ctrl-btn）*/
        :host([pill]) button {
            height: 36px;
            padding: 0 18px;
            border-radius: var(--radius-full, 9999px);
            border: none;
            background-color: var(--btn-info-bg, #f1f3f5);
            color: var(--text-main, #00263b);
            font-weight: 500;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
        }
        :host([pill]) button.is-active,
        :host([pill]) button.v-primary {
            background-color: var(--primary-color, #006098);
            color: #ffffff;
            box-shadow: 0 1px 2px rgba(0, 96, 152, 0.2);
        }
        :host-context([data-theme='dark']):host([pill]) button {
            background-color: var(--btn-info-bg, #262729);
            color: var(--text-main, #e5e8ea);
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
        }
        :host-context([data-theme='dark']):host([pill]) button.is-active,
        :host-context([data-theme='dark']):host([pill]) button.v-primary {
            background-color: var(--primary-color, #0070b0);
            color: #ffffff;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        }
        @media (hover: hover) and (pointer: fine) {
            :host([pill]) button:hover {
                background-color: var(--btn-info-hover, #e9ecef);
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
            }
            :host([pill]) button.is-active:hover,
            :host([pill]) button.v-primary:hover {
                background-color: var(--primary-hover, #004f80);
                box-shadow: 0 2px 5px rgba(0, 96, 152, 0.25);
            }
            :host-context([data-theme='dark']):host([pill]) button:hover {
                background-color: var(--btn-info-hover, #323438);
                color: #ffffff;
            }
            :host-context([data-theme='dark']):host([pill]) button.is-active:hover,
            :host-context([data-theme='dark']):host([pill]) button.v-primary:hover {
                background-color: var(--primary-hover, #0084d1);
            }
        }
        :host([pill]) .s-sm {
            height: 30px;
            padding: 0 14px;
        }

        .spin {
            width: 1.1em;
            height: 1.1em;
            border: 2px solid currentColor;
            border-top-color: transparent;
            border-radius: 50%;
            animation: cgo-spin 0.7s linear infinite;
        }
        @keyframes cgo-spin {
            to {
                transform: rotate(360deg);
            }
        }
    `);typeof window<"u"&&window.customElements&&(customElements.get("cgo-button")||customElements.define("cgo-button",T1));class L1 extends x{constructor(){super(),this.variant="primary",this.subsystem="",this.pill=!1}render(){var o;const e=this.subsystem||((o=this.variant)!=null&&o.startsWith("brand-")?this.variant.slice(6):"");if(e){const r=`background:var(--brand-gradient-${e});`;return l`
                <span class="badge brand" style=${r}><slot></slot></span>
            `}const t=this.variant==="secondary"?"info":this.variant||"primary";return l`
            <span class="badge ${t}"><slot></slot></span>
        `}}g(L1,"properties",{variant:{type:String},subsystem:{type:String},pill:{type:Boolean,reflect:!0}}),g(L1,"styles",m`
        :host {
            display: inline-flex;
            vertical-align: middle;
        }
        .badge {
            position: relative;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 2px 8px;
            border-radius: var(--radius-full, 9999px);
            font-size: var(--text-xs, 11px);
            font-weight: 600;
            line-height: 1.4;
            font-family: var(--font-sans, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
            box-sizing: border-box;
            white-space: nowrap;
            user-select: none;
            overflow: hidden;
            isolation: isolate;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
            border: none;
        }

        /* 同步 cgo-button 精致 1px 双轴微光描边 (Layer 2 Masked 1px Hairline Rim Light) */
        .badge::before {
            ${V}
        }

        :host-context([data-theme='dark']) .badge::before {
            ${n1}
        }

        /* 保证徽章内容在 Layer 3 (z-index: 3) 绝对清晰 */
        .badge > *,
        ::slotted(*) {
            position: relative;
            z-index: 3;
        }

        .primary {
            background: var(--primary-color, #006098);
            color: #fff;
            box-shadow: 0 1px 2px rgba(0, 96, 152, 0.2);
        }
        .success {
            background: var(--success-color, #34a853);
            color: #fff;
            box-shadow: 0 1px 2px rgba(52, 168, 83, 0.2);
        }
        .danger {
            background: var(--danger-color, #ea4335);
            color: #fff;
            box-shadow: 0 1px 2px rgba(234, 67, 53, 0.2);
        }
        .warning {
            background: var(--warning-color, #f59e0b);
            color: #fff;
            box-shadow: 0 1px 2px rgba(245, 158, 11, 0.2);
        }
        .info {
            background: var(--info-bg, #e7f3fb);
            color: var(--info-color, #006098);
        }
        .muted {
            background: var(--btn-info-bg, #f1f3f5);
            color: var(--text-main, #00263b);
        }

        /* 胶囊外观（同步 cgo-button pill） */
        :host([pill]) .badge {
            padding: 4px 14px;
            border-radius: var(--radius-full, 9999px);
            font-size: var(--text-xs, 12px);
            font-weight: 600;
            letter-spacing: 0.02em;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        :host-context([data-theme='dark']) .info {
            background: rgba(56, 189, 248, 0.16);
            color: #38bdf8;
        }
        :host-context([data-theme='dark']) .muted {
            background: var(--btn-info-bg, #262729);
            color: var(--text-main, #e5e8ea);
        }
        :host-context([data-theme='dark']) .primary {
            background: var(--primary-color, #0070b0);
            color: #ffffff;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        }
        :host-context([data-theme='dark']) :host([pill]) .badge {
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
        }

        .brand {
            color: #fff;
            border-radius: var(--radius-full, 9999px);
            font-size: var(--text-xs, 12px);
            font-weight: 600;
            margin-left: 4px;
            vertical-align: middle;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
        }
        :host([pill]) .brand {
            margin-left: 0;
            padding: 4px 14px;
            border-radius: var(--radius-full, 9999px);
            font-size: var(--text-xs, 12px);
            font-weight: 600;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
        }
    `);typeof window<"u"&&window.customElements&&(customElements.get("cgo-badge")||customElements.define("cgo-badge",L1));class B1 extends x{constructor(){super(),this.label="",this.value="",this.placeholder="",this.type="text",this.hint="",this.state="",this.disabled=!1}render(){return l`
            ${this.label?l`
                      <label>${this.label}</label>
                  `:null}
            <input
                .value=${this.value}
                type=${this.type}
                placeholder=${this.placeholder}
                ?disabled=${this.disabled}
                @input=${e=>{this.value=e.target.value,this.dispatchEvent(new CustomEvent("cgo-input",{detail:{value:this.value},bubbles:!0,composed:!0}))}}
            />
            ${this.hint?l`
                      <div class="hint ${this.state}">${this.hint}</div>
                  `:null}
        `}}g(B1,"properties",{label:{type:String},value:{type:String},placeholder:{type:String},type:{type:String},hint:{type:String},state:{type:String},disabled:{type:Boolean,reflect:!0}}),g(B1,"styles",m`
        :host {
            display: block;
            font-family: var(--font-sans, system-ui, sans-serif);
        }
        label {
            display: block;
            margin-bottom: 6px;
            color: var(--text-main, #00263b);
            font-size: var(--text-sm, 12px);
            font-weight: 600;
        }
        input {
            width: 100%;
            height: 38px;
            padding: 8px 12px;
            border: 1px solid var(--border-color, #dee2e6);
            border-radius: var(--radius-md, 8px);
            background: var(--card-bg, #fff);
            color: var(--text-main, #00263b);
            font: inherit;
            font-size: 14px;
            box-sizing: border-box;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
            -webkit-tap-highlight-color: transparent;
            transition:
                border-color var(--dur-fast, 140ms) ease,
                box-shadow var(--dur-fast, 140ms) ease,
                background-color var(--dur-fast, 140ms) ease;
        }
        @media (pointer: coarse), (max-width: 640px) {
            input {
                font-size: 16px; /* 防止 iOS Safari 聚焦输入框时强制缩放视口 */
            }
        }
        input::placeholder {
            color: var(--text-light, #636f75);
            opacity: 0.5;
            transition: opacity var(--dur-fast, 140ms) ease;
        }
        input:focus::placeholder {
            opacity: 0.75;
        }
        input:focus {
            outline: none;
            border-color: var(--primary-color, #006098);
            box-shadow:
                0 0 0 3.5px rgba(0, 96, 152, 0.14),
                0 1px 2px rgba(0, 96, 152, 0.08);
        }
        :host-context([data-theme='dark']) input {
            background: var(--card-bg, #1e2023);
            border-color: var(--border-color, rgba(255, 255, 255, 0.14));
            color: var(--text-main, #e5e8ea);
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }
        :host-context([data-theme='dark']) input:focus {
            border-color: var(--primary-color, #4dabf7);
            box-shadow:
                0 0 0 3.5px rgba(77, 171, 247, 0.22),
                0 1px 3px rgba(0, 0, 0, 0.35);
        }
        :host([state='success']) input {
            border-color: var(--success-color, #34a853);
        }
        :host([state='success']) input:focus {
            border-color: var(--success-color, #34a853);
            box-shadow:
                0 0 0 3.5px rgba(52, 168, 83, 0.18),
                0 1px 2px rgba(52, 168, 83, 0.08);
        }
        :host([state='danger']) input {
            border-color: var(--danger-color, #ea4335);
        }
        :host([state='danger']) input:focus {
            border-color: var(--danger-color, #ea4335);
            box-shadow:
                0 0 0 3.5px rgba(234, 67, 53, 0.18),
                0 1px 2px rgba(234, 67, 53, 0.08);
        }
        input:disabled {
            background: var(--btn-info-bg, #e9ecef);
            color: var(--text-light, #636f75);
            cursor: not-allowed;
            box-shadow: none;
        }
        .hint {
            margin-top: 5px;
            color: var(--text-light, #636f75);
            font-size: var(--text-sm, 12px);
            line-height: 1.45;
        }
        .hint.success {
            color: var(--success-color, #34a853);
        }
        .hint.danger {
            color: var(--danger-color, #ea4335);
        }
        .hint.info {
            color: var(--info-color, #006098);
            background: var(--info-bg, #e8f0fe);
            border: 1px solid var(--info-border, #b8d0ee);
            border-radius: var(--radius-xs, 4px);
            padding: 7px 10px;
        }
    `);typeof window<"u"&&window.customElements&&(customElements.get("cgo-input")||customElements.define("cgo-input",B1));const Ut=':root{--bg-color: #f8f9fa;--bg-body: var(--bg-color);--card-bg: #ffffff;--panel-bg: #ffffff;--bg-card: var(--card-bg);--text-main: #00263b;--text-light: #636f75;--text-secondary: var(--text-light);--text-color: var(--text-main);--border-color: #dee2e6;--primary-color: #00263b;--primary-hover: #004060;--btn-text: #ffffff;--header-bg: #ffffff;--header-height: 60px;--footer-bg: #ffffff;--cgo-floating-scrim-start: var(--bg-color, #f8f9fa);--cgo-floating-scrim-end: rgba(248, 249, 250, 0);--btn-info-bg: #e9ecef;--btn-info-text: #495057;--btn-info-hover: #dee2e6;--table-head-bg: #f1f3f5;--table-head-text: #00263b;--table-row-hover: #f8f9fa;--table-cell-border: #eeeeee;--tab-bg: #f8f9fa;--tab-hover: rgba(0, 0, 0, .03);--help-code-bg: #f7f9fa;--filter-tag-bg: #f8f9fa;--filter-toolbar-bg: #eef2f7}[data-theme=dark]{--bg-color: #1a1a1a;--bg-body: var(--bg-color);--card-bg: #1f2020;--panel-bg: #1f2020;--bg-card: var(--card-bg);--text-main: #e5e8ea;--text-light: #a0b0b9;--text-secondary: var(--text-light);--text-color: var(--text-main);--border-color: #333333;--primary-color: #006098;--primary-hover: #0070b0;--btn-text: #ffffff;--header-bg: #1f2020;--footer-bg: #1f2020;--cgo-floating-scrim-start: var(--bg-color, #1a1a1a);--cgo-floating-scrim-end: rgba(26, 26, 26, 0);--btn-info-bg: #373838;--btn-info-text: #e5e8ea;--btn-info-hover: #4a4b4c;--table-head-bg: #2c2d2e;--table-head-text: #e5e8ea;--table-row-hover: #2a2b2c;--table-cell-border: #333333;--tab-bg: #2c2d2e;--tab-hover: rgba(255, 255, 255, .05);--help-code-bg: #2a2a2a;--filter-tag-bg: #2c2d2e;--filter-toolbar-bg: #2c2d2e}:root{--success-color: #34a853;--success-bg: #e6ffed;--success-border: #a8d5b5;--warning-color: #f59e0b;--warning-bg: rgba(255, 243, 205, .5);--warning-border: rgba(255, 238, 186, .5);--danger-color: #ea4335;--danger-hover: #b3261e;--danger-bg: #fff1f1;--danger-border: #e58f8f;--info-color: #006098;--info-bg: #e8f0fe;--info-border: #b8d0ee;--diff-bg: #efbdc3;--diff-text: #d93025;--same-bg: #e6ffed;--same-text: #137333;--selected-bg: #e8f0fe}[data-theme=dark]{--success-color: #34a853;--success-bg: #1b3e20;--success-border: #2d5c36;--warning-color: #f59e0b;--warning-bg: rgba(100, 75, 0, .2);--warning-border: rgba(120, 90, 0, .3);--danger-color: #ea4335;--danger-hover: #ff5252;--danger-bg: #3b0f0f;--danger-border: #7a2424;--info-color: #006098;--info-bg: #1a2a3a;--info-border: #2a4060;--diff-bg: #5c1b1b;--diff-text: #ea4335;--same-bg: #1b3e20;--same-text: #34a853;--selected-bg: rgba(66, 133, 244, .2)}:root{--permission-enabled: #16803d;--permission-enabled-soft: #edf8f1;--permission-enabled-border: #badfc8;--permission-disabled: #52637a;--permission-disabled-soft: #f0f4f8;--permission-disabled-border: #b9c5d4;--permission-hidden: #c62828;--permission-hidden-soft: #fff1f1;--permission-hidden-border: #e58f8f;--permission-inherit: #64748b;--permission-inherit-soft: #f2f5f8;--permission-inherit-border: #d2dbe6}[data-theme=dark]{--permission-enabled: #81c995;--permission-enabled-soft: #163820;--permission-enabled-border: #245934;--permission-disabled: #94a3b8;--permission-disabled-soft: #202936;--permission-disabled-border: #334155;--permission-hidden: #ff8a80;--permission-hidden-soft: #3d1414;--permission-hidden-border: #5c1c1c;--permission-inherit: #a1b0cb;--permission-inherit-soft: #242d3d;--permission-inherit-border: #37455d}:root{--cgo-glass-default: liquid;--cgo-header-default: classic;--header-floating-height: 52px;--header-floating-mobile-height: 48px;--header-floating-radius: 12px;--header-floating-shadow: 0 4px 20px rgba(0, 0, 0, .18);--cgo-nav-width: 280px;--cgo-bg-default: solid;--bg-gradient-light: radial-gradient(circle at 12% 18%, rgba(0, 96, 152, .08), transparent 45%), radial-gradient(circle at 88% 82%, rgba(0, 160, 233, .06), transparent 45%), var(--bg-color, #f8f9fa);--bg-gradient-dark: radial-gradient(circle at 12% 18%, rgba(0, 96, 152, .16), transparent 50%), radial-gradient(circle at 88% 82%, rgba(15, 35, 65, .4), transparent 50%), var(--bg-color, #0f1115);--bg-gradient: var(--bg-gradient-light);--lg-rim-lit: .95;--lg-rim-dark: .04;--lg-rim-hold: 1px;--lg-rim-fade: 12px;--lg-rim-side: 4px;--glass-easing: cubic-bezier(.32, .72, 0, 1);--glass-duration: .28s;--glass-refraction-filter: url(#glass-distortion);--glass-backdrop-blur: blur(5px) saturate(130%);--glass-backdrop-blur-surface: blur(14px) saturate(135%);--glass-backdrop-blur-panel: blur(14px) saturate(135%);--glass-backdrop-filter: blur(5px) saturate(130%);--glass-backdrop-filter-surface: blur(14px) saturate(135%);--glass-backdrop-filter-panel: blur(14px) saturate(135%);--glass-bg: rgba(255, 255, 255, .6);--glass-bg-hover: rgba(255, 255, 255, .68);--glass-bg-card: rgba(255, 255, 255, .6);--glass-bg-card-hover: rgba(255, 255, 255, .68);--glass-bg-surface: rgba(255, 255, 255, .72);--glass-bg-panel: rgba(255, 255, 255, .9);--glass-border: rgba(255, 255, 255, .4);--glass-shadow: 0 0 0 .5px rgba(0, 0, 0, .06), 0 8px 24px -6px rgba(0, 38, 59, .06), 0 2px 6px -2px rgba(0, 38, 59, .04);--glass-shadow-hover: 0 0 0 .5px rgba(0, 0, 0, .08), 0 14px 30px -8px rgba(0, 38, 59, .12), 0 4px 10px -2px rgba(0, 38, 59, .06);--lg-rim-display: block;--sidebar-width: 280px}[data-theme=dark]{--bg-gradient: var(--bg-gradient-dark);--lg-rim-lit: .22;--lg-rim-dark: 0;--glass-bg: rgba(31, 32, 34, .6);--glass-bg-hover: rgba(38, 40, 44, .68);--glass-bg-card: rgba(31, 32, 34, .6);--glass-bg-card-hover: rgba(38, 40, 44, .68);--glass-bg-surface: rgba(31, 32, 34, .72);--glass-bg-panel: rgba(31, 32, 34, .9);--glass-border: rgba(255, 255, 255, .09);--glass-shadow: 0 0 0 .5px rgba(255, 255, 255, .09), 0 10px 28px -6px rgba(0, 0, 0, .5), 0 3px 8px -2px rgba(0, 0, 0, .35);--glass-shadow-hover: 0 0 0 .5px rgba(255, 255, 255, .15), 0 16px 36px -8px rgba(0, 0, 0, .65), 0 4px 12px -2px rgba(0, 0, 0, .4)}@media(prefers-color-scheme:dark){:root:not([data-theme=light]){--bg-gradient: var(--bg-gradient-dark);--lg-rim-lit: .22;--lg-rim-dark: 0;--glass-bg: rgba(31, 32, 34, .6);--glass-bg-hover: rgba(38, 40, 44, .68);--glass-bg-card: rgba(31, 32, 34, .6);--glass-bg-card-hover: rgba(38, 40, 44, .68);--glass-bg-surface: rgba(31, 32, 34, .72);--glass-bg-panel: rgba(31, 32, 34, .9);--glass-border: rgba(255, 255, 255, .09);--glass-shadow: 0 0 0 .5px rgba(255, 255, 255, .09), 0 10px 28px -6px rgba(0, 0, 0, .5), 0 3px 8px -2px rgba(0, 0, 0, .35);--glass-shadow-hover: 0 0 0 .5px rgba(255, 255, 255, .15), 0 16px 36px -8px rgba(0, 0, 0, .65), 0 4px 12px -2px rgba(0, 0, 0, .4);--cgo-floating-scrim-start: var(--bg-color, #1a1a1a);--cgo-floating-scrim-end: rgba(26, 26, 26, 0)}}:root[glass-mode=blur],:root[data-glass-mode=blur],body[glass-mode=blur],body[data-glass-mode=blur],[glass-mode=blur],[data-glass-mode=blur]{--glass-refraction-filter: none;--glass-backdrop-blur: blur(5px) saturate(130%);--glass-backdrop-blur-surface: blur(14px) saturate(135%);--glass-backdrop-filter: blur(5px) saturate(130%);--glass-backdrop-filter-surface: blur(14px) saturate(135%);--glass-bg: rgba(255, 255, 255, .6);--glass-bg-hover: rgba(255, 255, 255, .68);--glass-bg-card: rgba(255, 255, 255, .6);--glass-bg-card-hover: rgba(255, 255, 255, .68);--glass-bg-surface: rgba(255, 255, 255, .72);--glass-bg-panel: rgba(255, 255, 255, .9);--glass-border: rgba(255, 255, 255, .4);--glass-shadow: 0 0 0 .5px rgba(0, 0, 0, .06), 0 8px 24px -6px rgba(0, 38, 59, .06), 0 2px 6px -2px rgba(0, 38, 59, .04);--glass-shadow-hover: 0 0 0 .5px rgba(0, 0, 0, .08), 0 14px 30px -8px rgba(0, 38, 59, .12), 0 4px 10px -2px rgba(0, 38, 59, .06);--lg-rim-display: block}:root[glass-mode=liquid],:root[data-glass-mode=liquid],body[glass-mode=liquid],body[data-glass-mode=liquid],[glass-mode=liquid],[data-glass-mode=liquid]{--glass-refraction-filter: url(#glass-distortion);--glass-backdrop-blur: blur(5px) saturate(130%);--glass-backdrop-blur-surface: blur(14px) saturate(135%);--glass-backdrop-filter: blur(5px) saturate(130%);--glass-backdrop-filter-surface: blur(14px) saturate(135%);--glass-bg: rgba(255, 255, 255, .6);--glass-bg-hover: rgba(255, 255, 255, .68);--glass-bg-card: rgba(255, 255, 255, .6);--glass-bg-card-hover: rgba(255, 255, 255, .68);--glass-bg-surface: rgba(255, 255, 255, .72);--glass-bg-panel: rgba(255, 255, 255, .9);--glass-border: rgba(255, 255, 255, .4);--glass-shadow: 0 0 0 .5px rgba(0, 0, 0, .06), 0 8px 24px -6px rgba(0, 38, 59, .06), 0 2px 6px -2px rgba(0, 38, 59, .04);--glass-shadow-hover: 0 0 0 .5px rgba(0, 0, 0, .08), 0 14px 30px -8px rgba(0, 38, 59, .12), 0 4px 10px -2px rgba(0, 38, 59, .06);--lg-rim-display: block}[data-theme=dark][glass-mode=blur],[data-theme=dark][data-glass-mode=blur],[data-theme=dark] body[glass-mode=blur],[data-theme=dark] body[data-glass-mode=blur],[data-theme=dark] [glass-mode=blur],[data-theme=dark] [data-glass-mode=blur],[data-theme=dark][glass-mode=liquid],[data-theme=dark][data-glass-mode=liquid],[data-theme=dark] body[glass-mode=liquid],[data-theme=dark] body[data-glass-mode=liquid],[data-theme=dark] [glass-mode=liquid],[data-theme=dark] [data-glass-mode=liquid]{--glass-bg: rgba(31, 32, 34, .6);--glass-bg-hover: rgba(38, 40, 44, .68);--glass-bg-card: rgba(31, 32, 34, .6);--glass-bg-card-hover: rgba(38, 40, 44, .68);--glass-bg-surface: rgba(31, 32, 34, .72);--glass-bg-panel: rgba(31, 32, 34, .9);--glass-border: rgba(255, 255, 255, .09);--glass-shadow: 0 0 0 .5px rgba(255, 255, 255, .09), 0 10px 28px -6px rgba(0, 0, 0, .5), 0 3px 8px -2px rgba(0, 0, 0, .35);--glass-shadow-hover: 0 0 0 .5px rgba(255, 255, 255, .15), 0 16px 36px -8px rgba(0, 0, 0, .65), 0 4px 12px -2px rgba(0, 0, 0, .4)}@media(prefers-color-scheme:dark){:root:not([data-theme=light])[glass-mode=blur],:root:not([data-theme=light])[data-glass-mode=blur],:root:not([data-theme=light]) body[glass-mode=blur],:root:not([data-theme=light]) body[data-glass-mode=blur],:root:not([data-theme=light]) [glass-mode=blur],:root:not([data-theme=light]) [data-glass-mode=blur],:root:not([data-theme=light])[glass-mode=liquid],:root:not([data-theme=light])[data-glass-mode=liquid],:root:not([data-theme=light]) body[glass-mode=liquid],:root:not([data-theme=light]) body[data-glass-mode=liquid],:root:not([data-theme=light]) [glass-mode=liquid],:root:not([data-theme=light]) [data-glass-mode=liquid]{--glass-bg: rgba(31, 32, 34, .6);--glass-bg-hover: rgba(38, 40, 44, .68);--glass-bg-card: rgba(31, 32, 34, .6);--glass-bg-card-hover: rgba(38, 40, 44, .68);--glass-bg-surface: rgba(31, 32, 34, .72);--glass-bg-panel: rgba(31, 32, 34, .9);--glass-border: rgba(255, 255, 255, .09);--glass-shadow: 0 0 0 .5px rgba(255, 255, 255, .09), 0 10px 28px -6px rgba(0, 0, 0, .5), 0 3px 8px -2px rgba(0, 0, 0, .35);--glass-shadow-hover: 0 0 0 .5px rgba(255, 255, 255, .15), 0 16px 36px -8px rgba(0, 0, 0, .65), 0 4px 12px -2px rgba(0, 0, 0, .4)}}:root[glass-mode=flat],:root[glass-mode=none],:root[data-glass-mode=flat],:root[data-glass-mode=none],body[glass-mode=flat],body[glass-mode=none],body[data-glass-mode=flat],body[data-glass-mode=none],[glass-mode=flat],[glass-mode=none],[data-glass-mode=flat],[data-glass-mode=none]{--glass-refraction-filter: none;--glass-backdrop-blur: none;--glass-backdrop-blur-surface: none;--glass-backdrop-filter: none;--glass-backdrop-filter-surface: none;--glass-bg: var(--card-bg, #ffffff);--glass-bg-hover: var(--card-bg, #ffffff);--glass-bg-card: var(--card-bg, #ffffff);--glass-bg-card-hover: var(--card-bg, #ffffff);--glass-bg-surface: var(--card-bg, #ffffff);--glass-bg-panel: var(--card-bg, #ffffff);--glass-border: var(--border-color, #dee2e6);--glass-shadow: var(--shadow-sm, 0 2px 8px rgba(0, 0, 0, .06));--glass-shadow-hover: var(--shadow-md, 0 4px 15px rgba(0, 0, 0, .08));--lg-rim-display: none}:root{--map-bg: #ffffff;--station-stroke: #00263b;--not-open-color: #bdcbd2;--panel-header-bg: #00263b;--panel-header-text: #ffffff;--close-btn-color: rgba(255, 255, 255, .6);--capsule-bg: #ffffff;--capsule-text: #333333;--stops-tag-bg: #f0f2f5;--control-bg: #ffffff;--ctrl-btn-bg: #f0f2f5;--ctrl-icon: #333333;--ctrl-hover: #e1e4e8;--divider: #e0e0e0;--list-hover: #f0f2f5;--sta-stroke-width-cn: 2px;--sta-stroke-width-en: 1.75px}[data-theme=dark]{--map-bg: #1a1a1a;--station-stroke: #bdcbd2;--not-open-color: #4e4e4e;--panel-header-bg: #373838;--panel-header-text: #e5e8ea;--close-btn-color: #78848b;--capsule-bg: #1f2020;--capsule-text: #78848b;--stops-tag-bg: #78848b;--control-bg: #1f2020;--ctrl-btn-bg: #373838;--ctrl-icon: #78848b;--ctrl-hover: #4f4f4f;--divider: #333333;--list-hover: #373838}.line-bg{color:var(--line-color-text-light);display:inline-block}.line-bg.line-1号线八通线,.filter-tag[data-line="1号线八通线"].active{background-color:var(--line-color-1);color:var(--line-color-text-light)}.line-bg.line-2号线,.filter-tag[data-line="2号线"].active{background-color:var(--line-color-2);color:var(--line-color-text-light)}.line-bg.line-3号线,.filter-tag[data-line="3号线"].active{background-color:var(--line-color-3);color:var(--line-color-text-light)}.line-bg.line-4号线大兴线,.filter-tag[data-line="4号线大兴线"].active{background-color:var(--line-color-4);color:var(--line-color-text-light)}.line-bg.line-5号线,.filter-tag[data-line="5号线"].active{background-color:var(--line-color-5);color:var(--line-color-text-light)}.line-bg.line-6号线,.filter-tag[data-line="6号线"].active{background-color:var(--line-color-6);color:var(--line-color-text-light)}.line-bg.line-7号线,.filter-tag[data-line="7号线"].active{background-color:var(--line-color-7);color:var(--line-color-text-dark)}.line-bg.line-8号线,.filter-tag[data-line="8号线"].active{background-color:var(--line-color-8);color:var(--line-color-text-light)}.line-bg.line-9号线,.filter-tag[data-line="9号线"].active{background-color:var(--line-color-9);color:var(--line-color-text-dark)}.line-bg.line-10号线,.filter-tag[data-line="10号线"].active{background-color:var(--line-color-10);color:var(--line-color-text-light)}.line-bg.line-11号线,.filter-tag[data-line="11号线"].active{background-color:var(--line-color-11);color:var(--line-color-text-light)}.line-bg.line-12号线,.filter-tag[data-line="12号线"].active{background-color:var(--line-color-12);color:var(--line-color-text-light)}.line-bg.line-13号线,.filter-tag[data-line="13号线"].active{background-color:var(--line-color-13);color:var(--line-color-text-dark)}.line-bg.line-14号线,.filter-tag[data-line="14号线"].active{background-color:var(--line-color-14);color:var(--line-color-text-dark)}.line-bg.line-15号线,.filter-tag[data-line="15号线"].active{background-color:var(--line-color-15);color:var(--line-color-text-light)}.line-bg.line-16号线,.filter-tag[data-line="16号线"].active{background-color:var(--line-color-16);color:var(--line-color-text-light)}.line-bg.line-17号线,.filter-tag[data-line="17号线"].active{background-color:var(--line-color-17);color:var(--line-color-text-light)}.line-bg.line-18号线,.filter-tag[data-line="18号线"].active{background-color:var(--line-color-18);color:var(--line-color-text-light)}.line-bg.line-19号线,.filter-tag[data-line="19号线"].active{background-color:var(--line-color-19);color:var(--line-color-text-dark)}.line-bg.line-22号线,.filter-tag[data-line="22号线"].active{background-color:var(--line-color-22);color:var(--line-color-text-dark)}.line-bg.line-28号线,.filter-tag[data-line="28号线"].active{background-color:var(--line-color-28);color:var(--line-color-text-light)}.line-bg.line-亦庄线,.filter-tag[data-line=亦庄线].active{background-color:var(--line-color-24);color:var(--line-color-text-light)}.line-bg.line-亦庄T1线,.filter-tag[data-line=亦庄T1线].active{background-color:var(--line-color-t1);color:var(--line-color-text-light)}.line-bg.line-房山线,.filter-tag[data-line=房山线].active{background-color:var(--line-color-25);color:var(--line-color-text-light)}.line-bg.line-燕房线,.filter-tag[data-line=燕房线].active{background-color:var(--line-color-25w);color:var(--line-color-text-light)}.line-bg.line-S1线,.filter-tag[data-line=S1线].active{background-color:var(--line-color-26);color:var(--line-color-text-light)}.line-bg.line-昌平线,.filter-tag[data-line=昌平线].active{background-color:var(--line-color-27);color:var(--line-color-text-dark)}.line-bg.line-西郊线,.filter-tag[data-line=西郊线].active{background-color:var(--line-color-xj);color:var(--line-color-text-light)}.line-bg.line-首都机场线,.filter-tag[data-line=首都机场线].active{background-color:var(--line-color-cae);color:var(--line-color-text-dark)}.line-bg.line-大兴机场线,.filter-tag[data-line=大兴机场线].active{background-color:var(--line-color-dae);color:var(--line-color-text-light)}.line-bg.line-市郊S1线,.filter-tag[data-line=市郊S1线].active{background-color:var(--line-color-sub-s1);color:var(--line-color-text-light)}.line-bg.line-市郊S2线,.filter-tag[data-line=市郊S2线].active{background-color:var(--line-color-sub-s2);color:var(--line-color-text-light)}.line-bg.line-市郊S5线,.filter-tag[data-line=市郊S5线].active{background-color:var(--line-color-sub-s5);color:var(--line-color-text-light)}.line-bg.line-市郊S6线,.filter-tag[data-line=市郊S6线].active{background-color:var(--line-color-sub-s6);color:var(--line-color-text-light)}.filter-tag[data-line=all].active{background:var(--primary-color);color:var(--line-color-text-light)}.line-tag{display:inline-block;margin-left:5px;padding:1px 6px;border-radius:10px;font-size:11px;white-space:nowrap;vertical-align:middle}:root{--line-1-official: #c23a30;--line-2-official: #006098;--line-3-official: #e60033;--line-4-official: #008e9c;--line-5-official: #a6217f;--line-6-official: #d29700;--line-7-official: #fac671;--line-8-official: #009b6b;--line-9-official: #8fc31f;--line-10-official: #009bc0;--line-11-official: #ed796b;--line-12-official: #c76b00;--line-13-official: #f9e700;--line-14-official: #d5a7a1;--line-15-official: #6a357d;--line-16-official: #76a32d;--line-17-official: #00a9a9;--line-18-official: #5654a2;--line-19-official: #d6abc1;--line-22-official: #f7c8ce;--line-28-official: #35570b;--line-24-official: #e40077;--line-t1-official: #e6081b;--line-25-official: #e46022;--line-25w-official: #e46022;--line-26-official: #b25921;--line-27-official: #de82b2;--line-xj-official: #e6081b;--line-cae-official: #a29bbb;--line-dae-official: #004ba0;--line-sub-s1-official: #717071;--line-sub-s2-official: #717071;--line-sub-s5-official: #717071;--line-sub-s6-official: #717071;--line-text-light-official: #ffffff;--line-text-dark-official: #002538;--line-1-screen: #c23a30;--line-2-screen: #006098;--line-3-screen: #e60033;--line-4-screen: #008e9c;--line-5-screen: #a6217f;--line-6-screen: #d29700;--line-7-screen: #fac671;--line-8-screen: #009b63;--line-9-screen: #abcd03;--line-10-screen: #00a3c9;--line-11-screen: #ed796b;--line-12-screen: #c76b00;--line-13-screen: #f8de00;--line-14-screen: #d5a7a9;--line-15-screen: #6a357d;--line-16-screen: #6e992a;--line-17-screen: #00adb2;--line-18-screen: #5654a2;--line-19-screen: #d5abce;--line-22-screen: #f7c8ce;--line-28-screen: #35570b;--line-24-screen: #e40077;--line-t1-screen: #d80618;--line-25-screen: #e46022;--line-25w-screen: #e46022;--line-26-screen: #b25921;--line-27-screen: #ee87b4;--line-xj-screen: #d80618;--line-cae-screen: #a29bbb;--line-dae-screen: #004ba0;--line-sub-s1-screen: #d93932;--line-sub-s2-screen: #4080b7;--line-sub-s5-screen: #e98d95;--line-sub-s6-screen: #919a47;--line-text-light-screen: #ffffff;--line-text-dark-screen: #00263b;--line-color-1: var(--line-1-screen);--line-color-2: var(--line-2-screen);--line-color-3: var(--line-3-screen);--line-color-4: var(--line-4-screen);--line-color-5: var(--line-5-screen);--line-color-6: var(--line-6-screen);--line-color-7: var(--line-7-screen);--line-color-8: var(--line-8-screen);--line-color-9: var(--line-9-screen);--line-color-10: var(--line-10-screen);--line-color-11: var(--line-11-screen);--line-color-12: var(--line-12-screen);--line-color-13: var(--line-13-screen);--line-color-14: var(--line-14-screen);--line-color-15: var(--line-15-screen);--line-color-16: var(--line-16-screen);--line-color-17: var(--line-17-screen);--line-color-18: var(--line-18-screen);--line-color-19: var(--line-19-screen);--line-color-22: var(--line-22-screen);--line-color-28: var(--line-28-screen);--line-color-24: var(--line-24-screen);--line-color-t1: var(--line-t1-screen);--line-color-25: var(--line-25-screen);--line-color-25w: var(--line-25w-screen);--line-color-26: var(--line-26-screen);--line-color-27: var(--line-27-screen);--line-color-xj: var(--line-xj-screen);--line-color-cae: var(--line-cae-screen);--line-color-dae: var(--line-dae-screen);--line-color-sub-s1: var(--line-sub-s1-screen);--line-color-sub-s2: var(--line-sub-s2-screen);--line-color-sub-s5: var(--line-sub-s5-screen);--line-color-sub-s6: var(--line-sub-s6-screen);--line-color-text-light: var(--line-text-light-screen);--line-color-text-dark: var(--line-text-dark-screen)}[data-color-palette=official]{--line-color-1: var(--line-1-official);--line-color-2: var(--line-2-official);--line-color-3: var(--line-3-official);--line-color-4: var(--line-4-official);--line-color-5: var(--line-5-official);--line-color-6: var(--line-6-official);--line-color-7: var(--line-7-official);--line-color-8: var(--line-8-official);--line-color-9: var(--line-9-official);--line-color-10: var(--line-10-official);--line-color-11: var(--line-11-official);--line-color-12: var(--line-12-official);--line-color-13: var(--line-13-official);--line-color-14: var(--line-14-official);--line-color-15: var(--line-15-official);--line-color-16: var(--line-16-official);--line-color-17: var(--line-17-official);--line-color-18: var(--line-18-official);--line-color-19: var(--line-19-official);--line-color-22: var(--line-22-official);--line-color-28: var(--line-28-official);--line-color-24: var(--line-24-official);--line-color-t1: var(--line-t1-official);--line-color-25: var(--line-25-official);--line-color-25w: var(--line-25w-official);--line-color-26: var(--line-26-official);--line-color-27: var(--line-27-official);--line-color-xj: var(--line-xj-official);--line-color-cae: var(--line-cae-official);--line-color-dae: var(--line-dae-official);--line-color-sub-s1: var(--line-sub-s1-official);--line-color-sub-s2: var(--line-sub-s2-official);--line-color-sub-s5: var(--line-sub-s5-official);--line-color-sub-s6: var(--line-sub-s6-official);--line-color-text-light: var(--line-text-light-official);--line-color-text-dark: var(--line-text-dark-official)}[data-color-palette=screen]{--line-color-1: var(--line-1-screen);--line-color-2: var(--line-2-screen);--line-color-3: var(--line-3-screen);--line-color-4: var(--line-4-screen);--line-color-5: var(--line-5-screen);--line-color-6: var(--line-6-screen);--line-color-7: var(--line-7-screen);--line-color-8: var(--line-8-screen);--line-color-9: var(--line-9-screen);--line-color-10: var(--line-10-screen);--line-color-11: var(--line-11-screen);--line-color-12: var(--line-12-screen);--line-color-13: var(--line-13-screen);--line-color-14: var(--line-14-screen);--line-color-15: var(--line-15-screen);--line-color-16: var(--line-16-screen);--line-color-17: var(--line-17-screen);--line-color-18: var(--line-18-screen);--line-color-19: var(--line-19-screen);--line-color-22: var(--line-22-screen);--line-color-28: var(--line-28-screen);--line-color-24: var(--line-24-screen);--line-color-t1: var(--line-t1-screen);--line-color-25: var(--line-25-screen);--line-color-25w: var(--line-25w-screen);--line-color-26: var(--line-26-screen);--line-color-27: var(--line-27-screen);--line-color-xj: var(--line-xj-screen);--line-color-cae: var(--line-cae-screen);--line-color-dae: var(--line-dae-screen);--line-color-sub-s1: var(--line-sub-s1-screen);--line-color-sub-s2: var(--line-sub-s2-screen);--line-color-sub-s5: var(--line-sub-s5-screen);--line-color-sub-s6: var(--line-sub-s6-screen);--line-color-text-light: var(--line-text-light-screen);--line-color-text-dark: var(--line-text-dark-screen)}:root{--avatar-color-red: #d93025;--avatar-color-orange: #e46022;--avatar-color-amber: #d29700;--avatar-color-yellow: #e8b800;--avatar-color-lime: #8fc31f;--avatar-color-green: #009655;--avatar-color-teal: #008e9c;--avatar-color-sky: #009bc0;--avatar-color-blue: #006098;--avatar-color-indigo: #3a4db8;--avatar-color-purple: #6a357d;--avatar-color-pink: #de82b2;--avatar-color-brown: #b25921;--avatar-color-gray: #78848b;--avatar-color-dark: #00263b;--avatar-color-0: #ef4444;--avatar-color-1: #f87171;--avatar-color-2: #f97316;--avatar-color-3: #fb923c;--avatar-color-4: #f59e0b;--avatar-color-5: #eab308;--avatar-color-6: #fef08a;--avatar-color-7: #84cc16;--avatar-color-8: #a3e635;--avatar-color-9: #22c55e;--avatar-color-10: #10b981;--avatar-color-11: #059669;--avatar-color-12: #064e3b;--avatar-color-13: #0d9488;--avatar-color-14: #14b8a6;--avatar-color-15: #22d3ee;--avatar-color-16: #38bdf8;--avatar-color-17: #2563eb;--avatar-color-18: #1d4ed8;--avatar-color-19: #1e3a8a;--avatar-color-20: #4f46e5;--avatar-color-21: #6366f1;--avatar-color-22: #8b5cf6;--avatar-color-23: #c084fc;--avatar-color-24: #d946ef;--avatar-color-25: #ec4899;--avatar-color-26: #f472b6;--avatar-color-27: #fda4af;--avatar-color-28: #64748b;--avatar-color-29: #334155}.avatar-color-red{color:var(--avatar-color-red);fill:var(--avatar-color-red)}.avatar-color-orange{color:var(--avatar-color-orange);fill:var(--avatar-color-orange)}.avatar-color-amber{color:var(--avatar-color-amber);fill:var(--avatar-color-amber)}.avatar-color-yellow{color:var(--avatar-color-yellow);fill:var(--avatar-color-yellow)}.avatar-color-lime{color:var(--avatar-color-lime);fill:var(--avatar-color-lime)}.avatar-color-green{color:var(--avatar-color-green);fill:var(--avatar-color-green)}.avatar-color-teal{color:var(--avatar-color-teal);fill:var(--avatar-color-teal)}.avatar-color-sky{color:var(--avatar-color-sky);fill:var(--avatar-color-sky)}.avatar-color-blue{color:var(--avatar-color-blue);fill:var(--avatar-color-blue)}.avatar-color-indigo{color:var(--avatar-color-indigo);fill:var(--avatar-color-indigo)}.avatar-color-purple{color:var(--avatar-color-purple);fill:var(--avatar-color-purple)}.avatar-color-pink{color:var(--avatar-color-pink);fill:var(--avatar-color-pink)}.avatar-color-brown{color:var(--avatar-color-brown);fill:var(--avatar-color-brown)}.avatar-color-gray{color:var(--avatar-color-gray);fill:var(--avatar-color-gray)}.avatar-color-dark{color:var(--avatar-color-dark);fill:var(--avatar-color-dark)}.avatar-color-0{color:var(--avatar-color-0);fill:var(--avatar-color-0)}.avatar-color-1{color:var(--avatar-color-1);fill:var(--avatar-color-1)}.avatar-color-2{color:var(--avatar-color-2);fill:var(--avatar-color-2)}.avatar-color-3{color:var(--avatar-color-3);fill:var(--avatar-color-3)}.avatar-color-4{color:var(--avatar-color-4);fill:var(--avatar-color-4)}.avatar-color-5{color:var(--avatar-color-5);fill:var(--avatar-color-5)}.avatar-color-6{color:var(--avatar-color-6);fill:var(--avatar-color-6)}.avatar-color-7{color:var(--avatar-color-7);fill:var(--avatar-color-7)}.avatar-color-8{color:var(--avatar-color-8);fill:var(--avatar-color-8)}.avatar-color-9{color:var(--avatar-color-9);fill:var(--avatar-color-9)}.avatar-color-10{color:var(--avatar-color-10);fill:var(--avatar-color-10)}.avatar-color-11{color:var(--avatar-color-11);fill:var(--avatar-color-11)}.avatar-color-12{color:var(--avatar-color-12);fill:var(--avatar-color-12)}.avatar-color-13{color:var(--avatar-color-13);fill:var(--avatar-color-13)}.avatar-color-14{color:var(--avatar-color-14);fill:var(--avatar-color-14)}.avatar-color-15{color:var(--avatar-color-15);fill:var(--avatar-color-15)}.avatar-color-16{color:var(--avatar-color-16);fill:var(--avatar-color-16)}.avatar-color-17{color:var(--avatar-color-17);fill:var(--avatar-color-17)}.avatar-color-18{color:var(--avatar-color-18);fill:var(--avatar-color-18)}.avatar-color-19{color:var(--avatar-color-19);fill:var(--avatar-color-19)}.avatar-color-20{color:var(--avatar-color-20);fill:var(--avatar-color-20)}.avatar-color-21{color:var(--avatar-color-21);fill:var(--avatar-color-21)}.avatar-color-22{color:var(--avatar-color-22);fill:var(--avatar-color-22)}.avatar-color-23{color:var(--avatar-color-23);fill:var(--avatar-color-23)}.avatar-color-24{color:var(--avatar-color-24);fill:var(--avatar-color-24)}.avatar-color-25{color:var(--avatar-color-25);fill:var(--avatar-color-25)}.avatar-color-26{color:var(--avatar-color-26);fill:var(--avatar-color-26)}.avatar-color-27{color:var(--avatar-color-27);fill:var(--avatar-color-27)}.avatar-color-28{color:var(--avatar-color-28);fill:var(--avatar-color-28)}.avatar-color-29{color:var(--avatar-color-29);fill:var(--avatar-color-29)}:root{--level-default-gradient: linear-gradient(135deg, #1282b8, #009655);--level-test-gradient: linear-gradient(135deg, #e98913, #f7b52c);--level-prime-gradient: linear-gradient(135deg, #1c1887, #5f1985);--level-admin-gradient: linear-gradient(135deg, #5c1c24, #e5757e)}:root{--brand-color-vitool: #ad78eb;--brand-gradient-start-vitool: #8a56dd;--brand-gradient-end-vitool: #af80d2;--brand-gradient-vitool: linear-gradient( to top, var(--brand-gradient-start-vitool), var(--brand-gradient-end-vitool) );--brand-border-vitool: #7549bc;--brand-color-wall: #a35490;--brand-gradient-start-wall: #843d79;--brand-gradient-end-wall: #c46ea9;--brand-gradient-wall: linear-gradient(to top, var(--brand-gradient-start-wall), var(--brand-gradient-end-wall));--brand-border-wall: #683060;--brand-color-stasign: #8787eb;--brand-gradient-start-stasign: #7146c2;--brand-gradient-end-stasign: #92a6fc;--brand-gradient-stasign: linear-gradient( to top, var(--brand-gradient-start-stasign), var(--brand-gradient-end-stasign) );--brand-border-stasign: #5442ab;--brand-color-staline: #66a1c8;--brand-gradient-start-staline: #3a6894;--brand-gradient-end-staline: #84c2db;--brand-gradient-staline: linear-gradient( to top, var(--brand-gradient-start-staline), var(--brand-gradient-end-staline) );--brand-border-staline: #30587d;--brand-color-project: #67caae;--brand-gradient-start-project: #43b1a2;--brand-gradient-end-project: #8fdeb2;--brand-gradient-project: linear-gradient( to top, var(--brand-gradient-start-project), var(--brand-gradient-end-project) );--brand-border-project: #399c8f;--brand-color-admin: #475569;--brand-gradient-start-admin: #334155;--brand-gradient-end-admin: #64748b;--brand-gradient-admin: linear-gradient(to top, var(--brand-gradient-start-admin), var(--brand-gradient-end-admin));--brand-border-admin: #1e293b;--brand-gradient-start-appname: var(--brand-gradient-start-vitool);--brand-gradient-end-appname: var(--brand-gradient-end-vitool);--brand-gradient-appname: linear-gradient( to top, var(--brand-gradient-start-appname), var(--brand-gradient-end-appname) );--brand-border-appname: var(--brand-border-vitool)}html[data-app=wall]{--brand-gradient-start-appname: var(--brand-gradient-start-wall);--brand-gradient-end-appname: var(--brand-gradient-end-wall);--brand-border-appname: var(--brand-border-wall)}html[data-app=stasign]{--brand-gradient-start-appname: var(--brand-gradient-start-stasign);--brand-gradient-end-appname: var(--brand-gradient-end-stasign);--brand-border-appname: var(--brand-border-stasign)}html[data-app=staline]{--brand-gradient-start-appname: var(--brand-gradient-start-staline);--brand-gradient-end-appname: var(--brand-gradient-end-staline);--brand-border-appname: var(--brand-border-staline)}html[data-app=project]{--brand-gradient-start-appname: var(--brand-gradient-start-project);--brand-gradient-end-appname: var(--brand-gradient-end-project);--brand-border-appname: var(--brand-border-project)}html[data-app=admin]{--brand-gradient-start-appname: var(--brand-gradient-start-admin);--brand-gradient-end-appname: var(--brand-gradient-end-admin);--brand-border-appname: var(--brand-border-admin)}';/*!
 * CGo UI — 主题引擎（明暗切换 + iframe 同步）
 * 移植自 cgoui/cgo_theme.js，保持完全一致的行为：
 *   - data-theme 属性应用到 <html>
 *   - 顶层窗口向所有 iframe 广播主题；子窗口监听 message 同步
 *   - localStorage 按工具前缀隔离；宿主可通过配置处理嵌入式页面
 *   - 系统主题变化在未手动设置时跟随
 */const Dt=["vitool","wall","stasign","staline","project","cgoauth","mc","enmap","guide","timetable"];function Rt(){let a="";try{const e=window.location.pathname,t=e.split("/").pop().replace(".html","");if((t==="index"||t==="real")&&(e.includes("/scmap")||e.includes("/scmap_original")||e.includes("/scmap_test")))return"scmap_app-theme";Dt.includes(t)&&(a=t+"_")}catch{}return a+"app-theme"}let Y=Rt();function Ft(a){a&&(Y=a)}function Gt(){return Y}function Z(a){document.documentElement.setAttribute("data-theme",a),document.querySelectorAll("cgo-theme-toggle").forEach(e=>e._sync&&e._sync(a)),tt(a),window.self===window.top&&document.querySelectorAll("iframe").forEach(e=>{try{e.contentWindow&&e.contentWindow.postMessage({type:"theme-change",theme:a},"*")}catch{}})}function ve(){return document.documentElement.getAttribute("data-theme")||"light"}function Qe(){const a=ve()==="dark"?"light":"dark";return localStorage.setItem(Y,a),Z(a),a}function et(){localStorage.removeItem(Y);const a=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";return Z(a),a}function Yt(){let a=!1;const e=typeof window<"u"&&window.CGoUIConfig?window.CGoUIConfig:{};try{const t=e.embed||{};t.hideHeader===!0&&(a=!0),t.queryParam&&t.queryValue&&new URLSearchParams(window.location.search).get(t.queryParam)===t.queryValue&&(a=!0)}catch{}try{typeof e.shouldHideHeader=="function"&&e.shouldHideHeader({window})&&(a=!0)}catch{}if(a){const t=document.createElement("style");t.innerText=".tool-header, .bottom-bar, .status-bar { display: none !important; }",document.head.appendChild(t),document.documentElement.classList.add("is-iframe-vitool-hidden")}}function Kt(){if(window.addEventListener("message",a=>{a.data&&a.data.type==="theme-change"&&Z(a.data.theme)}),window.self!==window.top)try{const a=window.parent.document.documentElement.getAttribute("data-theme");a&&setTimeout(()=>Z(a),50)}catch{try{window.parent.postMessage({type:"theme-request"},"*")}catch{}}}const Wt=Jt(),Xt=Qt();function Jt(){return'<path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/>'}function Qt(){return'<path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/>'}function tt(a){const e=document.getElementById("theme-toggle-btn");if(!e)return;const t=e.querySelector(".btn-icon");t&&(t.innerHTML=a==="dark"?Xt:Wt)}function e2(){const a=document.getElementById("theme-toggle-btn");if(!a||a._cgoThemeBound)return;a._cgoThemeBound=!0,tt(ve());let e=null,t=!1;a.addEventListener("pointerdown",r=>{r.button!==0&&r.pointerType==="mouse"||(t=!1,e=setTimeout(()=>{t=!0,et(),navigator.vibrate&&navigator.vibrate(50)},800))});const o=()=>{e&&(clearTimeout(e),e=null)};a.addEventListener("pointerup",o),a.addEventListener("pointerleave",o),a.addEventListener("pointercancel",o),a.oncontextmenu=r=>(r.preventDefault(),r.stopPropagation(),!1),a.addEventListener("click",r=>{if(t){r.preventDefault(),r.stopPropagation(),t=!1;return}Qe()})}let Ee=!1,m1=null;function t2(){let a="";try{if(typeof window<"u"&&window.location&&window.location.pathname){const t=window.location.pathname.replace(/\.html$/,"").replace(/\/index$/,"").replace(/^\//,"").replace(/\/$/,"");a=t?t.replace(/[^a-zA-Z0-9_-]/g,"_")+"_":"root_"}}catch{}return a+"cgo_theme_color_config"}let c1=t2();function z1(a){a&&(c1=a)}function Z1(){return c1}function a2(a){if(!a||typeof a!="string")return null;let e=a.trim().replace(/^#/,"");if(e.length===3&&(e=e.split("").map(o=>o+o).join("")),e.length!==6)return null;const t=parseInt(e,16);return[t>>16&255,t>>8&255,t&255]}function o2(a,e,t){a/=255,e/=255,t/=255;const o=Math.max(a,e,t),r=Math.min(a,e,t);let i=0,s=0,n=(o+r)/2;if(o!==r){const c=o-r;switch(s=n>.5?c/(2-o-r):c/(o+r),o){case a:i=(e-t)/c+(e<t?6:0);break;case e:i=(t-a)/c+2;break;case t:i=(a-e)/c+4;break}i/=6}return[Math.round(i*360),Math.round(s*100),Math.round(n*100)]}function S(a,e,t){a=(a%360+360)%360,e=Math.max(0,Math.min(100,e))/100,t=Math.max(0,Math.min(100,t))/100;const o=(1-Math.abs(2*t-1))*e,r=o*(1-Math.abs(a/60%2-1)),i=t-o/2;let s=0,n=0,c=0;a<60?(s=o,n=r,c=0):a<120?(s=r,n=o,c=0):a<180?(s=0,n=o,c=r):a<240?(s=0,n=r,c=o):a<300?(s=r,n=0,c=o):(s=o,n=0,c=r);const h=b=>Math.round((b+i)*255).toString(16).padStart(2,"0");return`#${h(s)}${h(n)}${h(c)}`}function g1(a){if(!a)return null;const e=a2(a);if(!e)return null;const[t,o,r]=o2(...e);if(a.toLowerCase()==="#00263b")return{primary:"#00263b",primaryHover:"#004060",darkPrimary:"#006098",darkPrimaryHover:"#0070b0",textMain:"#00263b",darkTextMain:"#e5e8ea",textLight:"#636f75",darkTextLight:"#a0b0b9"};let i;r>48?i=Math.max(30,Math.min(38,Math.round(r*.62))):i=Math.min(48,Math.max(32,r));const s=Math.min(98,Math.max(60,o)),n=S(t,s,i),c=Math.max(24,i-7),h=S(t,s,c),b=Math.min(62,Math.max(45,r>48?r*.8:i+12)),d=Math.min(98,Math.max(65,o)),f=S(t,d,b),p=Math.min(72,b+8),u=S(t,d,p),y=Math.min(100,Math.max(50,o)),w=S(t,y,11),_=Math.min(22,Math.max(8,Math.round(o*.2))),D=S(t,_,91),w1=Math.min(30,Math.max(12,Math.round(o*.3))),l1=S(t,w1,42),d1=Math.min(25,Math.max(10,Math.round(o*.25))),$=S(t,d1,72);return{primary:n,primaryHover:h,darkPrimary:f,darkPrimaryHover:u,textMain:w,darkTextMain:D,textLight:l1,darkTextLight:$}}function b1(a,e={}){if(!a)return f1(),null;const t=g1(a);if(!t)return console.warn("[CGoUI Theme] Invalid base color provided:",a),null;const o={...t,...e};m1={baseColor:a,overrides:e,palette:o};try{localStorage.setItem(c1,JSON.stringify(m1))}catch{}return r2(o),o}function f1(){m1=null;try{localStorage.removeItem(c1)}catch{}const a=document.getElementById("cgo-theme-color-style");a&&a.parentNode&&a.parentNode.removeChild(a)}function S1(){return m1}function r2(a){if(typeof document>"u")return;let e=document.getElementById("cgo-theme-color-style");e||(e=document.createElement("style"),e.id="cgo-theme-color-style",document.head.appendChild(e)),e.textContent=`
:root {
  --primary-color: ${a.primary};
  --primary-hover: ${a.primaryHover};
  --text-main: ${a.textMain};
  --text-light: ${a.textLight};
  --text-color: var(--text-main);
  --table-head-text: ${a.textMain};
}
[data-theme='dark'] {
  --primary-color: ${a.darkPrimary};
  --primary-hover: ${a.darkPrimaryHover};
  --text-main: ${a.darkTextMain||a.textMain};
  --text-light: ${a.darkTextLight};
  --table-head-text: ${a.darkTextMain||a.textMain};
}
`}function M(){if(typeof document>"u"||document.getElementById("glass-distortion")||document.getElementById("cgo-glass-svg"))return;const a=document.createElementNS("http://www.w3.org/2000/svg","svg");a.id="cgo-glass-svg",a.setAttribute("style","position: absolute; width: 0; height: 0; overflow: hidden; pointer-events: none;"),a.setAttribute("aria-hidden","true"),a.innerHTML=`
        <defs>
            <filter id="glass-distortion" x="0%" y="0%" width="100%" height="100%" filterUnits="objectBoundingBox" color-interpolation-filters="sRGB">
                <feTurbulence type="fractalNoise" baseFrequency="0.01 0.01" numOctaves="1" seed="5" result="turbulence" />
                <feComponentTransfer in="turbulence" result="mapped">
                    <feFuncR type="gamma" amplitude="1" exponent="10" offset="0.5" />
                    <feFuncG type="gamma" amplitude="0" exponent="1" offset="0" />
                    <feFuncB type="gamma" amplitude="0" exponent="1" offset="0.5" />
                </feComponentTransfer>
                <feGaussianBlur in="turbulence" stdDeviation="3" result="softMap" />
                <feSpecularLighting in="softMap" surfaceScale="5" specularConstant="1" specularExponent="100" lighting-color="white" result="specLight">
                    <fePointLight x="-200" y="-200" z="300" />
                </feSpecularLighting>
                <feComposite in="specLight" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="litImage" />
                <feDisplacementMap in="SourceGraphic" in2="softMap" scale="20" xChannelSelector="R" yChannelSelector="G" />
            </filter>
        </defs>
    `;const e=()=>{!document.getElementById("glass-distortion")&&!document.getElementById("cgo-glass-svg")&&(document.body||document.documentElement).appendChild(a),document.documentElement.style.getPropertyValue("--glass-refraction-filter")||document.documentElement.style.setProperty("--glass-refraction-filter","url(#glass-distortion)")};document.body?e():document.addEventListener("DOMContentLoaded",e,{once:!0})}function Ce(a){typeof document>"u"||(a==="flat"||a==="none"?document.documentElement.setAttribute("glass-mode","flat"):a==="blur"?document.documentElement.setAttribute("glass-mode","blur"):a==="liquid"?document.documentElement.setAttribute("glass-mode","liquid"):a||document.documentElement.setAttribute("glass-mode","liquid"))}function I1(){var a;return typeof document>"u"?"liquid":document.documentElement.getAttribute("glass-mode")||((a=getComputedStyle(document.documentElement).getPropertyValue("--cgo-glass-default"))==null?void 0:a.trim())||"liquid"}function Ae(a){typeof document>"u"||document.documentElement.style.setProperty("--cgo-glass-default",a)}function i2(){let a="";try{if(typeof window<"u"&&window.location&&window.location.pathname){const t=window.location.pathname.replace(/\.html$/,"").replace(/\/index$/,"").replace(/^\//,"").replace(/\/$/,"");a=t?t.replace(/[^a-zA-Z0-9_-]/g,"_")+"_":"root_"}}catch{}return a+"cgo_header_mode"}let y1=i2();function P1(a){a&&(y1=a)}function He(){return y1}function N(a){if(typeof document>"u")return;const e=a==="classic"?"classic":"floating";e==="classic"?document.documentElement.setAttribute("header-mode","classic"):document.documentElement.setAttribute("header-mode","floating");try{localStorage.setItem(y1,e)}catch{}return document.querySelectorAll("cgo-header-toggle").forEach(t=>t._sync&&t._sync(e)),typeof window<"u"&&window.dispatchEvent(new CustomEvent("cgo-header-mode-change",{detail:{mode:e}})),e}function s1(){var a;return typeof document>"u"?"floating":document.documentElement.getAttribute("header-mode")||((a=getComputedStyle(document.documentElement).getPropertyValue("--cgo-header-default"))==null?void 0:a.trim())||"floating"}function O1(){const a=s1()==="classic"?"floating":"classic";return N(a),a}function Te(a){typeof document>"u"||document.documentElement.style.setProperty("--cgo-header-default",a)}function F(a=typeof document<"u"?document:null){if(!a||typeof document>"u")return;try{if(document.body&&!document.querySelector(".mobile-status-bar-fill")){const t=document.createElement("div");t.className="mobile-status-bar-fill",t.setAttribute("aria-hidden","true"),document.body.prepend(t)}}catch{}const e=[];a.matches&&a.matches(".tool-header")&&e.push(a),a.querySelectorAll&&a.querySelectorAll(".tool-header").forEach(t=>e.push(t)),e.forEach(t=>{if(!t||t.dataset.cgoHeaderUpgraded==="true"||t.getAttribute("header-mode")==="classic"||t.classList.contains("classic-header")||document.documentElement.getAttribute("header-mode")==="classic"||t.querySelector(".header-island"))return;const o=t.querySelector(":scope > .header-left, .header-left"),r=t.querySelector(":scope > .header-center, .header-center"),i=t.querySelector(":scope > .header-right, .header-right");if(!o&&!r&&!i)return;const s=t.classList.contains("glass-surface"),n=document.createElement("div");if(n.className="header-island header-island-left"+(s?" glass-surface":""),o&&n.appendChild(o),o&&r){const b=document.createElement("div");b.className="header-island-divider",b.setAttribute("aria-hidden","true"),n.appendChild(b)}r&&n.appendChild(r);const c=document.createElement("div");c.className="header-island header-island-right"+(s?" glass-surface":""),i&&c.appendChild(i);const h=Array.from(t.childNodes).filter(b=>b!==o&&b!==r&&b!==i);t.innerHTML="",t.appendChild(n),t.appendChild(c),h.forEach(b=>{b.nodeType===3&&!b.textContent.trim()||t.appendChild(b)}),t.dataset.cgoHeaderUpgraded="true"})}function s2(){if(Ee)return;Ee=!0;try{if(typeof document<"u"&&!document.getElementById("cgo-clr-style")){const o=document.createElement("style");o.id="cgo-clr-style",o.textContent=Ut,document.head.prepend(o)}}catch(o){console.warn("Failed to auto-inject cgo_clr.css:",o)}M(),Yt(),Kt();const a=window.matchMedia("(prefers-color-scheme: dark)");Z(localStorage.getItem(Y)||(a.matches?"dark":"light")),a.addEventListener("change",o=>{localStorage.getItem(Y)||Z(o.matches?"dark":"light")});try{const o=localStorage.getItem(c1);if(o){const r=JSON.parse(o);r&&r.baseColor&&b1(r.baseColor,r.overrides||{})}}catch{}try{const o=document.documentElement.getAttribute("header-mode");if(o==="classic")N("classic");else if(o==="floating")N("floating");else{const r=localStorage.getItem(y1);if(r)N(r);else{const i=s1();i&&(document.documentElement.hasAttribute("header-mode")||document.documentElement.setAttribute("header-mode",i),document.querySelectorAll("cgo-header-toggle").forEach(s=>s._sync&&s._sync(i)))}}}catch{}try{const o=I1();o&&!document.documentElement.hasAttribute("glass-mode")&&document.documentElement.setAttribute("glass-mode",o)}catch{}const t=()=>{F(document)};if(typeof document<"u"&&(document.readyState==="loading"?document.addEventListener("DOMContentLoaded",t,{once:!0}):t(),typeof MutationObserver<"u"&&!document._cgoHeaderObserver)){document._cgoHeaderObserver=!0;const o=new MutationObserver(i=>{for(const s of i)for(const n of s.addedNodes)n.nodeType===1&&(n.matches&&n.matches(".tool-header")||n.querySelectorAll)&&F(n)}),r=document.documentElement||document.body;r&&o.observe(r,{childList:!0,subtree:!0})}}class N1 extends x{constructor(){super(),this.variant="liquid-glass",this.tier="c",this.title="",this.header="",this.icon="",this.glassMode=""}connectedCallback(){super.connectedCallback(),M()}render(){const t=!(this.variant==="flat"||this.glassMode==="flat"||this.glassMode==="none")&&this.variant!=="info"&&this.variant!=="danger",o=(this.tier||"").toLowerCase().trim(),r=o==="a"||this.variant==="interactive"?"a":o==="b"?"b":"c",i=r==="a"?"tier-a":r==="b"?"tier-b":"tier-c",s=this.title||this.header;return l`
            <section class="card ${this.variant} ${i}">
                ${t?l`<div class="glass-refraction" aria-hidden="true"></div>`:null}
                <div class="content-wrapper">
                    ${s?l`
                              <div class="header-row">
                                  ${this.icon?l`<cgo-icon name="${this.icon}" size="18"></cgo-icon>`:null}
                                  <h3>${s}</h3>
                              </div>
                          `:null}
                    <div class="body"><slot></slot></div>
                </div>
            </section>
        `}}g(N1,"properties",{variant:{type:String},tier:{type:String,reflect:!0},title:{type:String},header:{type:String},icon:{type:String},glassMode:{type:String,attribute:"glass-mode",reflect:!0}}),g(N1,"styles",m`
        :host {
            display: block;
            font-family: var(--font-sans, system-ui, sans-serif);
        }
        .card {
            position: relative;
            padding: 24px;
            border-radius: var(--radius-lg, 12px);
            background: transparent;
            color: var(--text-main, #00263b);
            border: none;
            box-shadow: var(--glass-shadow);
            box-sizing: border-box;
            transition: box-shadow var(--glass-duration, 0.28s) var(--glass-easing, cubic-bezier(0.32, 0.72, 0, 1)),
                        transform var(--glass-duration, 0.28s) var(--glass-easing, cubic-bezier(0.32, 0.72, 0, 1));
            overflow: hidden;
            isolation: isolate;
        }

        /* ===== 玻璃卡片体系（默认对齐 Tier C 不可交互强调表面） ===== */
        .glass,
        .liquid-glass,
        .tier-a,
        .tier-b,
        .tier-c,
        .card:not(.flat):not(.info):not(.danger) {
            background: transparent;
            border: none;
            box-shadow: var(--glass-shadow);
            overflow: hidden;
            isolation: isolate;
        }

        /* Layer 0: 折射磨砂层 (Tier C 默认) */
        ${z}

        /* Tier A Layer 0: 较轻模糊 (blur(5px) saturate(130%)) */
        .tier-a .glass-refraction {
            backdrop-filter: var(--glass-backdrop-filter, blur(5px) saturate(130%));
            -webkit-backdrop-filter: var(--glass-backdrop-filter, blur(5px) saturate(130%));
        }

        /* Tier B Layer 0: 深度模糊与折射 (blur(14px) saturate(135%)) */
        .tier-b .glass-refraction {
            backdrop-filter: var(--glass-backdrop-filter-surface, blur(14px) saturate(135%));
            -webkit-backdrop-filter: var(--glass-backdrop-filter-surface, blur(14px) saturate(135%));
        }

        /* Layer 1: 半透明底色衬底层 (默认 Tier C: 亮色 0.72, 暗色 0.72) */
        .card:not(.flat):not(.info):not(.danger)::after {
            content: "";
            position: absolute;
            inset: 0;
            z-index: 1;
            border-radius: inherit;
            background: var(--glass-bg-surface, rgba(255, 255, 255, 0.72));
            pointer-events: none;
            transition: background-color 0.25s ease;
        }

        :host-context([data-theme='dark']) .card:not(.flat):not(.info):not(.danger)::after {
            background: var(--glass-bg-surface, rgba(31, 32, 34, 0.72));
        }

        /* 默认 Tier C / .tier-c: 严禁 hover 任何视觉或位移变化 */
        .tier-c,
        .card:not(.tier-a):not(.tier-b):not(.flat):not(.info):not(.danger) {
            cursor: default;
        }
        .tier-c:hover,
        .card:not(.tier-a):not(.tier-b):not(.flat):not(.info):not(.danger):hover {
            transform: none !important;
            box-shadow: var(--glass-shadow) !important;
        }
        .tier-c:hover::after,
        .card:not(.tier-a):not(.tier-b):not(.flat):not(.info):not(.danger):hover::after {
            background: var(--glass-bg-surface, rgba(255, 255, 255, 0.72)) !important;
        }
        :host-context([data-theme='dark']) .tier-c:hover::after,
        :host-context([data-theme='dark']) .card:not(.tier-a):not(.tier-b):not(.flat):not(.info):not(.danger):hover::after {
            background: var(--glass-bg-surface, rgba(31, 32, 34, 0.72)) !important;
        }

        /* Tier B (.tier-b): 高不透明衬底 (0.9 固定)，严禁 hover 反应 */
        .tier-b::after {
            background: var(--glass-bg-panel, rgba(255, 255, 255, 0.9)) !important;
        }
        :host-context([data-theme='dark']) .tier-b::after {
            background: var(--glass-bg-panel, rgba(31, 32, 34, 0.9)) !important;
        }
        .tier-b:hover {
            transform: none !important;
            box-shadow: var(--glass-shadow) !important;
        }
        .tier-b:hover::after {
            background: var(--glass-bg-panel, rgba(255, 255, 255, 0.9)) !important;
        }
        :host-context([data-theme='dark']) .tier-b:hover::after {
            background: var(--glass-bg-panel, rgba(31, 32, 34, 0.9)) !important;
        }

        /* Tier A (.tier-a): 可交互卡片 (0.60 -> hover 0.68 + translateY(-4px)) */
        .tier-a {
            cursor: pointer;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
        }
        .tier-a::after {
            background: var(--glass-bg, rgba(255, 255, 255, 0.60)) !important;
        }
        :host-context([data-theme='dark']) .tier-a::after {
            background: var(--glass-bg, rgba(31, 32, 34, 0.60)) !important;
        }
        @media (hover: hover) and (pointer: fine) {
            .tier-a:hover {
                transform: translateY(-4px);
                box-shadow: var(--glass-shadow-hover);
            }
            .tier-a:hover::after {
                background: var(--glass-bg-hover, rgba(255, 255, 255, 0.68)) !important;
            }
            :host-context([data-theme='dark']) .tier-a:hover::after {
                background: var(--glass-bg-hover, rgba(38, 40, 44, 0.68)) !important;
            }
        }
        .tier-a:active {
            transform: translateY(-2px) scale(0.985);
            transition: transform var(--dur-micro, 100ms) cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* Layer 2: 双轴微光圈层 (默认 Tier C: 完整双轴微光圈) */
        .card:not(.flat):not(.info):not(.danger)::before {
            ${fe}
        }
        :host-context([data-theme='dark']) .card:not(.flat):not(.info):not(.danger)::before {
            ${Je}
        }

        /* Tier B 弱化微光圈 */
        .tier-b::before {
            background: linear-gradient(to bottom,
                rgba(255, 255, 255, calc(var(--lg-rim-lit, 0.95) * 0.45)) 0,
                rgba(255, 255, 255, calc(var(--lg-rim-lit, 0.95) * 0.45)) 1px,
                rgba(255, 255, 255, 0) 12px);
        }

        /* Layer 3: 内容容器 */
        .content-wrapper {
            position: relative;
            z-index: 3;
        }

        /* 传统扁平卡片（仅当开发者显式指定 flat 时降级） */
        .card.flat,
        :host([glass-mode="flat"]) .card,
        :host([glass-mode="none"]) .card {
            background: var(--card-bg, #fff);
            border: 1px solid var(--border-color, #dee2e6);
            box-shadow: var(--shadow-sm, 0 2px 8px rgba(0, 0, 0, 0.06));
            backdrop-filter: none;
            -webkit-backdrop-filter: none;
            cursor: default;
            transform: none !important;
        }
        .card.flat::before,
        .card.flat::after,
        :host([glass-mode="flat"]) .card::before,
        :host([glass-mode="flat"]) .card::after,
        :host([glass-mode="none"]) .card::before,
        :host([glass-mode="none"]) .card::after {
            display: none;
        }

        .info {
            color: #fff;
            border: none;
            background: linear-gradient(135deg, #00263b, #004060);
            box-shadow: 0 12px 30px rgba(0, 29, 49, 0.22);
            cursor: default;
        }
        .danger {
            border: 1px solid var(--danger-border, #e58f8f);
            border-left: 4px solid var(--danger-color, #ea4335);
            background: var(--danger-bg, #fff1f1);
            color: var(--text-main, #00263b);
            cursor: default;
        }
        :host-context([data-theme='dark']) .danger {
            background: rgba(234, 67, 53, 0.12);
            border-color: rgba(234, 67, 53, 0.35);
            border-left-color: var(--danger-color, #ea4335);
            color: var(--text-main, #e5e8ea);
        }
        .header-row {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
        }
        h3 {
            margin: 0;
            font-size: 18px;
            font-weight: 600;
        }
        .body {
            color: inherit;
            font-size: 14px;
            line-height: 1.65;
        }
        .standard .body,
        .glass .body,
        .liquid-glass .body,
        .tier-a .body,
        .tier-b .body,
        .tier-c .body,
        .danger .body {
            color: var(--text-light, #666);
        }
    `);typeof window<"u"&&window.customElements&&(customElements.get("cgo-card")||customElements.define("cgo-card",N1));class q1 extends x{constructor(){super(),this.glassMode=""}connectedCallback(){super.connectedCallback(),M()}render(){const e=this.glassMode==="flat"||this.glassMode==="none";return l`
            <div class="table-card ${e?"flat":"glass"}">
                ${e?null:l`<div class="glass-refraction" aria-hidden="true"></div>`}
                <div class="table-scroller">
                    <slot></slot>
                </div>
            </div>
        `}}g(q1,"properties",{glassMode:{type:String,attribute:"glass-mode",reflect:!0}}),g(q1,"styles",m`
        :host {
            display: block;
            font-family: var(--font-sans, system-ui, sans-serif);
            border-radius: var(--radius-lg, 12px);
            margin: 0;
            padding: 0;
        }

        /* 遵循次世代 Liquid Glass Tier B 不可交互底板规范 */
        .table-card {
            position: relative;
            border-radius: var(--radius-lg, 12px);
            background: transparent;
            color: var(--text-main, #00263b);
            border: none;
            box-shadow: 0 4px 20px -2px rgba(0, 38, 59, 0.05), 0 2px 8px -1px rgba(0, 38, 59, 0.03);
            overflow: hidden;
            isolation: isolate;
            transition: box-shadow var(--glass-duration, 0.28s) var(--glass-easing, cubic-bezier(0.32, 0.72, 0, 1));
        }

        /* Tier B 规范：绝对禁止整卡 hover 任何位移与反应 */
        .table-card:hover {
            transform: none !important;
            box-shadow: 0 4px 20px -2px rgba(0, 38, 59, 0.05), 0 2px 8px -1px rgba(0, 38, 59, 0.03) !important;
        }

        /* Layer 0: 折射磨砂层 (Tier B 规范) */
        ${z}

        /* Layer 1: 半透明底色衬底层 (Tier B 规范: 0.9 固定高不透明底板) */
        .table-card:not(.flat)::after {
            ${j}
        }
        :host-context([data-theme='dark']) .table-card:not(.flat)::after {
            ${U}
        }

        /* Layer 2: 弱化微光圈 (Tier B 规范: 顶部柔和单向光，与 0.9 底板自然融合) */
        .table-card:not(.flat)::before {
            ${H}
        }

        :host-context([data-theme='dark']) .table-card:not(.flat)::before {
            ${T}
        }

        :host-context([data-theme='dark']) .table-card {
            box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.35), 0 2px 8px -1px rgba(0, 0, 0, 0.2);
        }

        /* Layer 3: 滚动视口容器 */
        .table-scroller {
            position: relative;
            z-index: 3;
            overflow-x: auto;
            width: 100%;
            border-radius: inherit;
            -webkit-overflow-scrolling: touch;
        }

        /* 传统扁平降级 */
        .table-card.flat,
        :host([glass-mode='flat']) .table-card,
        :host([glass-mode='none']) .table-card {
            background: var(--card-bg, #fff);
            border: 1px solid var(--border-color, #dee2e6);
            box-shadow: var(--shadow-sm, 0 2px 8px rgba(0, 0, 0, 0.06));
            backdrop-filter: none;
            -webkit-backdrop-filter: none;
        }
        .table-card.flat::before,
        .table-card.flat::after,
        :host([glass-mode='flat']) .table-card::before,
        :host([glass-mode='flat']) .table-card::after,
        :host([glass-mode='none']) .table-card::before,
        :host([glass-mode='none']) .table-card::after {
            display: none;
        }

        /* 表格排版 */
        ::slotted(table) {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            font-family: var(--font-sans, system-ui, sans-serif);
            font-size: 13.5px;
            color: var(--text-main, #00263b);
            text-align: left;
            margin: 0;
        }

        /* 表头位置与毛玻璃视觉优化 */
        ::slotted(table th) {
            position: sticky;
            top: 0;
            z-index: 2;
            padding: 14px 18px;
            background: var(--glass-bg-subtle, rgba(0, 38, 59, 0.03));
            color: var(--table-head-text, var(--text-main, #00263b));
            font-weight: 600;
            font-size: 13px;
            letter-spacing: 0.02em;
            white-space: nowrap;
            border-bottom: 1px solid var(--glass-border-subtle, rgba(0, 38, 59, 0.07));
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            transition: background-color 0.25s ease, color 0.25s ease;
        }

        :host-context([data-theme='dark']) ::slotted(table th) {
            background: var(--glass-bg-subtle, rgba(255, 255, 255, 0.04));
            border-bottom-color: var(--glass-border-subtle, rgba(255, 255, 255, 0.07));
            color: var(--table-head-text, var(--text-main, #e5e8ea));
        }

        /* 表头左右两端圆角与外框融合 */
        ::slotted(table thead tr:first-child th:first-child) {
            border-top-left-radius: var(--radius-lg, 12px);
        }
        ::slotted(table thead tr:first-child th:last-child) {
            border-top-right-radius: var(--radius-lg, 12px);
        }

        /* 单元格排版与轻量分割线 */
        ::slotted(table td) {
            padding: 13px 18px;
            font-size: 13.5px;
            line-height: 1.45;
            color: var(--text-main, #00263b);
            border-bottom: 1px solid var(--glass-border-subtle, rgba(0, 38, 59, 0.05));
            transition: background-color 0.2s ease;
        }

        :host-context([data-theme='dark']) ::slotted(table td) {
            color: var(--text-main, #e5e8ea);
            border-bottom-color: var(--glass-border-subtle, rgba(255, 255, 255, 0.05));
        }

        /* 末行单元格顺滑收尾 */
        ::slotted(table tbody tr:last-child td) {
            border-bottom: none;
        }
        ::slotted(table tbody tr:last-child td:first-child) {
            border-bottom-left-radius: var(--radius-lg, 12px);
        }
        ::slotted(table tbody tr:last-child td:last-child) {
            border-bottom-right-radius: var(--radius-lg, 12px);
        }

        /* 行悬停轻柔微光 */
        ::slotted(table tbody tr:hover td) {
            background-color: var(--glass-bg-hover, rgba(0, 38, 59, 0.025));
        }
        :host-context([data-theme='dark']) ::slotted(table tbody tr:hover td) {
            background-color: var(--glass-bg-hover, rgba(255, 255, 255, 0.035));
        }

        /* 兼容 modern-table 居中排版 */
        ::slotted(table.modern-table th),
        ::slotted(table.modern-table td) {
            text-align: center;
        }
    `);typeof window<"u"&&window.customElements&&(customElements.get("cgo-table")||customElements.define("cgo-table",q1));class V1 extends x{constructor(){super(),this.label="图片/媒体预览区域 (自适应背景网格点)"}render(){return l`
            <div class="viewer">
                <div class="display"><slot>${this.label}</slot></div>
                <div class="actions"><slot name="actions"></slot></div>
            </div>
        `}}g(V1,"properties",{label:{type:String}}),g(V1,"styles",m`
        :host {
            display: block;
            font-family: var(--font-sans, system-ui, sans-serif);
        }
        .viewer {
            overflow: hidden;
            border-radius: var(--radius-lg, 12px);
            border: 1px solid var(--border-color, #dee2e6);
            background: var(--card-bg, #fff);
            box-shadow: var(--shadow-sm, 0 2px 8px rgba(0, 0, 0, 0.06));
        }
        .display {
            min-height: 200px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background-image: radial-gradient(var(--border-color, #dee2e6) 1px, transparent 1px);
            background-size: 16px 16px;
            color: var(--text-light, #666);
            font-size: 13px;
            text-align: center;
        }
        .actions {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            padding: 14px;
            border-top: 1px solid var(--border-color, #dee2e6);
            background: var(--card-bg, #fff);
        }
    `);typeof window<"u"&&window.customElements&&(customElements.get("cgo-media-viewer")||customElements.define("cgo-media-viewer",V1));class j1 extends x{constructor(){super(),this.title="浮动控制面板",this.snapped=!1,this.minimized=!1,this.closed=!1,this.interactive=!0,this.noclose=!1,this.lockx=!1,this.resetOnDragend=!1,this._onPointerDown=this._onPointerDown.bind(this),this._toggleMinimize=this._toggleMinimize.bind(this),this._close=this._close.bind(this)}_onPointerDown(e){if(!this.interactive||e.button!==0||e.target.closest(".controls"))return;const t=this.getBoundingClientRect(),o=window.getComputedStyle(this),i=(this.offsetParent||document.body).getBoundingClientRect();let s=t.left-i.left,n=t.top-i.top;o.position!=="absolute"&&o.position!=="fixed"&&(this.style.position="absolute",this.style.zIndex="1000",this.style.left=`${s}px`,this.style.top=`${n}px`,this.style.margin="0"),this._x=parseFloat(this.style.left),isNaN(this._x)&&(this._x=s),this._y=parseFloat(this.style.top),isNaN(this._y)&&(this._y=n),this._parentWidth=i.width,this._parentHeight=i.height,this._compWidth=t.width,this._compHeight=t.height,this._startX=e.clientX,this._startY=e.clientY,this._isDragging=!0,this._dragHeader=e.currentTarget;try{this._dragHeader&&this._dragHeader.setPointerCapture&&(this._dragHeader.setPointerCapture(e.pointerId),this._pointerId=e.pointerId)}catch{}this._onPointerMoveBound=this._onPointerMove.bind(this),this._onPointerUpBound=this._onPointerUp.bind(this),document.addEventListener("pointermove",this._onPointerMoveBound),document.addEventListener("pointerup",this._onPointerUpBound),this.dispatchEvent(new CustomEvent("cgo-dragstart",{bubbles:!0,composed:!0})),e.preventDefault()}_onPointerMove(e){if(!this._isDragging)return;const t=e.clientX-this._startX,o=e.clientY-this._startY;let r=this._x+t,i=this._y+o;if(this.offsetParent){const s=Math.max(0,(this._parentWidth||0)-(this._compWidth||0)),n=Math.max(0,(this._parentHeight||0)-(this._compHeight||0));r=Math.max(0,Math.min(r,s)),i=Math.max(0,Math.min(i,n));const c=12;let h=!1;r<c?(r=0,h=!0):r>s-c&&(r=s,h=!0),i<c?(i=0,h=!0):i>n-c&&(i=n,h=!0),this.snapped=h}this.lockx&&(r=this._x),this._rafId&&cancelAnimationFrame(this._rafId),this._pendingX=r,this._pendingY=i,this._rafId=requestAnimationFrame(()=>{this.style.left=`${r}px`,this.style.top=`${i}px`,this._rafId=null}),this.dispatchEvent(new CustomEvent("cgo-drag",{detail:{x:r,y:i,clientX:e.clientX,clientY:e.clientY,snapped:this.snapped},bubbles:!0,composed:!0}))}_onPointerUp(e){if(!this._isDragging)return;if(this._isDragging=!1,this._rafId&&(cancelAnimationFrame(this._rafId),this._rafId=null),this._pointerId!==void 0&&this._dragHeader&&this._dragHeader.releasePointerCapture){try{this._dragHeader.releasePointerCapture(this._pointerId)}catch{}this._pointerId=void 0}document.removeEventListener("pointermove",this._onPointerMoveBound),document.removeEventListener("pointerup",this._onPointerUpBound);const t=e&&e.clientX!==void 0?e.clientX:0,o=e&&e.clientY!==void 0?e.clientY:0,r=this._pendingX!==void 0?this._pendingX:parseFloat(this.style.left),i=this._pendingY!==void 0?this._pendingY:parseFloat(this.style.top);isNaN(r)||(this._x=r,this.style.left=`${r}px`),isNaN(i)||(this._y=i,this.style.top=`${i}px`),this._pendingX=void 0,this._pendingY=void 0,(this.resetOnDragend||this.lockx)&&(this.style.left="",this.style.top=""),this.dispatchEvent(new CustomEvent("cgo-dragend",{detail:{clientX:t,clientY:o},bubbles:!0,composed:!0}))}_toggleMinimize(){this.minimized=!this.minimized,this.dispatchEvent(new CustomEvent("cgo-minimize",{detail:{minimized:this.minimized},bubbles:!0,composed:!0}))}_close(){this.closed=!0,this.dispatchEvent(new CustomEvent("cgo-close",{bubbles:!0,composed:!0}))}render(){return l`
            <section class="window">
                <div class="header" part="header" @pointerdown=${this._onPointerDown}>
                    <div class="title-wrapper">
                        <div class="title">${this.title}</div>
                        <slot name="title-extra"></slot>
                    </div>
                    <div class="controls">
                        <slot name="header-extra"></slot>
                        <button class="ctrl" title=${this.minimized?"还原":"最小化"} @click=${this._toggleMinimize}>
                            ${this.minimized?"+":"-"}
                        </button>
                        ${this.noclose?"":l`<button class="ctrl" title="关闭" @click=${this._close}><cgo-icon name="close" size="12"></cgo-icon></button>`}
                    </div>
                </div>
                <div class="content" part="content"><slot></slot></div>
            </section>
        `}}g(j1,"properties",{title:{type:String},snapped:{type:Boolean,reflect:!0},minimized:{type:Boolean,reflect:!0},closed:{type:Boolean,reflect:!0},interactive:{type:Boolean,reflect:!0},noclose:{type:Boolean,reflect:!0},lockx:{type:Boolean,reflect:!0},resetOnDragend:{type:Boolean,attribute:"reset-on-dragend",reflect:!0}}),g(j1,"styles",m`
        :host {
            display: block;
            font-family: var(--font-sans, system-ui, sans-serif);
        }
        :host([closed]) {
            display: none !important;
        }
        :host([minimized]) .content {
            display: none;
        }
        :host([interactive]) .header {
            cursor: move;
            user-select: none;
            touch-action: none;
        }
        .window {
            width: min(320px, 100%);
            border: 1px solid var(--border-color, #dee2e6);
            border-radius: var(--radius-lg, 12px);
            background: var(--panel-bg, #fff);
            box-shadow: var(--shadow-lg, 0 8px 32px rgba(0, 0, 0, 0.12));
            overflow: hidden;
            display: flex;
            flex-direction: column;
            height: 100%;
            box-sizing: border-box;
        }
        :host-context([glass-mode="liquid"]) .window,
        :host-context([glass-mode="blur"]) .window,
        :host-context([data-glass-mode="liquid"]) .window,
        :host-context([data-glass-mode="blur"]) .window {
            border: none;
            background: var(--glass-bg-panel, rgba(255, 255, 255, 0.9));
            backdrop-filter: blur(14px) saturate(135%);
            -webkit-backdrop-filter: blur(14px) saturate(135%);
            box-shadow:
                0 0 0 0.5px rgba(0, 0, 0, 0.06),
                0 14px 34px -6px rgba(0, 38, 59, 0.14),
                0 3px 8px -2px rgba(0, 38, 59, 0.06),
                inset 0 1px 1px 0 rgba(255, 255, 255, 0.85);
        }
        :host-context([data-theme="dark"][glass-mode="liquid"]) .window,
        :host-context([data-theme="dark"][glass-mode="blur"]) .window,
        :host-context([data-theme="dark"][data-glass-mode="liquid"]) .window,
        :host-context([data-theme="dark"][data-glass-mode="blur"]) .window {
            border: none;
            background: var(--glass-bg-panel, rgba(28, 30, 32, 0.9));
            backdrop-filter: blur(14px) saturate(135%);
            -webkit-backdrop-filter: blur(14px) saturate(135%);
            box-shadow:
                0 0 0 0.5px rgba(255, 255, 255, 0.1),
                0 18px 40px -6px rgba(0, 0, 0, 0.6),
                0 4px 10px -2px rgba(0, 0, 0, 0.4),
                inset 0 1px 0 0 rgba(255, 255, 255, 0.15);
        }
        :host([snapped]) .window {
            border-color: var(--primary-color, #00263b);
            box-shadow:
                0 0 0 3px rgba(0, 29, 49, 0.12),
                var(--shadow-lg, 0 8px 32px rgba(0, 0, 0, 0.12));
        }
        .header {
            height: 38px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 10px 0 14px;
            border-bottom: 1px solid var(--border-color, #dee2e6);
            background: var(--card-bg, #fff);
            flex-shrink: 0;
        }
        :host-context([glass-mode="liquid"]) .header,
        :host-context([glass-mode="blur"]) .header,
        :host-context([data-glass-mode="liquid"]) .header,
        :host-context([data-glass-mode="blur"]) .header {
            background: rgba(255, 255, 255, 0.5);
            border-bottom-color: rgba(0, 0, 0, 0.08);
        }
        :host-context([data-theme="dark"][glass-mode="liquid"]) .header,
        :host-context([data-theme="dark"][glass-mode="blur"]) .header,
        :host-context([data-theme="dark"][data-glass-mode="liquid"]) .header,
        :host-context([data-theme="dark"][data-glass-mode="blur"]) .header {
            background: rgba(35, 37, 40, 0.5);
            border-bottom-color: rgba(255, 255, 255, 0.08);
        }
        .title-wrapper {
            display: flex;
            align-items: center;
            gap: 6px;
            overflow: hidden;
            min-width: 0;
            margin-right: 8px;
        }
        .title {
            font-size: 13px;
            font-weight: 700;
            color: var(--text-main, #00263b);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            flex-shrink: 0;
        }
        .controls {
            display: flex;
            gap: 4px;
            color: var(--text-light, #666);
            flex-shrink: 0;
        }
        .ctrl {
            width: 22px;
            height: 22px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: var(--radius-xs, 4px);
            background: transparent;
            border: none;
            color: inherit;
            cursor: pointer;
            font-size: 16px;
            line-height: 1;
            -webkit-tap-highlight-color: transparent;
            touch-action: manipulation;
            user-select: none;
            transition: background-color 0.15s ease, color 0.15s ease, transform 0.1s ease;
        }
        @media (hover: hover) and (pointer: fine) {
            .ctrl:hover {
                background: var(--btn-info-hover, #e9ecef);
                color: var(--text-main, #00263b);
            }
        }
        .ctrl:active {
            transform: scale(0.92);
        }
        .content {
            padding: var(--cgo-floating-content-padding, 14px);
            color: var(--text-light, #666);
            font-size: 13px;
            line-height: 1.55;
            flex: 1 1 auto;
            min-height: 0;
            overflow-y: auto;
        }
    `);typeof window<"u"&&window.customElements&&(customElements.get("cgo-floating-window")||customElements.define("cgo-floating-window",j1));const Q=new Set;let Le=!1;function n2(){Le||(Le=!0,document.addEventListener("click",a=>{Q.forEach(e=>{a.composedPath().includes(e)||e.close()})}))}class U1 extends x{constructor(){super(),this.state="inherit",this.label="",this.open=!1,this.glassMode="",this.disabled=!1,this._positionHandler=()=>{this.open&&this._positionMenu()}}connectedCallback(){super.connectedCallback(),M(),n2()}disconnectedCallback(){super.disconnectedCallback(),Q.delete(this),window.removeEventListener("resize",this._positionHandler),window.removeEventListener("scroll",this._positionHandler,!0)}openSelect(){this.disabled||(Q.forEach(e=>{e!==this&&e.close()}),this.open=!0,Q.add(this),requestAnimationFrame(()=>this._positionMenu()),window.addEventListener("resize",this._positionHandler),window.addEventListener("scroll",this._positionHandler,!0))}_positionMenu(){var h,b;const e=(h=this.shadowRoot)==null?void 0:h.querySelector(".menu"),t=(b=this.shadowRoot)==null?void 0:b.querySelector(".select");if(!e||!t)return;const o=t.getBoundingClientRect(),r=window.innerHeight,i=6,s=o.bottom+i,n=r-o.top+i,c=s+200<r;e.style.top=c?`${s}px`:"",e.style.bottom=c?"":`${n}px`,e.style.left=`${o.left}px`,e.style.width=`${o.width}px`}close(){this.open&&(this.open=!1,Q.delete(this),window.removeEventListener("resize",this._positionHandler),window.removeEventListener("scroll",this._positionHandler,!0))}toggle(e){this.disabled||(e&&e.stopPropagation(),this.open?this.close():this.openSelect())}_options(){return[{state:"inherit",label:"继承权限"},{state:"enabled",label:"允许访问"},{state:"disabled",label:"拒绝访问"},{state:"hidden",label:"隐藏入口"}]}_current(){return this._options().find(e=>e.state===this.state)||this._options()[0]}_select(e){this.state=e.state,this.label=e.label,this.close(),this.dispatchEvent(new CustomEvent("cgo-admin-change",{detail:e,bubbles:!0,composed:!0}))}render(){const e=this.label?{state:this.state,label:this.label}:this._current(),t=this.glassMode==="flat"||this.glassMode==="none";return l`
            <button
                class="select"
                type="button"
                ?disabled=${this.disabled}
                aria-expanded=${this.open}
                @click=${o=>this.toggle(o)}
            >
                <span class="dot"></span>
                <span class="label">${e.label}</span>
                <cgo-icon class="arrow" name="chevron-down" size="18" aria-hidden="true"></cgo-icon>
            </button>
            <div class="menu">
                ${t?null:l`<div class="glass-refraction" aria-hidden="true"></div>`}
                <div class="menu-content">
                    ${this._options().map(o=>l`
                            <button
                                class="option ${o.state}"
                                type="button"
                                aria-selected=${o.state===this.state}
                                @click=${()=>this._select(o)}
                            >
                                <span class="dot"></span>
                                ${o.label==="继承权限"?"继承 (Inherit)":o.label==="允许访问"?"允许 (Allow)":o.label==="拒绝访问"?"拒绝 (Deny)":"隐藏 (Hide)"}
                            </button>
                        `)}
                </div>
            </div>
        `}}g(U1,"properties",{state:{type:String,reflect:!0},label:{type:String},open:{type:Boolean,reflect:!0},glassMode:{type:String,attribute:"glass-mode",reflect:!0},disabled:{type:Boolean,reflect:!0}}),g(U1,"styles",m`
        :host {
            display: inline-block;
            position: relative;
            min-width: 136px;
            font-family: var(--font-sans, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
            vertical-align: middle;
        }

        /* ── 1. 功能入口收起时：参考 <cgo-button> 的液态玻璃与物理微交互 ── */
        .select {
            position: relative;
            display: grid;
            grid-template-columns: 9px minmax(0, 1fr) 18px;
            align-items: center;
            gap: 8px;
            width: 100%;
            height: 34px;
            padding: 0 10px;
            border-radius: var(--radius-sm, 6px);
            border: none !important;
            outline: none !important;
            background: var(--permission-inherit-soft, #f2f5f8);
            color: var(--text-main, #00263b);
            box-sizing: border-box;
            font-size: 13px;
            font-weight: 700;
            text-align: left;
            cursor: pointer;
            font-family: inherit;
            user-select: none;
            overflow: hidden;
            isolation: isolate;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
            /* 显式过渡与微触感反馈 */
            transition:
                color var(--dur-fast, 140ms) ease,
                background-color var(--dur-fast, 140ms) ease,
                box-shadow var(--dur-fast, 140ms) ease,
                transform var(--dur-micro, 100ms) cubic-bezier(0.23, 1, 0.32, 1);
        }

        /* <cgo-button> 同款 1px 双轴微光描边 (Layer 2 Masked 1px Hairline Rim Light，唯一描边来源) */
        .select::before {
            ${V}
        }

        .select:hover:not(:disabled)::before {
            opacity: 0.75;
        }

        .select:hover:not(:disabled) {
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.08);
        }

        /* 收起未打开状态下的按压触感反馈 */
        :host(:not([open])) .select:active:not(:disabled) {
            transform: scale(0.98);
        }

        :host-context([data-theme='dark']) .select {
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
            color: var(--text-main, #e5e8ea);
        }

        :host-context([data-theme='dark']) .select:hover:not(:disabled) {
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
        }

        :host-context([data-theme='dark']) .select::before {
            ${n1}
        }

        /* 保证文字和指示小点在 Layer 3 (z-index: 3) 绝对清晰 */
        .dot,
        .label,
        .arrow {
            position: relative;
            z-index: 3;
        }

        .label {
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .dot {
            width: 9px;
            height: 9px;
            border-radius: 50%;
            background: var(--permission-inherit, #64748b);
            box-shadow: 0 0 0 3px color-mix(in srgb, var(--permission-inherit, #64748b) 16%, transparent);
            flex-shrink: 0;
            transition: background var(--dur-fast, 140ms) ease, box-shadow var(--dur-fast, 140ms) ease;
        }

        .arrow {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            color: var(--text-main, #00263b);
            transition: transform var(--dur-fast, 160ms) cubic-bezier(0.16, 1, 0.3, 1), color var(--dur-fast, 140ms) ease;
            flex-shrink: 0;
        }

        :host-context([data-theme='dark']) .arrow {
            color: var(--text-main, #e5e8ea);
        }

        /* 各状态背景色（纯色背景，不设置实体 border，由 ::before 提供单一微光描边） */
        :host([state='enabled']) .select {
            background: var(--permission-enabled-soft, #edf8f1);
        }
        :host([state='enabled']) .dot {
            background: var(--permission-enabled, #16803d);
            box-shadow: 0 0 0 3px color-mix(in srgb, var(--permission-enabled, #16803d) 16%, transparent);
        }

        :host([state='disabled']) .select {
            background: var(--permission-disabled-soft, #f0f4f8);
        }
        :host([state='disabled']) .dot {
            background: var(--permission-disabled, #52637a);
            box-shadow: 0 0 0 3px color-mix(in srgb, var(--permission-disabled, #52637a) 16%, transparent);
        }

        :host([state='hidden']) .select {
            background: var(--permission-hidden-soft, #fff1f1);
        }
        :host([state='hidden']) .dot {
            background: var(--permission-hidden, #c62828);
            box-shadow: 0 0 0 3px color-mix(in srgb, var(--permission-hidden, #c62828) 16%, transparent);
        }

        :host([disabled]) .select {
            opacity: 0.55;
            cursor: not-allowed;
            pointer-events: none;
            transform: none !important;
            box-shadow: none;
        }

        /* ── 2. 功能入口打开时：参考 <cgo-input> 激活时的样式效果 ──
           彻底移除 ::before 伪元素微光，使用单组 box-shadow 绘制 1px 轮廓线 + 3.5px 扩散光晕，
           绝无多层边框套圈与内缩重影！ */
        :host([open]) .select::before {
            display: none !important;
        }

        :host([open]) .select {
            outline: none !important;
            border: none !important;
            transform: none !important;
            box-shadow:
                0 0 0 1px var(--permission-inherit, #64748b),
                0 0 0 3.5px color-mix(in srgb, var(--permission-inherit, #64748b) 16%, transparent),
                0 1px 2px rgba(0, 0, 0, 0.06) !important;
        }

        :host([open]) .arrow {
            transform: rotate(180deg);
        }

        :host([open][state='enabled']) .select {
            box-shadow:
                0 0 0 1px var(--permission-enabled, #16803d),
                0 0 0 3.5px color-mix(in srgb, var(--permission-enabled, #16803d) 18%, transparent),
                0 1px 2px rgba(22, 128, 61, 0.08) !important;
        }

        :host([open][state='disabled']) .select {
            box-shadow:
                0 0 0 1px var(--permission-disabled, #52637a),
                0 0 0 3.5px color-mix(in srgb, var(--permission-disabled, #52637a) 16%, transparent),
                0 1px 2px rgba(0, 0, 0, 0.06) !important;
        }

        :host([open][state='hidden']) .select {
            box-shadow:
                0 0 0 1px var(--permission-hidden, #c62828),
                0 0 0 3.5px color-mix(in srgb, var(--permission-hidden, #c62828) 18%, transparent),
                0 1px 2px rgba(198, 40, 40, 0.08) !important;
        }

        /* 暗色模式下打开/激活状态的 Focus Ring */
        :host-context([data-theme='dark']):host([open]) .select {
            box-shadow:
                0 0 0 1px var(--permission-inherit, #a1b0cb),
                0 0 0 3.5px color-mix(in srgb, var(--permission-inherit, #a1b0cb) 25%, transparent),
                0 1px 3px rgba(0, 0, 0, 0.35) !important;
        }

        :host-context([data-theme='dark']):host([open][state='enabled']) .select {
            box-shadow:
                0 0 0 1px var(--permission-enabled, #81c995),
                0 0 0 3.5px color-mix(in srgb, var(--permission-enabled, #81c995) 26%, transparent),
                0 1px 3px rgba(0, 0, 0, 0.35) !important;
        }

        :host-context([data-theme='dark']):host([open][state='disabled']) .select {
            box-shadow:
                0 0 0 1px var(--permission-disabled, #94a3b8),
                0 0 0 3.5px color-mix(in srgb, var(--permission-disabled, #94a3b8) 25%, transparent),
                0 1px 3px rgba(0, 0, 0, 0.35) !important;
        }

        :host-context([data-theme='dark']):host([open][state='hidden']) .select {
            box-shadow:
                0 0 0 1px var(--permission-hidden, #ff8a80),
                0 0 0 3.5px color-mix(in srgb, var(--permission-hidden, #ff8a80) 26%, transparent),
                0 1px 3px rgba(0, 0, 0, 0.35) !important;
        }

        /* ── 3. 打开时的下拉菜单：参考 <cgo-dropdown> 的下拉菜单添加与 card B 一致的液态玻璃效果 ── */
        .menu {
            display: none;
            /*
             * Fix: position: fixed 直接以视口为定位基准，完全脱离父级的 isolation、overflow、backdrop-filter 约束。
             * 坐标由 JS _positionMenu() 动态计算。
             */
            position: fixed;
            min-width: 140px;
            background: transparent;
            border: none;
            border-radius: var(--radius-md, 8px);
            box-shadow: var(--glass-shadow, 0 8px 24px rgba(0, 38, 59, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04));
            z-index: 100000;
            padding: 6px;
            overflow: hidden;
            isolation: isolate;
            box-sizing: border-box;
            animation: dropdownIn var(--dur-fast, 160ms) cubic-bezier(0.16, 1, 0.3, 1);
        }

        :host([open]) .menu {
            display: block;
        }

        /* Layer 0: 折射磨砂层 (Tier B 规范) */
        ${z}

        /* Layer 1: 半透明底色衬底层 (Tier B 规范: 0.9 固定) */
        .menu::after {
            ${j}
        }

        :host-context([data-theme='dark']) .menu::after {
            ${U}
        }

        /* Layer 2: 弱化微光圈 (Tier B 规范: 顶部柔和单向光，与 0.9 高不透明底板自然融合) */
        .menu::before {
            ${H}
        }

        :host-context([data-theme='dark']) .menu::before {
            ${T}
        }

        :host-context([data-theme='dark']) .menu {
            box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45), 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        /* Layer 3: 菜单内容项 */
        .menu-content {
            position: relative;
            z-index: 3;
            display: flex;
            flex-direction: column;
            gap: 2px;
        }

        /* 传统扁平降级 */
        :host([glass-mode='flat']) .menu,
        :host([glass-mode='none']) .menu {
            background: var(--card-bg, #fff);
            border: 1px solid var(--border-color, #dee2e6);
            backdrop-filter: none;
            -webkit-backdrop-filter: none;
        }
        :host([glass-mode='flat']) .menu::before,
        :host([glass-mode='flat']) .menu::after,
        :host([glass-mode='none']) .menu::before,
        :host([glass-mode='none']) .menu::after {
            display: none;
        }
        :host-context([data-theme='dark']):host([glass-mode='flat']) .menu {
            background: var(--card-bg, #1f2020);
            border-color: var(--border-color, #383a3c);
        }

        @keyframes dropdownIn {
            from {
                opacity: 0;
                transform: translateY(-4px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .option {
            display: flex;
            align-items: center;
            gap: 8px;
            width: 100%;
            border: 0;
            border-radius: var(--radius-xs, 4px);
            background: transparent;
            color: var(--text-main, #00263b);
            padding: 8px 9px;
            font: inherit;
            font-size: 12px;
            font-weight: 600;
            text-align: left;
            cursor: pointer;
            box-sizing: border-box;
            user-select: none;
            transition:
                background-color var(--dur-fast, 140ms) ease,
                color var(--dur-fast, 140ms) ease,
                transform var(--dur-micro, 100ms) ease;
        }

        .option:hover {
            background: var(--btn-info-hover, rgba(0, 38, 59, 0.06));
            color: var(--text-main, #00263b);
        }

        :host-context([data-theme='dark']) .option {
            color: var(--text-main, #e5e8ea);
        }

        :host-context([data-theme='dark']) .option:hover {
            background: rgba(255, 255, 255, 0.08);
            color: #ffffff;
        }

        .option:active {
            transform: scale(0.99);
        }

        .option[aria-selected='true'] {
            background: var(--btn-info-hover, rgba(0, 38, 59, 0.08));
            font-weight: 700;
        }

        .option.enabled[aria-selected='true'] {
            background: var(--permission-enabled-soft, #edf8f1);
            color: var(--permission-enabled, #16803d);
        }
        .option.disabled[aria-selected='true'] {
            background: var(--permission-disabled-soft, #f0f4f8);
            color: var(--permission-disabled, #52637a);
        }
        .option.hidden[aria-selected='true'] {
            background: var(--permission-hidden-soft, #fff1f1);
            color: var(--permission-hidden, #c62828);
        }
        .option.inherit[aria-selected='true'] {
            background: var(--permission-inherit-soft, #f2f5f8);
            color: var(--permission-inherit, #64748b);
        }

        .option .dot {
            width: 8px;
            height: 8px;
            box-shadow: none;
        }
        .option.inherit .dot {
            background: var(--permission-inherit, #64748b);
        }
        .option.enabled .dot {
            background: var(--permission-enabled, #16803d);
        }
        .option.disabled .dot {
            background: var(--permission-disabled, #52637a);
        }
        .option.hidden .dot {
            background: var(--permission-hidden, #c62828);
        }
    `);typeof window<"u"&&window.customElements&&(customElements.get("cgo-admin-select")||customElements.define("cgo-admin-select",U1));class D1 extends x{constructor(){super(),this.icon="",this.name="",this.label="",this.title="",this.detail="",this.desc="",this.action="配置"}_handleActionClick(e){this.dispatchEvent(new CustomEvent("cgo-preference-action",{bubbles:!0,composed:!0,detail:{name:this.name||this.label||"",title:this.title||"",detail:this.detail||this.desc||"",action:this.action||"配置",originalEvent:e}}))}_renderIcon(e){const t=(e||"").trim();if(!t)return l`<slot name="icon"></slot>`;const o=/^[a-z0-9_-]+$/i.test(t);return l`
            <span class="icon" part="icon">
                <slot name="icon">
                    ${o?l`<cgo-icon name="${t}" size="18"></cgo-icon>`:l`<span class="icon-text">${t}</span>`}
                </slot>
            </span>
        `}render(){let e=this.name||this.label||"",t=this.title||"",o=this.detail||this.desc||"",r=this.icon;!e&&!t&&!o&&!r&&(e="项目",t="项目选项",o="选项详细信息",r="settings");const s=!!(t&&o);return l`
            <div class="item" part="item">
                <div class="glass-refraction" aria-hidden="true"></div>
                <div class="left" part="left">
                    ${this._renderIcon(r)}
                    ${e?l`<span class="name" part="name">${e}</span>`:""}
                </div>
                <div class="middle ${s?"":"has-single"}" part="middle">
                    ${t?l`<span class="title" part="title">${t}</span>`:""}
                    ${o?l`<span class="detail" part="detail">${o}</span>`:""}
                </div>
                <div class="right" part="right">
                    <slot name="action">
                        <slot>
                            ${this.action?l`
                                <cgo-button
                                    variant="ghost"
                                    size="sm"
                                    class="action-btn"
                                    @click=${this._handleActionClick}
                                >
                                    ${this.action}
                                </cgo-button>
                            `:""}
                        </slot>
                    </slot>
                </div>
            </div>
        `}}g(D1,"properties",{icon:{type:String},name:{type:String},label:{type:String},title:{type:String},detail:{type:String},desc:{type:String},action:{type:String}}),g(D1,"styles",m`
        :host {
            display: block;
            font-family: var(--font-sans, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
        }

        /* ===== Card B (Tier B) 规范底板 =====
           Layer 0: 折射磨砂层 (.glass-refraction)
           Layer 1: 0.9 高不透明度底色衬底层 (::after)
           Layer 2: 弱化微光单向顶弧圈 (::before)
           Layer 3: 锐利内容交互层 (.left, .middle, .right) */
        .item {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            padding: 14px 20px;
            border-radius: var(--radius-md, 10px);
            background: transparent;
            color: var(--text-main, #00263b);
            border: none !important;
            outline: none !important;
            box-sizing: border-box;
            box-shadow: var(--glass-shadow, 0 8px 24px rgba(0, 38, 59, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04));
            overflow: hidden;
            isolation: isolate;
            transition:
                box-shadow var(--glass-duration, 0.28s) var(--glass-easing, cubic-bezier(0.32, 0.72, 0, 1)),
                transform var(--glass-duration, 0.28s) var(--glass-easing, cubic-bezier(0.32, 0.72, 0, 1));
        }

        /* Layer 0: 折射磨砂层 (Tier B 规范) */
        ${z}

        /* Layer 1: 半透明底色衬底层 (Tier B 规范: 0.9 高不透明衬底) */
        .item::after {
            ${j}
        }

        :host-context([data-theme='dark']) .item::after {
            ${U}
        }

        /* Layer 2: 弱化微光圈 (Tier B 规范: 顶部柔和单向光，与 0.9 高不透明底板自然融合，零实体边框) */
        .item::before {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: inherit;
            padding: 1px;
            background:
                linear-gradient(to right,
                    rgba(0, 38, 59, var(--lg-rim-dark, 0.04)) 0,
                    rgba(0, 0, 0, 0) var(--lg-rim-side, 4px),
                    rgba(0, 0, 0, 0) calc(100% - var(--lg-rim-side, 4px)),
                    rgba(0, 38, 59, var(--lg-rim-dark, 0.04)) 100%),
                linear-gradient(to bottom,
                    rgba(255, 255, 255, calc(var(--lg-rim-lit, 0.95) * 0.45 * 0.75)) 0,
                    rgba(255, 255, 255, calc(var(--lg-rim-lit, 0.95) * 0.45 * 0.75)) var(--lg-rim-hold, 1px),
                    rgba(255, 255, 255, 0) var(--lg-rim-fade, 12px));
            -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
            mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
            pointer-events: none;
            z-index: 2;
            opacity: 0.8;
            transition: opacity 0.2s ease;
        }

        :host-context([data-theme='dark']) .item::before {
            background:
                linear-gradient(to bottom,
                    rgba(255, 255, 255, calc(var(--lg-rim-lit, 0.22) * 1.5)) 0,
                    rgba(255, 255, 255, calc(var(--lg-rim-lit, 0.22) * 1.5)) 1px,
                    rgba(255, 255, 255, 0) 12px);
            opacity: 0.8;
        }

        /* 悬浮微交互 */
        :host(:hover) .item,
        .item:hover {
            box-shadow: 0 10px 28px rgba(0, 38, 59, 0.1), 0 3px 8px rgba(0, 0, 0, 0.05);
        }

        .item:hover::after {
            background: var(--glass-bg-surface, rgba(255, 255, 255, 0.92));
        }

        .item:hover::before {
            opacity: 1;
        }

        :host-context([data-theme='dark']):host(:hover) .item,
        :host-context([data-theme='dark']) .item:hover {
            box-shadow: 0 16px 36px rgba(0, 0, 0, 0.45), 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        :host-context([data-theme='dark']) .item:hover::after {
            background: rgba(38, 40, 44, 0.88);
        }

        /* Layer 3: 内容容器 */
        .left,
        .middle,
        .right {
            position: relative;
            z-index: 3;
        }

        .left {
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 140px;
            max-width: 220px;
            flex-shrink: 0;
        }

        .icon {
            width: 32px;
            height: 32px;
            border-radius: var(--radius-sm, 6px);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background: var(--surface-secondary, rgba(0, 38, 59, 0.05));
            color: var(--text-main, #00263b);
            flex-shrink: 0;
            overflow: hidden;
            box-sizing: border-box;
            transition: background-color var(--transition-base, 0.2s ease), color var(--transition-base, 0.2s ease);
        }

        .icon-text {
            font-size: 16px;
            line-height: 1;
            display: inline-flex;
            align-items: center;
            justify-content: center;
        }

        .name {
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-size: 0.95rem;
            font-weight: 600;
            line-height: 1.3;
            color: var(--text-main, #00263b);
        }

        .middle {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            min-width: 0;
            padding: 0 10px;
        }

        .middle.has-single {
            justify-content: flex-start;
        }

        .title {
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-size: 0.95rem;
            font-weight: 500;
            line-height: 1.3;
            color: var(--text-main, #00263b);
        }

        .detail {
            color: var(--text-light, #666);
            font-size: 0.88rem;
            line-height: 1.35;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .right {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            flex-shrink: 0;
        }

        /* 暗色模式颜色映射 */
        :host-context([data-theme='dark']) .item {
            color: var(--text-main, #f0f4f8);
            box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.25);
        }

        :host-context([data-theme='dark']) .icon {
            background: rgba(255, 255, 255, 0.08);
            color: var(--text-main, #f0f4f8);
        }

        :host-context([data-theme='dark']) .name,
        :host-context([data-theme='dark']) .title {
            color: var(--text-main, #f0f4f8);
        }

        :host-context([data-theme='dark']) .detail {
            color: var(--text-light, rgba(240, 244, 248, 0.65));
        }

        @media (max-width: 640px) {
            .item {
                flex-direction: column;
                align-items: stretch;
                gap: 12px;
                padding: 14px 16px;
            }
            .left {
                width: 100%;
                max-width: 100%;
            }
            .middle {
                width: 100%;
                padding: 0;
                flex-direction: column;
                align-items: flex-start;
                gap: 4px;
            }
            .detail {
                white-space: normal;
                overflow-wrap: anywhere;
            }
            .right {
                width: 100%;
                justify-content: flex-end;
            }
        }
    `);typeof window<"u"&&window.customElements&&(customElements.get("cgo-preference-item")||customElements.define("cgo-preference-item",D1));const c2=new Map([["7","dark"],["9","dark"],["13","dark"],["14","dark"],["19","dark"],["22","dark"],["27","dark"],["cae","dark"]]);class R1 extends x{constructor(){super(),this.line="1"}_token(){const e=String(this.line||"").toLowerCase();return{亦庄:"24",亦庄线:"24",亦庄t1:"t1",t1:"t1",房山:"25",房山线:"25",燕房:"25w",燕房线:"25w",昌平:"27",昌平线:"27",西郊:"xj",西郊线:"xj",首都机场:"cae",大兴机场:"dae",s1:"sub-s1",s2:"sub-s2",s5:"sub-s5",s6:"sub-s6"}[e]||e}render(){const e=this._token(),t=c2.has(e)?"var(--line-color-text-dark, #00263b)":"var(--line-color-text-light, #fff)",o=`--line-bg:var(--line-color-${e});--line-fg:${t}`;return l`
            <span class="chip" style=${o}><slot>${this.line}号线</slot></span>
        `}}g(R1,"properties",{line:{type:String}}),g(R1,"styles",m`
        :host {
            display: inline-flex;
            vertical-align: middle;
        }
        .chip {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 44px;
            height: 24px;
            padding: 0 14px;
            border-radius: var(--radius-full, 9999px);
            background: var(--line-bg, var(--primary-color, #00263b));
            color: var(--line-fg, #fff);
            font-family: var(--font-sans, system-ui, sans-serif);
            font-size: 12px;
            font-weight: 700;
            line-height: 1;
            white-space: nowrap;
            box-sizing: border-box;
        }
    `);typeof window<"u"&&window.customElements&&(customElements.get("cgo-line-badge")||customElements.define("cgo-line-badge",R1));class F1 extends x{constructor(){super(),this.level="default",this.label=""}_label(){return this.label?this.label:{default:"常旅客",test:"先锋旅客",prime:"启元旅客",admin:"管理员"}[this.level]||"常旅客"}render(){return l`
            <section class="card"><span class="tag"><span class="tag-label">${this._label()}</span></span></section>
        `}}g(F1,"properties",{level:{type:String,reflect:!0},label:{type:String}}),g(F1,"styles",m`
        :host {
            display: block;
            font-family: var(--font-sans, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
        }
        .card {
            position: relative;
            box-sizing: border-box;
            display: flex;
            justify-content: flex-end;
            align-items: center;
            min-height: 96px;
            padding: 24px 30px;
            border-radius: var(--radius-lg, 12px);
            border: none !important;
            outline: none !important;
            overflow: hidden;
            isolation: isolate;
            color: #ffffff;
            background: var(--level-default-gradient, linear-gradient(135deg, #009655, #43b581));
            box-shadow: 0 8px 32px rgba(0, 150, 85, 0.18);
            color-scheme: only light;
            forced-color-adjust: none;
            transition: box-shadow var(--dur-fast, 140ms) ease;
        }

        /* 卡片精致 1px 双轴微光描边（Hairline Rim Light，杜绝实体边框重影） */
        .card::before {
            ${V}
        }

        :host([level='test']) .card {
            background: var(--level-test-gradient, linear-gradient(135deg, #e98913, #f0b14a));
            box-shadow: 0 8px 32px rgba(233, 137, 19, 0.22);
        }
        :host([level='prime']) .card {
            background: var(--level-prime-gradient, linear-gradient(135deg, #5f1985, #9a56c8));
            box-shadow: 0 8px 32px rgba(95, 25, 133, 0.25);
        }
        :host([level='admin']) .card {
            background: var(--level-admin-gradient, linear-gradient(135deg, #5c1c24, #9b3846));
            box-shadow: 0 8px 32px rgba(92, 28, 36, 0.25);
        }

        /* 磨砂玻璃等级胶囊标签：彻底移除实体 border 与 inset 阴影的叠圈冲突 */
        .tag {
            position: relative;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 6px 14px;
            border-radius: var(--radius-full, 9999px);
            border: none !important;
            outline: none !important;
            background: rgba(255, 255, 255, 0.22);
            color: #ffffff;
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            font-size: var(--text-md, 0.9rem);
            font-weight: 600;
            user-select: none;
            overflow: hidden;
            isolation: isolate;
            z-index: 3;
            transition:
                transform 0.28s cubic-bezier(0.32, 0.72, 0, 1),
                background-color 0.25s ease,
                box-shadow 0.28s cubic-bezier(0.32, 0.72, 0, 1);
        }

        /* 胶囊单像素顶光微光描边（单一光源无重影） */
        .tag::before {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: inherit;
            padding: 1px;
            background: linear-gradient(to bottom,
                rgba(255, 255, 255, 0.75) 0,
                rgba(255, 255, 255, 0.75) 1px,
                rgba(255, 255, 255, 0.12) 100%);
            -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
            mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
            pointer-events: none;
            z-index: 2;
            opacity: 0.8;
            transition: opacity 0.2s ease;
        }

        .tag:hover {
            transform: translateY(-1px);
            background: rgba(255, 255, 255, 0.32);
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
        }

        .tag:hover::before {
            opacity: 1;
        }

        .tag-label {
            position: relative;
            z-index: 3;
        }
    `);typeof window<"u"&&window.customElements&&(customElements.get("cgo-level-card")||customElements.define("cgo-level-card",F1));class G1 extends x{constructor(){super(),this.mode="spinner",this.size="",this.speed="medium",this.direction="cw",this.fillMode="fill",this.value=0,this.duration="",this.showText=!1,this.showPercentage=!1,this._animTimer=null,this._startTime=null}connectedCallback(){super.connectedCallback(),this.duration&&this._checkAutoStartDuration()}disconnectedCallback(){super.disconnectedCallback(),this._stopDurationAnim()}updated(e){e.has("duration")&&this.duration&&this._checkAutoStartDuration()}_checkAutoStartDuration(){const e=this._parseDurationMs(this.duration);e>0&&this.start(e)}_parseDurationMs(e){if(typeof e=="number")return e;if(!e)return 0;const t=String(e).trim();return t.endsWith("ms")?parseFloat(t)||0:t.endsWith("s")?(parseFloat(t)||0)*1e3:parseFloat(t)||0}start(e){const t=e?this._parseDurationMs(e):this._parseDurationMs(this.duration);if(t<=0)return;this._stopDurationAnim(),this.value=0;const o=performance.now(),r=i=>{const s=i-o,n=Math.min(1,s/t);this.value=Math.round(n*100),this.dispatchEvent(new CustomEvent("cgo-progress-change",{detail:{value:this.value},bubbles:!0,composed:!0})),n<1?this._animTimer=requestAnimationFrame(r):(this._animTimer=null,this.dispatchEvent(new CustomEvent("cgo-progress-complete",{detail:{value:this.value},bubbles:!0,composed:!0})))};this._animTimer=requestAnimationFrame(r)}_stopDurationAnim(){this._animTimer&&(cancelAnimationFrame(this._animTimer),this._animTimer=null)}reset(){this._stopDurationAnim(),this.value=0}setValue(e){this._stopDurationAnim(),this.value=e}_getNormalizedMode(){return this.mode==="progress"||this.hasAttribute("value")||this.hasAttribute("duration")?"progress":"spinner"}_getNormalizedSpeed(){const e=(this.speed||"").toLowerCase();return e==="slow"||e==="slow速"||e==="慢"?"1.4s":e==="fast"||e==="fast速"||e==="快"?"0.45s":"0.75s"}_getNormalizedDirection(){const e=(this.direction||"").toLowerCase();return e==="ccw"||e==="counterclockwise"||e==="counter-clockwise"||e==="逆时针"?"ccw":"cw"}_getNormalizedFillMode(){const e=(this.fillMode||"").toLowerCase();return e==="clear"||e==="清空"?"clear":"fill"}_getNormalizedValue(){let e=parseFloat(this.value);return isNaN(e)&&(e=0),e>0&&e<=1&&(e=e*100),Math.min(100,Math.max(0,e))}_shouldShowText(){return this.showText||this.showPercentage||this.hasAttribute("show-text")||this.hasAttribute("show-percentage")}render(){const e=this._getNormalizedMode(),t=this._getNormalizedDirection(),o=["sm","lg"].includes(this.size)?this.size:"",r=this.size&&!["sm","lg"].includes(this.size)?`width: ${typeof this.size=="number"||!isNaN(this.size)?`${this.size}px`:this.size}; height: ${typeof this.size=="number"||!isNaN(this.size)?`${this.size}px`:this.size};`:"",i=16,s=2*Math.PI*i;if(e==="spinner"){const u=this._getNormalizedSpeed(),y=t==="ccw"?"spin-ccw":"spin-cw",w=`${s*.25} ${s*.75}`;return l`
                <div class="spinner-container ${o}" style="${r}">
                    <svg viewBox="0 0 40 40">
                        <circle class="track" cx="20" cy="20" r="${i}"></circle>
                        <circle
                            class="indicator ${y}"
                            cx="20"
                            cy="20"
                            r="${i}"
                            stroke-dasharray="${w}"
                            style="--spin-duration: ${u};"
                        ></circle>
                    </svg>
                </div>
            `}const n=this._getNormalizedFillMode(),c=this._getNormalizedValue(),h=c/100;let b;n==="fill"?b=h:b=1-h;const d=s*(1-b),f=t==="ccw"?"dir-ccw":"dir-cw",p=this._animTimer?"0.05s":"0.3s";return l`
            <div class="spinner-container ${o}" style="${r}">
                <svg viewBox="0 0 40 40">
                    <circle class="track" cx="20" cy="20" r="${i}"></circle>
                    <circle
                        class="indicator progress-indicator ${f}"
                        cx="20"
                        cy="20"
                        r="${i}"
                        stroke-dasharray="${s}"
                        stroke-dashoffset="${d}"
                        style="--dash-transition: ${p};"
                    ></circle>
                </svg>
                ${this._shouldShowText()?l`<span class="progress-text">${Math.round(c)}%</span>`:""}
            </div>
        `}}g(G1,"properties",{mode:{type:String},size:{type:String},speed:{type:String},direction:{type:String},fillMode:{type:String,attribute:"fill-mode"},value:{type:Number},duration:{type:String},showText:{type:Boolean,attribute:"show-text"},showPercentage:{type:Boolean,attribute:"show-percentage"}}),g(G1,"styles",m`
        :host {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            vertical-align: middle;
        }

        .spinner-container {
            position: relative;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
        }

        .spinner-container.sm {
            width: 20px;
            height: 20px;
        }

        .spinner-container.lg {
            width: 60px;
            height: 60px;
        }

        svg {
            width: 100%;
            height: 100%;
            overflow: visible;
        }

        /* 背景轨道 */
        .track {
            fill: none;
            stroke: var(--border-color, #dee2e6);
            opacity: 0.4;
            stroke-width: 3.5;
        }

        .sm .track, .sm .indicator {
            stroke-width: 3;
        }

        .lg .track, .lg .indicator {
            stroke-width: 4;
        }

        /* 旋转指示器与进度指示器 */
        .indicator {
            fill: none;
            stroke: var(--primary-color, #006098);
            stroke-width: 3.5;
            stroke-linecap: round;
            transform-origin: 20px 20px;
        }

        /* Spinner 旋转动画 */
        .spin-cw {
            animation: spin-cw-anim var(--spin-duration, 0.75s) linear infinite;
        }

        .spin-ccw {
            animation: spin-ccw-anim var(--spin-duration, 0.75s) linear infinite;
        }

        @media (prefers-reduced-motion: reduce) {
            .spin-cw, .spin-ccw {
                animation-duration: 2.5s !important;
            }
        }

        @keyframes spin-cw-anim {
            from {
                transform: rotate(0deg);
            }
            to {
                transform: rotate(360deg);
            }
        }

        @keyframes spin-ccw-anim {
            from {
                transform: rotate(0deg);
            }
            to {
                transform: rotate(-360deg);
            }
        }

        /* 进度圆环样式与方向 */
        .progress-indicator {
            transition: stroke-dashoffset var(--dash-transition, 0.3s) ease;
        }

        .dir-cw {
            transform: rotate(-90deg);
        }

        .dir-ccw {
            transform: rotate(-90deg) scaleY(-1);
        }

        /* 百分比数字 */
        .progress-text {
            position: absolute;
            font-size: 11px;
            font-weight: 600;
            color: var(--text-color, #212529);
            user-select: none;
            text-align: center;
            line-height: 1;
        }

        .sm .progress-text {
            font-size: 7px;
        }

        .lg .progress-text {
            font-size: 14px;
        }
    `);typeof window<"u"&&window.customElements&&(customElements.get("cgo-spinner")||customElements.define("cgo-spinner",G1));/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const at={CHILD:2},ot=a=>(...e)=>({_$litDirective$:a,values:e});let rt=class{constructor(e){}get _$AU(){return this._$AM._$AU}_$AT(e,t,o){this._$Ct=e,this._$AM=t,this._$Ci=o}_$AS(e,t){return this.update(e,t)}update(e,t){return this.render(...t)}};/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const{I:l2}=Ht,Be=a=>a,Ie=()=>document.createComment(""),X=(a,e,t)=>{var i;const o=a._$AA.parentNode,r=e===void 0?a._$AB:e._$AA;if(t===void 0){const s=o.insertBefore(Ie(),r),n=o.insertBefore(Ie(),r);t=new l2(s,n,a,a.options)}else{const s=t._$AB.nextSibling,n=t._$AM,c=n!==a;if(c){let h;(i=t._$AQ)==null||i.call(t,a),t._$AM=a,t._$AP!==void 0&&(h=a._$AU)!==n._$AU&&t._$AP(h)}if(s!==r||c){let h=t._$AA;for(;h!==s;){const b=Be(h).nextSibling;Be(o).insertBefore(h,r),h=b}}}return t},B=(a,e,t=a)=>(a._$AI(e,t),a),d2={},h2=(a,e=d2)=>a._$AH=e,p2=a=>a._$AH,E1=a=>{a._$AR(),a._$AA.remove()};/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const Pe=(a,e,t)=>{const o=new Map;for(let r=e;r<=t;r++)o.set(a[r],r);return o},g2=ot(class extends rt{constructor(a){if(super(a),a.type!==at.CHILD)throw Error("repeat() can only be used in text expressions")}dt(a,e,t){let o;t===void 0?t=e:e!==void 0&&(o=e);const r=[],i=[];let s=0;for(const n of a)r[s]=o?o(n,s):s,i[s]=t(n,s),s++;return{values:i,keys:r}}render(a,e,t){return this.dt(a,e,t).values}update(a,[e,t,o]){const r=p2(a),{values:i,keys:s}=this.dt(e,t,o);if(!Array.isArray(r))return this.ut=s,i;const n=this.ut??(this.ut=[]),c=[];let h,b,d=0,f=r.length-1,p=0,u=i.length-1;for(;d<=f&&p<=u;)if(r[d]===null)d++;else if(r[f]===null)f--;else if(n[d]===s[p])c[p]=B(r[d],i[p]),d++,p++;else if(n[f]===s[u])c[u]=B(r[f],i[u]),f--,u--;else if(n[d]===s[u])c[u]=B(r[d],i[u]),X(a,c[u+1],r[d]),d++,u--;else if(n[f]===s[p])c[p]=B(r[f],i[p]),X(a,r[d],r[f]),f--,p++;else if(h===void 0&&(h=Pe(s,p,u),b=Pe(n,d,f)),h.has(n[d]))if(h.has(n[f])){const y=b.get(s[p]),w=y!==void 0?r[y]:null;if(w===null){const _=X(a,r[d]);B(_,i[p]),c[p]=_}else c[p]=B(w,i[p]),X(a,r[d],w),r[y]=null;p++}else E1(r[f]),f--;else E1(r[d]),d++;for(;p<=u;){const y=X(a,c[u+1]);B(y,i[p]),c[p++]=y}for(;d<=f;){const y=r[d++];y!==null&&E1(y)}return this.ut=s,h2(a,c),A}}),Oe={software:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',operation:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>',promotion:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><line x1="12" y1="22" x2="12" y2="7"></line><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path></svg>',system:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>'},b2={software:"软件消息",operation:"运营信息",promotion:"推广内容",system:"系统消息"};class Y1 extends x{constructor(){super(),this.category="software",this.noticeTitle="",this.content="",this.imageUrl="",this.popup=!1,this.closable=!1,this.actions=[],this.customCatName="",this.duration=0,this.glassMode=""}connectedCallback(){super.connectedCallback(),M()}_handleClose(e){e.stopPropagation(),this.dispatchEvent(new CustomEvent("cgo-notice-close",{bubbles:!0,composed:!0,detail:{category:this.category,title:this.noticeTitle}}))}_handleAction(e,t){t.stopPropagation(),this.dispatchEvent(new CustomEvent("cgo-notice-action",{bubbles:!0,composed:!0,detail:{action:e.type||e.action||e,title:this.noticeTitle}}))}renderHeaderIcon(){const e=Oe[this.category]||Oe.software;return l`<span .innerHTML=${e}></span>`}render(){const e=this.customCatName||b2[this.category]||"通知消息",t=Array.isArray(this.actions)&&this.actions.length>0,o=this.duration>0,r=this.glassMode==="flat"||this.glassMode==="none";return l`
            <div class="notice-card cat-${this.category}">
                ${r?null:l`<div class="glass-refraction" aria-hidden="true"></div>`}

                ${this.closable?l`
                    <div class="close-container ${o?"has-spinner":""}">
                        ${o?l`
                            <cgo-spinner
                                mode="progress"
                                size="20"
                                duration="${this.duration}"
                                fill-mode="fill"
                                direction="cw"
                                class="close-spinner"
                            ></cgo-spinner>
                        `:null}
                        <button class="close-btn" @click=${this._handleClose} title="关闭">
                            <cgo-icon name="close" size="11"></cgo-icon>
                        </button>
                    </div>
                `:null}

                <div class="card-content">
                    <div class="header">
                        ${this.renderHeaderIcon()}
                        <span>${e}</span>
                    </div>

                    <div class="title">${this.noticeTitle}</div>

                    ${this.content?l`<div class="content-body">${this.content}</div>`:null}

                    ${this.imageUrl?l`
                        <div class="image-wrap">
                            <img src="${this.imageUrl}" alt="Notice Image" loading="lazy" />
                        </div>
                    `:null}

                    <slot></slot>

                    ${t?l`
                        <div class="actions">
                            ${this.actions.map(i=>{const s=typeof i=="string"?i:i.label||i.type,n=typeof i=="object"&&i.primary;return l`
                                    <button class="action-btn ${n?"primary":""}" @click=${c=>this._handleAction(i,c)}>
                                        ${s}
                                    </button>
                                `})}
                        </div>
                    `:null}
                </div>
            </div>
        `}}g(Y1,"properties",{category:{type:String},noticeTitle:{type:String,attribute:"notice-title"},content:{type:String},imageUrl:{type:String,attribute:"image-url"},popup:{type:Boolean,reflect:!0},closable:{type:Boolean,reflect:!0},actions:{type:Array},customCatName:{type:String,attribute:"cat-name"},duration:{type:Number},glassMode:{type:String,attribute:"glass-mode",reflect:!0}}),g(Y1,"styles",m`
        :host {
            display: block;
            font-family: var(--font-sans, system-ui, -apple-system, sans-serif);
            box-sizing: border-box;

            --cat-software: var(--cgopush-cat-software, #0085c4);
            --cat-operation: var(--cgopush-cat-operation, #d29700);
            --cat-promotion: var(--cgopush-cat-promotion, #009655);
            --cat-system: var(--cgopush-cat-system, #6b7280);
        }

        :host([data-theme='dark']),
        :host-context([data-theme='dark']) {
            --cat-software: #38bdf8;
            --cat-operation: #ffca28;
            --cat-promotion: #4ade80;
            --cat-system: #a0b0b9;
        }

        /* 遵循 Card Tier C 液态玻璃规范：透明底板、物理微光投影、零实体边框 */
        .notice-card {
            position: relative;
            background: transparent;
            color: var(--text-main, #00263b);
            border-radius: var(--radius-md, 10px);
            border: none;
            box-shadow: var(--glass-shadow);
            padding: 12px 14px;
            transition: box-shadow var(--glass-duration, 0.28s) var(--glass-easing, cubic-bezier(0.32, 0.72, 0, 1)),
                        transform var(--glass-duration, 0.28s) var(--glass-easing, cubic-bezier(0.32, 0.72, 0, 1));
            overflow: hidden;
            box-sizing: border-box;
            isolation: isolate;
        }

        :host-context([data-theme='dark']) .notice-card {
            color: var(--text-main, #e6edf3);
            box-shadow: var(--glass-shadow);
        }

        :host([popup]) .notice-card {
            width: 280px;
            max-width: 80vw;
            padding-right: 32px;
            box-shadow:
                0 0 0 0.5px rgba(0, 0, 0, 0.08),
                0 12px 32px -6px rgba(0, 38, 59, 0.16),
                0 4px 12px -2px rgba(0, 38, 59, 0.08),
                inset 0 1px 1px 0 rgba(255, 255, 255, 0.9);
        }

        :host-context([data-theme='dark']):host([popup]) .notice-card {
            box-shadow:
                0 0 0 0.5px rgba(255, 255, 255, 0.15),
                0 16px 36px -6px rgba(0, 0, 0, 0.45),
                0 6px 14px -2px rgba(0, 0, 0, 0.3),
                inset 0 1px 1px 0 rgba(255, 255, 255, 0.2);
        }

        /* Layer 0: 折射磨砂层 (Card Tier C 规范: 14px 高斯模糊 + 135% 饱和度 + SVG 空间微折射) */
        ${z}

        /* Layer 1: 半透明底色衬底层 (Card Tier C 规范: 0.72 固定，与 <cgo-card> 完全一致) */
        .notice-card::after {
            ${Vt}
        }

        :host-context([data-theme='dark']) .notice-card::after {
            ${jt}
        }

        /* Layer 2: 完整双轴微光圈层 (Card Tier C 规范: 保留顶部 lit 0.95 物理微光，杜绝实体边框重影) */
        .notice-card::before {
            ${fe}
        }

        :host-context([data-theme='dark']) .notice-card::before {
            ${Je}
        }

        /* Layer 3: 内容容器 */
        .card-content {
            position: relative;
            z-index: 3;
        }

        /* 传统扁平降级模式 */
        :host([glass-mode='flat']) .notice-card,
        :host([glass-mode='none']) .notice-card {
            background: var(--card-bg, #ffffff);
            border: 1px solid var(--border-color, rgba(0, 0, 0, 0.08));
            box-shadow: var(--shadow-sm, 0 4px 15px rgba(0, 0, 0, 0.06));
            backdrop-filter: none;
            -webkit-backdrop-filter: none;
        }

        :host-context([data-theme='dark']):host([glass-mode='flat']) .notice-card,
        :host-context([data-theme='dark']):host([glass-mode='none']) .notice-card {
            background: var(--card-bg, #1e2022);
            border-color: rgba(255, 255, 255, 0.1);
        }

        :host([glass-mode='flat']) .notice-card::before,
        :host([glass-mode='flat']) .notice-card::after,
        :host([glass-mode='none']) .notice-card::before,
        :host([glass-mode='none']) .notice-card::after,
        :host([glass-mode='flat']) .glass-refraction,
        :host([glass-mode='none']) .glass-refraction {
            display: none;
        }

        .header {
            font-size: 11px;
            font-weight: 600;
            margin-bottom: 5px;
            letter-spacing: 0.3px;
            display: flex;
            align-items: center;
            gap: 5px;
            line-height: 1;
        }

        .header svg {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }

        .cat-software .header { color: var(--cat-software); }
        .cat-operation .header { color: var(--cat-operation); }
        .cat-promotion .header { color: var(--cat-promotion); }
        .cat-system .header { color: var(--cat-system); }

        .title {
            font-size: 13px;
            font-weight: 700;
            line-height: 1.4;
            color: var(--text-main, #00263b);
            word-break: break-word;
        }

        :host-context([data-theme="dark"]) .title {
            color: var(--text-main, #f1f5f9);
        }

        :host(:not([popup])) .title {
            font-size: 14px;
            margin-bottom: 6px;
        }

        .content-body {
            font-size: 12px;
            line-height: 1.5;
            color: var(--text-light, #666666);
            margin-top: 6px;
            word-break: break-word;
        }

        :host-context([data-theme="dark"]) .content-body {
            color: var(--text-light, #a0b0b9);
        }

        :host([popup]) .content-body {
            display: none;
        }

        .image-wrap {
            margin-top: 8px;
            border-radius: var(--radius-xs, 6px);
            overflow: hidden;
            max-height: 120px;
        }

        .image-wrap img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
        }

        .actions {
            margin-top: 10px;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 8px;
        }

        .action-btn {
            font-size: 11px;
            font-weight: 600;
            padding: 4px 10px;
            border-radius: var(--radius-xs, 4px);
            border: 1px solid var(--border-color, rgba(0, 0, 0, 0.12));
            background: var(--bg-color, #f8f9fa);
            color: var(--text-main, #00263b);
            cursor: pointer;
            touch-action: manipulation;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
            transition:
                background-color var(--dur-fast, 140ms) ease,
                color var(--dur-fast, 140ms) ease,
                border-color var(--dur-fast, 140ms) ease,
                transform var(--dur-micro, 100ms) cubic-bezier(0.16, 1, 0.3, 1);
        }

        :host-context([data-theme="dark"]) .action-btn {
            border-color: rgba(255, 255, 255, 0.15);
            background: rgba(255, 255, 255, 0.08);
            color: #ffffff;
        }

        @media (hover: hover) and (pointer: fine) {
            .action-btn:hover {
                background: var(--tab-hover, rgba(0, 0, 0, 0.06));
                border-color: var(--primary-color, #006098);
                color: var(--primary-color, #006098);
            }

            :host-context([data-theme="dark"]) .action-btn:hover {
                background: rgba(255, 255, 255, 0.15);
                border-color: var(--primary-color, #38bdf8);
                color: var(--primary-color, #38bdf8);
            }
        }

        .action-btn:active {
            transform: scale(0.97);
        }

        .action-btn.primary {
            background: var(--primary-color, #006098);
            color: #ffffff;
            border-color: transparent;
        }

        @media (hover: hover) and (pointer: fine) {
            .action-btn.primary:hover {
                background: var(--primary-hover, #004d7a);
            }
        }

        /* 关闭按钮容器与圆形底色 */
        .close-container {
            position: absolute;
            top: 10px;
            right: 10px;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 5;
        }

        .close-btn {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: rgba(0, 0, 0, 0.06);
            color: var(--text-main, #00263b);
            border: none;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            padding: 0;
            transition: background 0.2s, color 0.2s, transform 0.15s;
            position: relative;
            z-index: 2;
        }

        /* 当存在倒计时环时，按钮自身背景透明，让外圈倒计时环完整透出 */
        .close-container.has-spinner .close-btn {
            background: transparent;
        }

        :host([data-theme='dark']) .close-btn,
        :host-context([data-theme='dark']) .close-btn {
            background: rgba(255, 255, 255, 0.15);
            color: #ffffff;
        }

        .close-btn:hover {
            background: rgba(0, 0, 0, 0.14) !important;
            color: var(--danger-color, #ea4335);
        }

        :host-context([data-theme="dark"]) .close-btn:hover {
            background: rgba(255, 255, 255, 0.25) !important;
            color: var(--danger-color, #f87171);
        }

        /* 倒计时进度圆环 */
        .close-spinner {
            position: absolute;
            inset: 0;
            width: 20px;
            height: 20px;
            pointer-events: none;
            z-index: 1;
            --primary-color: var(--cat-software, #0085c4);
            --border-color: rgba(0, 0, 0, 0.10);
        }

        :host-context([data-theme="dark"]) .close-spinner {
            --border-color: rgba(255, 255, 255, 0.16);
        }

        .cat-operation .close-spinner { --primary-color: var(--cat-operation, #d29700); }
        .cat-promotion .close-spinner { --primary-color: var(--cat-promotion, #009655); }
        .cat-system .close-spinner { --primary-color: var(--cat-system, #6b7280); }
    `);typeof window<"u"&&window.customElements&&(customElements.get("cgo-notice-card")||customElements.define("cgo-notice-card",Y1));class K1 extends x{constructor(){super(),this.position="top-right",this._popups=[],this._seq=0,this._onVisibilityChange=()=>{document.hidden?this._pauseAll():this._resumeAll()}}connectedCallback(){super.connectedCallback(),M(),document.addEventListener("visibilitychange",this._onVisibilityChange)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("visibilitychange",this._onVisibilityChange),this._clearAllTimers()}_clearAllTimers(){this._popups.forEach(e=>{e.timerId&&(clearTimeout(e.timerId),e.timerId=null)})}_pauseItem(e){const t=this._popups.find(r=>r.id===e);if(!t||t.state==="leaving"||!t.duration||t.paused)return;t.timerId&&(clearTimeout(t.timerId),t.timerId=null);const o=Date.now()-(t.startTime||Date.now());t.remaining=Math.max(0,(t.remaining??t.duration)-o),t.paused=!0}_resumeItem(e){const t=this._popups.find(r=>r.id===e);if(!t||t.state==="leaving"||!t.duration||!t.paused)return;t.paused=!1,t.startTime=Date.now();const o=t.remaining??t.duration;o>0?t.timerId=setTimeout(()=>{this.remove(e)},o):this.remove(e)}_pauseAll(){this._popups.forEach(e=>this._pauseItem(e.id))}_resumeAll(){this._popups.forEach(e=>this._resumeItem(e.id))}push(e,t=5e3){const o=e.id||`popup_${++this._seq}`;let r;return e.isToast?r={id:o,isToast:!0,message:e.message||"",type:e.type||"info",duration:t||3e3,remaining:t||3e3,startTime:Date.now(),paused:!1,timerId:null,state:"entering"}:r={id:o,isToast:!1,category:e.category||"software",title:e.title||e.noticeTitle||"",content:e.content||"",imageUrl:e.imageUrl||e.image||"",actions:e.actions||[],duration:t,remaining:t,startTime:Date.now(),paused:!1,timerId:null,state:"entering"},this._popups=[...this._popups,r],requestAnimationFrame(()=>{this._popups=this._popups.map(i=>i.id===o?{...i,state:"show"}:i)}),t>0&&!document.hidden&&(r.timerId=setTimeout(()=>{this.remove(o)},t)),o}remove(e){const t=this._popups.find(o=>o.id===e);t&&t.timerId&&(clearTimeout(t.timerId),t.timerId=null),this._popups=this._popups.map(o=>o.id===e?{...o,state:"leaving"}:o),setTimeout(()=>{this._popups=this._popups.filter(o=>o.id!==e)},220)}clear(){this._clearAllTimers(),this._popups=this._popups.map(e=>({...e,state:"leaving"})),setTimeout(()=>{this._popups=[]},220)}_handleItemClose(e,t){t.stopPropagation(),this.remove(e),this.dispatchEvent(new CustomEvent("cgo-popup-close",{bubbles:!0,composed:!0,detail:{id:e}}))}_handleItemAction(e,t){this.dispatchEvent(new CustomEvent("cgo-popup-action",{bubbles:!0,composed:!0,detail:{id:e,eventDetail:t.detail}}))}render(){return l`
            ${g2(this._popups,e=>e.id,e=>l`
                <div class="popup-item ${e.state}"
                    @mouseenter=${()=>this._pauseItem(e.id)}
                    @mouseleave=${()=>this._resumeItem(e.id)}>
                    ${e.isToast?l`
                        <div class="toast-card ${e.type==="success"?"success":e.type==="error"||e.type==="danger"?"danger":e.type==="warning"?"warning":"info"}">
                            <span class="toast-message">${e.message}</span>
                            <cgo-spinner
                                mode="progress"
                                size="20"
                                duration="${e.duration}"
                                fill-mode="fill"
                                direction="cw"
                                class="toast-progress-ring"
                            ></cgo-spinner>
                        </div>
                    `:l`
                        <cgo-notice-card
                            popup
                            closable
                            category=${e.category}
                            notice-title=${e.title}
                            content=${e.content}
                            image-url=${e.imageUrl}
                            .actions=${e.actions}
                            duration=${e.duration||0}
                            @cgo-notice-close=${t=>this._handleItemClose(e.id,t)}
                            @cgo-notice-action=${t=>this._handleItemAction(e.id,t)}
                        ></cgo-notice-card>
                    `}
                </div>
            `)}
        `}}g(K1,"properties",{position:{type:String,reflect:!0},_popups:{state:!0}}),g(K1,"styles",m`
        :host {
            position: fixed;
            z-index: 100100;
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: none;
            font-family: var(--font-sans, system-ui, -apple-system, sans-serif);
        }

        :host([position="top-right"]), :host(:not([position])) {
            top: 76px;
            right: 18px;
        }

        :host([position="top-left"]) {
            top: 76px;
            left: 18px;
        }

        :host([position="bottom-right"]) {
            bottom: 24px;
            right: 18px;
        }

        :host([position="bottom-left"]) {
            bottom: 24px;
            left: 18px;
        }

        .popup-item {
            pointer-events: auto;
            transform: translateX(110%);
            opacity: 0;
            transition: 
                transform 0.28s cubic-bezier(0.16, 1, 0.3, 1),
                opacity 0.22s ease-out;
        }

        .popup-item.show {
            transform: none;
            opacity: 1;
        }

        .popup-item.leaving {
            transform: translateX(110%) scale(0.95);
            opacity: 0;
            pointer-events: none;
            transition:
                transform 0.18s cubic-bezier(0.4, 0, 1, 1),
                opacity 0.14s ease-in !important;
        }

        :host([position="top-left"]) .popup-item,
        :host([position="bottom-left"]) .popup-item {
            transform: translateX(-110%);
        }

        :host([position="top-left"]) .popup-item.show,
        :host([position="bottom-left"]) .popup-item.show {
            transform: none;
        }

        :host([position="top-left"]) .popup-item.leaving,
        :host([position="bottom-left"]) .popup-item.leaving {
            transform: translateX(-110%) scale(0.95);
        }

        @media (prefers-reduced-motion: reduce) {
            .popup-item {
                transition: opacity 0.15s ease !important;
                transform: none !important;
            }
        }

        .toast-card {
            width: 280px;
            max-width: 80vw;
            box-sizing: border-box;
            padding: 9px 10px 9px 14px;
            border-radius: var(--radius-md, 10px);
            font-size: 13px;
            font-weight: 500;
            line-height: 1.4;
            word-break: break-word;
            border: none;
            background: rgba(0, 38, 59, 0.85);
            color: #ffffff;
            backdrop-filter: blur(14px) saturate(140%);
            -webkit-backdrop-filter: blur(14px) saturate(140%);
            box-shadow:
                0 0 0 0.5px rgba(255, 255, 255, 0.1),
                0 10px 30px -4px rgba(0, 0, 0, 0.35),
                inset 0 1px 0 rgba(255, 255, 255, 0.25);
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
        }

        :host-context([data-theme="dark"]) .toast-card {
            background: rgba(24, 26, 28, 0.85);
            box-shadow:
                0 0 0 0.5px rgba(255, 255, 255, 0.12),
                0 12px 34px -4px rgba(0, 0, 0, 0.5),
                inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }

        .toast-message {
            flex: 1;
            color: #ffffff;
        }

        .toast-progress-ring {
            flex-shrink: 0;
            width: 20px;
            height: 20px;
            margin-right: 0px;
            --primary-color: rgba(255, 255, 255, 0.95);
            --border-color: rgba(255, 255, 255, 0.25);
        }

        .toast-card.info {
            background: var(--primary-color) !important;
            color: #ffffff !important;
        }

        .toast-card.success {
            background: var(--success-color) !important;
            color: #ffffff !important;
        }

        .toast-card.danger,
        .toast-card.error {
            background: var(--danger-color) !important;
            color: #ffffff !important;
        }

        .toast-card.warning,
        .toast-card.warn {
            background: var(--warning-color) !important;
            color: #ffffff !important;
        }
    `);typeof window<"u"&&window.customElements&&(customElements.get("cgo-notice-popup")||customElements.define("cgo-notice-popup",K1));let J=null;function it(a,e=5e3){return typeof window>"u"?null:((!J||!document.body.contains(J))&&(J=document.createElement("cgo-notice-popup"),document.body.appendChild(J)),J.push(a,e))}class st extends x{show(e,t="info",o=3e3){return nt(e,t,o)}render(){return l``}}g(st,"styles",m`
        :host {
            display: none;
        }
    `);typeof window<"u"&&window.customElements&&(customElements.get("cgo-toast")||customElements.define("cgo-toast",st));function nt(a,e="info",t=3e3){return it({isToast:!0,message:a,type:e},t)}class W1 extends x{constructor(){super(),this.text="",this.placement="top"}render(){return l`
            <slot></slot>
            ${this.text?l`
                      <span class="bubble ${this.placement==="bottom"?"bottom":""}">${this.text}</span>
                  `:null}
        `}}g(W1,"properties",{text:{type:String},placement:{type:String}}),g(W1,"styles",m`
        :host {
            position: relative;
            display: inline-flex;
        }

        .bubble {
            position: absolute;
            bottom: calc(100% + 7px);
            left: 50%;
            transform: translate(-50%, 3px);
            padding: 5px 9px;
            border-radius: var(--radius-sm, 6px);
            background: rgba(18, 20, 24, 0.94);
            color: #ffffff;
            font-size: var(--text-xs, 12px);
            font-weight: 500;
            line-height: 1.4;
            font-family: var(--font-sans, system-ui, -apple-system, sans-serif);
            letter-spacing: 0.01em;
            white-space: nowrap;
            pointer-events: none;
            opacity: 0;
            visibility: hidden;
            border: none;
            box-shadow: 0 3px 10px rgba(0, 0, 0, 0.16), 0 1px 2px rgba(0, 0, 0, 0.08);
            transition:
                opacity 140ms ease,
                transform 140ms cubic-bezier(0.16, 1, 0.3, 1),
                visibility 140ms;
            z-index: 200;
            box-sizing: border-box;
        }

        .bubble.bottom {
            bottom: auto;
            top: calc(100% + 7px);
            transform: translate(-50%, -3px);
        }

        @media (hover: hover) and (pointer: fine) {
            :host(:hover) .bubble {
                opacity: 1;
                visibility: visible;
                transform: translate(-50%, 0);
                transition-delay: 200ms;
            }
        }

        @media (prefers-reduced-motion: reduce) {
            .bubble {
                transition: opacity 100ms ease, visibility 100ms !important;
                transform: translate(-50%, 0) !important;
            }
        }

        /* 暗色模式下：略微提亮背景并赋予极细单层柔和边缘，避免与深色底色完全混融，绝无双层套圈 */
        :host-context([data-theme='dark']) .bubble {
            background: rgba(38, 40, 45, 0.96);
            color: #f3f4f6;
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.45);
        }

        /* 在 glass 容器模式下保持极简干净，仅保留极轻微的背景微透与自然单层描边，绝无复杂玻璃套框 */
        :host-context([glass-mode='liquid']) .bubble,
        :host-context([glass-mode='blur']) .bubble,
        :host-context([data-glass-mode='liquid']) .bubble,
        :host-context([data-glass-mode='blur']) .bubble {
            background: rgba(18, 20, 24, 0.92);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            border: none;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.22);
        }

        :host-context([data-theme='dark']):host-context([glass-mode='liquid']) .bubble,
        :host-context([data-theme='dark']):host-context([glass-mode='blur']) .bubble,
        :host-context([data-theme='dark']):host-context([data-glass-mode='liquid']) .bubble,
        :host-context([data-theme='dark']):host-context([data-glass-mode='blur']) .bubble {
            background: rgba(38, 40, 45, 0.92);
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.45);
        }
    `);typeof window<"u"&&window.customElements&&(customElements.get("cgo-tooltip")||customElements.define("cgo-tooltip",W1));const e1=new Set;let Ne=!1;function f2(){Ne||(Ne=!0,document.addEventListener("click",()=>{e1.forEach(a=>a.close())}))}class X1 extends x{constructor(){super(),this.open=!1,this.align="right",this.glassMode="",this._closing=!1,this._positionHandler=()=>{this.open&&this._positionMenu()}}connectedCallback(){super.connectedCallback(),M()}disconnectedCallback(){super.disconnectedCallback(),e1.delete(this),window.removeEventListener("resize",this._positionHandler),window.removeEventListener("scroll",this._positionHandler,!0)}firstUpdated(){f2()}_toggle(e){e.stopPropagation(),this.open?this.close():this.show()}show(){this._closing=!1,e1.forEach(e=>{e!==this&&e.close()}),this.open=!0,e1.add(this),requestAnimationFrame(()=>this._positionMenu()),window.addEventListener("resize",this._positionHandler),window.addEventListener("scroll",this._positionHandler,!0)}_positionMenu(){var d,f;const e=(d=this.shadowRoot)==null?void 0:d.querySelector(".menu"),t=(f=this.shadowRoot)==null?void 0:f.querySelector(".trigger");if(!e||!t)return;const o=t.getBoundingClientRect(),r=e.offsetWidth||190,i=window.innerWidth,s=window.innerHeight,n=8,c=o.bottom+n,h=s-o.top+n,b=c+300<s;if(e.style.top=b?`${c}px`:"",e.style.bottom=b?"":`${h}px`,e.style.left="",e.style.right="",this.align==="left"){const p=Math.max(4,Math.min(o.left,i-r-4));e.style.left=`${p}px`}else if(this.align==="center"){const p=o.left+o.width/2,u=Math.max(4,Math.min(p-r/2,i-r-4));e.style.left=`${u}px`}else{const p=i-o.right;e.style.right=`${Math.max(4,p)}px`}}close(){var o;if(!this.open||this._closing)return;this._closing=!0,this.requestUpdate();const e=(o=this.shadowRoot)==null?void 0:o.querySelector(".menu"),t=()=>{this._closing=!1,this.open=!1,e1.delete(this),window.removeEventListener("resize",this._positionHandler),window.removeEventListener("scroll",this._positionHandler,!0),this.requestUpdate()};e?(e.addEventListener("animationend",t,{once:!0}),setTimeout(()=>{this._closing&&t()},180)):t()}_onMenuClick(e){e.target.closest("a, button, .dropdown-item")&&this.close()}render(){const e=this.glassMode==="flat"||this.glassMode==="none",t=this.open||this._closing;return l`
            <div class="trigger" @click=${this._toggle}>
                <slot name="trigger"></slot>
            </div>
            ${t?l`
                      <div class="menu ${this._closing?"closing":""}" @click=${this._onMenuClick}>
                          ${e?null:l`<div class="glass-refraction" aria-hidden="true"></div>`}
                          <div class="menu-content">
                              <slot></slot>
                          </div>
                      </div>
                  `:null}
        `}}g(X1,"properties",{open:{type:Boolean,reflect:!0},align:{type:String},glassMode:{type:String,attribute:"glass-mode",reflect:!0}}),g(X1,"styles",m`
        :host {
            position: relative;
            display: inline-block;
        }
        .trigger {
            display: inline-flex;
        }

        /* 遵循 Tier B 不可交互底板规范 (0.9 衬底，柔和微光圈) */
        .menu {
            display: none;
            /*
             * Fix: position: fixed 直接以视口为定位基准，完全脱离父级的 isolation、overflow、backdrop-filter 约束。
             * 坐标由 JS _positionMenu() 动态计算，并随 resize/scroll 跟随。
             */
            position: fixed;
            min-width: 190px;
            background: transparent;
            border: none;
            border-radius: var(--radius-lg, 12px);
            box-shadow: var(--glass-shadow, 0 8px 24px rgba(0, 38, 59, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04));
            z-index: 100000;
            padding: 6px;
            overflow: hidden;
            isolation: isolate;
            box-sizing: border-box;
            transform-origin: top right;
            animation: dropdownIn var(--dur-fast, 160ms) cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* Layer 0: 折射磨砂层 (Tier B 规范) */
        ${z}

        /* Layer 1: 半透明底色衬底层 (Tier B 规范: 0.9 固定) */
        .menu::after {
            ${j}
        }
        :host-context([data-theme='dark']) .menu::after {
            ${U}
        }

        /* Layer 2: 弱化微光圈 (Tier B 规范: 顶部柔和单向光，与 0.9 高不透明底板自然融合) */
        .menu::before {
            ${H}
        }

        :host-context([data-theme='dark']) .menu::before {
            ${T}
        }

        :host-context([data-theme='dark']) .menu {
            box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45), 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        /* Layer 3: 菜单内容项 */
        .menu-content {
            position: relative;
            z-index: 3;
        }

        /* align 属性仅影响 transform-origin，坐标已由 JS 全量负责 */
        :host([align='left']) .menu {
            transform-origin: top left;
        }
        :host([align='center']) .menu {
            transform-origin: top center;
        }
        :host([open]) .menu {
            display: block;
        }

        /* 传统扁平降级 */
        :host([glass-mode='flat']) .menu,
        :host([glass-mode='none']) .menu {
            background: var(--card-bg, #fff);
            border: 1px solid var(--border-color, #dee2e6);
            backdrop-filter: none;
            -webkit-backdrop-filter: none;
        }
        :host([glass-mode='flat']) .menu::before,
        :host([glass-mode='flat']) .menu::after,
        :host([glass-mode='none']) .menu::before,
        :host([glass-mode='none']) .menu::after {
            display: none;
        }
        :host-context([data-theme='dark']):host([glass-mode='flat']) .menu {
            background: var(--card-bg, #1f2020);
            border-color: var(--border-color, #383a3c);
        }

        @keyframes dropdownIn {
            from {
                opacity: 0;
                transform: scale(0.96);
            }
            to {
                opacity: 1;
                transform: scale(1);
            }
        }
        @keyframes dropdownOut {
            from {
                opacity: 1;
                transform: scale(1);
            }
            to {
                opacity: 0;
                transform: scale(0.97);
            }
        }
        .menu.closing {
            display: block;
            animation: dropdownOut 140ms cubic-bezier(0.4, 0, 1, 1) forwards;
        }

        /* 暴露给 light DOM 菜单项的统一样式（::slotted）
           注意：用 !important 抵消外层文档 cgo_element.css 的 *{padding:0} 全局重置，
           否则菜单项会塌成单行、行间距过挤。*/
        ::slotted(a),
        ::slotted(button),
        ::slotted(.dropdown-item) {
            display: flex !important;
            align-items: center;
            gap: 8px;
            padding: 8px 12px !important;
            margin: 0 !important;
            border-radius: var(--radius-sm, 6px);
            color: var(--text-main, #00263b);
            font-size: var(--text-base, 14px);
            font-weight: 500;
            line-height: 1.5;
            text-decoration: none;
            cursor: pointer;
            white-space: nowrap;
            border: none;
            background: transparent;
            box-sizing: border-box;
            width: 100%;
            text-align: left;
            user-select: none;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
            font-family: var(--font-sans, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
            transition:
                background-color var(--dur-fast, 140ms) ease,
                color var(--dur-fast, 140ms) ease,
                transform var(--dur-micro, 100ms) cubic-bezier(0.16, 1, 0.3, 1);
        }
        @media (hover: hover) and (pointer: fine) {
            ::slotted(a:hover),
            ::slotted(button:hover),
            ::slotted(.dropdown-item:hover) {
                background: var(--btn-info-hover, rgba(0, 38, 59, 0.06)) !important;
                color: var(--text-main, #00263b);
            }
        }
        :host-context([data-theme='dark']) ::slotted(a),
        :host-context([data-theme='dark']) ::slotted(button),
        :host-context([data-theme='dark']) ::slotted(.dropdown-item) {
            color: var(--text-main, #e5e8ea);
        }
        @media (hover: hover) and (pointer: fine) {
            :host-context([data-theme='dark']) ::slotted(a:hover),
            :host-context([data-theme='dark']) ::slotted(button:hover),
            :host-context([data-theme='dark']) ::slotted(.dropdown-item:hover) {
                background: rgba(255, 255, 255, 0.08) !important;
                color: #ffffff;
            }
        }
        ::slotted(a:active),
        ::slotted(button:active),
        ::slotted(.dropdown-item:active) {
            transform: scale(0.98);
        }

        /* 分隔线 */
        ::slotted(.dropdown-divider) {
            display: block !important;
            height: 1px;
            margin: 4px 0 !important;
            background: var(--border-color, rgba(0, 38, 59, 0.08));
        }
        :host-context([data-theme='dark']) ::slotted(.dropdown-divider) {
            background: rgba(255, 255, 255, 0.08);
        }

        /* 菜单内图标尺寸对齐 */
        ::slotted(a) cgo-icon,
        ::slotted(button) cgo-icon {
            flex-shrink: 0;
        }
    `);typeof window<"u"&&window.customElements&&(customElements.get("cgo-dropdown")||customElements.define("cgo-dropdown",X1));class J1 extends x{constructor(){super(),this.open=!1,this.title="",this.maxWidth="",this.closeOnOverlay=!0,this.glassMode="",this.tier="b",this._closing=!1,this._onKey=this._onKey.bind(this),this._syncNestedCards=this._syncNestedCards.bind(this)}connectedCallback(){super.connectedCallback(),M(),document.addEventListener("keydown",this._onKey)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("keydown",this._onKey)}firstUpdated(){this._syncNestedCards()}_syncNestedCards(){var o;const e=(o=this.shadowRoot)==null?void 0:o.querySelector("slot");if(!e)return;(e.assignedElements?e.assignedElements({flatten:!0}):[]).forEach(r=>{var s,n;((s=r.tagName)==null?void 0:s.toLowerCase())==="cgo-card"&&r.getAttribute("tier")!=="c"&&r.setAttribute("tier","c");const i=(n=r.querySelectorAll)==null?void 0:n.call(r,"cgo-card");i==null||i.forEach(c=>{c.getAttribute("tier")!=="c"&&c.setAttribute("tier","c")})})}_onKey(e){e.key==="Escape"&&this.open&&!this._closing&&this._close()}_close(){var o,r;if(this._closing)return;this._closing=!0,this.requestUpdate();const e=(o=this.shadowRoot)==null?void 0:o.querySelector(".dialog");(r=this.shadowRoot)==null||r.querySelector(".overlay");const t=()=>{this._closing=!1,this.open=!1,this.dispatchEvent(new CustomEvent("cgo-close",{bubbles:!0,composed:!0}))};e?e.addEventListener("animationend",t,{once:!0}):t()}show(){this.open=!0}render(){if(!this.open&&!this._closing)return l``;const e=this.maxWidth?`width:min(${this.maxWidth},92dvw)`:"",t=this.glassMode==="flat"||this.glassMode==="none";return l`
            <div class="overlay ${this._closing?"closing":""}" @click=${()=>!this._closing&&this.closeOnOverlay&&this._close()}></div>
            <div class="dialog ${this._closing?"closing":""}" style=${e} role="dialog" aria-modal="true">
                ${t?null:l`<div class="glass-refraction" aria-hidden="true"></div>`}
                <button class="close" @click=${this._close} aria-label="关闭"><cgo-icon name="close" size="14"></cgo-icon></button>
                ${this.title?l`
                          <h3 class="title">${this.title}</h3>
                      `:null}
                <div class="body"><slot @slotchange=${this._syncNestedCards}></slot></div>
            </div>
        `}}g(J1,"properties",{open:{type:Boolean,reflect:!0},title:{type:String},maxWidth:{type:String,attribute:"max-width"},closeOnOverlay:{type:Boolean,attribute:"close-on-overlay"},glassMode:{type:String,attribute:"glass-mode",reflect:!0},tier:{type:String,reflect:!0}}),g(J1,"styles",m`
        :host {
            display: none;
        }
        :host([open]) {
            display: block;
        }
        .overlay {
            position: fixed;
            inset: 0;
            background: transparent;
            z-index: 99990;
            backdrop-filter: blur(8px) saturate(120%);
            -webkit-backdrop-filter: blur(8px) saturate(120%);
            animation: overlayIn 0.2s ease;
        }
        @keyframes overlayIn {
            from {
                opacity: 0;
            }
            to {
                opacity: 1;
            }
        }

        /* 遵循 Tier B 不可交互底板规范 (0.9 衬底，柔和顶部微光圈，严禁 hover 任何位移动效) */
        .dialog {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: transparent;
            color: var(--text-main, #00263b);
            border: none;
            border-radius: var(--radius-lg, 12px);
            box-shadow: 0 20px 50px -10px rgba(0, 38, 59, 0.2), 0 8px 24px -4px rgba(0, 38, 59, 0.12);
            z-index: 100000;
            width: min(560px, 92dvw);
            max-height: 90dvh;
            overflow: hidden;
            isolation: isolate;
            display: flex;
            flex-direction: column;
            animation: dialogIn 0.24s cubic-bezier(0.16, 1, 0.3, 1);
            overscroll-behavior: contain;
        }

        /* Layer 0: 折射磨砂层 (Tier B 规范: 14px 物理高斯模糊 + 135% 饱和度 + SVG 空间微折射) */
        ${z}

        /* Layer 1: 半透明底色衬底层 (Tier B 规范: 0.9 固定) */
        .dialog::after {
            ${j}
        }
        :host-context([data-theme='dark']) .dialog::after {
            ${U}
        }

        /* Layer 2: 弱化微光圈 (Tier B 规范: 顶部柔和单向光，与 0.9 高不透明底板自然融合) */
        .dialog::before {
            ${H}
        }

        :host-context([data-theme='dark']) .dialog::before {
            ${T}
        }

        :host-context([data-theme='dark']) .dialog {
            box-shadow: 0 24px 60px -10px rgba(0, 0, 0, 0.7), 0 8px 24px -4px rgba(0, 0, 0, 0.5);
        }

        /* 传统扁平降级 */
        :host([glass-mode='flat']) .dialog,
        :host([glass-mode='none']) .dialog {
            background: var(--panel-bg, #fff);
            border: 1px solid var(--border-color, #dee2e6);
            backdrop-filter: none;
            -webkit-backdrop-filter: none;
        }
        :host([glass-mode='flat']) .dialog::before,
        :host([glass-mode='flat']) .dialog::after,
        :host([glass-mode='none']) .dialog::before,
        :host([glass-mode='none']) .dialog::after {
            display: none;
        }
        :host-context([data-theme='dark']):host([glass-mode='flat']) .dialog {
            background: var(--panel-bg, #1f2020);
            border-color: var(--border-color, #383a3c);
        }

        @keyframes dialogIn {
            from {
                opacity: 0;
                transform: translate(-50%, -48%) scale(0.96);
            }
            to {
                opacity: 1;
                transform: translate(-50%, -50%) scale(1);
            }
        }
        /* C-04: 弹窗退出动画 — 干脆收缩，不反弹 */
        @keyframes dialogOut {
            from {
                opacity: 1;
                transform: translate(-50%, -50%) scale(1);
            }
            to {
                opacity: 0;
                transform: translate(-50%, -48%) scale(0.97);
            }
        }
        .overlay.closing {
            animation: overlayOut 0.18s cubic-bezier(0.4, 0, 1, 1) forwards;
        }
        @keyframes overlayOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
        .dialog.closing {
            /* C-04: 出场使用 ease-in，无反弹 */
            animation: dialogOut 0.16s cubic-bezier(0.4, 0, 1, 1) forwards;
        }
        .close {
            position: absolute;
            top: 14px;
            right: 16px;
            background: none;
            border: none;
            cursor: pointer;
            color: var(--text-light, #666);
            line-height: 1;
            padding: 4px;
            z-index: 10;
            -webkit-tap-highlight-color: transparent;
            touch-action: manipulation;
            user-select: none;
            transition: color 0.16s ease, transform 0.12s cubic-bezier(0.2, 0, 0, 1);
        }
        @media (hover: hover) and (pointer: fine) {
            .close:hover {
                color: var(--text-main, #00263b);
                transform: scale(1.08);
            }
        }
        .close:active {
            transform: scale(0.92);
        }
        .title {
            position: relative;
            z-index: 3;
            margin: 0;
            padding: 22px 25px 0;
            font-size: 18px;
            font-weight: 700;
        }
        .body {
            position: relative;
            z-index: 3;
            padding: 16px 25px 22px;
            overflow-y: auto;
            overscroll-behavior-y: contain;
            color: var(--text-main, #00263b);
            font-family: var(--font-sans, system-ui, sans-serif);
            line-height: 1.6;
        }
        ::slotted(p),
        .body::slotted(p) {
            margin: 0 0 10px;
        }
        ::slotted(.dialog-buttons),
        .body::slotted(.dialog-buttons) {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 16px;
        }

        /* ══════════════════════════════════════════════════════
           面板内容如果包含 card 类型，则内容对齐 Tier C 强调表面规范
           (固定 0.72 衬底 + 完整双轴微光圈 + 零 hover 位移抖动)
           ══════════════════════════════════════════════════════ */
        ::slotted(cgo-card),
        .body::slotted(cgo-card) {
            display: block;
            margin-bottom: 12px;
            --glass-bg-surface: rgba(255, 255, 255, 0.72);
        }
        :host-context([data-theme='dark']) ::slotted(cgo-card),
        :host-context([data-theme='dark']) .body::slotted(cgo-card) {
            --glass-bg-surface: rgba(31, 32, 34, 0.72);
        }

        ::slotted(.card),
        ::slotted(.help-card),
        ::slotted(.modal-card),
        ::slotted([data-card]),
        .body::slotted(.card),
        .body::slotted(.help-card),
        .body::slotted(.modal-card),
        .body::slotted([data-card]) {
            display: block;
            position: relative;
            background: transparent !important;
            border: none !important;
            border-radius: var(--radius-lg, 12px);
            padding: 14px 16px;
            margin-bottom: 12px;
            box-sizing: border-box;
            color: var(--text-main, #00263b);
            overflow: hidden;
            isolation: isolate;
            box-shadow: var(--glass-shadow-surface, 0 4px 16px rgba(0, 38, 59, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04));
            cursor: default;
            transform: none !important;
        }

        :host-context([data-theme='dark']) ::slotted(.card),
        :host-context([data-theme='dark']) ::slotted(.help-card),
        :host-context([data-theme='dark']) ::slotted(.modal-card),
        :host-context([data-theme='dark']) ::slotted([data-card]),
        :host-context([data-theme='dark']) .body::slotted(.card),
        :host-context([data-theme='dark']) .body::slotted(.help-card),
        :host-context([data-theme='dark']) .body::slotted(.modal-card),
        :host-context([data-theme='dark']) .body::slotted([data-card]) {
            color: var(--text-main, #e5e8ea);
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
        }

        @media screen and (max-width: 640px) {
            .dialog {
                top: auto;
                bottom: 0;
                left: 0;
                transform: none;
                width: 100dvw !important;
                max-width: 100dvw !important;
                max-height: 85dvh;
                border-radius: 20px 20px 0 0;
                animation: drawerIn 0.28s cubic-bezier(0.16, 1, 0.3, 1);
            }
            .dialog.closing {
                animation: drawerOut 0.2s cubic-bezier(0.4, 0, 1, 1) forwards;
            }
            .body {
                padding-bottom: max(24px, env(safe-area-inset-bottom, 20px));
            }
        }
        @keyframes drawerIn {
            from {
                transform: translateY(100%);
            }
            to {
                transform: translateY(0);
            }
        }
        @keyframes drawerOut {
            from {
                transform: translateY(0);
            }
            to {
                transform: translateY(100%);
            }
        }
    `);typeof window<"u"&&window.customElements&&(customElements.get("cgo-modal")||customElements.define("cgo-modal",J1));class Q1 extends x{constructor(){super(),this.label="",this.icon="",this.active=!1,this.disabled=!1}render(){return l`<slot></slot>`}}g(Q1,"properties",{label:{type:String},icon:{type:String},active:{type:Boolean,reflect:!0},disabled:{type:Boolean,reflect:!0}}),g(Q1,"styles",m`
        :host {
            display: none;
        }
        :host([active]) {
            display: block;
            animation: tabFadeIn 160ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes tabFadeIn {
            from {
                opacity: 0;
                transform: translateY(3px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `);typeof window<"u"&&window.customElements&&(customElements.get("cgo-tab")||customElements.define("cgo-tab",Q1));class ee extends x{constructor(){super(),this.index=0,this.full=!1,this.pill=!1,this.size="",this.inline=!1}get _tabs(){return[...this.querySelectorAll("cgo-tab")]}_select(e){const t=this._tabs;t.length&&(t[e]&&t[e].disabled||(this.index=e,t.forEach((o,r)=>{o.active=r===e}),this.requestUpdate(),this.dispatchEvent(new CustomEvent("cgo-tab-change",{detail:{index:e},bubbles:!0,composed:!0}))))}updated(e){e.has("index")&&this._tabs.forEach((o,r)=>{o.active=r===this.index})}firstUpdated(){const t=this._tabs.findIndex(o=>o.hasAttribute("active")||o.active);this._select(t>=0?t:this.index||0)}_onSlotChange(){this.requestUpdate(),this._select(this.index||0)}render(){const e=this._tabs,t=e.some(o=>(o.textContent||"").trim().length>0||o.children.length>0);return t?this.hasAttribute("has-panels")||this.setAttribute("has-panels",""):this.hasAttribute("has-panels")&&this.removeAttribute("has-panels"),l`
            <div class="tab-pill-group" role="tablist">
                ${e.map((o,r)=>l`
                        <button
                            type="button"
                            role="tab"
                            class="tab-btn ${r===this.index?"active":""}"
                            ?disabled=${o.disabled}
                            aria-selected=${r===this.index}
                            @click=${()=>this._select(r)}
                        >
                            ${o.icon?l`<cgo-icon name="${o.icon}" size="${this.size==="sm"?"13":"14"}"></cgo-icon>`:null}
                            <span>${o.label}</span>
                        </button>
                    `)}
            </div>
            <div class="panels ${t?"":"is-empty"}">
                <slot @slotchange=${this._onSlotChange}></slot>
            </div>
        `}}g(ee,"properties",{index:{type:Number},full:{type:Boolean,reflect:!0},pill:{type:Boolean,reflect:!0},size:{type:String,reflect:!0},inline:{type:Boolean,reflect:!0}}),g(ee,"styles",m`
        :host {
            display: block;
            width: 100%;
            font-family: var(--font-sans, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
        }

        :host([inline]),
        :host(:not([full]):not([has-panels])) {
            display: inline-block;
            width: auto;
        }

        /* 移植自 CGo-Voice 声音克隆中心的高颜值分段胶囊标签组 (.tab-pill-group) */
        .tab-pill-group {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            background: var(--office-hover, rgba(0, 38, 59, 0.05));
            border: 1px solid var(--office-border, rgba(0, 0, 0, 0.08));
            border-radius: var(--radius-md, 8px);
            padding: 3px;
            box-sizing: border-box;
            user-select: none;
            max-width: 100%;
            overflow-x: auto;
            scrollbar-width: none;
            -webkit-overflow-scrolling: touch;
        }

        .tab-pill-group::-webkit-scrollbar {
            display: none;
        }

        :host([full]) .tab-pill-group {
            display: flex;
            width: 100%;
        }

        :host([pill]) .tab-pill-group {
            border-radius: var(--radius-full, 9999px);
            padding: 4px;
        }

        :host-context([data-theme="dark"]) .tab-pill-group {
            background: rgba(255, 255, 255, 0.06);
            border-color: rgba(255, 255, 255, 0.1);
        }

        /* 分段选项卡按钮 */
        .tab-btn {
            position: relative;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            padding: 6px 16px;
            font-size: 13px;
            font-weight: 500;
            font-family: inherit;
            color: var(--text-light, #64748b);
            background: transparent;
            border: 1px solid transparent;
            border-radius: 6px;
            cursor: pointer;
            transition:
                color var(--dur-fast, 140ms) ease,
                background-color var(--dur-fast, 140ms) ease,
                box-shadow var(--dur-fast, 140ms) ease,
                border-color var(--dur-fast, 140ms) ease,
                transform var(--dur-micro, 100ms) cubic-bezier(0.23, 1, 0.32, 1);
            user-select: none;
            outline: none;
            box-sizing: border-box;
            line-height: 1.4;
            white-space: nowrap;
            -webkit-tap-highlight-color: transparent;
            touch-action: manipulation;
        }

        :host([full]) .tab-btn {
            flex: 1;
        }

        :host([pill]) .tab-btn {
            border-radius: var(--radius-full, 9999px);
            padding: 6px 18px;
        }

        :host([size="sm"]) .tab-btn {
            padding: 4px 12px;
            font-size: 12px;
        }

        :host([size="sm"][pill]) .tab-btn {
            padding: 4px 14px;
        }

        @media (hover: hover) and (pointer: fine) {
            .tab-btn:hover:not(.active):not([disabled]) {
                color: var(--text-main, #00263b);
                background: rgba(0, 0, 0, 0.03);
            }

            :host-context([data-theme="dark"]) .tab-btn:hover:not(.active):not([disabled]) {
                color: #e2e8f0;
                background: rgba(255, 255, 255, 0.04);
            }
        }

        /* 激活选中项（高光浮起卡片质感） */
        .tab-btn.active {
            background: var(--card-bg, #ffffff);
            color: var(--primary-color, #006098);
            font-weight: 600;
            border-color: rgba(0, 0, 0, 0.04);
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04);
        }

        .tab-btn.active cgo-icon {
            color: var(--primary-color, #006098);
        }

        :host-context([data-theme="dark"]) .tab-btn.active {
            background: rgba(255, 255, 255, 0.14);
            color: #38bdf8;
            border-color: rgba(255, 255, 255, 0.15);
            box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
        }

        :host-context([data-theme="dark"]) .tab-btn.active cgo-icon {
            color: #38bdf8;
        }

        .tab-btn:active:not([disabled]) {
            transform: scale(0.96);
        }

        .tab-btn[disabled] {
            opacity: 0.45;
            cursor: not-allowed;
            pointer-events: none;
        }

        .tab-btn cgo-icon {
            flex-shrink: 0;
            transition: color var(--dur-fast, 140ms) ease;
        }

        /* 面板内容容器 */
        .panels {
            display: block;
            width: 100%;
            padding-top: 12px;
            box-sizing: border-box;
            color: var(--text-main, #00263b);
        }

        :host([no-panel]) .panels,
        .panels.is-empty {
            display: none !important;
            padding: 0 !important;
        }
    `);typeof window<"u"&&window.customElements&&(customElements.get("cgo-tabs")||customElements.define("cgo-tabs",ee));class te extends x{constructor(){super(),this.name="",this.src="",this.color="",this.size="60"}connectedCallback(){super.connectedCallback(),M()}_initials(){if(!this.name)return"";const e=this.name.trim();return/[一-龥]/.test(e)?e.slice(-1):e.split(/\s+/).map(t=>t[0]).slice(0,2).join("").toUpperCase()}render(){const e=/^\d+$/.test(this.size)?this.size+"px":this.size,t=this.color||"var(--primary-color, #006098)",o=`color-mix(in srgb, ${t} 90%, transparent)`;let r=`--cgo-avatar-size:${e};`;this.src?r+="--cgo-avatar-bg:var(--glass-bg-panel, rgba(255, 255, 255, 0.9));":r+=`--cgo-avatar-bg:${o};--cgo-avatar-flat-bg:${t};`;const i=["av",this.color?"has-color":"",this.src?"has-src":""].filter(Boolean).join(" ");return l`
            <div class="${i}" style="${r}">
                <div class="glass-refraction" aria-hidden="true"></div>
                <div class="av-content">
                    ${this.src?l`<img src=${this.src} alt=${this.name||"avatar"} />`:l`<span>${this._initials()}</span>`}
                </div>
            </div>
        `}}g(te,"properties",{name:{type:String},src:{type:String},color:{type:String},size:{type:String},glassMode:{type:String,attribute:"glass-mode",reflect:!0}}),g(te,"styles",m`
        :host {
            display: inline-flex;
            vertical-align: middle;
        }

        /* 遵循 Tier B 不可交互底板规范 (0.9 衬底，柔和微光圈，50% 纯圆轮廓) */
        .av {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            overflow: hidden;
            isolation: isolate;
            box-sizing: border-box;
            background: transparent;
            border: none;
            box-shadow: var(--glass-shadow, 0 8px 24px rgba(0, 38, 59, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04));
            color: #ffffff;
            font-family: var(--font-sans, system-ui, sans-serif);
            font-weight: 700;
            width: var(--cgo-avatar-size, 60px);
            height: var(--cgo-avatar-size, 60px);
            font-size: calc(var(--cgo-avatar-size, 60px) * 0.4);
            user-select: none;
            flex-shrink: 0;
            transition: box-shadow 0.25s ease;
        }

        :host-context([data-theme='dark']) .av {
            box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45), 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        /* Layer 0: 折射磨砂层 (Tier B 规范) */
        ${z}

        /* Layer 1: 半透明底色衬底层 (Tier B 规范: 0.9 固定) */
        .av::after {
            content: '';
            position: absolute;
            inset: 0;
            z-index: 1;
            border-radius: inherit;
            background: var(--cgo-avatar-bg, var(--glass-bg-panel, rgba(255, 255, 255, 0.9)));
            pointer-events: none;
            transition: background-color 0.25s ease;
        }

        :host-context([data-theme='dark']) .av:not(.has-color):not(.has-src)::after {
            background: var(--glass-bg-panel, rgba(31, 32, 34, 0.9));
        }

        /* Layer 2: 弱化微光圈 (Tier B 规范: 顶部柔和单向光，在 50% 圆形上呈现精致穹顶高光) */
        .av::before {
            ${H}
        }

        :host-context([data-theme='dark']) .av::before {
            ${T}
        }

        /* Layer 3: 头像内容区 (首字母文本或图片) */
        .av-content {
            position: relative;
            z-index: 3;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            border-radius: inherit;
            overflow: hidden;
        }

        img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
        }

        /* 传统扁平降级 */
        :host([glass-mode='flat']) .av,
        :host([glass-mode='none']) .av {
            background: var(--cgo-avatar-flat-bg, var(--card-bg, #fff));
            box-shadow: var(--shadow-sm, 0 2px 6px rgba(0, 0, 0, 0.08));
            backdrop-filter: none;
            -webkit-backdrop-filter: none;
        }
        :host([glass-mode='flat']) .av::before,
        :host([glass-mode='flat']) .av::after,
        :host([glass-mode='none']) .av::before,
        :host([glass-mode='none']) .av::after {
            display: none;
        }
    `);typeof window<"u"&&window.customElements&&(customElements.get("cgo-avatar")||customElements.define("cgo-avatar",te));class ae extends x{constructor(){super(),this.role="bot",this.sender="",this.time=""}connectedCallback(){super.connectedCallback(),M()}render(){const e=this.sender||this.time?l`
                      <div class="meta">${[this.sender,this.time].filter(Boolean).join(" · ")}</div>
                  `:null;return l`
            <div class="bubble ${this.role==="user"?"user":"bot"}">
                <div class="glass-refraction" aria-hidden="true"></div>
                <div class="bubble-content">
                    <slot></slot>
                </div>
            </div>
            ${e}
        `}}g(ae,"properties",{role:{type:String},sender:{type:String},time:{type:String},glassMode:{type:String,attribute:"glass-mode",reflect:!0}}),g(ae,"styles",m`
        :host {
            display: flex;
            flex-direction: column;
            margin: 8px 0;
            align-items: flex-start;
            box-sizing: border-box;
        }

        :host([role='user']) {
            align-items: flex-end;
        }

        /* 遵循 Tier B 不可交互底板规范 (0.9 衬底，柔和微光圈，专属不对称气泡圆角) */
        .bubble {
            position: relative;
            max-width: 80%;
            padding: 10px 15px;
            font-size: var(--text-base, 14px);
            line-height: 1.5;
            font-family: var(--font-sans, system-ui, sans-serif);
            word-break: break-word;
            background: transparent;
            border: none;
            box-shadow: var(--glass-shadow, 0 8px 24px rgba(0, 38, 59, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04));
            overflow: hidden;
            isolation: isolate;
            box-sizing: border-box;
            transition: box-shadow 0.25s ease;
        }

        :host-context([data-theme='dark']) .bubble {
            box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45), 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        /* 不对称圆角语义与物理入场动效 */
        .bot {
            border-radius: 16px 16px 16px 4px;
            color: var(--text-main, #00263b);
            transform-origin: bottom left;
            animation: bubbleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        :host-context([data-theme='dark']) .bot {
            color: var(--text-main, #e6edf3);
        }

        .user {
            border-radius: 16px 16px 4px 16px;
            color: #ffffff;
            box-shadow: 0 6px 20px rgba(0, 96, 152, 0.16), 0 2px 6px rgba(0, 0, 0, 0.04);
            transform-origin: bottom right;
            animation: bubbleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        :host-context([data-theme='dark']) .user {
            color: #ffffff;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 112, 176, 0.2);
        }

        @keyframes bubbleIn {
            from {
                opacity: 0;
                transform: translateY(6px) scale(0.97);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }

        @media (prefers-reduced-motion: reduce) {
            .bot, .user {
                animation: none !important;
            }
        }

        /* Layer 0: 折射磨砂层 (Tier B 规范) */
        ${z}

        /* Layer 1: 半透明底色衬底层 (Tier B 规范: 0.9 固定) */
        .bubble::after {
            content: '';
            position: absolute;
            inset: 0;
            z-index: 1;
            border-radius: inherit;
            pointer-events: none;
            transition: background-color 0.25s ease;
        }

        .bot::after {
            background: var(--glass-bg-panel, rgba(255, 255, 255, 0.9));
        }
        :host-context([data-theme='dark']) .bot::after {
            background: var(--glass-bg-panel, rgba(31, 32, 34, 0.9));
        }

        .user::after {
            background: color-mix(in srgb, var(--primary-color, #006098) 90%, transparent);
            background: var(--primary-color, #006098);
            opacity: 0.9;
        }
        :host-context([data-theme='dark']) .user::after {
            background: color-mix(in srgb, var(--primary-color, #0070b0) 90%, transparent);
            background: var(--primary-color, #0070b0);
            opacity: 0.9;
        }

        /* Layer 2: 弱化微光圈 (Tier B 规范: 顶部柔和单向光，与不对称圆角自然贴合) */
        .bubble::before {
            ${H}
        }

        :host-context([data-theme='dark']) .bubble::before {
            ${T}
        }

        /* Layer 3: 气泡内容层 */
        .bubble-content {
            position: relative;
            z-index: 3;
        }

        .meta {
            font-size: var(--text-xs, 11px);
            color: var(--text-light, #888888);
            margin-top: 4px;
            padding: 0 4px;
        }
        :host-context([data-theme='dark']) .meta {
            color: var(--text-light, #9ca3af);
        }

        /* 传统扁平降级 */
        :host([glass-mode='flat']) .bubble,
        :host([glass-mode='none']) .bubble {
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
            backdrop-filter: none;
            -webkit-backdrop-filter: none;
        }
        :host([glass-mode='flat']) .bot,
        :host([glass-mode='none']) .bot {
            background: var(--btn-info-bg, #e9ecef);
            border: 1px solid var(--border-color, #dee2e6);
        }
        :host([glass-mode='flat']) .user,
        :host([glass-mode='none']) .user {
            background: var(--primary-color, #006098);
        }
        :host([glass-mode='flat']) .bubble::before,
        :host([glass-mode='flat']) .bubble::after,
        :host([glass-mode='none']) .bubble::before,
        :host([glass-mode='none']) .bubble::after {
            display: none;
        }
    `);typeof window<"u"&&window.customElements&&(customElements.get("cgo-chat-bubble")||customElements.define("cgo-chat-bubble",ae));function ct(){const a=Math.floor(Math.random()*10)+1,e=Math.floor(Math.random()*10)+1,t=["+","-"][Math.floor(Math.random()*2)];let o="",r=0;if(t==="+")o=`${a} + ${e} = ?`,r=a+e;else{const p=Math.max(a,e),u=Math.min(a,e);o=`${p} - ${u} = ?`,r=p-u}const i=120,s=36;let n="";for(let p=0;p<3;p++){const u=Math.floor(Math.random()*i),y=Math.floor(Math.random()*s),w=Math.floor(Math.random()*i),_=Math.floor(Math.random()*s),D=`rgb(${Math.floor(Math.random()*120)+50},${Math.floor(Math.random()*120)+50},${Math.floor(Math.random()*120)+50})`;n+=`<line x1="${u}" y1="${y}" x2="${w}" y2="${_}" stroke="${D}" stroke-width="1.5" />`}let c="";for(let p=0;p<30;p++){const u=Math.floor(Math.random()*i),y=Math.floor(Math.random()*s),w=Math.random()*1.2+.4,_=`rgb(${Math.floor(Math.random()*150)+50},${Math.floor(Math.random()*150)+50},${Math.floor(Math.random()*150)+50})`;c+=`<circle cx="${u}" cy="${y}" r="${w}" fill="${_}" />`}const h=o.split(" ");let b="",d=12;for(const p of h){const u=Math.floor(Math.random()*24)-12,y=Math.floor(Math.random()*8)-4,w=`rgb(${Math.floor(Math.random()*120)},${Math.floor(Math.random()*120)},${Math.floor(Math.random()*120)})`;b+=`<text x="${d}" y="${25+y}" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="${w}" transform="rotate(${u}, ${d+5}, ${22+y})">${p}</text>`,d+=p.length*10+6}return{svg:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${i} ${s}" style="background:#f3f4f6;border-radius:4px;user-select:none;width:100%;height:100%;display:block;">${n}${b}${c}</svg>`,answer:String(r)}}class oe extends x{constructor(){super(),this.answer="",this.zoom=!1,this.zoomed=!1,this._svg="",this.refresh()}refresh(){const{svg:e,answer:t}=ct();this.answer=t,this._svg=e,this.dispatchEvent(new CustomEvent("cgo-captcha-refresh",{detail:{answer:t},bubbles:!0,composed:!0}))}render(){const e=document.createElement("template");return e.innerHTML=this._svg,l`
            ${this.zoom?l`
                      <button
                          class="zoom-btn"
                          type="button"
                          title=${this.zoomed?"收起验证码":"放大验证码"}
                          @click=${t=>{t.stopPropagation(),this.zoomed=!this.zoomed}}
                      >
                          <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              aria-hidden="true"
                          >
                              <circle cx="11" cy="11" r="8"></circle>
                              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                              ${this.zoomed?l`
                                        <line x1="8" y1="11" x2="14" y2="11"></line>
                                    `:l`
                                        <line x1="11" y1="8" x2="11" y2="14"></line>
                                        <line x1="8" y1="11" x2="14" y2="11"></line>
                                    `}
                          </svg>
                      </button>
                  `:null}
            <div class="box" title="点击刷新" @click=${()=>this.refresh()}>${e.content.cloneNode(!0)}</div>
        `}}g(oe,"properties",{answer:{type:String},zoom:{type:Boolean,reflect:!0},zoomed:{type:Boolean,reflect:!0},_svg:{state:!0}}),g(oe,"styles",m`
        :host {
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }
        .zoom-btn {
            position: relative;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            padding: 0;
            border: none;
            border-radius: var(--radius-sm, 6px);
            background-color: var(--btn-info-bg, #f1f3f5);
            color: var(--text-main, #00263b);
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
            cursor: pointer;
            flex-shrink: 0;
            user-select: none;
            overflow: hidden;
            isolation: isolate;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
            transition:
                color var(--dur-fast, 140ms) ease,
                background-color var(--dur-fast, 140ms) ease,
                box-shadow var(--dur-fast, 140ms) ease,
                transform var(--dur-micro, 100ms) cubic-bezier(0.23, 1, 0.32, 1),
                opacity var(--dur-fast, 140ms) ease;
        }

        /* 1px 双轴微光描边 (Layer 2 Masked 1px Hairline Rim Light, 与 cgo-button 一致，作为唯一精致描边) */
        .zoom-btn::before {
            ${V}
        }

        @media (hover: hover) and (pointer: fine) {
            .zoom-btn:hover {
                background-color: var(--btn-info-hover, #e9ecef);
                color: var(--text-main, #00263b);
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
            }

            .zoom-btn:hover::before {
                opacity: 0.75;
            }
        }

        .zoom-btn:active {
            transform: scale(0.96);
            background-color: #dee2e6;
        }

        .zoom-btn:focus-visible {
            outline: none;
            box-shadow: 0 0 0 2px var(--bg-color, #ffffff), 0 0 0 4px var(--primary-color, #006098);
        }

        :host([zoomed]) .zoom-btn {
            background-color: var(--btn-info-hover, #e9ecef);
            color: var(--primary-color, #006098);
        }

        /* 暗色模式适配 */
        :host-context([data-theme='dark']) .zoom-btn {
            background-color: var(--btn-info-bg, #262729);
            color: var(--text-main, #e5e8ea);
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
        }

        :host-context([data-theme='dark']) .zoom-btn::before {
            ${n1}
        }

        @media (hover: hover) and (pointer: fine) {
            :host-context([data-theme='dark']) .zoom-btn:hover {
                background-color: var(--btn-info-hover, #323438);
                color: #ffffff;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.35);
            }
        }

        :host-context([data-theme='dark']) .zoom-btn:active {
            background-color: #383a3c;
        }

        :host-context([data-theme='dark']) .zoom-btn:focus-visible {
            box-shadow: 0 0 0 2px var(--bg-color, #1a1a1a), 0 0 0 4px var(--primary-hover, #0070b0);
        }

        :host-context([data-theme='dark']):host([zoomed]) .zoom-btn {
            background-color: var(--btn-info-hover, #323438);
            color: var(--primary-color, #4dabf7);
        }

        .zoom-btn svg {
            position: relative;
            z-index: 3;
            width: 18px;
            height: 18px;
            display: block;
            color: inherit;
        }

        .box {
            width: 120px;
            height: 36px;
            box-sizing: border-box;
            cursor: pointer;
            border: 1px solid var(--border-color, #dee2e6);
            border-radius: var(--radius-sm, 6px);
            overflow: hidden;
            transform-origin: left center;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
            transition:
                transform 0.18s cubic-bezier(0.4, 0, 1, 1),
                box-shadow 0.18s ease,
                border-color 0.18s ease;
        }

        @media (hover: hover) and (pointer: fine) {
            .box:hover {
                border-color: var(--border-hover, #ced4da);
            }

            :host-context([data-theme='dark']) .box:hover {
                border-color: var(--border-hover, #44474b);
            }
        }

        :host-context([data-theme='dark']) .box {
            border-color: var(--border-color, #383a3c);
        }

        :host([zoomed]) .box {
            transform: scale(1.65);
            box-shadow: var(--shadow-lg, 0 8px 32px rgba(0, 0, 0, 0.12));
            z-index: 3;
            transition:
                transform 0.22s cubic-bezier(0.16, 1, 0.3, 1),
                box-shadow 0.22s ease,
                border-color 0.22s ease;
        }

        :host-context([data-theme='dark']):host([zoomed]) .box {
            box-shadow: 0 12px 36px rgba(0, 0, 0, 0.5);
        }

        @media (prefers-reduced-motion: reduce) {
            .box, .zoom-btn {
                transition: none !important;
            }
        }
    `);typeof window<"u"&&window.customElements&&(customElements.get("cgo-captcha")||customElements.define("cgo-captcha",oe));class re extends x{constructor(){super();g(this,"_start",t=>{t.button!==0&&t.pointerType==="mouse"||(this._isLongPress=!1,this._pressTimer=setTimeout(()=>{this._isLongPress=!0,et(),this._showTip("已恢复系统明暗模式"),navigator.vibrate&&navigator.vibrate(50)},800))});g(this,"_cancel",()=>{this._pressTimer&&(clearTimeout(this._pressTimer),this._pressTimer=null)});g(this,"_click",t=>{if(this._isLongPress){t.preventDefault(),t.stopPropagation(),this._isLongPress=!1;return}Qe()});this.storageKey="",this._theme=ve(),this._tip="",this._pressTimer=null,this._isLongPress=!1,this._iconAnimating=!1}connectedCallback(){super.connectedCallback(),this.storageKey&&Ft(this.storageKey)}_sync(t){this._iconAnimating=!0,this._theme=t,this.requestUpdate(),setTimeout(()=>{this._iconAnimating=!1,this.requestUpdate()},300)}_showTip(t){this._tip=t,this.requestUpdate(),clearTimeout(this._tipTimer),this._tipTimer=setTimeout(()=>{this._tip=""},2e3)}render(){const t=this._theme==="dark"?v.moon.d:v.sun.d,o=document.createElement("template");return o.innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true" class="${this._iconAnimating?"icon-enter":""}">${t}</svg>`,l`
            <button
                title="切换明暗 · 长按恢复系统"
                @pointerdown=${this._start}
                @pointerup=${this._cancel}
                @pointerleave=${this._cancel}
                @pointercancel=${this._cancel}
                @click=${this._click}
                @contextmenu=${r=>{r.preventDefault(),r.stopPropagation()}}
            >
                ${o.content.cloneNode(!0)}
            </button>
            ${this._tip?l`
                      <div class="tip show">${this._tip}</div>
                  `:null}
        `}}g(re,"properties",{storageKey:{type:String,attribute:"storage-key"},_theme:{state:!0},_tip:{state:!0}}),g(re,"styles",m`
        :host {
            display: inline-flex;
            vertical-align: middle;
        }
        button {
            position: relative;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 34px;
            height: 34px;
            padding: 0;
            border-radius: var(--radius-xs, 4px);
            border: none;
            background: var(--btn-info-bg, #f1f3f5);
            color: var(--text-main, #00263b);
            cursor: pointer;
            box-sizing: border-box;
            isolation: isolate;
            overflow: hidden;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
            transition:
                color var(--dur-fast, 140ms) ease,
                background-color var(--dur-fast, 140ms) ease,
                box-shadow var(--dur-fast, 140ms) ease,
                transform var(--dur-micro, 100ms) cubic-bezier(0.23, 1, 0.32, 1);
            -webkit-tap-highlight-color: transparent;
        }

        /* 液态玻璃 Layer 2 精致 1px 双轴微光描边 (Hairline Rim Light)，跟随 4px r角 */
        button::before {
            ${V}
        }

        @media (hover: hover) and (pointer: fine) {
            button:hover {
                background: var(--btn-info-hover, #e9ecef);
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
            }
            button:hover::before {
                opacity: 0.75;
            }
        }

        /* 物理微触感反馈：按压 scale(0.98)，悬停零位移 */
        button:active {
            transform: scale(0.98);
            transition: transform 100ms cubic-bezier(0.23, 1, 0.32, 1);
        }

        /* 暗色主题深度适配 */
        :host([data-theme='dark']) button,
        :host-context([data-theme='dark']) button {
            background: var(--btn-info-bg, #262729);
            color: var(--text-main, #e5e8ea);
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
        }

        :host([data-theme='dark']) button::before,
        :host-context([data-theme='dark']) button::before {
            background:
                linear-gradient(to bottom,
                    rgba(255, 255, 255, 0.33) 0,
                    rgba(255, 255, 255, 0.12) 1px,
                    rgba(255, 255, 255, 0) 6px,
                    rgba(0, 0, 0, 0.08) 100%);
        }

        @media (hover: hover) and (pointer: fine) {
            :host([data-theme='dark']) button:hover,
            :host-context([data-theme='dark']) button:hover {
                background: var(--btn-info-hover, #323438);
                color: #ffffff;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.35);
            }
        }

        /* 纯平 flat 模式回退 */
        :host([glass-mode='flat']) button::before,
        :host-context([glass-mode='flat']) button::before,
        :host([glass-mode='none']) button::before,
        :host-context([glass-mode='none']) button::before {
            display: none;
        }
        :host([glass-mode='flat']) button,
        :host-context([glass-mode='flat']) button {
            border: 1px solid var(--border-color, #dee2e6);
            box-shadow: none;
        }

        svg {
            position: relative;
            z-index: 3;
            width: 20px;
            height: 20px;
            fill: currentColor;
            pointer-events: none;
            /* C-07: 图标切换时旋转淡入动效，利落紧凑 */
            transition:
                opacity 140ms ease-out,
                transform 180ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        /* C-07: 切换中：旋转 90° 缩放退出，避免极小缩放 */
        svg.icon-exit {
            opacity: 0;
            transform: rotate(90deg) scale(0.85);
        }
        /* C-07: 新图标旋转进入 */
        svg.icon-enter {
            animation: iconEnter 180ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes iconEnter {
            from {
                opacity: 0;
                transform: rotate(-60deg) scale(0.88);
            }
            to {
                opacity: 1;
                transform: rotate(0deg) scale(1);
            }
        }
        .tip {
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%) translateY(-10px);
            background: rgba(0, 0, 0, 0.82);
            color: #fff;
            padding: 8px 16px;
            border-radius: var(--radius-full, 9999px);
            font-size: 13px;
            pointer-events: none;
            z-index: 11000;
            opacity: 0;
            transition:
                opacity 160ms cubic-bezier(0.16, 1, 0.3, 1),
                transform 160ms cubic-bezier(0.16, 1, 0.3, 1);
            white-space: nowrap;
            box-shadow: var(--shadow-md, 0 4px 15px rgba(0, 0, 0, 0.08));
        }
        .tip.show {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    `);typeof window<"u"&&window.customElements&&(customElements.get("cgo-theme-toggle")||customElements.define("cgo-theme-toggle",re));class ie extends x{constructor(){super();g(this,"_start",t=>{t.button!==0&&t.pointerType==="mouse"||(this._isLongPress=!1,this._pressTimer=setTimeout(()=>{this._isLongPress=!0,N("floating"),this._showTip("已恢复默认悬浮菜单栏"),navigator.vibrate&&navigator.vibrate(50)},800))});g(this,"_cancel",()=>{this._pressTimer&&(clearTimeout(this._pressTimer),this._pressTimer=null)});g(this,"_click",t=>{if(this._isLongPress){t.preventDefault(),t.stopPropagation(),this._isLongPress=!1;return}const o=O1();this._showTip(o==="floating"?"已启用悬浮菜单栏":"已恢复吸顶顶栏")});this.storageKey="",this._mode="floating",this._tip="",this._pressTimer=null,this._isLongPress=!1,this._onModeChange=t=>{t&&t.detail&&t.detail.mode&&(this._mode=t.detail.mode)}}connectedCallback(){super.connectedCallback(),this.storageKey&&P1(this.storageKey),this._mode=s1(),typeof window<"u"&&window.addEventListener("cgo-header-mode-change",this._onModeChange)}disconnectedCallback(){super.disconnectedCallback(),typeof window<"u"&&window.removeEventListener("cgo-header-mode-change",this._onModeChange)}_sync(t){this._mode=t,this.requestUpdate()}_showTip(t){this._tip=t,this.requestUpdate(),clearTimeout(this._tipTimer),this._tipTimer=setTimeout(()=>{this._tip="",this.requestUpdate()},2e3)}render(){const t=this._mode==="floating",o=t?v["pin-angle"]||v.pin:v["unpin-angle"]||v.window,r=o?o.d:"",i=o&&o.viewBox||"0 0 24 24",s=t?"切换为吸顶顶栏 · 长按重置":"切换为悬浮菜单栏 · 长按重置",n=document.createElement("template");return n.innerHTML=`<svg viewBox="${i}" aria-hidden="true">${r}</svg>`,l`
            <cgo-button
                variant="${t?"primary":"info"}"
                icon-only
                title="${s}"
                aria-label="${s}"
                @pointerdown=${this._start}
                @pointerup=${this._cancel}
                @pointerleave=${this._cancel}
                @pointercancel=${this._cancel}
                @click=${this._click}
                @contextmenu=${c=>{c.preventDefault(),c.stopPropagation()}}
            >
                ${n.content.cloneNode(!0)}
            </cgo-button>
            ${this._tip?l`
                      <div class="tip show">${this._tip}</div>
                  `:null}
        `}}g(ie,"properties",{storageKey:{type:String,attribute:"storage-key"},_mode:{state:!0},_tip:{state:!0}}),g(ie,"styles",m`
        :host {
            display: inline-flex;
        }
        cgo-button {
            display: inline-flex;
        }
        svg {
            width: 18px;
            height: 18px;
            fill: currentColor;
            pointer-events: none;
            transition: transform 160ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .tip {
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%) translateY(-10px);
            background: rgba(0, 0, 0, 0.82);
            color: #fff;
            padding: 8px 16px;
            border-radius: var(--radius-full, 9999px);
            font-size: 13px;
            pointer-events: none;
            z-index: 11000;
            opacity: 0;
            transition:
                opacity 160ms cubic-bezier(0.16, 1, 0.3, 1),
                transform 160ms cubic-bezier(0.16, 1, 0.3, 1);
            white-space: nowrap;
            box-shadow: var(--shadow-md, 0 4px 15px rgba(0, 0, 0, 0.12));
        }
        .tip.show {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    `);typeof window<"u"&&window.customElements&&(customElements.get("cgo-header-toggle")||customElements.define("cgo-header-toggle",ie));class se extends x{constructor(){super(),this.icon="",this.label="",this.target="",this.active=!1,this.danger=!1,this.heading=!1,this.tag="",this.wrap=!1}}g(se,"properties",{icon:{type:String},label:{type:String},target:{type:String},active:{type:Boolean,reflect:!0},danger:{type:Boolean,reflect:!0},heading:{type:Boolean,reflect:!0},tag:{type:String},wrap:{type:Boolean,reflect:!0}}),g(se,"styles",m`
        :host {
            display: contents;
        }
    `);typeof window<"u"&&window.customElements&&(customElements.get("cgo-nav-item")||customElements.define("cgo-nav-item",se));class ne extends x{constructor(){super(),this.activeIndex=0,this.docked=!1,this.floating=!1,this._manualFloating=!1,this._lastItemsLen=0}connectedCallback(){super.connectedCallback(),M(),this.hasAttribute("floating")&&(this._manualFloating=!0),this._syncFloatingState=()=>{var o,r;if(this.hasAttribute("docked")){this.hasAttribute("floating")&&this.removeAttribute("floating");return}(document.documentElement.getAttribute("header-mode")||document.documentElement.getAttribute("data-header-mode")||((o=document.body)==null?void 0:o.getAttribute("header-mode"))||((r=document.body)==null?void 0:r.getAttribute("data-header-mode")))==="floating"?this.hasAttribute("floating")||this.setAttribute("floating",""):this._manualFloating||this.hasAttribute("floating")&&this.removeAttribute("floating")},this._syncFloatingState(),typeof window<"u"&&window.addEventListener("cgo-header-mode-change",this._syncFloatingState),typeof MutationObserver<"u"&&(this._headerObserver=new MutationObserver(this._syncFloatingState),this._headerObserver.observe(document.documentElement,{attributes:!0,attributeFilter:["header-mode","data-header-mode"]}),document.body&&this._headerObserver.observe(document.body,{attributes:!0,attributeFilter:["header-mode","data-header-mode"]}))}disconnectedCallback(){super.disconnectedCallback(),typeof window<"u"&&this._syncFloatingState&&window.removeEventListener("cgo-header-mode-change",this._syncFloatingState),this._headerObserver&&(this._headerObserver.disconnect(),this._headerObserver=null)}get _items(){return[...this.querySelectorAll("cgo-nav-item")]}get _clickableItems(){return this._items.filter(e=>!e.heading)}select(e){const t=this._clickableItems;if(e<0||e>=t.length)return;this.activeIndex=e,t.forEach((r,i)=>{r.active=i===e});const o=t[e];this.dispatchEvent(new CustomEvent("cgo-nav-change",{detail:{index:e,target:o.target,item:o},bubbles:!0,composed:!0}))}selectByTarget(e){const o=this._clickableItems.findIndex(r=>r.target===e);o>=0&&this.select(o)}updated(e){const t=this._items.length;t!==this._lastItemsLen&&(this._lastItemsLen=t,this._initActive())}_initActive(){const e=this._clickableItems;if(e.length===0)return;const t=e.findIndex(o=>o.active);t>=0?this.activeIndex=t:(e[0].active=!0,this.activeIndex=0)}render(){const e=this._items;let t=0;const o=e.map((r,i)=>{const s=r.icon,n=r.label,c=r.danger,h=r.heading,b=r.active,d=r.tag;if(h)return l`
                    <div class="sidenav-heading">
                        ${s?l`
                                  <span class="sidenav-heading-icon">${s}</span>
                              `:null}
                        <span>${n}</span>
                    </div>
                `;const f=t++,p=r.wrap?" wrap":"";return l`
                <button
                    class="sidenav-item ${b?"active":""} ${c?"danger":""}${p}"
                    @click=${()=>this.select(f)}
                    type="button"
                >
                    ${s?l`
                              <cgo-icon name=${s} size="18"></cgo-icon>
                          `:null}
                    <span class="sidenav-item-label">
                        ${n||l`
                            <slot name="item-${i}"></slot>
                        `}
                    </span>
                    ${d?l`
                              <code class="sidenav-item-tag">${d}</code>
                          `:null}
                </button>
            `});return l`
            <div class="sidenav">
                <div class="liquid-glass-effect" aria-hidden="true"></div>
                ${this._hasSlot("user-brief")?l`
                          <div class="sidenav-user-brief">
                              <slot name="user-brief" @slotchange=${()=>this.requestUpdate()}></slot>
                          </div>
                      `:null}

                <nav class="sidenav-menu">${o}</nav>

                ${this._hasSlot("footer")?l`
                          <div class="sidenav-footer">
                              <slot name="footer" @slotchange=${()=>this.requestUpdate()}></slot>
                          </div>
                      `:null}
            </div>
        `}_hasSlot(e){return this.querySelector(`[slot="${e}"]`)!==null}}g(ne,"properties",{activeIndex:{type:Number,attribute:"active-index"},docked:{type:Boolean,reflect:!0},floating:{type:Boolean,reflect:!0}}),g(ne,"styles",m`
        :host {
            /* ---- CSS 变量（可按需覆写） ---- */
            --sidenav-width: var(--cgo-nav-width, var(--sidebar-width, 280px));
            --sidenav-bg: var(--glass-bg, rgba(248, 249, 250, 0.85));
            --sidenav-border: var(--border-color, rgba(0, 0, 0, 0.08));
            --sidenav-radius: var(--header-floating-radius, 12px);
            --sidenav-shadow: var(--header-floating-shadow, 0 4px 20px rgba(0, 0, 0, 0.12));
            --sidenav-item-gap: 4px;
            --sidenav-item-radius: 6px;
            --sidenav-item-px: 12px;
            --sidenav-item-py: 10px;
            --sidenav-active-bg: var(--primary-color, #006098);
            --sidenav-active-fg: var(--btn-text, #fff);
            --sidenav-active-border-left: transparent;
            --sidenav-danger-bg: var(--danger-color, #dc3545);
            --sidenav-danger-fg: #fff;
            --sidenav-user-brief-border: var(--glass-border, rgba(0, 0, 0, 0.08));
            --sidenav-footer-border: var(--glass-border, rgba(0, 0, 0, 0.08));

            display: block;
            font-family: var(--font-sans, system-ui, -apple-system, 'Noto Sans SC', sans-serif);
        }

        /* ===== 外层容器 (统一为 tool.html 液态玻璃规格) ===== */
        .sidenav {
            display: flex;
            flex-direction: column;
            width: var(--sidenav-width);
            height: 100%;
            background: transparent;
            border: none;
            border-radius: var(--sidenav-radius, 12px);
            box-shadow: var(--glass-shadow);
            box-sizing: border-box;
            position: relative;
            overflow: hidden;
            isolation: isolate;
            transition: transform var(--glass-duration, 0.28s) var(--glass-easing, cubic-bezier(0.32, 0.72, 0, 1)),
                        box-shadow var(--glass-duration, 0.28s) var(--glass-easing, cubic-bezier(0.32, 0.72, 0, 1));
        }

        /* Layer 0: 折射磨砂层 (完全对齐 tool.html) */
        .liquid-glass-effect {
            position: absolute;
            z-index: 0;
            inset: 0;
            border-radius: inherit;
            backdrop-filter: var(--glass-backdrop-filter, blur(5px) saturate(130%));
            -webkit-backdrop-filter: var(--glass-backdrop-filter, blur(5px) saturate(130%));
            filter: var(--glass-refraction-filter, url(#glass-distortion));
            overflow: hidden;
            pointer-events: none;
            isolation: isolate;
        }

        /* Layer 1: Tint 半透明衬底层 (完全对齐 tool.html: 亮色 0.60, 暗色 0.60) */
        .sidenav::after {
            content: "";
            position: absolute;
            z-index: 1;
            inset: 0;
            border-radius: inherit;
            background: var(--glass-bg, rgba(255, 255, 255, 0.60));
            pointer-events: none;
            transition: background-color 0.25s ease;
        }

        :host-context([data-theme="dark"]) .sidenav::after,
        :host-context([data-theme="dark"]:root) .sidenav::after {
            background: var(--glass-bg, rgba(31, 32, 34, 0.60));
        }

        @media (prefers-color-scheme: dark) {
            :host-context(:root:not([data-theme="light"])) .sidenav::after {
                background: var(--glass-bg, rgba(31, 32, 34, 0.60));
            }
        }

        /* Layer 2: 双轴微光圈层 (完全对齐 tool.html 极简微边框) */
        .sidenav::before {
            ${fe}
        }

        :host([docked]) .sidenav,
        :host(:not([floating])) .sidenav,
        :host-context([header-mode="classic"]) .sidenav,
        :host-context([data-header-mode="classic"]) .sidenav,
        :host-context(:root:not([header-mode="floating"])) .sidenav {
            border-radius: 0 !important;
            border-top: none !important;
            border-bottom: none !important;
            border-left: none !important;
            border-right: 1px solid var(--sidenav-border, var(--border-color)) !important;
            box-shadow: none !important;
        }
        :host([docked]) .sidenav::before,
        :host(:not([floating])) .sidenav::before,
        :host-context([header-mode="classic"]) .sidenav::before,
        :host-context([data-header-mode="classic"]) .sidenav::before,
        :host-context(:root:not([header-mode="floating"])) .sidenav::before {
            display: none !important;
        }

        /* Layer 3: 内部元素保证绝对锐利清晰 */
        .sidenav-user-brief,
        .sidenav-menu,
        .sidenav-footer {
            position: relative;
            z-index: 3;
        }

        /* ===== 用户简介区 ===== */
        .sidenav-user-brief {
            padding: 20px 15px;
            display: flex;
            flex-direction: column;
            align-items: center;
            border-bottom: 1px solid var(--sidenav-user-brief-border);
        }

        /* ===== 导航列表 ===== */
        .sidenav-menu {
            flex: 1;
            overflow-y: auto;
            padding: 12px 10px;
            display: flex;
            flex-direction: column;
            gap: var(--sidenav-item-gap);
            scrollbar-width: thin;
        }

        /* ===== 侧边栏底部插槽 ===== */
        .sidenav-footer {
            padding: 16px;
            border-top: 1px solid var(--sidenav-footer-border);
        }

        /* ===== 分组标题（不可点击） ===== */
        .sidenav-heading {
            padding: 12px var(--sidenav-item-px) 4px;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.08em;
            color: var(--text-light, #64748b);
            text-transform: uppercase;
            user-select: none;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .sidenav-heading:first-child {
            padding-top: 0;
        }
        .sidenav-heading-icon {
            font-size: 13px;
            line-height: 1;
        }

        /* ===== PC 端导航项 ===== */
        .sidenav-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: var(--sidenav-item-py) var(--sidenav-item-px);
            border-radius: var(--sidenav-item-radius);
            border: none;
            color: var(--text-light, #64748b);
            cursor: pointer;
            font-weight: 500;
            font-size: 0.9rem;
            background: none;
            width: 100%;
            text-align: left;
            font-family: inherit;
            line-height: 1.4;
            box-sizing: border-box;
            white-space: nowrap;
            user-select: none;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
            transition:
                background-color var(--dur-fast, 140ms) ease,
                color var(--dur-fast, 140ms) ease,
                transform var(--dur-micro, 100ms) cubic-bezier(0.16, 1, 0.3, 1);
        }
        @media (hover: hover) and (pointer: fine) {
            .sidenav-item:hover {
                background-color: var(--btn-info-bg, #f1f3f5);
                color: var(--text-main, #102033);
            }
        }
        .sidenav-item:active {
            transform: scale(0.98);
        }
        .sidenav-item.active {
            background-color: var(--sidenav-active-bg);
            color: var(--sidenav-active-fg);
        }
        .sidenav-item.active .sidenav-item-tag {
            color: var(--sidenav-active-fg);
        }
        .sidenav-item.active cgo-icon {
            color: var(--sidenav-active-fg);
        }
        .sidenav-item.danger {
            color: var(--danger-color, #dc3545);
        }
        @media (hover: hover) and (pointer: fine) {
            .sidenav-item.danger:hover {
                background-color: rgba(217, 48, 37, 0.1);
                color: var(--danger-color, #dc3545);
            }
        }
        .sidenav-item.danger.active {
            background-color: var(--sidenav-danger-bg);
            color: var(--sidenav-danger-fg);
        }

        /* 标签文本 */
        .sidenav-item-label {
            flex: 1;
            min-width: 0;
        }

        /* 右侧代码标签 */
        .sidenav-item-tag {
            font-family: var(--font-mono, 'SF Mono', 'Fira Code', monospace);
            font-size: 11px;
            color: var(--text-light, #64748b);
            margin-left: auto;
            flex-shrink: 0;
            font-weight: 400;
        }

        /* tag 换行变体 */
        .sidenav-item.wrap {
            flex-wrap: wrap;
            white-space: normal;
            align-items: flex-start;
        }
        .sidenav-item.wrap .sidenav-item-label {
            flex: 0 0 100%;
        }
        .sidenav-item.wrap .sidenav-item-tag {
            margin-left: 0;
            width: 100%;
        }

        /* ===== 移动端胶囊样式 ===== */
        .sidenav-capsules {
            display: none;
        }

        /* ============================================
           响应式：≤640px 切换为顶部胶囊选项卡
           ============================================ */
        @media (max-width: 640px) {
            .sidenav {
                width: 100%;
                height: auto;
                flex-direction: row;
                align-items: center;
                border-radius: var(--header-floating-radius, 12px);
                border: none;
                background: transparent;
                box-shadow: var(--glass-shadow);
                padding: 0;
                flex-shrink: 0;
                box-sizing: border-box;
            }

            /* 移动端悬浮模式下：宽度与浮动菜单栏相同，外观采用浮动胶囊卡片样式 */
            :host([floating]),
            :host-context([header-mode="floating"]),
            :host-context([data-header-mode="floating"]) {
                display: block;
                margin-left: calc(10px + env(safe-area-inset-left, 0px)) !important;
                margin-right: calc(10px + env(safe-area-inset-right, 0px)) !important;
                width: calc(100% - 20px - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px)) !important;
                max-width: calc(100% - 20px - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px)) !important;
                box-sizing: border-box;
            }

            /* 移动端普通吸顶模式下：铺满顶栏下方，直角吸附对接 */
            :host(:not([floating])) .sidenav,
            :host-context([header-mode="classic"]) .sidenav,
            :host-context([data-header-mode="classic"]) .sidenav,
            :host-context(:root:not([header-mode="floating"])) .sidenav {
                border-radius: 0 !important;
                margin-left: 0 !important;
                margin-right: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
                border-right: none !important;
                border-bottom: 1px solid var(--sidenav-border, var(--border-color)) !important;
                box-shadow: none !important;
            }

            .sidenav-user-brief,
            .sidenav-footer,
            .sidenav-heading {
                display: none;
            }
            .sidenav-menu {
                flex-direction: row;
                padding: 10px 12px;
                overflow-x: auto;
                overflow-y: hidden;
                white-space: nowrap;
                -webkit-overflow-scrolling: touch;
                touch-action: pan-x;
                overscroll-behavior-x: contain;
                gap: 8px;
                scrollbar-width: none;
                position: relative;
                z-index: 3;
            }
            .sidenav-menu::-webkit-scrollbar {
                display: none;
            }

            /* 移动端选项卡 */
            .sidenav-item {
                flex-shrink: 0;
                flex-direction: row;
                align-items: center;
                gap: 6px;
                padding: 8px 14px;
                margin: 0;
                border-radius: var(--sidenav-item-radius, 6px);
                font-size: 0.85rem;
                width: auto;
                background-color: transparent;
                color: var(--text-light, #64748b);
            }
            .sidenav-item:hover {
                background-color: transparent;
            }
            .sidenav-item.active {
                background-color: var(--sidenav-active-bg);
                color: var(--sidenav-active-fg);
            }
            .sidenav-item.danger {
                color: var(--danger-color, #dc3545);
                background-color: var(--btn-info-bg, #f1f3f5);
            }
            .sidenav-item.danger.active {
                background-color: var(--sidenav-danger-bg);
                color: var(--sidenav-danger-fg);
            }
            .sidenav-item-tag {
                display: none;
            }
            .sidenav-item cgo-icon {
                width: 16px;
                height: 16px;
            }
        }
    `);typeof window<"u"&&window.customElements&&(customElements.get("cgo-side-nav")||customElements.define("cgo-side-nav",ne));/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */class ce extends rt{constructor(e){if(super(e),this.it=k,e.type!==at.CHILD)throw Error(this.constructor.directiveName+"() can only be used in child bindings")}render(e){if(e===k||e==null)return this._t=void 0,this.it=e;if(e===A)return e;if(typeof e!="string")throw Error(this.constructor.directiveName+"() called with a non-string value");if(e===this.it)return this._t;this.it=e;const t=[e];return t.raw=t,this._t={_$litType$:this.constructor.resultType,strings:t,values:[]}}}ce.directiveName="unsafeHTML",ce.resultType=1;const v2=ot(ce),h1=new Set;class le extends x{constructor(){super(),this.value="",this.placeholder="",this.open=!1,this.openUp=!1,this.disabled=!1,this.glassMode="",this._label="",this._onOutside=this._onOutside.bind(this),this._positionHandler=()=>{this.open&&this._positionOptions()}}connectedCallback(){super.connectedCallback(),M(),document.addEventListener("click",this._onOutside),this._syncThemeToHost(),this._themeObserver=new MutationObserver(()=>this._syncThemeToHost()),this._themeObserver.observe(document.documentElement,{attributes:!0,attributeFilter:["data-theme"]}),requestAnimationFrame(()=>this.requestUpdate())}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("click",this._onOutside),window.removeEventListener("resize",this._positionHandler),window.removeEventListener("scroll",this._positionHandler,!0),h1.delete(this),this._themeObserver&&(this._themeObserver.disconnect(),this._themeObserver=null)}_syncThemeToHost(){const e=document.documentElement.getAttribute("data-theme");e?this.setAttribute("data-theme",e):this.removeAttribute("data-theme")}_onOutside(e){e.composedPath().includes(this)||this.close()}_getOptions(){return[...this.querySelectorAll("cgo-toolbar-option")]}_syncLabel(){const e=this._getOptions(),t=e.find(o=>o.getAttribute("value")===this.value);t?this._label=t.textContent.trim():!this.value&&e.length>0?this._label=e[0].textContent.trim():this._label=""}firstUpdated(){this._syncLabel()}updated(e){e.has("value")&&this._syncLabel()}_toggle(e){e.stopPropagation(),!this.disabled&&(this.open?this.close():this.show())}show(){h1.forEach(e=>{e!==this&&e.close()}),this.open=!0,h1.add(this),this._positionOptions(),window.addEventListener("resize",this._positionHandler),window.addEventListener("scroll",this._positionHandler,!0)}_positionOptions(){requestAnimationFrame(()=>{const e=this.shadowRoot.querySelector(".options"),t=this.shadowRoot.querySelector(".trigger");if(!e||!t)return;let o=null,r=this.parentNode;for(;r;){if(r instanceof ShadowRoot){r=r.host;continue}if(r===document.body||r===document.documentElement)break;const d=window.getComputedStyle(r);if(d.transform&&d.transform!=="none"||d.perspective&&d.perspective!=="none"||d.filter&&d.filter!=="none"||d.backdropFilter&&d.backdropFilter!=="none"){o=r;break}r=r.parentNode}const i=t.getBoundingClientRect(),s=i.width,n=o?o.getBoundingClientRect():{left:0,top:0,height:window.innerHeight},c=i.left-n.left;e.style.width=s+"px",e.style.left=c+"px",e.style.top="",e.style.bottom="";const h=i.bottom-n.top+5;i.bottom+5+Math.min(e.scrollHeight,300)>window.innerHeight-10?(this.openUp=!0,e.style.bottom=n.height-(i.top-n.top)+5+"px"):(this.openUp=!1,e.style.top=h+"px")})}close(){this.open&&(this.open=!1,h1.delete(this),window.removeEventListener("resize",this._positionHandler),window.removeEventListener("scroll",this._positionHandler,!0))}_select(e){if(this.value===e){this.close();return}this.value=e;const t=this._getOptions().find(r=>r.getAttribute("value")===e),o=t?t.textContent.trim():"";this.close(),this.dispatchEvent(new CustomEvent("cgo-change",{detail:{value:e,label:o},bubbles:!0,composed:!0}))}render(){const e=this._getOptions(),t=!this._label&&!!this.placeholder,o=this.glassMode==="flat"||this.glassMode==="none";return l`
            <button class="trigger" type="button" ?disabled=${this.disabled} aria-expanded=${this.open} @click=${this._toggle}>
                <span class="text ${t?"placeholder":""}">${this._label||this.placeholder||""}</span>
                <cgo-icon class="arrow" name="expand-more" size="18" aria-hidden="true"></cgo-icon>
            </button>
            <div class="options">
                ${o?null:l`<div class="glass-refraction" aria-hidden="true"></div>`}
                <div class="options-content">
                    ${e.map(r=>{const i=r.getAttribute("value")||"",s=i===this.value;return l`
                            <div class="opt ${s?"selected":""}" @click=${()=>this._select(i)}>
                                ${v2(r.innerHTML)}
                            </div>
                        `})}
                </div>
            </div>
            <div class="src"><slot></slot></div>
        `}}g(le,"properties",{value:{type:String,reflect:!0},placeholder:{type:String},open:{type:Boolean,reflect:!0},openUp:{type:Boolean,reflect:!0,attribute:"open-up"},disabled:{type:Boolean,reflect:!0},glassMode:{type:String,attribute:"glass-mode",reflect:!0},_label:{type:String,state:!0}}),g(le,"styles",m`
        :host {
            display: inline-block;
            position: relative;
            vertical-align: middle;
            box-sizing: border-box;
            font-family: var(--font-sans, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
        }

        /* ── 1. 功能入口收起时：参考 <cgo-button> 的液态玻璃与物理微交互 ── */
        .trigger {
            appearance: none;
            -webkit-appearance: none;
            -moz-appearance: none;
            position: relative;
            outline: none !important;
            border: none !important;
            display: flex;
            align-items: center;
            gap: 10px;
            width: 100%;
            background: var(--btn-info-bg, #f1f3f5);
            border-radius: var(--radius-sm, 6px);
            padding: 6px 12px;
            cursor: pointer;
            font-size: 13px;
            font-family: inherit;
            font-weight: 500;
            color: var(--text-main, #00263b);
            text-align: left;
            line-height: 1.6;
            user-select: none;
            min-height: 34px;
            height: 34px;
            box-sizing: border-box;
            overflow: hidden;
            isolation: isolate;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
            transition:
                color var(--dur-fast, 140ms) ease,
                background-color var(--dur-fast, 140ms) ease,
                box-shadow var(--dur-fast, 140ms) ease,
                transform var(--dur-micro, 100ms) cubic-bezier(0.23, 1, 0.32, 1);
        }

        /* <cgo-button> 同款 1px 双轴微光描边 (Layer 2 Masked 1px Hairline Rim Light，唯一描边来源) */
        .trigger::before {
            ${V}
        }

        .trigger:hover:not(:disabled)::before {
            opacity: 0.75;
        }

        .trigger:hover:not(:disabled) {
            background: var(--btn-info-hover, #e9ecef);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
        }

        /* 收起未打开状态下的按压微触感反馈 */
        :host(:not([open])) .trigger:active:not(:disabled) {
            transform: scale(0.98);
        }

        /* 暗色模式收起态适配 */
        :host([data-theme='dark']) .trigger,
        :host-context([data-theme='dark']) .trigger {
            background: var(--btn-info-bg, #262729);
            color: var(--text-main, #e5e8ea);
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
        }

        :host([data-theme='dark']) .trigger:hover:not(:disabled),
        :host-context([data-theme='dark']) .trigger:hover:not(:disabled) {
            background: var(--btn-info-hover, #323438);
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.35);
        }

        :host([data-theme='dark']) .trigger::before,
        :host-context([data-theme='dark']) .trigger::before {
            ${n1}
        }

        /* 保证文字和箭头在 Layer 3 (z-index: 3) 绝对锐利清晰 */
        .text,
        .arrow {
            position: relative;
            z-index: 3;
        }

        .text {
            flex: 1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            min-width: 0;
        }

        .placeholder {
            opacity: 0.55;
        }

        .arrow {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            opacity: 0.65;
            flex-shrink: 0;
            color: inherit;
            transition: transform var(--dur-fast, 160ms) cubic-bezier(0.16, 1, 0.3, 1), opacity var(--dur-fast, 140ms) ease;
        }

        :host([disabled]) .trigger {
            opacity: 0.5;
            cursor: not-allowed;
            pointer-events: none;
            box-shadow: none;
            transform: none !important;
        }

        /* ── 2. 功能入口打开时：参考 <cgo-input> 激活时的样式效果 ──
           彻底移除 ::before 微光描边，使用单组 box-shadow 呈现 1px 精准轮廓线 + 3.5px 扩散光晕，
           绝无多层边框套圈与内缩重影！ */
        :host([open]) .trigger::before {
            display: none !important;
        }

        :host([open]) .trigger {
            outline: none !important;
            border: none !important;
            transform: none !important;
            box-shadow:
                0 0 0 1px var(--primary-color, #006098),
                0 0 0 3.5px rgba(0, 96, 152, 0.14),
                0 1px 2px rgba(0, 96, 152, 0.08) !important;
        }

        :host([open]) .arrow {
            transform: rotate(180deg);
            opacity: 0.9;
        }

        :host([data-theme='dark']):host([open]) .trigger,
        :host-context([data-theme='dark']):host([open]) .trigger {
            box-shadow:
                0 0 0 1px var(--primary-color, #4dabf7),
                0 0 0 3.5px rgba(77, 171, 247, 0.22),
                0 1px 3px rgba(0, 0, 0, 0.35) !important;
        }

        /* ── 3. 打开时的下拉菜单：参考 <cgo-dropdown> 的下拉菜单添加与 card B 一致的液态玻璃效果 ── */
        .options {
            position: fixed;
            background: transparent;
            border: none !important;
            outline: none !important;
            border-radius: var(--radius-md, 8px);
            box-shadow: var(--glass-shadow, 0 8px 24px rgba(0, 38, 59, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04));
            z-index: 100000;
            display: none;
            padding: 6px;
            box-sizing: border-box;
            overflow: hidden;
            isolation: isolate;
        }

        :host([open]) .options {
            display: flex;
            flex-direction: column;
        }

        /* Layer 0: 折射磨砂层 (Tier B 规范) */
        ${z}

        /* Layer 1: 半透明底色衬底层 (Tier B 规范: 0.9 固定) */
        .options::after {
            ${j}
        }

        :host([data-theme='dark']) .options::after,
        :host-context([data-theme='dark']) .options::after {
            ${U}
        }

        /* Layer 2: 弱化微光圈 (Tier B 规范: 顶部柔和单向光，与 0.9 高不透明底板自然融合，杜绝双层套圈) */
        .options::before {
            ${H}
        }

        :host([data-theme='dark']) .options::before,
        :host-context([data-theme='dark']) .options::before {
            ${T}
        }

        :host([data-theme='dark']) .options,
        :host-context([data-theme='dark']) .options {
            box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45), 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        /* Layer 3: 菜单内容项容器（保证选项滚动时不破坏外层微光圈与背景卡片） */
        .options-content {
            position: relative;
            z-index: 3;
            max-height: 280px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 2px;
            width: 100%;
            box-sizing: border-box;
        }

        .options-content::-webkit-scrollbar {
            width: 5px;
        }
        .options-content::-webkit-scrollbar-thumb {
            background: rgba(0, 0, 0, 0.12);
            border-radius: 10px;
        }
        :host([data-theme='dark']) .options-content::-webkit-scrollbar-thumb,
        :host-context([data-theme='dark']) .options-content::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.15);
        }

        .opt {
            display: flex;
            align-items: center;
            gap: 10px;
            width: 100%;
            box-sizing: border-box;
            padding: 8px 10px;
            border-radius: var(--radius-xs, 4px);
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
            color: var(--text-main, #00263b);
            transition:
                background-color var(--dur-fast, 140ms) ease,
                color var(--dur-fast, 140ms) ease,
                transform var(--dur-micro, 100ms) ease;
            user-select: none;
            border: none !important;
            outline: none !important;
            background: transparent;
            font-family: inherit;
            text-align: left;
        }

        .opt:hover {
            background: var(--btn-info-hover, rgba(0, 38, 59, 0.06));
            color: var(--text-main, #00263b);
        }

        :host([data-theme='dark']) .opt,
        :host-context([data-theme='dark']) .opt {
            color: var(--text-main, #e5e8ea);
        }

        :host([data-theme='dark']) .opt:hover,
        :host-context([data-theme='dark']) .opt:hover {
            background: rgba(255, 255, 255, 0.08);
            color: #ffffff;
        }

        .opt:active {
            transform: scale(0.99);
        }

        .opt.selected {
            background: var(--primary-color, #006098) !important;
            color: #ffffff !important;
            font-weight: 600;
        }

        :host([data-theme='dark']) .opt.selected,
        :host-context([data-theme='dark']) .opt.selected {
            background: var(--primary-color, #0070b0) !important;
            color: #ffffff !important;
        }

        /* 选项内颜色圆点 / 图片 */
        .opt ::slotted(.cgo-toolbar-option-dot),
        .opt .cgo-toolbar-option-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            flex-shrink: 0;
        }
        .opt ::slotted(.cgo-toolbar-option-img),
        .opt .cgo-toolbar-option-img {
            height: 18px;
            width: auto;
            max-width: 42px;
            object-fit: contain;
            flex-shrink: 0;
        }

        /* 传统扁平降级 */
        :host([glass-mode='flat']) .options,
        :host([glass-mode='none']) .options {
            background: var(--card-bg, #fff);
            border: 1px solid var(--border-color, #dee2e6) !important;
            backdrop-filter: none;
            -webkit-backdrop-filter: none;
        }
        :host([glass-mode='flat']) .options::before,
        :host([glass-mode='flat']) .options::after,
        :host([glass-mode='none']) .options::before,
        :host([glass-mode='none']) .options::after {
            display: none;
        }
        :host([data-theme='dark']):host([glass-mode='flat']) .options,
        :host-context([data-theme='dark']):host([glass-mode='flat']) .options {
            background: var(--card-bg, #1f2020);
            border-color: var(--border-color, #383a3c) !important;
        }

        :host([open]:not([open-up])) .options {
            animation: cgoTsFadeIn var(--dur-fast, 160ms) cubic-bezier(0.16, 1, 0.3, 1);
        }
        :host([open][open-up]) .options {
            animation: cgoTsFadeInUp var(--dur-fast, 160ms) cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes cgoTsFadeIn {
            from {
                opacity: 0;
                transform: translateY(-4px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        @keyframes cgoTsFadeInUp {
            from {
                opacity: 0;
                transform: translateY(4px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .src {
            display: none;
        }
    `);typeof window<"u"&&window.customElements&&(customElements.get("cgo-toolbar-select")||customElements.define("cgo-toolbar-select",le));const u2='<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>';class de extends x{constructor(){super(),this.title="通知中心",this.items=[],this.muted=!1,this.maxHeight="",this.glassMode=""}connectedCallback(){super.connectedCallback(),M()}_handleClear(e){e.stopPropagation(),this.dispatchEvent(new CustomEvent("cgo-notice-clear",{bubbles:!0,composed:!0}))}_handleMuteToggle(e){e.stopPropagation(),this.muted=!this.muted,this.dispatchEvent(new CustomEvent("cgo-notice-mute-toggle",{bubbles:!0,composed:!0,detail:{muted:this.muted}}))}_handleItemAction(e,t){this.dispatchEvent(new CustomEvent("cgo-notice-action",{bubbles:!0,composed:!0,detail:{item:e,eventDetail:t.detail}}))}render(){const e=this.glassMode==="flat"||this.glassMode==="none",t=this.maxHeight?`--panel-max-height: ${this.maxHeight};`:"",o=Array.isArray(this.items)?this.items:[];return l`
            <div class="center-panel" style="${t}">
                ${e?null:l`<div class="glass-refraction" aria-hidden="true"></div>`}
                <div class="panel-content">
                    <div class="panel-title">${this.title}</div>

                    <div class="list-container">
                        ${o.length===0?l`
                            <div class="empty-tip">暂无通知公告</div>
                        `:o.map(r=>l`
                            <cgo-notice-card
                                category=${r.category||"software"}
                                notice-title=${r.title||""}
                                content=${r.content||""}
                                image-url=${r.imageUrl||r.image||""}
                                .actions=${r.actions||[]}
                                @cgo-notice-action=${i=>this._handleItemAction(r,i)}
                            ></cgo-notice-card>
                        `)}
                    </div>

                    <div class="panel-footer">
                        <button class="btn-clear" @click=${this._handleClear}>清除所有通知</button>
                        <button class="btn-mute ${this.muted?"is-active":""}" @click=${this._handleMuteToggle}>
                            <span .innerHTML=${u2}></span>
                            <span>${this.muted?"已静默":"免打扰"}</span>
                        </button>
                    </div>
                </div>
            </div>
        `}}g(de,"properties",{title:{type:String},items:{type:Array,converter:e=>{if(!e)return[];if(Array.isArray(e))return e;try{return JSON.parse(e)}catch{return[]}}},muted:{type:Boolean,reflect:!0},maxHeight:{type:String,attribute:"max-height"},glassMode:{type:String,attribute:"glass-mode",reflect:!0}}),g(de,"styles",m`
        :host {
            display: block;
            width: 100%;
            max-width: 320px;
            font-family: var(--font-sans, system-ui, -apple-system, sans-serif);
            box-sizing: border-box;
        }

        /* 遵循 Tier B 不可交互底板规范 (0.9 衬底，柔和微光圈，与下拉菜单 dropdown 统一外观) */
        .center-panel {
            position: relative;
            width: 100%;
            background: transparent;
            border: none;
            border-radius: var(--radius-lg, 12px);
            box-shadow: var(--glass-shadow);
            box-sizing: border-box;
            max-height: var(--panel-max-height, 480px);
            overflow: hidden;
            isolation: isolate;
            transition: box-shadow var(--glass-duration, 0.28s) var(--glass-easing, cubic-bezier(0.32, 0.72, 0, 1));
            backdrop-filter: var(--glass-backdrop-blur-surface, blur(14px) saturate(135%));
            -webkit-backdrop-filter: var(--glass-backdrop-blur-surface, blur(14px) saturate(135%));
        }

        :host-context([data-theme='dark']) .center-panel {
            color: var(--text-main, #e6edf3);
            box-shadow: var(--glass-shadow);
        }

        /* Layer 0: 折射磨砂层 (Tier B 规范: 14px 模糊 + 135% 饱和度 + SVG 空间折射) */
        /* Layer 0: 折射磨砂层 (Tier B 规范) */
        ${z}

        /* Layer 1: 半透明底色衬底层 (Tier B 规范: 0.9 固定) */
        .center-panel::after {
            ${j}
        }

        :host-context([data-theme='dark']) .center-panel::after {
            ${U}
        }

        /* Layer 2: 弱化微光圈 (Tier B 规范: 顶部柔和单向光，与下拉菜单完全统一) */
        .center-panel::before {
            ${H}
        }

        :host-context([data-theme='dark']) .center-panel::before {
            ${T}
        }

        /* Layer 3: 面板实际内容区 */
        .panel-content {
            position: relative;
            z-index: 3;
            display: flex;
            flex-direction: column;
            max-height: inherit;
            box-sizing: border-box;
            padding: 12px 0 10px;
        }

        .panel-title {
            font-size: 13px;
            font-weight: 700;
            text-align: center;
            margin: 0;
            padding: 0 14px 10px;
            border-bottom: 1px solid rgba(0, 0, 0, 0.06);
            color: var(--text-main, #00263b);
            flex-shrink: 0;
            letter-spacing: 0.2px;
        }

        :host-context([data-theme='dark']) .panel-title {
            color: var(--text-main, #e6edf3);
            border-bottom-color: rgba(255, 255, 255, 0.08);
        }

        .list-container {
            flex: 1;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 8px;
            padding: 10px 12px;
            min-height: 80px;
            background: rgba(0, 0, 0, 0.02);
            scrollbar-width: thin;
        }

        :host-context([data-theme='dark']) .list-container {
            background: rgba(255, 255, 255, 0.02);
        }

        .list-container::-webkit-scrollbar {
            width: 4px;
        }
        .list-container::-webkit-scrollbar-track {
            background: transparent;
        }
        .list-container::-webkit-scrollbar-thumb {
            background: rgba(0, 0, 0, 0.15);
            border-radius: 4px;
        }
        :host-context([data-theme='dark']) .list-container::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.18);
        }

        .empty-tip {
            text-align: center;
            font-size: 12px;
            color: var(--text-light, #888888);
            padding: 24px 10px;
        }

        :host-context([data-theme='dark']) .empty-tip {
            color: var(--text-light, #9ca3af);
        }

        .panel-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-top: 0;
            padding: 8px 12px 0;
            border-top: 1px solid rgba(0, 0, 0, 0.06);
            flex-shrink: 0;
        }

        :host-context([data-theme='dark']) .panel-footer {
            border-top-color: rgba(255, 255, 255, 0.08);
        }

        .btn-clear {
            font-size: 11px;
            color: var(--text-light, #666666);
            background: transparent;
            border: none;
            cursor: pointer;
            padding: 4px 8px;
            border-radius: var(--radius-xs, 4px);
            touch-action: manipulation;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
            transition:
                background-color var(--dur-fast, 140ms) ease,
                color var(--dur-fast, 140ms) ease,
                transform var(--dur-micro, 100ms) cubic-bezier(0.16, 1, 0.3, 1);
        }

        :host-context([data-theme='dark']) .btn-clear {
            color: var(--text-light, #9ca3af);
        }

        @media (hover: hover) and (pointer: fine) {
            .btn-clear:hover {
                background: var(--tab-hover, rgba(0, 0, 0, 0.06));
                color: var(--danger-color, #dc3545);
            }

            :host-context([data-theme='dark']) .btn-clear:hover {
                background: rgba(255, 255, 255, 0.08);
                color: var(--danger-color, #f87171);
            }
        }
        .btn-clear:active {
            transform: scale(0.97);
        }

        .btn-mute {
            font-size: 11px;
            display: flex;
            align-items: center;
            gap: 4px;
            color: var(--text-light, #666666);
            background: rgba(0, 0, 0, 0.04);
            border: 1px solid rgba(0, 0, 0, 0.08);
            padding: 3px 8px;
            border-radius: var(--radius-xs, 4px);
            cursor: pointer;
            touch-action: manipulation;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
            transition:
                background-color var(--dur-fast, 140ms) ease,
                color var(--dur-fast, 140ms) ease,
                border-color var(--dur-fast, 140ms) ease,
                transform var(--dur-micro, 100ms) cubic-bezier(0.16, 1, 0.3, 1);
        }

        :host-context([data-theme='dark']) .btn-mute {
            color: var(--text-light, #9ca3af);
            background: rgba(255, 255, 255, 0.06);
            border-color: rgba(255, 255, 255, 0.1);
        }

        @media (hover: hover) and (pointer: fine) {
            .btn-mute:hover {
                background: var(--tab-hover, rgba(0, 0, 0, 0.08));
                color: var(--text-main, #00263b);
            }

            :host-context([data-theme='dark']) .btn-mute:hover {
                background: rgba(255, 255, 255, 0.12);
                color: #ffffff;
            }
        }
        .btn-mute:active {
            transform: scale(0.97);
        }

        .btn-mute.is-active {
            background: var(--info-bg, rgba(0, 133, 196, 0.12));
            color: var(--primary-color, #006098);
            border-color: var(--primary-color, #006098);
        }

        :host-context([data-theme='dark']) .btn-mute.is-active {
            background: rgba(56, 189, 248, 0.18);
            color: var(--primary-color, #38bdf8);
            border-color: var(--primary-color, #38bdf8);
        }

        /* 传统扁平降级 */
        :host([glass-mode='flat']) .center-panel,
        :host([glass-mode='none']) .center-panel {
            background: var(--card-bg, #ffffff);
            border: 1px solid var(--border-color, #dee2e6);
            box-shadow: var(--shadow-sm, 0 2px 8px rgba(0, 0, 0, 0.06));
            backdrop-filter: none;
            -webkit-backdrop-filter: none;
        }
        :host([glass-mode='flat']) .center-panel::before,
        :host([glass-mode='flat']) .center-panel::after,
        :host([glass-mode='none']) .center-panel::before,
        :host([glass-mode='none']) .center-panel::after,
        :host([glass-mode='flat']) .glass-refraction,
        :host([glass-mode='none']) .glass-refraction {
            display: none;
        }
        :host-context([data-theme='dark']):host([glass-mode='flat']) .center-panel,
        :host-context([data-theme='dark']):host([glass-mode='none']) .center-panel {
            background: var(--card-bg, #1f2020);
            border-color: var(--border-color, #383a3c);
        }
    `);typeof window<"u"&&window.customElements&&(customElements.get("cgo-notice-center")||customElements.define("cgo-notice-center",de));/*!
 * CGo UI — window.CGO / window.ToolTheme 兼容垫片
 *
 * 目的：让 15 个仍在使用旧全局 API 的工具「一行不动也不会坏」。
 * 这里 1:1 重建 cgo_icons.js / cgo_ctrl.js / cgo_theme.js 暴露的全部 API，
 * 签名与行为保持一致；多数函数仍操作 light DOM + 仍加载的全局 CSS。
 */const v1=Object.freeze({branding:Object.freeze({copyright:"",links:[],beianPath:"",beianAlt:"备案图标"}),isEmbeddedApp:()=>!1});let he=v1;function m2(a={}){const e={...v1.branding,...a.branding||{}},t=Array.isArray(e.links)?e.links.filter(o=>o&&o.href):[];return he={...v1,...a,branding:{...e,links:t},isEmbeddedApp:typeof a.isEmbeddedApp=="function"?a.isEmbeddedApp:v1.isEmbeddedApp},he}function lt(a){return a&&a.CGoUIConfig?m2(a.CGoUIConfig):he}function ue(a,e){return We(a,e||{})}function x2(a,e,t,o){t=t||"btn btn-info",o=o||"left";const r=ue(e,{class:"btn-icon"}),i=a?"<span>"+I(a)+"</span>":"",s=o==="right"?i+r:r+i;return'<button class="'+t+'">'+s+"</button>"}function qe(a){a=a||document.body,a.querySelectorAll("[data-icon]").forEach(t=>{if(t.dataset.iconRendered)return;const o=t.dataset.icon,r=t.dataset.iconSize||20,i=t.dataset.iconClass||"btn-icon";t.innerHTML=ue(o,{size:r,class:i}),t.dataset.iconRendered="1"})}function y2(){if(document.getElementById("cgo-icon-sprite"))return;let a="";Object.keys(v).forEach(t=>{const o=v[t],r=o.type==="stroke"?"none":"currentColor";a+='<symbol id="cgo-icon-'+t+'" viewBox="'+(o.viewBox||"0 0 24 24")+'" fill="'+r+'"'+(o.type==="stroke"?' stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"':"")+">"+o.d+"</symbol>"});const e=document.createElementNS("http://www.w3.org/2000/svg","svg");e.setAttribute("id","cgo-icon-sprite"),e.setAttribute("aria-hidden","true"),e.style.cssText="position:absolute;width:0;height:0;overflow:hidden;",e.innerHTML="<defs>"+a+"</defs>",document.body.insertBefore(e,document.body.firstChild)}function w2(a,e){e=e||{};const t=e.size!==void 0?e.size:20,o=typeof t=="number"?t+"px":t,r=v[a];return'<svg class="'+("cgo-svg-icon"+(r&&r.type==="stroke"?" cgo-stroke-icon":"")+(e.class?" "+e.class:""))+'" xmlns="http://www.w3.org/2000/svg" width="'+o+'" height="'+o+'" aria-hidden="true"><use href="#cgo-icon-'+a+'"/></svg>'}function Ve(a,e){a.querySelectorAll(".dropdown-content.show").forEach(t=>{t!==e&&t.classList.remove("show")})}function je(a){a=a||document,a.querySelectorAll(".dropdown").forEach(e=>{const t=e.querySelector(".dropbtn"),o=e.querySelector(".dropdown-content");!t||!o||t._cgoBound||(t._cgoBound=!0,t.addEventListener("click",r=>{r.stopPropagation();const i=!o.classList.contains("show");Ve(a instanceof Document?document.body:a),i&&o.classList.add("show")}),o.querySelectorAll("a, button").forEach(r=>{r.addEventListener("click",i=>{i.stopPropagation(),o.classList.remove("show")})}))}),a._cgoDropdownOutsideInit||(a._cgoDropdownOutsideInit=!0,(a instanceof Document?document:a).addEventListener("click",()=>Ve(a instanceof Document?document.body:a)))}function dt(a){const e=a?"Appearance":"界面外观",t=a?"Dark or light UI style":"软件界面的深色或浅色风格",o=a?"System":"跟随系统",r=a?"Light":"亮色",i=a?"Dark":"暗色";return'<div class="help-setting-row"><div><h4>'+e+"</h4><p>"+t+'</p></div><div style="min-width:120px"><cgo-toolbar-select id="js-theme-select"><cgo-toolbar-option value="system">'+o+'</cgo-toolbar-option><cgo-toolbar-option value="light">'+r+'</cgo-toolbar-option><cgo-toolbar-option value="dark">'+i+"</cgo-toolbar-option></cgo-toolbar-select></div></div>"}function ht(a){if(!a)return;const e=Gt(),t=localStorage.getItem(e),o=t==="light"?"light":t==="dark"?"dark":"system";a.setAttribute("value",o),a.addEventListener("cgo-change",r=>{const i=r.detail.value;i==="system"?(localStorage.removeItem(e),Z(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light")):(localStorage.setItem(e,i),Z(i))})}function k2(a){console.log("[HelpModal] showHelpModal entry called, options:",a),a=a||{};const e=a.title||"帮助与选项",t=a.subtitle||"",o=lt(typeof window<"u"?window:void 0),r={...o.branding,...a.branding||{}},i=a.iconPath?'<img src="'+a.iconPath+'" class="help-icon-img" alt="Logo">':"",s=a.beianPath||r.beianPath,n=a.content||"",c=a.maxWidth||"420px",h=!!a.isEnglish,b=a.isEmbedded===!0||o.isEmbeddedApp({options:a,global:window}),d=a.hideTheme||b?"":dt(h),f=document.createElement("div");f.className="help-overlay";const p=document.createElement("div");p.className="text-dialog help-dialog",p.style.maxWidth=c;const u=document.createElement("button");u.className="dialog-close-btn",u.innerHTML="&times;";const y=document.createElement("div");y.className="help-container";const w='<div class="help-header">'+i+'<div class="help-title-group"><h3>'+e+"</h3>"+(t?"<p>"+t+"</p>":"")+"</div></div>",_=Array.isArray(r.links)?r.links.filter($=>$&&$.href&&$.label).map($=>'<a href="'+I($.href)+'" target="_blank" rel="noopener noreferrer">'+I($.label)+"</a>").join(""):"",D=s?'<div class="help-beian-group"><img src="'+I(s)+'" alt="'+I(r.beianAlt||"备案图标")+'" class="help-beian-icon"></div>':"",w1=r.copyright||_||D?'<div class="help-footer"><div class="help-footer-content">'+(r.copyright?"<span>"+I(r.copyright)+"</span>":"")+_+D+"</div></div>":"";y.innerHTML=w+d+n+w1,p.appendChild(u),p.appendChild(y),document.body.appendChild(f),document.body.appendChild(p),f.style.opacity="1",p.style.opacity="1",p.style.transform="translate(-50%, -50%)";const l1=p.querySelector("#js-theme-select");l1&&ht(l1);const d1=$=>{console.log("[HelpModal] close called, reason:",$,"stack:",new Error().stack),f.parentNode&&f.parentNode.removeChild(f),p.parentNode&&p.parentNode.removeChild(p)};u.addEventListener("click",()=>d1("closeBtn click")),setTimeout(()=>{f.addEventListener("click",$=>{$.target===f&&d1("overlay click")})},100)}function M2(a,e,t){t=t||{};const o=typeof t.duration=="number"?t.duration:8e3,r=t.zoomClass||"auth-captcha-zoomed",i=typeof a=="string"?document.querySelector(a):a,s=typeof e=="string"?document.querySelector(e):e;if(!i||!s)return null;let n=null;const c=()=>{s.classList.remove(r),n&&(clearTimeout(n),n=null)},h=b=>{b.stopPropagation(),s.classList.contains(r)?c():(s.classList.add(r),n&&clearTimeout(n),n=setTimeout(c,o))};return i.addEventListener("click",h),{destroy:()=>{i.removeEventListener("click",h),c()},reset:c}}function _2(a=window){lt(a);const e=a.CGO||{};e.Icons=v,e.icon=ue,e.iconBtn=x2,e.renderIcons=qe,e.injectSprite=y2,e.use=w2,e.iconList=Ot,e.initDropdowns=je,e.getThemeSettingHTML=dt,e.bindThemeSelect=ht,e.showToast=nt,e.showNoticePopup=it,e.showHelpModal=k2,e.generateCaptcha=ct,e.bindCaptchaZoom=M2,e.theme={setThemeColor:b1,resetThemeColor:f1,getThemeColor:S1,generateThemePalette:g1,applyTheme:Z,setThemeColorStorageKey:z1,getThemeColorStorageKey:Z1,setGlassMode:Ce,getGlassMode:I1,setDefaultGlassMode:Ae,injectLiquidGlassFilter:M,setHeaderMode:N,getHeaderMode:s1,toggleHeaderMode:O1,setDefaultHeaderMode:Te,setHeaderModeStorageKey:P1,getHeaderModeStorageKey:He,autoUpgradeHeader:F},e.setThemeColor=b1,e.resetThemeColor=f1,e.getThemeColor=S1,e.generateThemePalette=g1,e.setThemeColorStorageKey=z1,e.getThemeColorStorageKey=Z1,e.setGlassMode=Ce,e.getGlassMode=I1,e.setDefaultGlassMode=Ae,e.injectLiquidGlassFilter=M,e.setHeaderMode=N,e.getHeaderMode=s1,e.toggleHeaderMode=O1,e.setDefaultHeaderMode=Te,e.setHeaderModeStorageKey=P1,e.getHeaderModeStorageKey=He,e.autoUpgradeHeader=F,e.initImgIconWrappers=C1,a.CGO=e,a.ToolTheme=a.ToolTheme||{},a.ToolTheme.applyTheme=Z,a.ToolTheme.setThemeColor=b1,a.ToolTheme.resetThemeColor=f1,a.ToolTheme.getThemeColor=S1,a.ToolTheme.generateThemePalette=g1,a.ToolTheme.setThemeColorStorageKey=z1,a.ToolTheme.getThemeColorStorageKey=Z1;const t=()=>{qe(),je(document),e2(),C1(document),F(document)};C1(document),document.readyState==="loading"?document.addEventListener("DOMContentLoaded",t):t()}function C1(a=document){if(typeof window>"u"||!a)return;const e=(o,r)=>{o.classList.add("loaded"),r&&r.classList.add("loaded")},t=o=>{if(!o||o.classList.contains("loaded"))return;const r=o.querySelector("img");r&&(r.complete&&r.naturalWidth!==0?e(o,r):(r.addEventListener("load",()=>e(o,r),{once:!0}),r.addEventListener("error",()=>e(o,r),{once:!0})))};a.querySelectorAll(".img-icon-wrapper").forEach(t),typeof MutationObserver<"u"&&a===document&&!document._cgoImgIconObserver&&(document._cgoImgIconObserver=!0,new MutationObserver(r=>{for(const i of r)for(const s of i.addedNodes)s.nodeType===1&&(s.matches&&s.matches(".img-icon-wrapper")?t(s):s.querySelectorAll&&s.querySelectorAll(".img-icon-wrapper").forEach(t))}).observe(document.documentElement||document.body,{childList:!0,subtree:!0}))}const $2=["bjsubway"];function z2(a){for(const e of $2)delete v[e];return _2(a)}/*!
 * @cgo/ui — browser <script type="module"> entry.
 * The built dist/cgo-ui.js can be loaded from the NPM package or a versioned CDN.
 */s2();z2(window);
